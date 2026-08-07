import { NextResponse } from "next/server";
import { NOME_COOKIE, DURACAO_SESSAO_MS, credenciaisValidas, criarTokenSessao } from "@/lib/admin-session";
import { SITE_URL } from "@/lib/site-url";

/** Destino só pode ser dentro de /admin — evita open redirect via ?redirect=. */
function destinoSeguro(valor: string): string {
  return valor.startsWith("/admin") ? valor : "/admin";
}

export async function POST(request: Request) {
  const form = await request.formData();
  const usuario = String(form.get("usuario") ?? "");
  const senha = String(form.get("senha") ?? "");
  const destino = destinoSeguro(String(form.get("redirect") ?? "/admin"));

  if (!credenciaisValidas(usuario, senha)) {
    const url = new URL("/admin/login", SITE_URL);
    url.searchParams.set("erro", "1");
    url.searchParams.set("redirect", destino);
    return NextResponse.redirect(url, { status: 303 });
  }

  const response = NextResponse.redirect(new URL(destino, SITE_URL), { status: 303 });
  response.cookies.set(NOME_COOKIE, criarTokenSessao(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: DURACAO_SESSAO_MS / 1000,
  });
  return response;
}
