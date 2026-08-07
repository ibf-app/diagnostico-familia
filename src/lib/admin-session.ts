import { createHmac, timingSafeEqual } from "crypto";

/**
 * Sessão do /admin via cookie assinado (HMAC), não JWT/lib externa — só existe
 * uma credencial compartilhada (ADMIN_USER/ADMIN_PASSWORD), então não há sessão
 * por usuário nem payload além da expiração. ADMIN_SESSION_SECRET assina o
 * cookie pra ele não poder ser forjado (nem só reaproveitado pós-troca de senha).
 */
export const NOME_COOKIE = "admin_session";
export const DURACAO_SESSAO_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

function segredoSessao(): string {
  const valor = process.env.ADMIN_SESSION_SECRET;
  if (!valor) throw new Error("ADMIN_SESSION_SECRET não configurada");
  return valor;
}

function assinar(payload: string): string {
  return createHmac("sha256", segredoSessao()).update(payload).digest("base64url");
}

function compararSeguro(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Tamanhos diferentes já vazam informação por timing na comparação em si, mas
  // timingSafeEqual exige buffers do mesmo tamanho — sem essa checagem, lançaria.
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function criarTokenSessao(): string {
  const expiraEm = String(Date.now() + DURACAO_SESSAO_MS);
  return `${expiraEm}.${assinar(expiraEm)}`;
}

export function tokenSessaoValido(token: string | undefined | null): boolean {
  if (!token) return false;

  const [expiraEm, assinatura] = token.split(".");
  if (!expiraEm || !assinatura) return false;

  let assinaturaEsperada: string;
  try {
    assinaturaEsperada = assinar(expiraEm);
  } catch {
    return false;
  }

  if (!compararSeguro(assinatura, assinaturaEsperada)) return false;

  const expiraEmNumero = Number(expiraEm);
  return Number.isFinite(expiraEmNumero) && Date.now() < expiraEmNumero;
}

export function credenciaisValidas(usuario: string, senha: string): boolean {
  const usuarioEsperado = process.env.ADMIN_USER;
  const senhaEsperada = process.env.ADMIN_PASSWORD;
  if (!usuarioEsperado || !senhaEsperada) return false;

  return compararSeguro(usuario, usuarioEsperado) && compararSeguro(senha, senhaEsperada);
}
