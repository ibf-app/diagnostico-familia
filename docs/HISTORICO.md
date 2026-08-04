# Histórico e arquitetura — Quiz "Família em Foco" (IBF)

> Este documento consolida as decisões e o estado do projeto que, até aqui, só
> existiam espalhadas em conversas. Sempre que uma decisão importante mudar,
> atualize este arquivo — é a fonte de verdade sobre o "porquê", não só o "o quê"
> (o código já documenta o "o quê").

## 1. O que é o projeto

Quiz de isca gratuito, por e-mail e tela, pra qualificar leads automaticamente
e entregar um diagnóstico familiar personalizado. A pessoa responde 8–10
perguntas (P1–P10), e o sistema decide **de forma 100% determinística** (nunca
por IA) qual é a "fase" da vida familiar dela e qual programa do IBF recomendar
— a IA só escreve o *conteúdo* do diagnóstico em cima dessa decisão já tomada.

Documento de origem: `IBF_Quiz_Perguntas_PromptIA_Estrutura_Email` (v7),
fornecido pelo time de produto — perguntas, árvore de decisão, tabelas de
mapeamento e a spec do prompt de IA vêm de lá. Ver `docs/quiz-perguntas.md`.

## 2. Stack e por quê

| Peça | Escolha | Por quê |
|---|---|---|
| Framework | Next.js (TypeScript) | Frontend do quiz + API routes no mesmo projeto/deploy |
| Banco | Postgres no Railway, via Prisma | Já era a preferência do time; roda `prisma migrate deploy` automaticamente no start do Railway |
| IA | Anthropic (Claude) | Geração de conteúdo do diagnóstico, com saída estruturada nativa (não fine-tuning — ver seção 5) |
| E-mail | **Brevo** (não Mailersend) | Mailersend tem só 500 e-mails/mês grátis, já ocupados por outro app do IBF; Brevo dá ~9.000/mês grátis |
| Deploy | Railway | `railway.json` define o start command (`prisma migrate deploy && next start`) |

## 3. Árvore de decisão — por que é código, não IA

A fase e o programa recomendado são decididos por `src/lib/decision-tree.ts`,
uma função pura e determinística. Isso é intencional e não deve mudar: o doc
de origem é explícito que a IA nunca decide fase/programa, só escreve texto em
cima do que já foi decidido — garante consistência de marca e previsibilidade
comercial. Testado com os 3 casos de exemplo reais fornecidos originalmente
(Rafael/solteiro, Marina/casal sem filhos, Fernanda/casal com filhos).

## 4. Knowledge base — grounding da IA

`src/knowledge-base/` é o material que a IA recebe no prompt pra escrever o
diagnóstico (não é treino de modelo — é contexto injetado a cada chamada,
RAG simples sem embeddings, porque o volume de conteúdo por programa cabe
inteiro no contexto sem precisar de busca seletiva).

- `programas/<slug>.md` — conteúdo teórico real de cada um dos 9 programas do
  IBF, extraído automaticamente de `docs/casos_programas_ibf/` (apostilas
  reais fornecidas pelo time) via `scripts/build-knowledge-base.ts`.
  **Importante:** o script extrai só as seções "Nota técnica" de cada caso —
  descarta de propósito "Leitura do caso" e "Guia para preparar a reunião
  plenária" (têm nomes fictícios de personagens que não podem vazar pro
  e-mail de um lead real) e "Quiz"/"Referências" (não são conteúdo de
  grounding). Reexecutável se o material de origem for atualizado.
- `institucional/dados-iffd.md` — únicos números que a IA pode citar (68
  países, 20 Centros de Fortalecimento Familiar, +1.000 voluntários, +10.000
  pessoas impactadas). Validado com o time em 2026-08-04.
- `institucional/aviso-seguranca.md` — texto de fallback pra quando a regra de
  segurança dispara (ver seção 6). **Ainda não é o texto final** — o time
  removeu o rascunho original por não estar aprovado juridicamente; o que
  está lá hoje é um placeholder genérico neutro.
- `institucional/cta-generico.md` — destino do CTA pra quem não tem programa
  recomendado (`https://www.portalibf.org.br/conheca-o-ibf`).
- `livros-e-filmes.json` — **ainda vazio**. A lista curada de recomendações
  não existe; por isso `recomendacao_livro`/`recomendacao_filme` no schema da
  IA são `nullable` — o e-mail/tela simplesmente omitem esse bloco quando não
  há nada pra recomendar, em vez de a IA inventar título.

## 5. Geração de conteúdo por IA — decisões de design

- **Não é fine-tuning.** Nenhum modelo é treinado; cada chamada à API da
  Anthropic recebe o contexto relevante (programa + dados IFFD + lista de
  livros/filmes) montado na hora, em `src/lib/ai-diagnostic.ts`.
