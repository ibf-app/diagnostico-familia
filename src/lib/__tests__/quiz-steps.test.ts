import { describe, expect, it } from "vitest";
import { proximoPasso } from "@/lib/quiz-steps";
import type { RespostasQuiz } from "@/types/quiz";

describe("proximoPasso", () => {
  it("casal sem filhos: P2 -> P3_TEMPO_UNIAO -> P5 (pula P4)", () => {
    const r: Partial<RespostasQuiz> = { estadoCivil: "CASADO_UNIAO_ESTAVEL", temFilhos: false };
    expect(proximoPasso("P2", r)).toBe("P3_TEMPO_UNIAO");
    expect(proximoPasso("P3_TEMPO_UNIAO", r)).toBe("P5");
  });

  it("casal com filhos priorizando a relação: P4 -> P3B_TEMPO_UNIAO -> P5", () => {
    const r: Partial<RespostasQuiz> = {
      estadoCivil: "CASADO_UNIAO_ESTAVEL",
      temFilhos: true,
      idadesFilhos: ["DE_0_A_3"],
      prioridade: "CUIDAR_DA_RELACAO",
    };
    expect(proximoPasso("P4", r)).toBe("P3B_TEMPO_UNIAO");
    expect(proximoPasso("P3B_TEMPO_UNIAO", r)).toBe("P5");
  });

  it("casal com 1 filho priorizando educação: P4 -> P5 direto (sem P4b)", () => {
    const r: Partial<RespostasQuiz> = {
      estadoCivil: "CASADO_UNIAO_ESTAVEL",
      temFilhos: true,
      idadesFilhos: ["DE_8_A_10"],
      prioridade: "CUIDAR_DA_EDUCACAO_DOS_FILHOS",
    };
    expect(proximoPasso("P4", r)).toBe("P5");
  });

  it("casal com 2+ filhos priorizando educação: P4 -> P4B -> P5", () => {
    const r: Partial<RespostasQuiz> = {
      estadoCivil: "CASADO_UNIAO_ESTAVEL",
      temFilhos: true,
      idadesFilhos: ["DE_0_A_3", "DE_8_A_10"],
      prioridade: "CUIDAR_DA_EDUCACAO_DOS_FILHOS",
    };
    expect(proximoPasso("P4", r)).toBe("P4B");
    expect(proximoPasso("P4B", r)).toBe("P5");
  });

  it("individual sem filhos: P2 -> P4 (pula P3) -> P5", () => {
    const r: Partial<RespostasQuiz> = { estadoCivil: "SOLTEIRO", temFilhos: false };
    expect(proximoPasso("P2", r)).toBe("P4");
    expect(proximoPasso("P4", { ...r, prioridade: "VIDA_AFETIVA_E_RELACIONAMENTOS" })).toBe("P5");
  });

  it("individual com filhos cuidando de si: P4 -> P5 direto", () => {
    const r: Partial<RespostasQuiz> = {
      estadoCivil: "DIVORCIADO_SEPARADO",
      temFilhos: true,
      idadesFilhos: ["DE_11_A_13"],
      prioridade: "CUIDAR_DE_MIM",
    };
    expect(proximoPasso("P4", r)).toBe("P5");
  });

  it("individual com 2+ filhos priorizando educação: P4 -> P4B -> P5", () => {
    const r: Partial<RespostasQuiz> = {
      estadoCivil: "VIUVO",
      temFilhos: true,
      idadesFilhos: ["DE_4_A_5", "DE_6_A_7"],
      prioridade: "CUIDAR_DA_EDUCACAO_DOS_FILHOS",
    };
    expect(proximoPasso("P4", r)).toBe("P4B");
  });

  it("P5 em diante é sempre linear até DONE", () => {
    const r: Partial<RespostasQuiz> = {};
    expect(proximoPasso("P5", r)).toBe("P6");
    expect(proximoPasso("P6", r)).toBe("P7");
    expect(proximoPasso("P7", r)).toBe("P8");
    expect(proximoPasso("P8", r)).toBe("P9");
    expect(proximoPasso("P9", r)).toBe("P10");
    expect(proximoPasso("P10", r)).toBe("DONE");
  });
});
