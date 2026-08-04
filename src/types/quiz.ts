export type EstadoCivil =
  | "SOLTEIRO"
  | "NAMORANDO_NOIVO"
  | "CASADO_UNIAO_ESTAVEL"
  | "DIVORCIADO_SEPARADO"
  | "VIUVO";

export type TempoUniao = "ATE_5_ANOS" | "MAIS_DE_5_ANOS";

export type FaixaEtaria =
  | "DE_0_A_3"
  | "DE_4_A_5"
  | "DE_6_A_7"
  | "DE_8_A_10"
  | "DE_11_A_13"
  | "DE_14_A_16"
  | "MAIS_DE_16";

export type MomentoEmocional =
  | "PILOTO_AUTOMATICO"
  | "FASE_DIFICIL"
  | "BEM_BUSCANDO_CRESCER"
  | "PREFIRO_NAO_RESPONDER";

/** Prioridade em P4 quando casado(a)/união estável sem filhos e com filhos. */
export type PrioridadeCasal = "CUIDAR_DA_RELACAO" | "CUIDAR_DA_EDUCACAO_DOS_FILHOS";

/** Prioridade em P4 quando solteiro(a) etc. sem filhos. */
export type PrioridadeSolteiro =
  | "MEU_PROPOSITO_E_CAMINHO"
  | "TRABALHO_E_CARREIRA"
  | "VIDA_AFETIVA_E_RELACIONAMENTOS"
  | "NAO_SEI_DIZER";

/** Prioridade em P4 quando solteiro(a) etc. com filhos. */
export type PrioridadeSolteiroComFilhos = "CUIDAR_DE_MIM" | "CUIDAR_DA_EDUCACAO_DOS_FILHOS";

export interface RespostasQuiz {
  estadoCivil: EstadoCivil;
  temFilhos: boolean;
  tempoUniao?: TempoUniao;
  /** P3 — faixas etárias marcadas (múltipla escolha), só quando temFilhos = true */
  idadesFilhos?: FaixaEtaria[];
  prioridade: PrioridadeCasal | PrioridadeSolteiro | PrioridadeSolteiroComFilhos;
  /** P4b — só quando idadesFilhos.length >= 2 e prioridade = CUIDAR_DA_EDUCACAO_DOS_FILHOS */
  faixaMaisDesafiadora?: FaixaEtaria;
  maiorDesafio: string;
  momentoEmocional: MomentoEmocional;
  relatoLivre?: string;
  cidade?: string;
  comoConheceu?: string;
  nome: string;
  whatsapp?: string;
  email: string;
}

export type TabelaC = "C1_CASAL" | "C2_PAIS" | "C3_INDIVIDUAL";

export interface ResultadoDecisao {
  fase: string;
  programaRecomendado: string | null;
  tabelaUsada: TabelaC;
}
