import type { DiagnosticoIa } from "@/lib/ai-diagnostic-schema";

/**
 * Template do e-mail de diagnóstico, adaptado diretamente dos 3 exemplos reais
 * (03_exemplo_email/: Rafael, Marina, Fernanda) — mesma estrutura visual e blocos
 * (seção 5 do doc de spec: abertura → perfil → insights → ações → livro/filme →
 * credencial → oferta), agora parametrizados pelo output da IA.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderEmailDiagnostico(params: {
  nome: string;
  fase: string;
  diagnostico: DiagnosticoIa;
}): string {
  const { nome, fase, diagnostico } = params;

  const insightsHtml = diagnostico.insights
    .map(
      (texto) => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E3E1D8; border-radius:8px; margin-bottom:10px;"><tr><td style="padding:14px 16px;">
        <div style="font-size:14px; line-height:1.6; color:#444441;">${escapeHtml(texto)}</div>
      </td></tr></table>`
    )
    .join("\n");

  const acoesHtml = diagnostico.acoes_praticas
    .map(
      (texto) => `
      <tr><td style="padding-bottom:12px; vertical-align:top; width:22px; color:#639922; font-weight:bold; font-size:15px;">&#10003;</td>
          <td style="padding-bottom:12px; font-size:14px; line-height:1.6; color:#222222;">${escapeHtml(texto)}</td></tr>`
    )
    .join("\n");

  const ofertaHtml =
    diagnostico.oferta.tipo === "programa" && diagnostico.oferta.programa_primario
      ? `<div style="font-size:14px; line-height:1.6; color:#222222; margin-bottom:10px;">${escapeHtml(
          diagnostico.oferta.texto
        )}</div>`
      : `<div style="font-size:14px; line-height:1.6; color:#222222;">${escapeHtml(diagnostico.oferta.texto)}</div>`;

  // Lista curada de livros/filmes ainda não existe (pendente do time), então a IA
  // pode retornar null nos dois campos — nesse caso o bloco inteiro é omitido.
  const linhasLivroFilme = [
    diagnostico.recomendacao_livro &&
      `<div style="font-size:14px; line-height:1.6; color:#444441; margin-bottom:8px;"><b>Livro:</b> ${escapeHtml(
        diagnostico.recomendacao_livro.titulo
      )} — ${escapeHtml(diagnostico.recomendacao_livro.porque)}</div>`,
    diagnostico.recomendacao_filme &&
      `<div style="font-size:14px; line-height:1.6; color:#444441;"><b>Filme:</b> ${escapeHtml(
        diagnostico.recomendacao_filme.titulo
      )} — ${escapeHtml(diagnostico.recomendacao_filme.porque)}</div>`,
  ].filter(Boolean);

  const blocoLivroFilmeHtml =
    linhasLivroFilme.length === 0
      ? ""
      : `
  <tr><td style="padding:4px 28px 8px;">
    <div style="font-size:13px; font-weight:bold; color:#8A6D1F; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:12px;">Para aprofundar essa semana</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E3E1D8; border-radius:8px;"><tr><td style="padding:14px 16px;">
      ${linhasLivroFilme.join("\n")}
    </td></tr></table>
  </td></tr>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>IBF — Diagnóstico</title>
</head>
<body style="margin:0; padding:24px; background:#EDEBE4; font-family:Helvetica,Arial,sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:0 auto; background:#FFFFFF; border:1px solid #D8D5CA; border-radius:8px;">

  <tr><td style="background:#1A2B4C; padding:20px 28px; border-radius:8px 8px 0 0;">
    <div style="color:#FFFFFF; font-size:22px; font-weight:bold;">ibf</div>
    <div style="color:#B8C4D9; font-size:12px; margin-top:2px;">Instituto Brasileiro da Família</div>
  </td></tr>

  <tr><td style="padding:24px 28px 4px;">
    <p style="font-size:16px; line-height:1.6; color:#222222; margin:0 0 12px;">Oi, ${escapeHtml(nome)}.</p>
    <p style="font-size:16px; line-height:1.6; color:#222222; margin:0 0 20px;">${escapeHtml(
      diagnostico.abertura_personalizada
    )}</p>
  </td></tr>

  <tr><td style="padding:0 28px 20px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1E9; border-radius:8px;">
      <tr><td style="padding:18px 20px;">
        <div style="font-size:11px; color:#8A6D1F; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Seu momento</div>
        <div style="font-size:19px; font-weight:bold; color:#1A2B4C; margin-bottom:10px;">${escapeHtml(
          diagnostico.fase_titulo || fase
        )}</div>
        <div style="font-size:12px; color:#6B6656; margin-top:6px;">seu momento dentro do ciclo familiar</div>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:4px 28px 8px;">
    <div style="font-size:13px; font-weight:bold; color:#8A6D1F; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:12px;">O que os dados dizem sobre essa fase</div>
    ${insightsHtml}
  </td></tr>

  <tr><td style="padding:20px 28px 8px;">
    <div style="font-size:13px; font-weight:bold; color:#8A6D1F; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:12px;">3 ações práticas para essa semana</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${acoesHtml}
    </table>
  </td></tr>

  ${blocoLivroFilmeHtml}

  <tr><td style="padding:20px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="border-left:3px solid #F5A623; padding:2px 0 2px 14px; font-size:13px; line-height:1.6; color:#6B6656;">Essas reflexões fazem parte da metodologia da IFFD (International Federation for Family Development), da qual o IBF é representante no Brasil.</td>
    </tr></table>
  </td></tr>

  <tr><td style="padding:0 28px 24px; border-top:1px solid #E3E1D8; padding-top:16px;">
    ${ofertaHtml}
  </td></tr>

  <tr><td style="background:#F4F1E9; padding:16px 28px; font-size:11px; line-height:1.6; color:#8A867A; border-radius:0 0 8px 8px;">
    IBF &middot; Instituto Brasileiro da Família &mdash; Você recebeu este diagnóstico porque respondeu ao quiz Família em Foco.<br>
    <a href="{{unsubscribe}}" style="color:#8A867A;">Cancelar inscrição</a> &middot; <a href="#" style="color:#8A867A;">Política de privacidade</a>
  </td></tr>

</table>
</body>
</html>
`;
}
