import Link from "next/link";
import styles from "./page.module.css";

const ITENS_RESULTADO = [
  {
    titulo: "Leitura da fase atual",
    texto: "Uma leitura clara de que momento sua família ou relação está vivendo agora.",
  },
  {
    titulo: "Insights sobre esse momento",
    texto: "O que esse momento revela, explicado de um jeito acolhedor e direto ao ponto.",
  },
  {
    titulo: "Ações práticas para a semana",
    texto: "Passos concretos pra aplicar nos próximos dias, sem conselho genérico.",
  },
  {
    titulo: "Livro ou filme, quando fizer sentido",
    texto: "Uma sugestão pra se aprofundar nesse momento, quando houver uma indicação que combine com sua fase.",
  },
];

const PASSOS_COMO_FUNCIONA = [
  {
    titulo: "Responda algumas perguntas rápidas",
    texto: "Sobre sua fase de vida, sua relação e, se for o caso, seus filhos. Leva cerca de 2 minutos.",
  },
  {
    titulo: "Suas respostas são organizadas em um diagnóstico",
    texto: "Feito sob medida para o seu momento, não um resultado padrão igual para todo mundo.",
  },
  {
    titulo: "Veja o resultado na tela e no seu e-mail",
    texto: "Assim que você termina, seu diagnóstico aparece na tela e também chega na sua caixa de entrada.",
  },
];

const NUMEROS_IBF = [
  { numero: "68", legenda: "países onde a metodologia da IFFD é aplicada" },
  { numero: "20", legenda: "Centros de Fortalecimento Familiar no Brasil" },
  { numero: "+1.000", legenda: "colaboradores voluntários" },
  { numero: "+10.000", legenda: "pessoas impactadas diretamente" },
];

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          {/* eslint-disable-next-line @next/next/no-img-element -- logo estático simples, sem otimização de imagem necessária */}
          <img src="/logo_ibf.webp" alt="IBF" className={styles.logo} />
          <span className={styles.headerTitulo}>Família em Foco</span>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <p className={styles.eyebrow}>IBF · Instituto Brasileiro da Família</p>
            <h1 className={styles.h1}>Descubra em que momento sua família está agora</h1>
            <p className={styles.heroTexto}>
              Um diagnóstico gratuito e personalizado sobre sua fase familiar ou conjugal, com insights e ações
              práticas para essa semana.
            </p>
            <Link href="/quiz" className={styles.ctaPrimario}>
              Começar quiz
            </Link>
            <p className={styles.suporteTexto}>Leva cerca de 2 minutos · gratuito</p>
          </div>
        </section>

        <section className={styles.secaoAlt}>
          <div className={styles.secaoInner}>
            <p className={styles.eyebrowSecao}>O que você recebe</p>
            <h2 className={styles.tituloSecao}>Um diagnóstico feito a partir das suas respostas</h2>
            <p className={styles.textoSecao}>
              Nada de resultado genérico de teste de personalidade. O que você recebe é construído em cima do que
              você contar sobre sua própria família.
            </p>
            <ul className={styles.listaItens}>
              {ITENS_RESULTADO.map((item, i) => (
                <li key={item.titulo} className={styles.item}>
                  <span className={styles.itemNumero}>{i + 1}</span>
                  <div>
                    <p className={styles.itemTitulo}>{item.titulo}</p>
                    <p className={styles.itemTexto}>{item.texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={styles.secao}>
          <div className={styles.secaoInner}>
            <p className={styles.eyebrowSecao}>Como funciona</p>
            <h2 className={styles.tituloSecao}>Simples, rápido e no seu tempo</h2>
            <ol className={styles.listaPassos}>
              {PASSOS_COMO_FUNCIONA.map((passo, i) => (
                <li key={passo.titulo} className={styles.passo}>
                  <span className={styles.passoNumero}>{i + 1}</span>
                  <div>
                    <p className={styles.itemTitulo}>{passo.titulo}</p>
                    <p className={styles.itemTexto}>{passo.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={`${styles.secaoAlt} ${styles.secaoMetodologia}`}>
          <div className={styles.secaoInner}>
            <p className={styles.eyebrowSecao}>Metodologia</p>
            <h2 className={styles.tituloSecao}>Uma metodologia aplicada há décadas</h2>
            <p className={styles.textoSecao}>
              O IBF é representante no Brasil da IFFD (International Federation for Family Development), metodologia
              aplicada há décadas em 68 países. As perguntas do quiz e a leitura que você recebe partem dessa base,
              não de achismo.
            </p>
            <div className={styles.statsGrid}>
              {NUMEROS_IBF.map((stat) => (
                <div key={stat.legenda} className={styles.statCard}>
                  <p className={styles.statNumero}>{stat.numero}</p>
                  <p className={styles.statLegenda}>{stat.legenda}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.secao}>
          <div className={styles.secaoInner}>
            <div className={styles.ctaFinalCard}>
              <h2 className={styles.tituloSecao}>Pronto para saber em que momento sua família está?</h2>
              <p className={styles.textoSecao}>
                É gratuito, é rápido e o diagnóstico é só seu. Não precisa expor sua intimidade pra ninguém.
              </p>
              <Link href="/quiz" className={styles.ctaPrimario}>
                Começar quiz
              </Link>
              <p className={styles.suporteTexto}>Leva cerca de 2 minutos · gratuito</p>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p className={styles.footerTexto}>IBF · Instituto Brasileiro da Família</p>
          <a
            className={styles.footerLink}
            href="https://www.portalibf.org.br/politica-de-privacidade"
            target="_blank"
            rel="noopener noreferrer"
          >
            Política de privacidade
          </a>
        </div>
      </footer>
    </div>
  );
}
