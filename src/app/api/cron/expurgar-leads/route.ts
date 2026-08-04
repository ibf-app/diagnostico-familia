import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autenticarCron } from "@/lib/cron-auth";

// Prazo de retenção proposto em docs/quiz-perguntas.md (seção final): 24 meses a
// partir do consentimento LGPD (Lead.consentimentoLgpdEm).
const RETENCAO_EM_MESES = 24;

/**
 * Disparada por um agendador externo (Railway cron service ou cron-job.org).
 * Apaga Lead (e o Diagnostico relacionado, via onDelete: Cascade) cujo
 * consentimentoLgpdEm seja mais antigo que RETENCAO_EM_MESES a partir de agora.
 */
export async function POST(request: Request) {
  const naoAutorizado = autenticarCron(request);
  if (naoAutorizado) return naoAutorizado;

  const limite = new Date();
  limite.setMonth(limite.getMonth() - RETENCAO_EM_MESES);

  const { count } = await prisma.lead.deleteMany({
    where: { consentimentoLgpdEm: { lt: limite } },
  });

  return NextResponse.json({ removidos: count });
}
