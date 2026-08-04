"use client";

import { useState } from "react";
import styles from "./quiz.module.css";
import { proximoPasso, type StepId } from "@/lib/quiz-steps";
import {
  COMO_CONHECEU_OPTIONS,
  TEXTO_CONSENTIMENTO_LGPD,
  ESTADO_CIVIL_OPTIONS,
  FAIXA_ETARIA_OPTIONS,
  MOMENTO_EMOCIONAL_OPTIONS,
  TEMPO_UNIAO_OPTIONS,
  campoAbertoPergunta,
  maiorDesafioOptions,
  momentoEmocionalPergunta,
  prioridadeOptions,
} from "@/lib/quiz-options";
import type { FaixaEtaria, RespostasQuiz } from "@/types/quiz";

// Ordem de referência só pra estimar o progresso visual — passos condicionais
// (P3/P3b/P4b) nem sempre aparecem todos numa mesma jornada.
const ORDEM_PROGRESSO: StepId[] = [
  "P1",
  "P2",
  "P3_TEMPO_UNIAO",
  "P3_IDADES",
  "P4",
  "P3B_TEMPO_UNIAO",
  "P4B",
  "P5",
  "P6",
  "P7",
  "P8",
  "P9",
  "P10",
];

type Respostas = Partial<RespostasQuiz>;