- **Saída estruturada nativa** (`output_config.format` com JSON Schema gerado
  do próprio schema Zod via `z.toJSONSchema`), não só instrução de prompt —
  isso evita o modelo devolver JSON malformado ou envolto em ` ```json `.
  Limitação descoberta na prática: a API da Anthropic só aceita `minItems` 0
  ou 1 nesse schema, então campos como `insights`/`acoes_praticas` usam
  `.min(1)` em vez de `.length(3)` — a quantidade exata (3 itens) é reforçada
  só via instrução no prompt, e o template de e-mail/tela itera sobre o array
  sem depender de tamanho fixo.
- **Guardrails de conteúdo** (proporção 80/20 diagnóstico/oferta, zero preço
  antes do bloco de oferta, zero alucinação de dados fora do fornecido, tom
  não robótico, sem clichê motivacional) vêm do doc original e estão no
  `SYSTEM_PROMPT`.
- **Evitar travessão (—)** em qualquer texto gerado ou copy de interface —
  regra de estilo adicionada depois, documentada em `docs/briefing-design.md`.

## 6. Regra de segurança — nunca vender em situação de crise

Quando o momento emocional (P6) ou o relato livre (P7) sinalizam sofrimento
além do escopo do quiz (`src/lib/safety-check.ts`, hoje uma heurística por
palavra-chave — não é uma solução robusta, ver TODO no próprio arquivo), o
e-mail **nunca** oferece ou menciona programa do IBF, mesmo que a árvore de
decisão tenha atribuído um `programaRecomendado`. Isso é reforçado em dois
níveis, não só um:

1. **Prompt:** instrução explícita pra IA não mencionar programa, e o
   conteúdo do programa nem é incluído no contexto quando o alerta dispara.
2. **Código:** `gerarDiagnosticoComIa` sobrescreve a oferta de volta pra
   `apoio_profissional`/`null` depois da resposta da IA, independente do que
   o modelo tenha retornado — testado em
   `src/lib/__tests__/ai-diagnostic.test.ts` simulando uma IA que tenta
   ignorar a instrução.

## 7. LGPD

- Controlador: Instituto Brasileiro da Família – IBF, CNPJ 46.586.700/0001-00.
- Texto do checkbox de consentimento (`TEXTO_CONSENTIMENTO_LGPD` em
  `src/lib/quiz-options.ts`): **provisório**, proposto pelo time, pendente
  validação jurídica antes de produção real.
- Retenção: 24 meses a partir do consentimento — implementado como rotina
  automática (`POST /api/cron/expurgar-leads`), disparada por um agendador
  externo (Railway cron service ou cron-job.org), autenticada por
  `CRON_SECRET` (ver `src/lib/cron-auth.ts`).

## 8. Resiliência — lead nunca se perde

O `Lead` é sempre salvo primeiro, antes de qualquer chamada de IA ou envio de
e-mail. Se a geração de IA ou o envio falhar por qualquer motivo, o
`Diagnostico` fica `FALHOU` (com o erro e contagem de tentativas), mas a
pessoa não precisa preencher o quiz de novo. `POST /api/cron/reprocessar-falhas`
(também autenticado por `CRON_SECRET`) varre os `FALHOU` com menos de 5
tentativas e tenta de novo — lógica extraída em `src/lib/processar-diagnostico.ts`
pra ser reaproveitada tanto pelo fluxo síncrono (`POST /api/quiz`) quanto pelo
cron.

## 9. Telas

- **Landing (`src/app/page.tsx`)** — hoje ainda é o boilerplate do
  `create-next-app`; briefing completo de conteúdo em `docs/briefing-design.md`
  pra handoff de design (humano ou ferramenta), implementação real pendente.
- **Quiz (`src/app/quiz/page.tsx`)** — wizard multi-step com toda a lógica
  condicional da árvore (P3/P3b/P4b), máscara de telefone brasileiro,
  validação de e-mail/telefone, logo do IBF (`public/logo_ibf.webp`) e nome
  do quiz no header.
- **Resultado (`src/app/quiz/TelaResultado.tsx`)** — exibida imediatamente
  após o envio, reproduz os mesmos blocos do e-mail (decisão de produto:
  mostrar na tela E continuar mandando e-mail, não substituir um pelo outro —
  o e-mail é o canal de nutrição/remarketing do lead a longo prazo).

## 10. Bugs corrigidos que valem registrar (pra não reintroduzir)

- **Campo de texto herdando valor do passo anterior**: P7 e P8 usavam o mesmo
  componente React sem `key` diferenciando o passo — React reaproveitava a
  instância e mantinha o texto digitado. Fix: `key={step}` no componente do
  passo atual.
- **502 no envio do quiz**: duas causas concorrentes — (1) a IA podia devolver
  JSON malformado, resolvido com saída estruturada nativa (seção 5); (2) o
  remetente configurado no Brevo (`diagnostico@portalibf.org.br`) não estava
  verificado na conta — trocado pro remetente verificado
  (`BREVO_SENDER_EMAIL`, hoje `send@edudebarros.com.br`, até o domínio
  `@portalibf.org.br` ser verificado).
- **Erro 400 "minItems values other than 0 or 1"**: ver seção 5.
- **Nixpacks (Railway) usando Node 18**: Prisma 7 e Next 16 exigem Node ≥20.19.
  Fix: `.nvmrc` + `engines.node` em `package.json`.
- **Migration inicial sem acesso de rede ao Postgres do Railway**: esta sessão
  não tem saída de rede TCP direta pra bancos externos (só HTTPS via proxy) —
  a migration inicial foi gerada offline com
  `prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script`,
  sem precisar conectar no banco real.

## 11. Pendências conhecidas

- [ ] Lista curada de livros/filmes (`livros-e-filmes.json`) — ainda vazia.
- [ ] Texto final do aviso de segurança — aguardando aprovação jurídica.
- [ ] Texto final do consentimento LGPD — aguardando aprovação jurídica.
- [ ] Landing page (`src/app/page.tsx`) — briefing pronto, implementação
      pendente.
- [ ] Confirmar destino definitivo do CTA genérico (hoje aponta pra
      `conheca-o-ibf`, que ainda mistura CTAs de programas específicos).
- [ ] PDFs originais das apostilas (`docs/casos_programas_ibf/*.pdf`) foram
      removidos do git — arquivar em storage separado (Railway Volume ou
      equivalente), fora do escopo deste repositório.
