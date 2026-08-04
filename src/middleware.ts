import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Protege /admin com HTTP Basic Auth simples — não é pensado pra múltiplos
 * usuários nem controle de permissão granular, só pra impedir acesso público
 * a dados de leads (nome, e-mail, WhatsApp, relato livre). Sem ADMIN_USER/
 * ADMIN_PASSWORD configuradas no ambiente, nega por padrão.
 */
export function middleware(request: NextRequest) {
  const usuario = process.env.ADMIN_USER;
  const senha = process.env.ADMIN_PASSWORD;

  if (!usuario || !senha) {
    return new NextResponse("Admin não configurado (faltam ADMIN_USER/ADMIN_PASSWORD).", { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const decoded = Buffer.from(authHeader.slice("Basic ".length), "base64").toString("utf-8");
    const [usuarioEnviado, senhaEnviada] = decoded.split(":");
    if (usuarioEnviado === usuario && senhaEnviada === senha) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Autenticação necessária.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin Família em Foco"' },
  });
}

export const config = {
  matcher: "/admin/:path*",
};
