import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Diagnostico, Lead } from "@/generated/prisma/client";
import type { ResultadoDecisao, RespostasQuiz } from "@/types/quiz";

const DIAGNOSTICO_IA = {
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
    texto: "Texto qualquer.",
  },
};

const diagnosticoUpdateMock = vi.fn().mockResolvedValue({});
const gerarDiagnosticoComIaMock = vi.fn();
const enviarEmailDiagnosticoMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    diagnostico: {
      update: diagnosticoUpdateMock,
    },
  },
}));

vi.mock("@/lib/ai-diagnostic", () => ({
  gerarDiagnosticoComIa: gerarDiagnosticoComIaMock,
}));

vi.mock("@/lib/mailer", () => ({
  enviarEmailDiagnostico: enviarEmailDiagnosticoMock,
}));

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

const decisao: ResultadoDecisao = {
  fase: "Base do Casal",
  programaRecomendado: "Amor Matrimonial 1",
  tabelaUsada: "C1_CASAL",
};

describe("processarDiagnostico", () => {
  beforeEach(() => {
    diagnosticoUpdateMock.mockClear();
    gerarDiagnosticoComIaMock.mockReset();
    enviarEmailDiagnosticoMock.mockReset();
  });

  it("gera, envia e marca ENVIADO quando tudo dá certo", async () => {
    const { processarDiagnostico } = await import("@/lib/processar-diagnostico");

    gerarDiagnosticoComIaMock.mockResolvedValue(DIAGNOSTICO_IA);
    enviarEmailDiagnosticoMock.mockResolvedValue(undefined);

    const resultado = await processarDiagnostico({ diagnosticoId: "diag-1", respostas, decisao });

    expect(resultado).toEqual({ status: "ENVIADO", diagnostico: DIAGNOSTICO_IA, fase: decisao.fase });
    expect(enviarEmailDiagnosticoMock).toHaveBeenCalledWith({
      nome: respostas.nome,
      email: respostas.email,
      fase: decisao.fase,
      diagnostico: DIAGNOSTICO_IA,
    });

    // 1a chamada marca GERADO com o conteúdo da IA, 2a marca ENVIADO.
    expect(diagnosticoUpdateMock).toHaveBeenNthCalledWith(1, {
      where: { id: "diag-1" },
      data: {
        status: "GERADO",
        conteudoJson: DIAGNOSTICO_IA,
        tipoOferta: "PROGRAMA",
      },
    });
    expect(diagnosticoUpdateMock.mock.calls[1][0]).toMatchObject({
      where: { id: "diag-1" },
      data: { status: "ENVIADO" },
    });
  });

  it("marca FALHOU e incrementa tentativas quando a IA falha, sem lançar", async () => {
    const { processarDiagnostico } = await import("@/lib/processar-diagnostico");

    gerarDiagnosticoComIaMock.mockRejectedValue(new Error("Anthropic fora do ar"));

    const resultado = await processarDiagnostico({ diagnosticoId: "diag-2", respostas, decisao });

    expect(resultado).toEqual({ status: "FALHOU", erro: "Anthropic fora do ar" });
    expect(enviarEmailDiagnosticoMock).not.toHaveBeenCalled();
    expect(diagnosticoUpdateMock).toHaveBeenCalledWith({
      where: { id: "diag-2" },
      data: { status: "FALHOU", erro: "Anthropic fora do ar", tentativas: { increment: 1 } },
    });
  });

  it("marca FALHOU quando a IA gera certo mas o envio do e-mail falha", async () => {
    const { processarDiagnostico } = await import("@/lib/processar-diagnostico");

    gerarDiagnosticoComIaMock.mockResolvedValue(DIAGNOSTICO_IA);
    enviarEmailDiagnosticoMock.mockRejectedValue(new Error("Brevo 502"));

    const resultado = await processarDiagnostico({ diagnosticoId: "diag-3", respostas, decisao });

    expect(resultado).toEqual({ status: "FALHOU", erro: "Brevo 502" });
    expect(diagnosticoUpdateMock.mock.calls.at(-1)?.[0]).toEqual({
      where: { id: "diag-3" },
      data: { status: "FALHOU", erro: "Brevo 502", tentativas: { increment: 1 } },
    });
  });
});

describe("reconstruirRespostasEDecisao", () => {
  const leadBase: Lead = {
    id: "lead-1",
    createdAt: new Date("2026-01-01"),
    estadoCivil: "CASADO_UNIAO_ESTAVEL",
    temFilhos: false,
    tempoUniao: "ATE_5_ANOS",
    idadesFilhos: [],
    faixaMaisDesafiadora: null,
    prioridade: "CUIDAR_DA_RELACAO",
    maiorDesafio: "Comunicação no dia a dia",
    momentoEmocional: "PILOTO_AUTOMATICO",
    relatoLivre: "A correria do trabalho tem tomado o tempo que era só nosso.",
    cidade: null,
    comoConheceu: null,
    nome: "Marina",
    whatsapp: null,
    email: "marina@exemplo.com",
    consentimentoLgpdEm: new Date("2026-01-01"),
  } as Lead;

  const diagnosticoBase: Pick<Diagnostico, "fase" | "programaRecomendado" | "tabelaUsada"> = {
    fase: "Base do Casal",
    programaRecomendado: "Amor Matrimonial 1",
    tabelaUsada: "C1_CASAL",
  };

  it("reconstrói respostas e decisao a partir do que está salvo no banco, convertendo null em undefined", async () => {
    const { reconstruirRespostasEDecisao } = await import("@/lib/processar-diagnostico");

    const { respostas: respostasReconstruidas, decisao: decisaoReconstruida } = reconstruirRespostasEDecisao(
      leadBase,
      diagnosticoBase
    );

    expect(respostasReconstruidas).toEqual({
      estadoCivil: "CASADO_UNIAO_ESTAVEL",
      temFilhos: false,
      tempoUniao: "ATE_5_ANOS",
      idadesFilhos: [],
      faixaMaisDesafiadora: undefined,
      prioridade: "CUIDAR_DA_RELACAO",
      maiorDesafio: "Comunicação no dia a dia",
      momentoEmocional: "PILOTO_AUTOMATICO",
      relatoLivre: "A correria do trabalho tem tomado o tempo que era só nosso.",
      cidade: undefined,
      comoConheceu: undefined,
      nome: "Marina",
      whatsapp: undefined,
      email: "marina@exemplo.com",
    });
    expect(decisaoReconstruida).toEqual({
      fase: "Base do Casal",
      programaRecomendado: "Amor Matrimonial 1",
      tabelaUsada: "C1_CASAL",
    });
  });

  it("lança se o Diagnostico não tiver tabelaUsada salva (dado inconsistente)", async () => {
    const { reconstruirRespostasEDecisao } = await import("@/lib/processar-diagnostico");

    expect(() =>
      reconstruirRespostasEDecisao(leadBase, { ...diagnosticoBase, tabelaUsada: null })
    ).toThrow(/tabelaUsada/);
  });
});
