import type { FaixaEtaria, RespostasQuiz } from "@/types/quiz";
import { ehCasal } from "@/lib/quiz-steps";

export const ESTADO_CIVIL_OPTIONS: { value: RespostasQuiz["estadoCivil"]; label: string }[] = [
  { value: "SOLTEIRO", label: "Solteiro(a)" },
  { value: "NAMORANDO_NOIVO", label: "Namorando(a) ou noivo(a)" },
  { value: "CASADO_UNIAO_ESTAVEL", label: "Casado(a) ou união estável" },
  { value: "DIVORCIADO_SEPARADO", label: "Divorciado(a) ou separado(a)" },
  { value: "VIUVO", label: "Viúvo(a)" },
];

export const TEMPO_UNIAO_OPTIONS: { value: NonNullable<RespostasQuiz["tempoUniao"]>; label: string }[] = [
  { value: "ATE_5_ANOS", label: "Até 5 anos" },
  { value: "MAIS_DE_5_ANOS", label: "Mais de 5 anos" },
];

export const FAIXA_ETARIA_OPTIONS: { value: FaixaEtaria; label: string }[] = [
  { value: "DE_0_A_3", label: "0–3 anos" },
  { value: "DE_4_A_5", label: "4–5 anos" },
  { value: "DE_6_A_7", label: "6–7 anos" },
  { value: "DE_8_A_10", label: "8–10 anos" },
  { value: "DE_11_A_13", label: "11–13 anos" },
  { value: "DE_14_A_16", label: "14–16 anos" },
  { value: "MAIS_DE_16", label: "+16 anos" },
];

export function prioridadeOptions(respostas: Partial<RespostasQuiz>) {
  const casal = ehCasal(respostas);
  if (casal && respostas.temFilhos) {
    return [
      { value: "CUIDAR_DA_RELACAO", label: "Cuidar da relação como casal" },
      { value: "CUIDAR_DA_EDUCACAO_DOS_FILHOS", label: "Cuidar da educação dos filhos" },
    ] as const;
  }
  if (!casal && respostas.temFilhos) {
    return [
      { value: "CUIDAR_DE_MIM", label: "Cuidar de mim" },
      { value: "CUIDAR_DA_EDUCACAO_DOS_FILHOS", label: "Cuidar da educação dos filhos" },
    ] as const;
  }
  // individual sem filhos
  return [
    { value: "MEU_PROPOSITO_E_CAMINHO", label: "Meu propósito e caminho" },
    { value: "TRABALHO_E_CARREIRA", label: "Trabalho e carreira" },
    { value: "VIDA_AFETIVA_E_RELACIONAMENTOS", label: "Vida afetiva e relacionamentos" },
    { value: "NAO_SEI_DIZER", label: "Não sei dizer" },
  ] as const;
}

const NAO_SEI_DIZER = "Não sei dizer";

/** Tabela C — opções de "maior desafio" (seção 2 do doc), por perfil e faixa etária. */
const TABELA_C_PAIS: Record<FaixaEtaria, string[]> = {
  DE_0_A_3: ["Rotina (sono/alimentação)", "Educar sem virar bagunça", "Atenção a cada filho", NAO_SEI_DIZER],
  DE_4_A_5: ["Entender o jeito de cada filho", "Brigas entre irmãos", "Colocar limites", NAO_SEI_DIZER],
  DE_6_A_7: ["Diálogo com os filhos", "Passar valores", "Autoridade no dia a dia", NAO_SEI_DIZER],
  DE_8_A_10: ["Autoestima e confiança", "Tempo de tela", "Ordem e regras em casa", NAO_SEI_DIZER],
  DE_11_A_13: ["Mudanças da fase", "Amizades e influências", "Autonomia com limite", NAO_SEI_DIZER],
  DE_14_A_16: ["Mudanças e crises dessa fase", "Identidade e responsabilidade", "Afetividade e relacionamentos", NAO_SEI_DIZER],
  MAIS_DE_16: ["Comunicação", "Autonomia", "Preparo pra vida adulta", NAO_SEI_DIZER],
};

const TABELA_C1_CASAL = ["Comunicação no dia a dia", "Tempo e atenção um pro outro", "Equilíbrio trabalho-casa", NAO_SEI_DIZER];
const TABELA_C3_INDIVIDUAL = ["Falta de clareza sobre o futuro", "Trabalho e vida pessoal", "Relacionamentos e conexão", NAO_SEI_DIZER];

/**
 * Opções de P5 (maior desafio) — depende do perfil e, quando há filhos, da faixa
 * etária relevante (a única marcada, ou a escolhida em P4b quando há 2+).
 */
export function maiorDesafioOptions(respostas: Partial<RespostasQuiz>): string[] {
  const casal = ehCasal(respostas);

  if (respostas.temFilhos) {
    const faixa = respostas.faixaMaisDesafiadora ?? respostas.idadesFilhos?.[0];
    if (faixa) return TABELA_C_PAIS[faixa];
  }

  if (casal) return TABELA_C1_CASAL;
  return TABELA_C3_INDIVIDUAL;
}

export const MOMENTO_EMOCIONAL_OPTIONS: { value: RespostasQuiz["momentoEmocional"]; label: string }[] = [
  { value: "PILOTO_AUTOMATICO", label: "No piloto automático" },
  { value: "FASE_DIFICIL", label: "Numa fase difícil" },
  { value: "BEM_BUSCANDO_CRESCER", label: "Bem, buscando crescer" },
  { value: "PREFIRO_NAO_RESPONDER", label: "Prefiro não responder" },
];

/** A pergunta de P6 varia no singular/plural conforme o perfil (seção 3 do doc). */
export function momentoEmocionalPergunta(respostas: Partial<RespostasQuiz>): string {
  const casal = ehCasal(respostas);
  if (casal && respostas.prioridade === "CUIDAR_DA_RELACAO") return "Como está o momento emocional de vocês dois?";
  if (respostas.temFilhos && respostas.prioridade === "CUIDAR_DA_EDUCACAO_DOS_FILHOS") {
    return "Como está seu momento emocional com a educação dos filhos?";
  }
  return "Como está seu momento emocional?";
}

export function campoAbertoPergunta(respostas: Partial<RespostasQuiz>): string {
  const casal = ehCasal(respostas);
  if (casal && respostas.prioridade === "CUIDAR_DA_RELACAO") return "O que mais pesa na relação de vocês hoje? (opcional)";
  if (respostas.temFilhos && respostas.prioridade === "CUIDAR_DA_EDUCACAO_DOS_FILHOS") {
    return "O que mais pesa na educação dos seus filhos hoje? (opcional)";
  }
  return "O que mais pesa pra você hoje? (opcional)";
}

export const COMO_CONHECEU_OPTIONS = [
  "Indicação de amigo/família",
  "Redes sociais",
  "Escola dos filhos",
  "Evento presencial",
  "Outro",
];

/**
 * PROVISÓRIO — proposta do time (2026-08-04), ainda pendente validação jurídica
 * antes de ir pra produção. Prazo de retenção sugerido junto (24 meses a partir
 * da resposta, ou até a pessoa pedir exclusão) ainda não está implementado como
 * rotina automática — ver docs/quiz-perguntas.md.
 */
export const TEXTO_CONSENTIMENTO_LGPD =
  "Autorizo o IBF a usar minhas respostas para gerar meu diagnóstico personalizado e a me contatar por " +
  "e-mail (e WhatsApp, se eu informar) com esse conteúdo e outras novidades dos programas. Posso cancelar " +
  "esse consentimento quando quiser. Li e concordo com a Política de Privacidade.";
