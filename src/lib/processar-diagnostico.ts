import { prisma } from "@/lib/prisma";
import { sinalizaAlertaEmocional } from "@/lib/safety-check";
import { gerarDiagnosticoComIa } from "@/lib/ai-diagnostic";
import { enviarEmailDiagnostico } from "@/lib/mailer";
import { linkCtaGenerico, linkPrograma } from "@/lib/knowledge-base";
import type { Diagnostico, Lead } from "@/generated/prisma/client";
import type { DiagnosticoIa } from "@/lib/ai-diagnostic-schema";
import type { ResultadoDecisao, RespostasQuiz, TabelaC } from "@/types/quiz";

export interface ProcessarDiagnosticoParams {
  diagnosticoId: string;
  respostas: RespostasQuiz;
  decisao: ResultadoDecisao;
}

export type ResultadoProcessamento =
  | { status: "ENVIADO"; diagnostico: DiagnosticoIa; fase: string; ofertaLink: string | null }
  | { status: "FALHOU"; erro: string };

/**
 * Link do CTA da oferta. "programa" usa o link oficial do programa recomendado
 * pela árvore de decisão (fonte da verdade, não o que a IA eventualmente citar em
 * texto livre), "conteudo_generico" usa o link genérico do knowledge-base,
 * "apoio_profissional" nunca tem CTA.
 */
function linkDaOferta(tipo: DiagnosticoIa["oferta"]["tipo"], programaRecomendado: string | null): string | null {
  if (tipo === "programa") return linkPrograma(programaRecomendado);
  if (tipo === "conteudo_generico") return linkCtaGenerico();
  return null;
}

/**
 * Gera o conteúdo do diagnóstico via IA, envia o e-mail e atualiza o status do
 * Diagnostico no banco (GERADO -> ENVIADO). Extraída do POST /api/quiz original
 * pra ser reaproveitada pelo cron de reprocessamento (POST /api/cron/reprocessar-falhas),
 * que não tem `respostas`/`decisao` "frescas" em memória — só o que já está salvo
 * no banco (ver reconstruirRespostasEDecisao abaixo).
 *
 * Nunca lança: qualquer falha (IA ou e-mail) é capturada aqui, marca o Diagnostico
 * como FALHOU (incrementando tentativas) e volta no retorno — quem chamou decide o
 * que fazer com isso (responder a request original, ou seguir pro próximo item de
 * um lote de reprocessamento sem que uma falha pare as outras).
 */
export async function processarDiagnostico({
  diagnosticoId,
  respostas,
  decisao,
}: ProcessarDiagnosticoParams): Promise<ResultadoProcessamento> {
  try {
    const sinalDeAlertaEmocional = sinalizaAlertaEmocional(respostas.relatoLivre);
    const diagnosticoIa = await gerarDiagnosticoComIa({ respostas, decisao, sinalDeAlertaEmocional });

    await prisma.diagnostico.update({
      where: { id: diagnosticoId },
      data: {
        status: "GERADO",
        conteudoJson: diagnosticoIa,
        tipoOferta: diagnosticoIa.oferta.tipo.toUpperCase() as "PROGRAMA" | "CONTEUDO_GENERICO" | "APOIO_PROFISSIONAL",
      },
    });

    const ofertaLink = linkDaOferta(diagnosticoIa.oferta.tipo, decisao.programaRecomendado);

    await enviarEmailDiagnostico({
      nome: respostas.nome,
      email: respostas.email,
      fase: decisao.fase,
      diagnostico: diagnosticoIa,
      ofertaLink,
    });

    await prisma.diagnostico.update({
      where: { id: diagnosticoId },
      data: { status: "ENVIADO", enviadoEm: new Date() },
    });

    return { status: "ENVIADO", diagnostico: diagnosticoIa, fase: decisao.fase, ofertaLink };
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Erro desconhecido ao gerar/enviar diagnóstico";
    console.error(`[processar-diagnostico] Falha ao gerar/enviar diagnóstico ${diagnosticoId}:`, err);

    await prisma.diagnostico.update({
      where: { id: diagnosticoId },
      data: { status: "FALHOU", erro: mensagem, tentativas: { increment: 1 } },
    });

    return { status: "FALHOU", erro: mensagem };
  }
}

/**
 * Reconstrói RespostasQuiz e ResultadoDecisao a partir do que já está persistido
 * (Lead + Diagnostico) — usada só no reprocessamento. fase/programaRecomendado/
 * tabelaUsada NÃO são recalculados pela árvore de decisão aqui: eles já foram
 * decididos uma vez, na criação do lead, e ficam fixos (decidirFaseEPrograma é
 * determinística, mas reprocessar não é o lugar de decidir fase de novo).
 */
export function reconstruirRespostasEDecisao(
  lead: Lead,
  diagnostico: Pick<Diagnostico, "fase" | "programaRecomendado" | "tabelaUsada">
): { respostas: RespostasQuiz; decisao: ResultadoDecisao } {
  const respostas: RespostasQuiz = {
    estadoCivil: lead.estadoCivil,
    temFilhos: lead.temFilhos,
    tempoUniao: lead.tempoUniao ?? undefined,
    idadesFilhos: lead.idadesFilhos,
    faixaMaisDesafiadora: lead.faixaMaisDesafiadora ?? undefined,
    // mesmo cast usado em /api/quiz: a árvore de decisão só olha os valores
    // CUIDAR_DA_RELACAO / CUIDAR_DE_MIM / CUIDAR_DA_EDUCACAO_DOS_FILHOS, mas aqui
    // nem chamamos a árvore de novo — só repassamos pra IA calibrar o conteúdo.
    prioridade: lead.prioridade as RespostasQuiz["prioridade"],
    maiorDesafio: lead.maiorDesafio,
    momentoEmocional: lead.momentoEmocional,
    relatoLivre: lead.relatoLivre ?? undefined,
    cidade: lead.cidade ?? undefined,
    comoConheceu: lead.comoConheceu ?? undefined,
    nome: lead.nome,
    whatsapp: lead.whatsapp ?? undefined,
    email: lead.email,
  };

  if (!diagnostico.tabelaUsada) {
    // Nunca deveria acontecer: tabelaUsada é sempre setada junto com fase na
    // criação (ver POST /api/quiz). Se acontecer, é dado inconsistente — melhor
    // falhar explicitamente do que adivinhar uma tabela.
    throw new Error("Diagnostico sem tabelaUsada salva — dado inconsistente, não é possível reprocessar");
  }

  const decisao: ResultadoDecisao = {
    fase: diagnostico.fase,
    programaRecomendado: diagnostico.programaRecomendado,
    tabelaUsada: diagnostico.tabelaUsada as TabelaC,
  };

  return { respostas, decisao };
}

/**
 * Busca o Lead + Diagnostico pelo id do diagnóstico, reconstrói o input e reprocessa
 * (gera IA + envia e-mail). Usada pelo cron de reprocessamento — cada item do lote
 * é isolado, então uma falha aqui não impede o processamento dos próximos.
 */
export async function reprocessarDiagnostico(diagnosticoId: string): Promise<ResultadoProcessamento> {
  const diagnostico = await prisma.diagnostico.findUnique({
    where: { id: diagnosticoId },
    include: { lead: true },
  });

  if (!diagnostico) {
    return { status: "FALHOU", erro: `Diagnostico ${diagnosticoId} não encontrado` };
  }

  const { respostas, decisao } = reconstruirRespostasEDecisao(diagnostico.lead, diagnostico);

  return processarDiagnostico({ diagnosticoId, respostas, decisao });
}
