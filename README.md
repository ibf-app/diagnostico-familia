# Diagnóstico Família — quiz "Família em Foco" (IBF)

Quiz de isca gratuito, por e-mail, que qualifica leads automaticamente e entrega
um diagnóstico personalizado a partir de uma árvore de decisão determinística +
geração de conteúdo por IA.

- **Stack:** Next.js (TypeScript), Prisma + Postgres (Railway), Anthropic (Claude)
  para o conteúdo do diagnóstico, Mailersend para envio.
- **Árvore de decisão:** `src/lib/decision-tree.ts` — decide fase e programa
  recomendado de forma 100% determinística (a IA nunca decide isso, só escreve
  conteúdo em cima). Testada com os 3 casos de exemplo reais em
  `src/lib/__tests__/decision-tree.test.ts`.
- **Knowledge base:** `src/knowledge-base/` — grounding fechado que a IA recebe
  no prompt (apostilas dos programas, dados IFFD validados, lista curada de
  livros/filmes). Hoje é tudo placeholder — ver `src/knowledge-base/README.md`.
- **Perguntas do quiz:** ver `docs/quiz-perguntas.md` e `src/types/quiz.ts`.

## Getting Started

```bash
npm install
cp .env.example .env   # preencher DATABASE_URL, ANTHROPIC_API_KEY, MAILERSEND_API_KEY
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

Schema em `prisma/schema.prisma` (modelos `Lead` e `Diagnostico`). Depois de
configurar `DATABASE_URL` (Postgres no Railway):

```bash
npx prisma migrate dev --name init
```
