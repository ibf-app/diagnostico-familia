import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autenticarCron } from "@/lib/cron-auth";
import { reprocessarDiagnostico } from "@/lib/processar-diagnostico";

// Limite de tentativas antes de parar de reprocessar automaticamente — evita loop
// infinito gastando chamadas de IA/e-mail em diagnósticos com erro persistente
// (ex.: e-mail inválido, chave de API expirada). Acima disso, o Diagnostico continua
// FALHOU e precisa de intervenção manual. Valor escolhido arbitrariamente; ajustar
// conforme o padrão de falhas observado em produção.
const LIMITE_TENTATIVAS = 5;

/**
 * Disparada por um agendador externo (Railway cron service ou cron-job.org).
 * Busca Diagnostico com status FALHOU (e ainda dentro do limite de tentativas) e
 * roda de novo a geração de IA + envio de e-mail pra cada um.
 */
export async function POST(request: Request) {
  const naoAutorizado = autenticarCron(request);
  if (naoAutorizado) return naoAutorizado;

  const falhas = await prisma.diagnostico.findMany({
    where: { status: "FALHOU", tentativas: { lt: LIMITE_TENTATIVAS } },
    select: { id: true },
  });

  let sucesso = 0;
  let falha = 0;

  // Sequencial de propósito: evita disparar N chamadas simultâneas pra API da
  // Anthropic/Brevo num lote potencialmente grande, e uma falha isolada não afeta
  // as outras (reprocessarDiagnostico nunca lança).
  for (const { id } of falhas) {
    const resultado = await reprocessarDiagnostico(id);
    if (resultado.status === "ENVIADO") {
      sucesso++;
    } else {
      falha++;
    }
  }

  return NextResponse.json({ processados: falhas.length, sucesso, falha });
}
