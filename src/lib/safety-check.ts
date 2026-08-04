/**
 * Regra de segurança (seção 4.3 do doc de spec): heurística de primeira linha,
 * NÃO substitui revisão humana antes de produção. Sinaliza candidatos a receber
 * o bloco de apoio profissional em vez da oferta comercial — o texto final ainda
 * precisa ser aprovado juridicamente (ver knowledge-base/institucional/aviso-seguranca.md).
 *
 * Hoje só olha o relato livre (P7) por palavra-chave. O doc também cita o momento
 * emocional (P6) como possível gatilho, mas nenhuma opção de P6 sozinha justifica
 * a heurística por keyword — fica registrado como TODO caso o time decida que
 * "Fase difícil" também deve, por si só, reduzir o limiar de alerta.
 *
 * TODO: esta lista de termos é um ponto de partida, não uma solução robusta.
 * Antes de produção, validar com Eduardo/Letícia se a checagem deve ser mais
 * rigorosa (ex.: também passar o relato livre por um segundo julgamento da IA
 * dedicado só a essa classificação, em vez de regex).
 */
const TERMOS_DE_ALERTA = [
  "crise",
  "violência",
  "violencia",
  "desespero",
  "não aguento mais",
  "nao aguento mais",
  "quero morrer",
  "suicíd",
  "suicid",
  "me machucar",
  "machucar ele",
  "machucar ela",
  "abuso",
];

export function sinalizaAlertaEmocional(relatoLivre?: string): boolean {
  if (!relatoLivre) return false;
  const texto = relatoLivre.toLowerCase();
  return TERMOS_DE_ALERTA.some((termo) => texto.includes(termo));
}
