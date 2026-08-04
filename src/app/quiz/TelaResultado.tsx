import styles from "./resultado.module.css";
import type { DiagnosticoIa } from "@/lib/ai-diagnostic-schema";

interface TelaResultadoProps {
  nome: string;
  fase: string;
  diagnostico: DiagnosticoIa;
}

/**
 * Rótulo e CTA do bloco de oferta, derivados do tipo já decidido pela árvore
 * determinística (não altera schema/prompt da IA — só varia a apresentação
 * visual). Mesma lógica usada no protótipo aprovado (docs/telas_em_html.html).
 */
function conteudoOferta(oferta: DiagnosticoIa["oferta"]): {
  eyebrow: string;
  mostrarCta: boolean;
  ctaLabel: string;
} {
  if (oferta.tipo === "programa") {
    return {
      eyebrow: oferta.programa_primario
        ? `Programa recomendado · ${oferta.programa_primario}`
        : "Programa recomendado",
      mostrarCta: true,
      ctaLabel: "Conhecer o programa",
    };
  }
  if (oferta.tipo === "conteudo_generico") {
    return { eyebrow: "Próximo passo", mostrarCta: true, ctaLabel: "Falar com o IBF" };
  }
  return { eyebrow: "Um lembrete importante", mostrarCta: false, ctaLabel: "" };
}

/**
 * Tela de resultado exibida imediatamente após o envio do quiz. Reproduz, em
 * React, os mesmos blocos e a mesma ordem lógica do e-mail transacional
 * (ver src/lib/email-template.ts): abertura -> momento -> insights -> ações
 * práticas -> livro/filme (condicional) -> credibilidade IFFD -> oferta.
 */
export default function TelaResultado({ nome, fase, diagnostico }: TelaResultadoProps) {
  const temLivroOuFilme = Boolean(diagnostico.recomendacao_livro || diagnostico.recomendacao_filme);
  const oferta = conteudoOferta(diagnostico.oferta);

  return (
    <div>
      <div className={styles.header}>
        {/* eslint-disable-next-line @next/next/no-img-element -- logo estático simples, sem otimização de imagem necessária */}
        <img src="/logo_ibf.webp" alt="IBF" className={styles.logo} />
        <div className={styles.headerTitulo}>Seu diagnóstico</div>
      </div>

      <p className={styles.saudacao}>Oi, {nome}.</p>
      <p className={styles.abertura}>{diagnostico.abertura_personalizada}</p>

      <div className={styles.momentoCard}>
        <div className={styles.eyebrow}>Seu momento</div>
        <div className={styles.faseTitulo}>{diagnostico.fase_titulo || fase}</div>
      </div>

      <div className={styles.section}>
        <div className={styles.eyebrow}>O que os dados dizem sobre essa fase</div>
        <div className={styles.insightList}>
          {diagnostico.insights.map((texto, i) => (
            <div key={i} className={styles.insightCard}>
              {texto}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.eyebrow}>Ações práticas para essa semana</div>
        <ul className={styles.acaoList}>
          {diagnostico.acoes_praticas.map((texto, i) => (
            <li key={i} className={styles.acaoItem}>
              <span className={styles.acaoCheck}>&#10003;</span>
              <span>{texto}</span>
            </li>
          ))}
        </ul>
      </div>

      {temLivroOuFilme && (
        <div className={styles.section}>
          <div className={styles.eyebrow}>Para aprofundar essa semana</div>
          <div className={styles.aprofundarCard}>
            {diagnostico.recomendacao_livro && (
              <p className={styles.aprofundarItem}>
                <strong>Livro:</strong> {diagnostico.recomendacao_livro.titulo}. {diagnostico.recomendacao_livro.porque}
              </p>
            )}
            {diagnostico.recomendacao_filme && (
              <p className={styles.aprofundarItem}>
                <strong>Filme:</strong> {diagnostico.recomendacao_filme.titulo}. {diagnostico.recomendacao_filme.porque}
              </p>
            )}
          </div>
        </div>
      )}

      <div className={styles.credibilidade}>
        Essas reflexões fazem parte da metodologia da IFFD (International Federation for Family Development), da
        qual o IBF é representante no Brasil.
      </div>

      <div className={styles.oferta}>
        <div className={styles.ofertaEyebrow}>{oferta.eyebrow}</div>
        <p className={styles.ofertaTexto}>{diagnostico.oferta.texto}</p>
        {oferta.mostrarCta && (
          <a
            className={styles.ofertaCta}
            href="https://www.portalibf.org.br"
            target="_blank"
            rel="noopener noreferrer"
          >
            {oferta.ctaLabel}
          </a>
        )}
      </div>

      <div className={styles.avisoEmail}>
        Esse mesmo diagnóstico também foi enviado para o seu e-mail. Se não encontrar em alguns minutos, dá uma
        olhada na caixa de spam ou promoções.
      </div>
    </div>
  );
}
