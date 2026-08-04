import { z } from "zod";

/**
 * Schema de saída da IA (seção 4.4 do doc de spec). A IA só preenche conteúdo —
 * fase/programa já vêm decididos pela árvore determinística (decision-tree.ts).
 *
 * recomendacao_livro/recomendacao_filme são opcionais: a lista curada (seção 4.2,
 * item 3) ainda não foi populada pelo time, então por enquanto a IA não recomenda
 * nada nesse bloco em vez de inventar títulos (decisão do time em 2026-08-04).
 */
export const diagnosticoIaSchema = z.object({
  assunto_email: z.string().min(1),
  abertura_personalizada: z.string().min(1),
  fase_titulo: z.string().min(1),
  insights: z.array(z.string().min(1)).length(3),
  acoes_praticas: z.array(z.string().min(1)).length(3),
  recomendacao_livro: z
    .object({
      titulo: z.string().min(1),
      porque: z.string().min(1),
    })
    .nullable(),
  recomendacao_filme: z
    .object({
      titulo: z.string().min(1),
      porque: z.string().min(1),
    })
    .nullable(),
  oferta: z.object({
    tipo: z.enum(["programa", "conteudo_generico", "apoio_profissional"]),
    programa_primario: z.string().nullable(),
    texto: z.string().min(1),
  }),
});

export type DiagnosticoIa = z.infer<typeof diagnosticoIaSchema>;
