# Quiz "Família em Foco" — perguntas (v7)

Referência resumida para o código. Fonte completa: doc
`IBF_Quiz_Perguntas_PromptIA_Estrutura_Email` (seção 3) fornecido pelo time de produto,
incluindo a spec do prompt de IA e a árvore de decisão completa.

10 perguntas (P1–P10), 2 com variantes condicionais (P3/P3b), 1 ramificada (P4b),
3 opcionais que não bloqueiam o envio (P7, P8, P9). Tempo estimado: 2 minutos.

| # | Pergunta | Exibida quando... |
|---|---|---|
| P1 | Estado civil | Sempre (1ª pergunta) |
| P2 | Tem filhos? | Sempre |
| P3 | Tempo de união (até 5 / mais de 5 anos) | Casado(a)/união estável e P2 = Não |
| P3 | Idade dos filhos (chips, múltipla escolha) | P2 = Sim |
| P3b | Tempo de união | Casado(a) com filhos e P4 = "cuidar da relação como casal" |
| P4 | Prioridade agora (varia por perfil) | Sempre |
| P4b | Qual faixa está mais desafiadora agora? | 2+ faixas marcadas em P3 e P4 = "cuidar da educação dos filhos" |
| P5 | Maior desafio hoje (Tabela C, por perfil) | Sempre |
| P6 | Momento emocional | Sempre |
| P7 | Campo aberto (opcional, até 280 caracteres) | Sempre, opcional |
| P8 | Cidade (opcional) | Sempre, opcional |
| P9 | Como conheceu o IBF? (opcional) | Sempre, opcional |
| P10 | Nome, WhatsApp (opcional), e-mail + consentimento LGPD | Sempre, última etapa |

Ver `src/lib/decision-tree.ts` para a árvore de decisão implementada e
`src/types/quiz.ts` para os tipos de cada resposta.
