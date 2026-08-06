import { prisma } from "@/lib/prisma";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

const POR_PAGINA = 50;

const ROTULO_STATUS: Record<string, string> = {
  PENDENTE: "Pendente",
  GERADO: "Gerado",
  ENVIADO: "Enviado",
  FALHOU: "Falhou",
};

function formatarData(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(data);
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const { pagina: paginaParam } = await searchParams;
  const pagina = Math.max(1, Number(paginaParam) || 1);

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      include: { diagnostico: true },
      orderBy: { createdAt: "desc" },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
    prisma.lead.count(),
  ]);

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <span className={styles.navAtivo}>Leads</span>
        <a href="/admin/relatorio">Relatório de perfis</a>
      </nav>
      <div className={styles.header}>
        <h1 className={styles.titulo}>Leads · Família em Foco</h1>
        <div className={styles.subtitulo}>
          {total} {total === 1 ? "lead recebido" : "leads recebidos"} · página {pagina} de {totalPaginas}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Recebido em</th>
              <th>Nome</th>
              <th>Contato</th>
              <th>Fase</th>
              <th>Programa</th>
              <th>Status</th>
              <th>Tentativas</th>
              <th>Enviado em</th>
              <th>Relato livre</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const diagnostico = lead.diagnostico;
              const status = diagnostico?.status ?? "PENDENTE";
              return (
                <tr key={lead.id}>
                  <td>{formatarData(lead.createdAt)}</td>
                  <td>{lead.nome}</td>
                  <td>
                    <div>{lead.email}</div>
                    {lead.whatsapp && <div className={styles.contatoSecundario}>{lead.whatsapp}</div>}
                  </td>
                  <td>{diagnostico?.fase ?? "—"}</td>
                  <td>{diagnostico?.programaRecomendado ?? "—"}</td>
                  <td>
                    <span className={`${styles.status} ${styles[`status${status}`]}`}>
                      {ROTULO_STATUS[status] ?? status}
                    </span>
                    {diagnostico?.erro && <div className={styles.erroTexto} title={diagnostico.erro}>
                      {diagnostico.erro}
                    </div>}
                  </td>
                  <td>{diagnostico?.tentativas ?? 0}</td>
                  <td>{diagnostico?.enviadoEm ? formatarData(diagnostico.enviadoEm) : "—"}</td>
                  <td className={styles.relatoLivre} title={lead.relatoLivre ?? ""}>
                    {lead.relatoLivre ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {leads.length === 0 && <div className={styles.vazio}>Nenhum lead recebido ainda.</div>}

      <div className={styles.paginacao}>
        {pagina > 1 && <a href={`/admin?pagina=${pagina - 1}`}>← Anterior</a>}
        {pagina < totalPaginas && <a href={`/admin?pagina=${pagina + 1}`}>Próxima →</a>}
      </div>
    </div>
  );
}
