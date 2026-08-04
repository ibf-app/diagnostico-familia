# Briefing de design — Família em Foco (IBF)

> Documento de conteúdo e requisitos para handoff a um designer humano e/ou para
> alimentar a ferramenta Claude Design. Não é uma implementação: não contém CSS,
> componentes nem decisões visuais finais — essas ficam a critério de quem desenha.

## 1. Contexto do produto

**Família em Foco** é um quiz gratuito (lead magnet) do **IBF — Instituto
Brasileiro da Família**, representante no Brasil da **IFFD** (International
Federation for Family Development), metodologia aplicada há décadas em **68
países**.

O usuário responde de 8 a 10 perguntas (P1–P10, com algumas condicionais e três
opcionais) sobre sua situação familiar/conjugal atual. Ao final, informa nome,
e-mail e WhatsApp (opcional) e recebe um **diagnóstico personalizado gerado por
IA**: leitura da fase em que está, insights sobre esse momento, ações práticas
para a semana, eventualmente uma recomendação de livro/filme, e uma oferta de
programa do IBF (ou um CTA genérico/apoio profissional, dependendo do perfil).

**Público:** pais, casais e pessoas solteiras/sem filhos, brasileiros, em
diferentes fases do ciclo familiar — de quem está namorando/noivando a quem já
tem filhos adolescentes, passando por quem está sozinho(a) buscando propósito.
Perfis bem diferentes entre si, então o tom precisa funcionar tanto para quem
está numa fase tranquila quanto para quem está numa fase difícil.

**Objetivo de negócio:** captar lead (nome + e-mail + WhatsApp opcional) →
entregar valor real e imediato (o diagnóstico) → nutrir e converter para um
programa pago do IBF. O diagnóstico não pode parecer um funil de vendas
disfarçado: hoje a regra de conteúdo já impõe proporção 80% diagnóstico/dica
prática e 20% oferta, e isso deve se refletir também na hierarquia visual das
telas (o conteúdo de valor vem antes e ocupa mais espaço que a oferta).

Hoje o diagnóstico só chega por e-mail. Este briefing cobre também a criação de
uma tela de resultado que exibe o mesmo diagnóstico imediatamente no site.

## 2. Tom de voz e diretrizes de conteúdo

Estas diretrizes já regem o conteúdo gerado por IA (ver `SYSTEM_PROMPT` em
`src/lib/ai-diagnostic.ts`) e devem se estender a todo o copy de interface
(landing, quiz, tela de resultado):

- **Profissional, mas caloroso** — como um especialista que leu as respostas de
  verdade, não como um formulário genérico.
- **Baseado em evidência** — nunca citar dado, estatística ou nome de programa
  que não venha do conteúdo institucional já curado (ver seção 8).
- **Nunca robótico** e **nunca clichê motivacional vazio** ("você é capaz de
  tudo!", "acredite em si mesmo!") — nem no copy institucional, nem nos textos
  de apoio das telas.
- **Evitar travessão (—)** em qualquer texto de interface, seguindo a mesma
  regra já aplicada ao conteúdo gerado por IA. Preferir frases curtas, vírgula
  ou ponto.
- Isso vale tanto para o copy fixo das telas (headlines, microcopy de botões,
  textos de apoio) quanto para o conteúdo dinâmico que já é gerado pela IA e
  será exibido na tela de resultado.

## 3. Tela 1 — Home / Landing (a construir)

Hoje esta tela **não existe de fato**: `src/app/page.tsx` é o boilerplate
padrão do `create-next-app` (logo do Next.js, links para Vercel/documentação).
Precisa ser substituída por uma landing "vendedora" que apresente a ferramenta
antes de a pessoa entrar no quiz.

Blocos de conteúdo que a página precisa ter:

1. **Header** com o logo do IBF (`public/logo_ibf.webp`) e nome do produto
   ("Família em Foco").
2. **Bloco principal (hero)**: o que é a ferramenta, para quem é, e a promessa
   central (diagnóstico gratuito e personalizado sobre o momento familiar da
   pessoa) — com CTA principal "Começar quiz" bem visível.
3. **O que você recebe como resultado**: descrever concretamente os blocos do
   diagnóstico (leitura da fase atual, insights sobre esse momento, ações
   práticas para a semana, e eventualmente indicação de livro/filme), deixando
   claro que é personalizado e não um resultado genérico de "teste de
   personalidade".
4. **Como funciona (passo a passo)**: algo como responder algumas perguntas
   rápidas (mencionar o tempo estimado de ~2 minutos, hoje registrado em
   `docs/quiz-perguntas.md`) → receber o diagnóstico na tela e por e-mail.
5. **Sinais de credibilidade**: metodologia da IFFD, presença em 68 países —
   e, se o designer/produto optar por incluir os outros números institucionais
   já validados (20 Centros de Fortalecimento Familiar no Brasil, +1.000
   colaboradores voluntários, +10.000 pessoas impactadas — todos em
   `src/knowledge-base/institucional/dados-iffd.md`), usar exatamente esses
   números, sem arredondar ou estimar novos.
6. **CTA final**, reforçando o convite a começar o quiz.
7. **Rodapé** com identificação do IBF e link para política de privacidade
   (mesmo padrão já usado no e-mail: `portalibf.org.br/politica-de-privacidade`).

Não é necessário (e não há conteúdo hoje para) depoimentos de usuários reais,
prova social quantitativa do próprio quiz, ou nomes específicos de programas —
isso é conteúdo institucional que não está definido neste projeto (ver seção 9).

## 4. Tela 2 — Quiz (existente, precisa de polish visual)

### Estrutura atual (funcional, implementada em `src/app/quiz/page.tsx` e
`src/app/quiz/quiz.module.css`)

