import { z } from "zod";

/**
 * Validação da API (/api/quiz). Só garante tipos e os campos sempre obrigatórios
 * (P1, P2, P4, P5, P6, P10) — a obrigatoriedade condicional (P3/P3b/P4b conforme
 * o perfil) é responsabilidade do wizard no frontend e é verificada de novo pela
 * própria árvore de decisão (decision-tree.ts lança erro se faltar algo condicional).
 */
export const quizInputSchema = z.object({
  estadoCivil: z.enum(["SOLTEIRO", "NAMORANDO_NOIVO", "CASADO_UNIAO_ESTAVEL", "DIVORCIADO_SEPARADO", "VIUVO"]),
  temFilhos: z.boolean(),
  tempoUniao: z.enum(["ATE_5_ANOS", "MAIS_DE_5_ANOS"]).optional(),
  idadesFilhos: z
    .array(z.enum(["DE_0_A_3", "DE_4_A_5", "DE_6_A_7", "DE_8_A_10", "DE_11_A_13", "DE_14_A_16", "MAIS_DE_16"]))
    .optional(),
  faixaMaisDesafiadora: z
    .enum(["DE_0_A_3", "DE_4_A_5", "DE_6_A_7", "DE_8_A_10", "DE_11_A_13", "DE_14_A_16", "MAIS_DE_16"])
    .optional(),
  prioridade: z.string().min(1),
  maiorDesafio: z.string().min(1),
  momentoEmocional: z.enum(["PILOTO_AUTOMATICO", "FASE_DIFICIL", "BEM_BUSCANDO_CRESCER", "PREFIRO_NAO_RESPONDER"]),
  relatoLivre: z.string().max(280).optional(),
  cidade: z.string().max(120).optional(),
  comoConheceu: z.string().max(120).optional(),
  nome: z.string().min(1),
  whatsapp: z.string().max(30).optional(),
  email: z.string().email(),
  consentimentoLgpd: z.literal(true),
});

export type QuizInput = z.infer<typeof quizInputSchema>;
