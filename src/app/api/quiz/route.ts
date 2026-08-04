import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { quizInputSchema } from "@/lib/quiz-input-schema";
import { decidirFaseEPrograma } from "@/lib/decision-tree";
import { processarDiagnostico } from "@/lib/processar-diagnostico";
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

  const resultado = await processarDiagnostico({ diagnosticoId, respostas, decisao });

  if (resultado.status === "ENVIADO") {
    return NextResponse.json(
      {
        leadId: lead.id,
        status: "ENVIADO",
        diagnostico: resultado.diagnostico,
        fase: resultado.fase,
        ofertaLink: resultado.ofertaLink,
      },
      { status: 201 }
    );
  }

  // O lead já está salvo mesmo se IA/e-mail falharem — dá pra reprocessar depois
  // a partir do status FALHOU (ver POST /api/cron/reprocessar-falhas), sem pedir
  // pra pessoa preencher tudo de novo.
  return NextResponse.json(
    { leadId: lead.id, status: "FALHOU", error: "Não foi possível gerar/enviar o diagnóstico agora." },
    { status: 502 }
  );
}
