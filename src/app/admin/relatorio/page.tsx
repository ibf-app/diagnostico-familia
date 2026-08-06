import { prisma } from "@/lib/prisma";
import { MOMENTO_EMOCIONAL_OPTIONS } from "@/lib/quiz-options";
import styles from "../admin.module.css";
import relatorioStyles from "./relatorio.module.css";

export const dynamic = "force-dynamic";

const SEM_DIAGNOSTICO = "Sem diagnóstico ainda";

const ROTULO_PRIORIDADE: Record<string, string> = {
  CUIDAR_DA_RELACAO: "Cuidar da relação como casal",
  CUIDAR_DA_EDUCACAO_DOS_FILHOS: "Cuidar da educação dos filhos",
  CUIDAR_DE_MIM: "Cuidar de mim",
  MEU_PROPOSITO_E_CAMINHO: "Meu propósito e caminho",
  TRABALHO_E_CARREIRA: "Trabalho e carreira",
  VIDA_AFETIVA_E_RELACIONAMENTOS: "Vida afetiva e relacionamentos",
  NAO_SEI_DIZER: "Não sei dizer",
};

const ROTULO_MOMENTO_EMOCIONAL: Record<string, string> = Object.fromEntries(
  MOMENTO_EMOCIONAL_OPTIONS.map((opcao) => [opcao.value, opcao.label]),
);

function contar<T extends string>(itens: T[]): { valor: T; total: number }[] {
  const contagem = new Map<T, number>();
  for (const item of itens) {
    contagem.set(item, (contagem.get(item) ?? 0) + 1);
  }
  return [...contagem.entries()]
    .map(([valor, total]) => ({ valor, total }))
    .sort((a, b) => b.total - a.total);
}

export default async function RelatorioPage() {
  const leads = await prisma.lead.findMany({ include: { diagnostico: true } });

  const total = leads.length;

  const porFase = new Map<
    string,
    { nome: string; leads: typeof leads }
  >();
  for (const lead of leads) {
    const fase = lead.diagnostico?.fase ?? SEM_DIAGNOSTICO;
    const grupo = porFase.get(fase) ?? { nome: fase, leads: [] };
    grupo.leads.push(lead);
    porFase.set(fase, grupo);
  }

  const grupos = [...porFase.values()].sort((a, b) => b.leads.length - a.leads.length);

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <a href="/admin">Leads</a>
        <span className={styles.navAtivo}>Relatório de perfis</span>
      </nav>
      <div className={styles.header}>
        <h1 className={styles.titulo}>Relatório de perfis · Família em Foco</h1>
        <div className={styles.subtitulo}>
          {total} {total === 1 ? "lead recebido" : "leads recebidos"} agrupados por perfil (fase) identificado no
          diagnóstico
        </div>
      </div>

      {total === 0 && <div className={styles.vazio}>Nenhum lead recebido ainda.</div>}

      <div className={relatorioStyles.grid}>
        {grupos.map((grupo) => {
          const percentual = total > 0 ? Math.round((grupo.leads.length / total) * 100) : 0;
          const programas = contar(
            grupo.leads.map((lead) => lead.diagnostico?.programaRecomendado ?? "Sem programa / CTA genérico"),
          );
          const momentos = contar(grupo.leads.map((lead) => lead.momentoEmocional));
          const prioridades = contar(grupo.leads.map((lead) => lead.prioridade));

          return (
            <div key={grupo.nome} className={relatorioStyles.card}>
              <div className={relatorioStyles.cardHeader}>
                <h2 className={relatorioStyles.cardTitulo}>{grupo.nome}</h2>
                <div className={relatorioStyles.cardTotal}>
                  {grupo.leads.length} {grupo.leads.length === 1 ? "lead" : "leads"} · {percentual}%
                </div>
              </div>

              <div className={relatorioStyles.secao}>
                <div className={relatorioStyles.secaoTitulo}>Programa recomendado</div>
                <ul className={relatorioStyles.lista}>
                  {programas.map(({ valor, total: totalItem }) => (
                    <li key={valor}>
                      <span>{valor}</span>
                      <span className={relatorioStyles.listaTotal}>{totalItem}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={relatorioStyles.secao}>
                <div className={relatorioStyles.secaoTitulo}>Momento emocional</div>
                <ul className={relatorioStyles.lista}>
                  {momentos.map(({ valor, total: totalItem }) => (
                    <li key={valor}>
                      <span>{ROTULO_MOMENTO_EMOCIONAL[valor] ?? valor}</span>
                      <span className={relatorioStyles.listaTotal}>{totalItem}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={relatorioStyles.secao}>
                <div className={relatorioStyles.secaoTitulo}>Prioridade</div>
                <ul className={relatorioStyles.lista}>
                  {prioridades.map(({ valor, total: totalItem }) => (
                    <li key={valor}>
                      <span>{ROTULO_PRIORIDADE[valor] ?? valor}</span>
                      <span className={relatorioStyles.listaTotal}>{totalItem}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