- Card centralizado sobre fundo bege, com header (logo + título "Família em
  Foco") e uma barra de progresso fina no topo.
- Fluxo de wizard com passos condicionais (P1 a P10): a sequência de perguntas
  varia conforme o perfil (casal com/sem filhos, indivíduo com/sem filhos), com
  ramificações em P3/P3b e P4b — ver `src/lib/quiz-steps.ts` e
  `docs/quiz-perguntas.md` para a árvore completa.
- Tipos de interação por passo:
  - **Escolha única**: lista de botões empilhados (uma opção por linha).
  - **Seleção múltipla**: chips em formato de pílula, arredondados, que podem
    ser combinados (usado só na pergunta de idade dos filhos).
  - **Campo de texto livre**: textarea com limite de 280 caracteres (relato
    livre, opcional) ou input simples (cidade, opcional).
  - **Formulário final (P10)**: nome, WhatsApp (opcional, com máscara de
    telefone brasileiro aplicada em tempo real), e-mail (com validação),
    checkbox de consentimento LGPD.
- Navegação: botão "Voltar" (texto/link) quando há histórico, botão "Pular"
  nas perguntas opcionais, botão primário "Continuar"/"Receber meu
  diagnóstico".
- Ao concluir, hoje mostra só uma tela de confirmação textual ("Recebemos suas
  respostas! Seu diagnóstico personalizado está a caminho do seu e-mail...") —
  ver requisito de mudança na seção 5.

### Por que precisa de polish

O dono do produto considera o layout atual "não muito legal" e quer melhorá-lo
para aumentar a taxa de conclusão do quiz. Não há mudança de fluxo/lógica
esperada aqui — é puramente visual e de microinteração.

### Requisitos de melhoria

- **Mobile-first**: é um quiz curto (~2 minutos), pensado para ser respondido
  no celular. O design deve partir da tela pequena e escalar para desktop, não
  o contrário.
- **Indicador de progresso mais claro**: hoje é só uma barra fina; considerar
  reforçar a sensação de avanço (ex.: "pergunta X de Y" ou equivalente) sem
  assumir um número fixo de passos, já que o total de perguntas varia por
  perfil (a lógica de cálculo de progresso já existe em `ORDEM_PROGRESSO` em
  `quiz/page.tsx` e pode ser reaproveitada).
- **Sensação de "quase lá"** nos últimos passos, para reduzir abandono
  justamente perto do formulário final (que é onde o lead é efetivamente
  capturado).
- **Hierarquia visual mais forte** nas perguntas e opções (hoje os botões de
  escolha única e os chips de seleção múltipla têm o mesmo peso visual básico;
  avaliar se precisam de mais diferenciação entre si).
- **Estados de erro e validação** já existem funcionalmente (e-mail inválido,
  telefone com dígitos faltando/sobrando) e devem ganhar tratamento visual
  consistente com o restante do sistema.
- **Consentimento LGPD**: o texto (`TEXTO_CONSENTIMENTO_LGPD` em
  `src/lib/quiz-options.ts`) já existe como checkbox acoplado ao formulário
  final — é conteúdo **provisório**, pendente de validação jurídica do IBF (ver
  seção 8). O design pode e deve estilizar o bloco (tipografia, espaçamento,
  possível componente de checkbox), mas não deve propor reescrita do texto.

## 5. Tela 3 — Resultado (nova, a construir)

### Situação atual

Hoje, ao concluir o quiz, a única coisa exibida na tela é uma mensagem de
confirmação genérica ("Recebemos suas respostas! Seu diagnóstico personalizado
está a caminho do seu e-mail..."). O diagnóstico completo só existe no e-mail
transacional (`src/lib/email-template.ts`), que já é montado a partir do
retorno estruturado da IA (`src/lib/ai-diagnostic-schema.ts`).

### Requisito de produto

O dono do produto quer que o diagnóstico completo seja **exibido na própria
tela**, imediatamente após o envio do quiz, e não apenas por e-mail. Isso é uma
tela nova a ser desenhada.

### Blocos de conteúdo (os mesmos do e-mail, na mesma ordem lógica)

1. **Abertura personalizada**: saudação com o nome da pessoa + o texto de
   abertura gerado pela IA (`abertura_personalizada`).
2. **Seu momento / fase**: card de destaque com o título da fase atribuída
   (`fase_titulo`) — no e-mail este bloco tem tratamento visual diferenciado
   (fundo bege, rótulo "Seu momento" em caixa alta).
3. **Insights**: "o que os dados dizem sobre essa fase" — lista de itens
   (`insights`, hoje pensado para 3 itens) em blocos individuais.
4. **Ações práticas**: lista de itens (`acoes_praticas`, hoje pensado para 3
   itens) com marcador de "concluído"/checkmark, como no e-mail (cor de acento
   verde já em uso: `#639922`).
5. **Livro/filme (condicional)**: bloco "para aprofundar essa semana" com
   recomendação de livro e/ou filme — só aparece quando a IA de fato retornou
   algum dos dois (`recomendacao_livro` / `recomendacao_filme`), já que a lista
   curada de títulos está vazia hoje (ver seção 8). O design precisa prever
   tanto o estado "com recomendação" quanto o estado "sem recomendação nenhuma"
   (bloco inteiro ausente).
6. **Nota de credibilidade metodológica**: menção à metodologia da IFFD (já
   presente no e-mail como uma citação/destaque com borda lateral colorida).
7. **Oferta**: bloco final com o texto de oferta (`oferta.texto`) — pode ser
   uma indicação de programa específico, um CTA genérico, ou uma mensagem de
   apoio profissional (quando a regra de segurança emocional é acionada e
   nenhum programa é oferecido). Esse bloco deve manter proporção visual
   discreta em relação aos blocos de diagnóstico (reforçando a regra de
   conteúdo 80/20 da seção 2), nunca competir em destaque com os insights e
   ações práticas.
8. **Reforço de que o e-mail também foi enviado**: a tela deve deixar claro,
   de forma visível mas não intrusiva, que o mesmo diagnóstico foi enviado por
   e-mail (e sugerir checar spam/promoções, como já faz o texto atual da tela
   de confirmação) — a exibição na tela complementa o e-mail, não o substitui.

### Observação técnica para quem for implementar depois do design

Hoje a rota `/api/quiz` processa o envio mas a página não guarda nem exibe o
retorno estruturado do diagnóstico — a tela de resultado é puramente textual e
estática. Passar a exibir o diagnóstico na tela é também uma mudança de
funcionalidade, não só visual; o design deve tratar esta tela como conteúdo
dinâmico (os mesmos campos que já alimentam o e-mail), não como texto fixo.

## 6. Consistência com o e-mail existente

O e-mail transacional de diagnóstico já está em produção e tem uma identidade
visual definida (ver `src/lib/email-template.ts`). O site (landing, quiz,
resultado) deve manter consistência visual com esse e-mail, não criar uma
identidade nova do zero — a pessoa recebe o mesmo diagnóstico em dois canais
(tela e e-mail) e ambos devem parecer parte do mesmo produto.

## 7. Tokens de design — tabela de partida

Estes valores já estão em uso hoje (e-mail e/ou quiz) e servem como ponto de
partida para o designer consolidar em um sistema de tokens formal — não são a
palavra final, mas a base de onde partir para manter consistência com o que já
está em produção.

### Cores

| Token proposto | Hex | Uso atual |
|---|---|---|
| Navy (primária/marca) | `#1A2B4C` | Header do e-mail, títulos, botão primário do quiz, chip selecionado |
| Dourado/mostarda | `#8A6D1F` | Rótulos em caixa alta ("Seu momento", "O que os dados dizem...", eyebrow do quiz) |
| Acento (destaque/progresso) | `#F5A623` | Barra de progresso do quiz, borda lateral da nota de credibilidade |
| Fundo bege (página) | `#EDEBE4` / `#F4F1E9` | Fundo do e-mail e do quiz, bloco "Seu momento" |
| Borda neutra | `#E3E1D8` / `#D8D5CA` | Bordas de cards e inputs |
| Verde de confirmação | `#639922` | Checkmark das ações práticas |
| Texto principal | `#222222` | Corpo de texto |
| Texto secundário | `#444441` | Parágrafos de apoio, checkbox de consentimento |
| Texto terciário | `#6B6656` | Legendas, links secundários, botão "voltar" |
| Texto quaternário/rodapé | `#8A867A` | Rodapé do e-mail |
| Erro | `#B3261E` | Mensagens de validação do quiz (já em uso, fora da paleta bege/navy) |

### Tipografia e espaçamento

Ainda não há uma escala tipográfica nem grid de espaçamento formalizados no
código — hoje é CSS ad hoc por componente (`font-size` em pixels avulsos,
`Helvetica, Arial, sans-serif` como família tipográfica, sem uso de fontes
customizadas). Cabe ao designer propor:

- Uma escala tipográfica (tamanhos de display/título/corpo/legenda) coerente
  com os tamanhos já em uso (títulos ~19–22px, corpo ~14–16px, legendas
  ~11–13px).
- Uma escala de espaçamento consistente (hoje os valores variam entre 8px,
  10px, 12px, 16px, 20px, 24px, 28px sem um sistema claro).
- Decisão sobre manter a família tipográfica padrão do sistema (Helvetica/Arial)
  ou propor uma nova — hoje não há webfont carregada no projeto.

### Logo

O logo oficial do IBF está em `public/logo_ibf.webp` e já é usado no header do
quiz e no e-mail (com fundo navy, no e-mail). Qualquer novo uso do logo
(landing, tela de resultado) deve reaproveitar esse arquivo.

## 8. Restrições técnicas para o handoff

- **Stack**: Next.js (App Router). As telas novas (landing, resultado) devem
  seguir a mesma convenção de estrutura de pastas já usada em `src/app/`.
- **Mobile-first** em todas as telas, mas principalmente no quiz, que é
  pensado para ser respondido no celular.
- **Texto de consentimento LGPD é provisório**: está marcado no código como
  pendente de validação jurídica (ver `TEXTO_CONSENTIMENTO_LGPD` em
  `src/lib/quiz-options.ts` e `docs/quiz-perguntas.md`). O design pode
  estilizar o componente (checkbox, tipografia, espaçamento), mas não deve
  propor uma reescrita do conteúdo jurídico.
- **A lista curada de livros/filmes recomendados está vazia hoje**
  (`src/knowledge-base/livros-e-filmes.json`, aguardando indicação do time de
  conteúdo) — isso significa que, na prática, o bloco "livro/filme" da tela de
  resultado provavelmente não vai aparecer para nenhum usuário até essa lista
  ser populada. Isso **não é um bug de design**: o design deve prever os dois
  estados (com e sem recomendação) mesmo que o segundo seja o mais comum por
  enquanto.
- **Nomes e conteúdo dos programas do IBF** vêm de arquivos institucionais já
  definidos em `src/knowledge-base/programas/*.md` (ex.: Amor Matrimonial,
  Primeiros Passos, Primeiras Letras, Pré-adolescência, Adolescência, Primeiras
  Decisões, Primeiras Conversas, Projeto Pessoal) — o design não decide nomes
  de programa nem escreve descrições novas para eles.
- **Dados institucionais citáveis** (estatísticas, números) estão limitados ao
  que existe em `src/knowledge-base/institucional/dados-iffd.md` — hoje: 68
  países, 20 Centros de Fortalecimento Familiar, +1.000 colaboradores
  voluntários, +10.000 pessoas impactadas. Nenhum outro número deve ser
  inventado ou estimado para a landing.

## 9. Fora de escopo / não decidir neste design

- **Texto jurídico do consentimento LGPD** — é responsabilidade do jurídico do
  IBF, não do design.
- **Nomes, preços e conteúdo descritivo dos programas do IBF** — já definidos
  em conteúdo institucional próprio, fora deste projeto de design.
- **Textos institucionais aprovados** (política de privacidade, dados da
  metodologia IFFD, avisos de segurança/apoio profissional) — são conteúdo
  fixo e curado, não copy de interface a ser reescrito.
- **A lista curada de livros e filmes** — depende de indicação do time de
  conteúdo do IBF, não é uma decisão de design.
