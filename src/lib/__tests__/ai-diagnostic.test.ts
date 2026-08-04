import { describe, expect, it, vi } from "vitest";
import type { ResultadoDecisao, RespostasQuiz } from "@/types/quiz";

// Simula uma resposta da IA que IGNORA a instrução do prompt e tenta oferecer
// um programa mesmo com o alerta de segurança ativo — o teste garante que o
// código força o resultado de volta pra apoio_profissional de qualquer jeito.
const RESPOSTA_IA_DESOBEDIENTE = {
  assunto_email: "Assunto qualquer",
  abertura_personalizada: "Abertura qualquer.",
  fase_titulo: "Fase qualquer",
  insights: ["a", "b", "c"],
  acoes_praticas: ["a", "b", "c"],
  recomendacao_livro: null,
  recomendacao_filme: null,
  oferta: {
    tipo: "programa",
    programa_primario: "Amor Matrimonial 1",
    texto: "Texto tentando vender o programa mesmo em situação de alerta.",
  },
};

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: JSON.stringify(RESPOSTA_IA_DESOBEDIENTE) }],
      }),
    };
  },
}));

vi.mock("@/lib/knowledge-base", () => ({
  lerConteudoPrograma: vi.fn().mockReturnValue("conteúdo do programa"),
  lerCtaGenerico: vi.fn().mockReturnValue("cta genérico"),
  lerDadosIffd: vi.fn().mockReturnValue("dados iffd"),
  lerAvisoSeguranca: vi.fn().mockReturnValue("aviso de segurança"),
  filtrarLivrosEFilmes: vi.fn().mockReturnValue([]),
}));

const respostas: RespostasQuiz = {
  estadoCivil: "CASADO_UNIAO_ESTAVEL",
  temFilhos: false,
  tempoUniao: "ATE_5_ANOS",
  prioridade: "CUIDAR_DA_RELACAO",
  maiorDesafio: "Comunicação no dia a dia",
  momentoEmocional: "FASE_DIFICIL",
  relatoLivre: "estamos em crise, situação muito grave",
  nome: "Teste",
  email: "teste@exemplo.com",
};

const decisao: ResultadoDecisao = {
  fase: "Base do Casal",
  programaRecomendado: "Amor Matrimonial 1",
  tabelaUsada: "C1_CASAL",
};

describe("gerarDiagnosticoComIa — trava de segurança", () => {
  it("força oferta para apoio_profissional mesmo se a IA tentar oferecer programa", async () => {
    const { gerarDiagnosticoComIa } = await import("@/lib/ai-diagnostic");

    const resultado = await gerarDiagnosticoComIa({
      respostas,
      decisao,
      sinalDeAlertaEmocional: true,
    });

    expect(resultado.oferta.tipo).toBe("apoio_profissional");
    expect(resultado.oferta.programa_primario).toBeNull();
  });

  it("sem alerta, respeita a oferta retornada pela IA normalmente", async () => {
    const { gerarDiagnosticoComIa } = await import("@/lib/ai-diagnostic");

    const resultado = await gerarDiagnosticoComIa({
      respostas,
      decisao,
      sinalDeAlertaEmocional: false,
    });

    expect(resultado.oferta.tipo).toBe("programa");
    expect(resultado.oferta.programa_primario).toBe("Amor Matrimonial 1");
  });
});
