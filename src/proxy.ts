import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { NOME_COOKIE, tokenSessaoValido } from "@/lib/admin-session";
import { SITE_URL } from "@/lib/site-url";

/**
 * Protege /admin com sessão por cookie assinado (ver src/lib/admin-session.ts),
 * com tela de login própria em /admin/login em vez do prompt nativo de Basic
 * Auth do navegador. Sem ADMIN_USER/ADMIN_PASSWORD/ADMIN_SESSION_SECRET
 * configuradas no ambiente, nega por padrão (não existe "modo aberto").
 */
export function proxy(request: NextRequest) {
  if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) {
    return new NextResponse(
      "Admin não configurado (faltam ADMIN_USER/ADMIN_PASSWORD/ADMIN_SESSION_SECRET).",
      { status: 503 }
    );
  }

  const { pathname } = request.nextUrl;
  const autenticado = tokenSessaoValido(request.cookies.get(NOME_COOKIE)?.value);

  if (pathname === "/admin/login") {
    // Já logado tentando ver a tela de login de novo: manda direto pro painel
    // em vez de mostrar o formulário sem propósito.
    return autenticado ? NextResponse.redirect(new URL("/admin", SITE_URL)) : NextResponse.next();
  }

  if (!autenticado) {
    const destino = new URL("/admin/login", SITE_URL);
    destino.searchParams.set("redirect", pathname);
    return NextResponse.redirect(destino);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
