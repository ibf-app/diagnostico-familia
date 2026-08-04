import { NextResponse } from "next/server";

/**
 * Autenticação dos endpoints de cron (POST /api/cron/*), disparados por um
 * agendador externo (Railway cron service ou cron-job.org) — exige o header
 * `Authorization: Bearer <CRON_SECRET>`. Sem CRON_SECRET configurada no ambiente
 * ou sem token válido, nega por padrão (não existe "modo aberto" se a env var
 * não estiver setada).
 *
 * Retorna a Response 401 pra o caller devolver direto, ou null quando autenticado.
 */
export function autenticarCron(request: Request): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;

  if (!cronSecret || !token || token !== cronSecret) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  return null;
}
