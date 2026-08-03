import { describe, expect, it } from "vitest";
import { decidirFaseEPrograma } from "@/lib/decision-tree";
import type { RespostasQuiz } from "@/types/quiz";

// Os 3 casos abaixo replicam exatamente os exemplos de e-mail fornecidos
// (03_exemplo_email/: Rafael, Marina, Fernanda) — servem de regressão pra árvore de decisão.

describe("decidirFaseEPrograma", () => {
  it("Rafael — solteiro, sem filhos, prioridade vida afetiva -> Projeto em Formação / Projeto Pessoal", () => {
    const respostas: RespostasQuiz = {
      estadoCivil: "SOLTEIRO",
      temFilhos: false,
      prioridade: "VIDA_AFETIVA_E_RELACIONAMENTOS",
      maiorDesafio: "Relacionamentos e conexão",
      momentoEmocional: "BEM_BUSCANDO_CRESCER",
      relatoLivre:
        "Já me organizei bastante sozinho, mas ainda não sei como construir uma relação séria sem repetir os mesmos erros.",
      nome: "Rafael",
      email: "rafael@exemplo.com",
    };

    expect(decidirFaseEPrograma(respostas)).toEqual({
      fase: "Projeto em Formação",
      programaRecomendado: "Projeto Pessoal",
      tabelaUsada: "C3_INDIVIDUAL",
    });
  });

  it("Marina — casada há 2 anos, sem filhos -> Base do Casal / Amor Matrimonial 1", () => {
    const respostas: RespostasQuiz = {
      estadoCivil: "CASADO_UNIAO_ESTAVEL",
      temFilhos: false,
      tempoUniao: "ATE_5_ANOS",
      prioridade: "CUIDAR_DA_RELACAO",
      maiorDesafio: "Comunicação no dia a dia",
      momentoEmocional: "PILOTO_AUTOMATICO",
      relatoLivre: "A correria do trabalho tem tomado o tempo que era só nosso.",
      nome: "Marina",
      email: "marina@exemplo.com",
    };

    expect(decidirFaseEPrograma(respostas)).toEqual({
      fase: "Base do Casal",
      programaRecomendado: "Amor Matrimonial 1",
      tabelaUsada: "C1_CASAL",
    });
  });

  it("Fernanda — casada, 2 filhos (0-3 e 8-10), prioridade educação, faixa mais desafiadora 8-10 -> Pais em Construção / Primeiras Decisões", () => {
    const respostas: RespostasQuiz = {
      estadoCivil: "CASADO_UNIAO_ESTAVEL",
      temFilhos: true,
      idadesFilhos: ["DE_0_A_3", "DE_8_A_10"],
      prioridade: "CUIDAR_DA_EDUCACAO_DOS_FILHOS",
      faixaMaisDesafiadora: "DE_8_A_10",
      maiorDesafio: "Ordem e regras em casa",
      momentoEmocional: "FASE_DIFICIL",
      relatoLivre:
        "Ele testa os limites o tempo todo e às vezes não sei se estou sendo rígido demais ou frouxo demais.",
      nome: "Fernanda",
      email: "fernanda@exemplo.com",
    };

    expect(decidirFaseEPrograma(respostas)).toEqual({
      fase: "Pais em Construção",
      programaRecomendado: "Primeiras Decisões",
      tabelaUsada: "C2_PAIS",
    });
  });

  it("casal com filhos priorizando a relação usa P3b (Tabela B), não Tabela A", () => {
    const respostas: RespostasQuiz = {
      estadoCivil: "CASADO_UNIAO_ESTAVEL",
      temFilhos: true,
      idadesFilhos: ["DE_4_A_5"],
      prioridade: "CUIDAR_DA_RELACAO",
      tempoUniao: "MAIS_DE_5_ANOS",
      maiorDesafio: "Equilíbrio trabalho-casa",
      momentoEmocional: "BEM_BUSCANDO_CRESCER",
      nome: "Teste",
      email: "teste@exemplo.com",
    };

    expect(decidirFaseEPrograma(respostas)).toEqual({
      fase: "Casal em Prioridade",
      programaRecomendado: "Amor Matrimonial 2",
      tabelaUsada: "C1_CASAL",
    });
  });

  it("solo com filhos priorizando a si mesmo -> Recomeço com Propósito, sem programa (CTA genérico)", () => {
    const respostas: RespostasQuiz = {
      estadoCivil: "DIVORCIADO_SEPARADO",
      temFilhos: true,
      idadesFilhos: ["DE_11_A_13"],
      prioridade: "CUIDAR_DE_MIM",
      maiorDesafio: "Falta de clareza sobre o futuro",
      momentoEmocional: "FASE_DIFICIL",
      nome: "Teste",
      email: "teste@exemplo.com",
    };

    expect(decidirFaseEPrograma(respostas)).toEqual({
      fase: "Recomeço com Propósito",
      programaRecomendado: null,
      tabelaUsada: "C3_INDIVIDUAL",
    });
  });

  it("solo com filhos priorizando a educação, mesmo com faixa válida, nunca recebe programa (Educador(a) Solo)", () => {
    const respostas: RespostasQuiz = {
      estadoCivil: "VIUVO",
      temFilhos: true,
      idadesFilhos: ["DE_14_A_16"],
      prioridade: "CUIDAR_DA_EDUCACAO_DOS_FILHOS",
      maiorDesafio: "Mudanças e crises dessa fase",
      momentoEmocional: "PREFIRO_NAO_RESPONDER",
      nome: "Teste",
      email: "teste@exemplo.com",
    };

    expect(decidirFaseEPrograma(respostas)).toEqual({
      fase: "Educador(a) Solo",
      programaRecomendado: null,
      tabelaUsada: "C2_PAIS",
    });
  });

  it("filho +16 anos está fora do catálogo -> programaRecomendado null mesmo em casal", () => {
    const respostas: RespostasQuiz = {
      estadoCivil: "CASADO_UNIAO_ESTAVEL",
      temFilhos: true,
      idadesFilhos: ["MAIS_DE_16"],
      prioridade: "CUIDAR_DA_EDUCACAO_DOS_FILHOS",
      maiorDesafio: "Preparo pra vida adulta",
      momentoEmocional: "BEM_BUSCANDO_CRESCER",
      nome: "Teste",
      email: "teste@exemplo.com",
    };

    expect(decidirFaseEPrograma(respostas)).toEqual({
      fase: "Pais em Construção",
      programaRecomendado: null,
      tabelaUsada: "C2_PAIS",
    });
  });

  it("2+ faixas marcadas sem faixaMaisDesafiadora (P4b) lança erro de validação", () => {
    const respostas: RespostasQuiz = {
      estadoCivil: "CASADO_UNIAO_ESTAVEL",
      temFilhos: true,
      idadesFilhos: ["DE_0_A_3", "DE_8_A_10"],
      prioridade: "CUIDAR_DA_EDUCACAO_DOS_FILHOS",
      maiorDesafio: "Ordem e regras em casa",
      momentoEmocional: "FASE_DIFICIL",
      nome: "Teste",
      email: "teste@exemplo.com",
    };

    expect(() => decidirFaseEPrograma(respostas)).toThrow(/faixaMaisDesafiadora/);
  });
});
