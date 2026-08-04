# Knowledge base (grounding da IA)

Esta pasta é o contexto fechado que a IA recebe pra gerar o conteúdo do diagnóstico
(seção 4.2 do doc `IBF_Quiz_Perguntas_PromptIA_Estrutura_Email`). Nada aqui é usado
pra treinar modelo nenhum — é texto injetado no prompt a cada chamada (RAG simples,
sem índice/embedding por enquanto: o volume de conteúdo é pequeno o bastante pra
mandar o arquivo inteiro do programa relevante).

Todo arquivo aqui é **placeholder** até o material oficial chegar do IBF. Ver a
lista de pendências compartilhada no Slack (itens 1, 2, 3, 4, 7).

## Estrutura

- `programas/<slug>.md` — um arquivo por programa do catálogo, com trechos oficiais
  (apostila/site) que a IA pode citar. Ver `programas/_template.md` para o formato.
- `livros-e-filmes.json` — lista curada por fase × desafio (Tabela C). A IA só pode
  escolher títulos desta lista, nunca sugerir livremente.
- `institucional/dados-iffd.md` — estatísticas/dados da metodologia IFFD aprovados
  para uso público (hoje só "68 países").
- `institucional/aviso-seguranca.md` — texto final (aprovado juridicamente) que
  substitui a oferta comercial quando a regra de segurança (seção 4.3) é acionada.
- `institucional/cta-generico.md` — destino/texto do CTA genérico para perfis sem
  `programaRecomendado` (Educador(a) Solo, Recomeço com Propósito).

## Como isso é usado

`lib/ai-diagnostic.ts` lê o arquivo do programa correspondente ao resultado de
`decidirFaseEPrograma()` (ou o CTA genérico, se `programaRecomendado` for `null`),
monta o prompt com esse conteúdo + as respostas do lead, e chama a API da Anthropic.
