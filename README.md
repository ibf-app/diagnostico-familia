# Diagnóstico Família — quiz "Família em Foco" (IBF)

Quiz de isca gratuito, por e-mail e tela, que qualifica leads automaticamente e
entrega um diagnóstico personalizado a partir de uma árvore de decisão
determinística + geração de conteúdo por IA.

> **Novo no projeto?** Leia `docs/HISTORICO.md` primeiro — consolida as
> decisões de arquitetura, os porquês, os bugs já corrigidos e as pendências
> conhecidas. Este README é só o "como rodar".

- **Stack:** Next.js (TypeScript), Prisma + Postgres (Railway), Anthropic (Claude)
  para o conteúdo do diagnóstico, Brevo para envio.
- **Árvore de decisão:** `src/lib/decision-tree.ts` — decide fase e programa
  recomendado de forma 100% determinística (a IA nunca decide isso, só escreve
  conteúdo em cima). Testada com os 3 casos de exemplo reais em
  `src/lib/__tests__/decision-tree.test.ts`.
- **Knowledge base:** `src/knowledge-base/` — grounding fechado que a IA recebe
  no prompt. Apostilas dos 9 programas e dados IFFD já populados a partir do
  material real do IBF; lista curada de livros/filmes ainda pendente — ver
  `src/knowledge-base/README.md`.
- **Perguntas do quiz:** ver `docs/quiz-perguntas.md` e `src/types/quiz.ts`.

## Getting Started

```bash
npm install
cp .env.example .env   # preencher DATABASE_URL, ANTHROPIC_API_KEY, BREVO_API_KEY
npx prisma generate
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Testes

```bash
npm test          # roda uma vez
npm run test:watch
```

## Banco de dados

Schema em `prisma/schema.prisma` (modelos `Lead` e `Diagnostico`). A migration
inicial já está commitada em `prisma/migrations/`, gerada offline (sem precisar
de conexão com o banco) via:

```bash
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script
```

Em produção (Railway), o `startCommand` em `railway.json` roda
`prisma migrate deploy` automaticamente antes de subir o app — não precisa
rodar a migration manualmente lá. Em desenvolvimento local, depois de
configurar `DATABASE_URL`:

```bash
npx prisma migrate deploy
```
