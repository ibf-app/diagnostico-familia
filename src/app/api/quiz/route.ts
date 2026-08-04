import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { quizInputSchema } from "@/lib/quiz-input-schema";
import { decidirFaseEPrograma } from "@/lib/decision-tree";
import { sinalizaAlertaEmocional } from "@/lib/safety-check";
import { gerarDiagnosticoComIa } from "@/lib/ai-diagnostic";
import { enviarEmailDiagnostico } from "@/lib/mailer";
import type { RespostasQuiz } from "@/types/quiz";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = quizInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Respostas inválidas", detalhes: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;
  const respostas: RespostasQuiz = {
    estadoCivil: input.estadoCivil,
    temFilhos: input.temFilhos,
    tempoUniao: input.tempoUniao,
    idadesFilhos: input.idadesFilhos,
    faixaMaisDesafiadora: input.faixaMaisDesafiadora,
    // seguro pelo schema do wizard no frontend (quiz-options.ts); a árvore de decisão
    // só usa os valores CUIDAR_DA_RELACAO / CUIDAR_DE_MIM / CUIDAR_DA_EDUCACAO_DOS_FILHOS
    // pra ramificar — o restante só calibra o conteúdo da IA.
    prioridade: input.prioridade as RespostasQuiz["prioridade"],
    maiorDesafio: input.maiorDesafio,
    momentoEmocional: input.momentoEmocional,
    relatoLivre: input.relatoLivre,
    cidade: input.cidade,
    comoConheceu: input.comoConheceu,
    nome: input.nome,
    whatsapp: input.whatsapp,
    email: input.email,
  };

  let decisao;
  try {
    decisao = decidirFaseEPrograma(respostas);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Respostas incompletas" }, { status: 400 });
  }

  const lead = await prisma.lead.create({
    data: {
      estadoCivil: respostas.estadoCivil,
      temFilhos: respostas.temFilhos,
      tempoUniao: respostas.tempoUniao,
      idadesFilhos: respostas.idadesFilhos ?? [],
      faixaMaisDesafiadora: respostas.faixaMaisDesafiadora,
      prioridade: respostas.prioridade,
      maiorDesafio: respostas.maiorDesafio,
      momentoEmocional: respostas.momentoEmocional,
      relatoLivre: respostas.relatoLivre,
      cidade: respostas.cidade,
      comoConheceu: respostas.comoConheceu,
      nome: respostas.nome,
      whatsapp: respostas.whatsapp,
      email: respostas.email,
      consentimentoLgpdEm: new Date(),
      diagnostico: {
        create: {
          fase: decisao.fase,
          programaRecomendado: decisao.programaRecomendado,
          tabelaUsada: decisao.tabelaUsada,
        },
      },
    },
    include: { diagnostico: true },
  });

  const diagnosticoId = lead.diagnostico!.id;

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

    await enviarEmailDiagnostico({
      nome: respostas.nome,
      email: respostas.email,
      fase: decisao.fase,
      diagnostico: diagnosticoIa,
    });

    await prisma.diagnostico.update({
      where: { id: diagnosticoId },
      data: { status: "ENVIADO", enviadoEm: new Date() },
    });

    return NextResponse.json({ leadId: lead.id, status: "ENVIADO" }, { status: 201 });
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Erro desconhecido ao gerar/enviar diagnóstico";
    console.error(`[api/quiz] Falha ao gerar/enviar diagnóstico ${diagnosticoId}:`, err);
    await prisma.diagnostico.update({
      where: { id: diagnosticoId },
      data: { status: "FALHOU", erro: mensagem, tentativas: { increment: 1 } },
    });

    // O lead já está salvo mesmo se IA/e-mail falharem — dá pra reprocessar depois
    // a partir do status FALHOU, sem pedir pra pessoa preencher tudo de novo.
    return NextResponse.json(
      { leadId: lead.id, status: "FALHOU", error: "Não foi possível gerar/enviar o diagnóstico agora." },
      { status: 502 }
    );
  }
}