export default function QuizPage() {
  const [step, setStep] = useState<StepId>("P1");
  const [historico, setHistorico] = useState<StepId[]>([]);
  const [respostas, setRespostas] = useState<Respostas>({});
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [concluido, setConcluido] = useState(false);

  function avancar(atualizacao: Respostas) {
    const novasRespostas = { ...respostas, ...atualizacao };
    setRespostas(novasRespostas);
    setHistorico((h) => [...h, step]);
    setStep(proximoPasso(step, novasRespostas));
  }

  function voltar() {
    setHistorico((h) => {
      if (h.length === 0) return h;
      const copia = [...h];
      const anterior = copia.pop()!;
      setStep(anterior);
      return copia;
    });
  }

  async function enviarQuiz(camposFinais: Pick<Respostas, "nome" | "whatsapp" | "email">) {
    setEnviando(true);
    setErro(null);
    const payload = { ...respostas, ...camposFinais, consentimentoLgpd: true };

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Não foi possível enviar o quiz agora.");
      }

      setConcluido(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setEnviando(false);
    }
  }

  const progresso = Math.round((ORDEM_PROGRESSO.indexOf(step) / (ORDEM_PROGRESSO.length - 1)) * 100);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          {/* eslint-disable-next-line @next/next/no-img-element -- logo estático simples, sem otimização de imagem necessária */}
          <img src="/logo_ibf.webp" alt="IBF" className={styles.logo} />
          <div className={styles.headerTitulo}>Família em Foco</div>
        </div>

        {!concluido && (
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${Math.max(4, progresso)}%` }} />
          </div>
        )}

        {concluido ? (
          <TelaConcluido />
        ) : (
          <PassoAtual
            key={step}
            step={step}
            respostas={respostas}
            onAvancar={avancar}
            onVoltar={historico.length > 0 ? voltar : undefined}
            onEnviar={enviarQuiz}
            enviando={enviando}
            erro={erro}
          />
        )}
      </div>
    </div>
  );
}

function TelaConcluido() {
  return (
    <div>
      <div className={styles.resultTitle}>Recebemos suas respostas!</div>
      <p className={styles.resultText}>
        Seu diagnóstico personalizado está a caminho do seu e-mail. Se não encontrar em alguns minutos, dá uma
        olhada na caixa de spam/promoções.
      </p>
    </div>
  );
}

interface PassoAtualProps {
  step: StepId;
  respostas: Respostas;
  onAvancar: (atualizacao: Respostas) => void;
  onVoltar?: () => void;
  onEnviar: (campos: Pick<Respostas, "nome" | "whatsapp" | "email">) => void;
  enviando: boolean;
  erro: string | null;
}

function PassoAtual({ step, respostas, onAvancar, onVoltar, onEnviar, enviando, erro }: PassoAtualProps) {
  switch (step) {
    case "P1":
      return (
        <EscolhaUnica
          pergunta="Qual seu estado civil?"
          opcoes={ESTADO_CIVIL_OPTIONS}
          valorAtual={respostas.estadoCivil}
          onEscolher={(estadoCivil) => onAvancar({ estadoCivil })}
        />
      );

    case "P2":
      return (
        <EscolhaUnica
          pergunta="Você tem filhos?"
          opcoes={[
            { value: true, label: "Sim" },
            { value: false, label: "Não" },
          ]}
          valorAtual={respostas.temFilhos}
          onEscolher={(temFilhos) => onAvancar({ temFilhos })}
          onVoltar={onVoltar}
        />
      );

    case "P3_TEMPO_UNIAO":
    case "P3B_TEMPO_UNIAO":
      return (
        <EscolhaUnica
          pergunta="Há quanto tempo estão juntos?"
          opcoes={TEMPO_UNIAO_OPTIONS}
          valorAtual={respostas.tempoUniao}
          onEscolher={(tempoUniao) => onAvancar({ tempoUniao })}
          onVoltar={onVoltar}
        />
      );

    case "P3_IDADES":
      return (
        <SelecaoMultipla
          pergunta="Qual a idade dos seus filhos?"
          opcoes={FAIXA_ETARIA_OPTIONS}
          valoresAtuais={respostas.idadesFilhos ?? []}
          onContinuar={(idadesFilhos) => onAvancar({ idadesFilhos })}
          onVoltar={onVoltar}
        />
      );

    case "P4":
      return (
        <EscolhaUnica
          pergunta="Qual sua prioridade agora?"
          opcoes={prioridadeOptions(respostas).map((o) => ({ value: o.value, label: o.label }))}
          valorAtual={respostas.prioridade}
          onEscolher={(prioridade) => onAvancar({ prioridade: prioridade as RespostasQuiz["prioridade"] })}
          onVoltar={onVoltar}
        />
      );

    case "P4B": {
      const faixas = respostas.idadesFilhos ?? [];
      const opcoes = FAIXA_ETARIA_OPTIONS.filter((o) => faixas.includes(o.value));
      return (
        <EscolhaUnica
          pergunta="Qual dessas faixas está mais desafiadora agora?"
          opcoes={opcoes}
          valorAtual={respostas.faixaMaisDesafiadora}
          onEscolher={(faixaMaisDesafiadora) => onAvancar({ faixaMaisDesafiadora: faixaMaisDesafiadora as FaixaEtaria })}
          onVoltar={onVoltar}
        />
      );
    }

    case "P5":
      return (
        <EscolhaUnica
          pergunta="Qual o maior desafio hoje?"
          opcoes={maiorDesafioOptions(respostas).map((texto) => ({ value: texto, label: texto }))}
          valorAtual={respostas.maiorDesafio}
          onEscolher={(maiorDesafio) => onAvancar({ maiorDesafio })}
          onVoltar={onVoltar}
        />
      );

    case "P6":
      return (
        <EscolhaUnica
          pergunta={momentoEmocionalPergunta(respostas)}
          opcoes={MOMENTO_EMOCIONAL_OPTIONS}
          valorAtual={respostas.momentoEmocional}
          onEscolher={(momentoEmocional) => onAvancar({ momentoEmocional })}
          onVoltar={onVoltar}
        />
      );

    case "P7":
      return (
        <CampoTexto
          pergunta={campoAbertoPergunta(respostas)}
          tipo="textarea"
          maxLength={280}
          valorInicial={respostas.relatoLivre ?? ""}
          onContinuar={(relatoLivre) => onAvancar({ relatoLivre: relatoLivre || undefined })}
          onVoltar={onVoltar}
        />
      );

    case "P8":
      return (
        <CampoTexto
          pergunta="Qual sua cidade? (opcional)"
          tipo="input"
          valorInicial={respostas.cidade ?? ""}
          onContinuar={(cidade) => onAvancar({ cidade: cidade || undefined })}
          onVoltar={onVoltar}
        />
      );

    case "P9":
      return (
        <EscolhaUnica
          pergunta="Como você conheceu o IBF? (opcional)"
          opcoes={COMO_CONHECEU_OPTIONS.map((texto) => ({ value: texto, label: texto }))}
          valorAtual={respostas.comoConheceu}
          onEscolher={(comoConheceu) => onAvancar({ comoConheceu })}
          onVoltar={onVoltar}
          permitirPular
          onPular={() => onAvancar({})}
        />
      );

    case "P10":
      return <FormularioFinal onEnviar={onEnviar} onVoltar={onVoltar} enviando={enviando} erro={erro} />;

    case "DONE":
      return null;
  }
}

interface EscolhaUnicaProps<T> {
  pergunta: string;
  opcoes: readonly { value: T; label: string }[];
  valorAtual?: T;
  onEscolher: (valor: T) => void;
  onVoltar?: () => void;
  permitirPular?: boolean;
  onPular?: () => void;
}

function EscolhaUnica<T>({ pergunta, opcoes, valorAtual, onEscolher, onVoltar, permitirPular, onPular }: EscolhaUnicaProps<T>) {
  return (
    <div>
      <div className={styles.question}>{pergunta}</div>
      <div className={styles.optionList}>
        {opcoes.map((opcao, i) => (
          <button
            key={i}
            type="button"
            className={`${styles.optionButton} ${valorAtual === opcao.value ? styles.optionButtonSelected : ""}`}
            onClick={() => onEscolher(opcao.value)}
          >
            {opcao.label}
          </button>
        ))}
      </div>
      <div className={styles.actions}>
        {onVoltar ? (
          <button type="button" className={styles.linkButton} onClick={onVoltar}>
            ← Voltar
          </button>
        ) : (
          <span />
        )}
        {permitirPular && (
          <button type="button" className={styles.linkButton} onClick={onPular}>
            Pular →
          </button>
        )}
      </div>
    </div>
  );
}

interface SelecaoMultiplaProps {
  pergunta: string;
  opcoes: readonly { value: FaixaEtaria; label: string }[];
  valoresAtuais: FaixaEtaria[];
  onContinuar: (valores: FaixaEtaria[]) => void;
  onVoltar?: () => void;
}

function SelecaoMultipla({ pergunta, opcoes, valoresAtuais, onContinuar, onVoltar }: SelecaoMultiplaProps) {
  const [selecionados, setSelecionados] = useState<FaixaEtaria[]>(valoresAtuais);

  function alternar(valor: FaixaEtaria) {
    setSelecionados((atual) => (atual.includes(valor) ? atual.filter((v) => v !== valor) : [...atual, valor]));
  }

  return (
    <div>
      <div className={styles.question}>{pergunta}</div>
      <div className={styles.chipList}>
        {opcoes.map((opcao) => (
          <button
            key={opcao.value}
            type="button"
            className={`${styles.chip} ${selecionados.includes(opcao.value) ? styles.chipSelected : ""}`}
            onClick={() => alternar(opcao.value)}
          >
            {opcao.label}
          </button>
        ))}
      </div>
      <div className={styles.actions}>
        {onVoltar ? (
          <button type="button" className={styles.linkButton} onClick={onVoltar}>
            ← Voltar
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          className={styles.primaryButton}
          disabled={selecionados.length === 0}
          onClick={() => onContinuar(selecionados)}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

interface CampoTextoProps {
  pergunta: string;
  tipo: "input" | "textarea";
  maxLength?: number;
  valorInicial: string;
  onContinuar: (valor: string) => void;
  onVoltar?: () => void;
}

function CampoTexto({ pergunta, tipo, maxLength, valorInicial, onContinuar, onVoltar }: CampoTextoProps) {
  const [valor, setValor] = useState(valorInicial);

  return (
    <div>
      <div className={styles.question}>{pergunta}</div>
      {tipo === "textarea" ? (
        <textarea
          className={styles.textArea}
          maxLength={maxLength}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
      ) : (
        <input className={styles.textInput} value={valor} onChange={(e) => setValor(e.target.value)} />
      )}
      <div className={styles.actions}>
        {onVoltar ? (
          <button type="button" className={styles.linkButton} onClick={onVoltar}>
            ← Voltar
          </button>
        ) : (
          <span />
        )}
        <button type="button" className={styles.primaryButton} onClick={() => onContinuar(valor.trim())}>
          Continuar
        </button>
      </div>
    </div>
  );
}

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  if (digitos.length === 0) return "";
  const ddd = digitos.slice(0, 2);
  const resto = digitos.slice(2);
  if (digitos.length <= 2) return `(${ddd}`;
  if (digitos.length <= 6) return `(${ddd}) ${resto}`;
  if (digitos.length <= 10) return `(${ddd}) ${resto.slice(0, 4)}-${resto.slice(4)}`;
  return `(${ddd}) ${resto.slice(0, 5)}-${resto.slice(5)}`;
}

function telefoneValido(valor: string): boolean {
  const digitos = valor.replace(/\D/g, "");
  return digitos.length === 0 || digitos.length === 10 || digitos.length === 11;
}

interface FormularioFinalProps {
  onEnviar: (campos: Pick<Respostas, "nome" | "whatsapp" | "email">) => void;
  onVoltar?: () => void;
  enviando: boolean;
  erro: string | null;
}

function FormularioFinal({ onEnviar, onVoltar, enviando, erro }: FormularioFinalProps) {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [consentimento, setConsentimento] = useState(false);
  const [emailTocado, setEmailTocado] = useState(false);
  const [whatsappTocado, setWhatsappTocado] = useState(false);

  const emailEhValido = REGEX_EMAIL.test(email.trim());
  const whatsappEhValido = telefoneValido(whatsapp);

  const podeEnviar =
    nome.trim().length > 0 && emailEhValido && whatsappEhValido && consentimento && !enviando;

  return (
    <div>
      <div className={styles.question}>Pra onde enviamos seu diagnóstico?</div>

      {erro && <div className={styles.errorText}>{erro}</div>}

      <input className={styles.textInput} placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />

      <input
        className={styles.textInput}
        placeholder="WhatsApp (opcional)"
        inputMode="tel"
        value={whatsapp}
        onChange={(e) => setWhatsapp(formatarTelefone(e.target.value))}
        onBlur={() => setWhatsappTocado(true)}
      />
      {whatsappTocado && !whatsappEhValido && (
        <div className={styles.errorText}>Confere o número — parece faltar ou sobrar dígito.</div>
      )}

      <input
        className={styles.textInput}
        placeholder="E-mail"
        type="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => setEmailTocado(true)}
      />
      {emailTocado && !emailEhValido && <div className={styles.errorText}>Digite um e-mail válido.</div>}

      <label className={styles.checkboxRow}>
        <input type="checkbox" checked={consentimento} onChange={(e) => setConsentimento(e.target.checked)} />
        <span>{TEXTO_CONSENTIMENTO_LGPD}</span>
      </label>

      <div className={styles.actions}>
        {onVoltar ? (
          <button type="button" className={styles.linkButton} onClick={onVoltar} disabled={enviando}>
            ← Voltar
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          className={styles.primaryButton}
          disabled={!podeEnviar}
          onClick={() => onEnviar({ nome: nome.trim(), whatsapp: whatsapp.trim() || undefined, email: email.trim() })}
        >
          {enviando ? "Enviando..." : "Receber meu diagnóstico"}
        </button>
      </div>
    </div>
  );
}
