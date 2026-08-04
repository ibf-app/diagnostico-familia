import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import {
  filtrarLivrosEFilmes,
  lerAvisoSeguranca,
  lerConteudoPrograma,
  lerCtaGenerico,
  lerDadosIffd,
} from "@/lib/knowledge-base";
import { diagnosticoIaSchema, type DiagnosticoIa } from "@/lib/ai-diagnostic-schema";
import type { ResultadoDecisao, RespostasQuiz } from "@/types/quiz";

// TODO: confirmar o model id exato disponível na conta Anthropic do projeto antes de ir pra produção.
const MODELO = "claude-sonnet-5";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Gerado a partir do próprio schema de validação — a API garante que a resposta
// já vem nesse formato (structured outputs), então não dependemos só da IA "obedecer"
// a instrução do prompt pra produzir JSON válido.
const FORMATO_SAIDA_JSON_SCHEMA: Record<string, unknown> = z.toJSONSchema(diagnosticoIaSchema);
delete FORMATO_SAIDA_JSON_SCHEMA.$schema;

const SYSTEM_PROMPT = `Você escreve o conteúdo de um e-mail de diagnóstico gratuito do IBF
(Instituto Brasileiro da Família), a partir das respostas de um quiz. Regras fixas
(seção 4.3 do doc de spec "Quiz Família em Foco" v7):

1. Proporção 80/20: 80% diagnóstico e dica prática, 20% menção a programa — e esse
   20% só no bloco final (oferta).
2. Nenhum preço, nome de curso ou CTA de compra antes do bloco de oferta.
3. Nunca cite dado, estatística ou referência que não esteja no material fornecido
   abaixo (zero alucinação de números).
4. Tom: como um especialista que leu as respostas de verdade — nunca linguagem de
   robô, nunca clichê motivacional vazio.
5. Escolha o livro e o filme APENAS da lista curada fornecida. Se a lista estiver
   vazia ou não tiver nada relevante, retorne null nesses dois campos — nunca
   invente um título.
6. Você NÃO decide fase nem programa recomendado — isso já vem fixado no input.
   Você só escreve o conteúdo em cima disso.
7. Se a seção "REGRA DE SEGURANÇA ACIONADA" estiver presente no prompt, o e-mail
   NUNCA menciona, oferece ou insinua qualquer programa do IBF — mesmo que exista
   um programa recomendado no input. O bloco final é só apoio profissional.`;

interface InputDiagnostico {
  respostas: RespostasQuiz;
  decisao: ResultadoDecisao;
  /** true quando P6/P7 sinalizam sofrimento além do escopo do quiz — regra de segurança (seção 4.3) */
  sinalDeAlertaEmocional: boolean;
}

function montarPrompt({ respostas, decisao, sinalDeAlertaEmocional }: InputDiagnostico): string {
  // Quando o alerta dispara, nem passamos o conteúdo do programa pro modelo —
  // menos chance dele "vazar" menção a programa por acidente (reforça a regra 7).
  const conteudoPrograma = sinalDeAlertaEmocional ? null : lerConteudoPrograma(decisao.programaRecomendado);
  const livrosEFilmes = filtrarLivrosEFilmes(decisao.fase, respostas.maiorDesafio);

  const inputJson = {
    nome: respostas.nome,
    fase_atribuida: decisao.fase,
    programa_recomendado: sinalDeAlertaEmocional ? null : decisao.programaRecomendado,
    respostas: {
      estado_civil: respostas.estadoCivil,
      tem_filhos: respostas.temFilhos,
      tempo_uniao: respostas.tempoUniao ?? null,
      idades_filhos: respostas.idadesFilhos ?? [],
      faixa_mais_desafiadora: respostas.faixaMaisDesafiadora ?? null,
      prioridade: respostas.prioridade,
      maior_desafio: respostas.maiorDesafio,
      momento_emocional: respostas.momentoEmocional,
      relato_livre: respostas.relatoLivre ?? null,
      cidade: respostas.cidade ?? null,
      como_conheceu: respostas.comoConheceu ?? null,
    },
  };

  const partes = [`## Input\n\`\`\`json\n${JSON.stringify(inputJson, null, 2)}\n\`\`\``];

  if (sinalDeAlertaEmocional) {
    partes.push(
      `## REGRA DE SEGURANÇA ACIONADA\nNão mencione, ofereça ou insinue nenhum programa do IBF neste ` +
        `e-mail. O campo "oferta" deve ter tipo "apoio_profissional", programa_primario null, e o texto ` +
        `deve se basear no seguinte (pode adaptar levemente ao contexto, sem perder o conteúdo):\n${lerAvisoSeguranca()}`
    );
  } else {
    partes.push(
      conteudoPrograma
        ? `## Conteúdo oficial do programa recomendado\n${conteudoPrograma}`
        : `## Sem programa recomendado — use o CTA genérico abaixo\n${lerCtaGenerico()}`
    );
  }

  partes.push(
    `## Dados institucionais validados (só pode citar o que estiver aqui)\n${lerDadosIffd()}`,
    `## Lista curada de livros/filmes (escolha só daqui; se vazia, use null nos dois campos)\n${JSON.stringify(livrosEFilmes, null, 2)}`
  );

  return partes.join("\n\n");
}

export async function gerarDiagnosticoComIa(input: InputDiagnostico): Promise<DiagnosticoIa> {
  const message = await anthropic.messages.create({
    model: MODELO,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: montarPrompt(input) }],
    output_config: {
      format: {
        type: "json_schema",
        schema: FORMATO_SAIDA_JSON_SCHEMA,
      },
    },
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error(
      `Resposta da IA não contém bloco de texto (stop_reason: ${message.stop_reason}, blocks: ${message.content
        .map((b) => b.type)
        .join(", ")})`
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(textBlock.text);
  } catch (err) {
    console.error("Falha ao fazer parse do JSON retornado pela IA. Texto bruto:", textBlock.text);
    throw new Error(`Resposta da IA não é um JSON válido: ${err instanceof Error ? err.message : String(err)}`);
  }

  const diagnostico = diagnosticoIaSchema.parse(json);

  // Trava de segurança no código, não só no prompt: mesmo que o modelo ignore a
  // instrução, o e-mail nunca vende programa quando o alerta emocional disparou.
  if (input.sinalDeAlertaEmocional) {
    return {
      ...diagnostico,
      oferta: {
        tipo: "apoio_profissional",
        programa_primario: null,
        texto: diagnostico.oferta.texto,
      },
    };
  }

  return diagnostico;
}
