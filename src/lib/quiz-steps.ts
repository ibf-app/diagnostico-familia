import type { RespostasQuiz } from "@/types/quiz";

export type StepId =
  | "P1"
  | "P2"
  | "P3_TEMPO_UNIAO"
  | "P3_IDADES"
  | "P3B_TEMPO_UNIAO"
  | "P4"
  | "P4B"
  | "P5"
  | "P6"
  | "P7"
  | "P8"
  | "P9"
  | "P10"
  | "DONE";

export function ehCasal(respostas: Partial<RespostasQuiz>): boolean {
  return respostas.estadoCivil === "CASADO_UNIAO_ESTAVEL";
}

/**
 * Avança pro próximo passo do wizard dado o passo atual e as respostas acumuladas
 * até aqui. Espelha a árvore de decisão (decision-tree.ts) em termos de navegação,
 * mas não decide fase/programa — só qual pergunta vem em seguida.
 */
export function proximoPasso(atual: StepId, respostas: Partial<RespostasQuiz>): StepId {
  const casal = ehCasal(respostas);
  const numFaixas = respostas.idadesFilhos?.length ?? 0;

  switch (atual) {
    case "P1":
      return "P2";

    case "P2":
      if (casal && !respostas.temFilhos) return "P3_TEMPO_UNIAO";
      if (respostas.temFilhos) return "P3_IDADES";
      return "P4"; // individual sem filhos

    case "P3_TEMPO_UNIAO":
      // casal sem filhos: tempo de união já fecha a fase, só falta o bloco comum (P5+)
      return "P5";

    case "P3_IDADES":
      return "P4";

    case "P4":
      if (respostas.prioridade === "CUIDAR_DA_RELACAO") return "P3B_TEMPO_UNIAO";
      if (respostas.prioridade === "CUIDAR_DE_MIM") return "P5";
      if (respostas.prioridade === "CUIDAR_DA_EDUCACAO_DOS_FILHOS") {
        return numFaixas >= 2 ? "P4B" : "P5";
      }
      // prioridades do perfil individual sem filhos (propósito/carreira/afetivo/não sei)
      return "P5";

    case "P3B_TEMPO_UNIAO":
      return "P5";

    case "P4B":
      return "P5";

    case "P5":
      return "P6";
    case "P6":
      return "P7";
    case "P7":
      return "P8";
    case "P8":
      return "P9";
    case "P9":
      return "P10";
    case "P10":
      return "DONE";

    case "DONE":
      return "DONE";
  }
}
