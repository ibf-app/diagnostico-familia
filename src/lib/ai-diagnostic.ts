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
   vazia, retorne titulo "" e explique em "porque" que a recomendação está pendente
   — nunca invente um título.
6. Você NÃO decide fase nem programa recomendado — isso já vem fixado no input.
   Você só escreve o conteúdo em cima disso.
7. Responda APENAS com um JSON válido no formato especificado, sem texto fora do JSON.`;

interface InputDiagnostico {
  respostas: RespostasQuiz;
  decisao: ResultadoDecisao;
  /** true quando P6/P7 sinalizam sofrimento além do escopo do quiz — regra de segurança (seção 4.3) */
  sinalDeAlertaEmocional: boolean;
}

function montarPrompt({ respostas, decisao, sinalDeAlertaEmocional }: InputDiagnostico): string {
  const conteudoPrograma = lerConteudoPrograma(decisao.programaRecomendado);
  const livrosEFilmes = filtrarLivrosEFilmes(decisao.fase, respostas.maiorDesafio);

  const inputJson = {
    nome: respostas.nome,
    fase_atribuida: decisao.fase,
    programa_recomendado: decisao.programaRecomendado,
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

  const partes = [
    `## Input\n\`\`\`json\n${JSON.stringify(inputJson, null, 2)}\n\`\`\``,
    conteudoPrograma
      ? `## Conteúdo oficial do programa recomendado\n${conteudoPrograma}`
      : `## Sem programa recomendado — use o CTA genérico abaixo\n${lerCtaGenerico()}`,
    `## Dados institucionais validados (só pode citar o que estiver aqui)\n${lerDadosIffd()}`,
    `## Lista curada de livros/filmes (escolha só daqui)\n${JSON.stringify(livrosEFilmes, null, 2)}`,
  ];

  if (sinalDeAlertaEmocional) {
    partes.push(
      `## REGRA DE SEGURANÇA ACIONADA\nO campo "oferta" deve ter tipo "apoio_profissional" e usar ` +
        `este texto-base (pode adaptar levemente ao contexto, sem perder o conteúdo):\n${lerAvisoSeguranca()}`
    );
  }

  partes.push(
    `## Formato de saída esperado (JSON)\n\`\`\`json\n${JSON.stringify(
      {
        assunto_email: "string",
        abertura_personalizada: "string (1-2 frases citando a resposta da pessoa)",
        fase_titulo: "string (ecoa fase_atribuida)",
        insights: ["string", "string", "string"],
        acoes_praticas: ["string", "string", "string"],
        recomendacao_livro: { titulo: "string", porque: "string" },
        recomendacao_filme: { titulo: "string", porque: "string" },
        oferta: {
          tipo: "programa | conteudo_generico | apoio_profissional",
          programa_primario: "string | null",
          texto: "string",
        },
      },
      null,
      2
    )}\n\`\`\``
  );

  return partes.join("\n\n");
}

export async function gerarDiagnosticoComIa(input: InputDiagnostico): Promise<DiagnosticoIa> {
  const message = await anthropic.messages.create({
    model: MODELO,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: montarPrompt(input) }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Resposta da IA não contém bloco de texto");
  }

  const json = JSON.parse(textBlock.text);
  return diagnosticoIaSchema.parse(json);
}
