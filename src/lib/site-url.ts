/**
 * URL pública canônica do app — usada pra montar URLs absolutas (redirects de
 * autenticação, imagem no e-mail) sem depender de `request.url`. Atrás do proxy
 * do Railway, `request.url` reflete o host interno do container
 * (`http://localhost:8080/...`), não o domínio público, e gerar um redirect a
 * partir dele manda o navegador pra localhost.
 */
export const SITE_URL = process.env.APP_BASE_URL ?? "https://quiz.portalibf.org.br";
