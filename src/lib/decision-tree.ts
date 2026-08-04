import type { FaixaEtaria, ResultadoDecisao, RespostasQuiz, TempoUniao } from "@/types/quiz";

/** Tabela A — idade dos filhos -> programa (seção 2 do doc, v7) */
const TABELA_A: Record<FaixaEtaria, string | null> = {
  DE_0_A_3: "Primeiros Passos",
  DE_4_A_5: "Primeiras Conversas",
  DE_6_A_7: "Primeiras Letras",
  DE_8_A_10: "Primeiras Decisões",
  DE_11_A_13: "Pré-adolescência",
  DE_14_A_16: "Adolescência",
  MAIS_DE_16: null, // fora do catálogo
};

/** Tabela B — tempo de união -> programa */
const TABELA_B: Record<TempoUniao, string> = {
  ATE_5_ANOS: "Amor Matrimonial 1",
  MAIS_DE_5_ANOS: "Amor Matrimonial 2",
};

function isCasal(respostas: RespostasQuiz): boolean {
  return respostas.estadoCivil === "CASADO_UNIAO_ESTAVEL";
}

/**
 * Quando 2+ faixas foram marcadas em P3, o programa é decidido pela resposta de P4b
 * (qual faixa está mais desafiadora agora). Com só 1 faixa marcada, usa ela direto.
 */
function programaPelaFaixa(respostas: RespostasQuiz): string | null {
  const idades = respostas.idadesFilhos ?? [];
  if (idades.length >= 2) {
    if (!respostas.faixaMaisDesafiadora) {
      throw new Error("faixaMaisDesafiadora (P4b) é obrigatória quando 2+ faixas são marcadas em P3");
    }
    return TABELA_A[respostas.faixaMaisDesafiadora];
  }
  if (idades.length === 1) {
    return TABELA_A[idades[0]];
  }
  throw new Error("idadesFilhos (P3) não pode ser vazio quando temFilhos = true");
}

/**
 * Árvore de decisão determinística do quiz "Família em Foco" (v7).
 * A IA nunca decide fase/programa — só escreve o conteúdo em cima do que esta função retorna.
 * Ver documento de referência: seção 2 (árvore) e 03_exemplo_email/ (casos validados).
 */
export function decidirFaseEPrograma(respostas: RespostasQuiz): ResultadoDecisao {
  const casal = isCasal(respostas);

  if (casal) {
    if (!respostas.temFilhos) {
      if (!respostas.tempoUniao) {
        throw new Error("tempoUniao (P3) é obrigatória para casal sem filhos");
      }
      return {
        fase: "Base do Casal",
        programaRecomendado: TABELA_B[respostas.tempoUniao],
        tabelaUsada: "C1_CASAL",
      };
    }

    // Casal com filhos: prioridade decide entre cuidar da relação (P3b) ou dos filhos
    if (respostas.prioridade === "CUIDAR_DA_RELACAO") {
      if (!respostas.tempoUniao) {
        throw new Error("tempoUniao (P3b) é obrigatória quando prioridade = CUIDAR_DA_RELACAO");
      }
      return {
        fase: "Casal em Prioridade",
        programaRecomendado: TABELA_B[respostas.tempoUniao],
        tabelaUsada: "C1_CASAL",
      };
    }

    // prioridade === CUIDAR_DA_EDUCACAO_DOS_FILHOS
    return {
      fase: "Pais em Construção",
      programaRecomendado: programaPelaFaixa(respostas),
      tabelaUsada: "C2_PAIS",
    };
  }

  // Ramo individual: solteiro(a) / namorando ou noivo(a) / divorciado(a) ou separado(a) / viúvo(a)
  if (!respostas.temFilhos) {
    // A fase é sempre "Projeto em Formação"; a prioridade só calibra o tom do e-mail.
    return {
      fase: "Projeto em Formação",
      programaRecomendado: "Projeto Pessoal",
      tabelaUsada: "C3_INDIVIDUAL",
    };
  }

  if (respostas.prioridade === "CUIDAR_DE_MIM") {
    return {
      fase: "Recomeço com Propósito",
      programaRecomendado: null, // CTA genérico — sem programa de casal pra quem está sozinho
      tabelaUsada: "C3_INDIVIDUAL",
    };
  }

  // prioridade === CUIDAR_DA_EDUCACAO_DOS_FILHOS (perfil solo)
  // Confirma que a faixa é válida (dispara o mesmo erro de validação da programaPelaFaixa),
  // mas o resultado nunca aponta programa: os programas do catálogo são pensados para o casal.
  programaPelaFaixa(respostas);
  return {
    fase: "Educador(a) Solo",
    programaRecomendado: null,
    tabelaUsada: "C2_PAIS",
  };
}
