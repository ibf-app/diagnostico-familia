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
  // A API da Anthropic só aceita minItems 0 ou 1 no schema de saída estruturada
  // (output_config) — "exatamente 3 itens" é reforçado só via instrução no
  // prompt; o template de e-mail itera sobre o array, então funciona com
  // qualquer tamanho caso o modelo devolva um número diferente de 3.
  insights: z.array(z.string().min(1)).min(1),
  acoes_praticas: z.array(z.string().min(1)).min(1),
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
