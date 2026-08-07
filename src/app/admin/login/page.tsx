import styles from "../admin.module.css";
import loginStyles from "./login.module.css";

function destinoSeguro(valor: string | undefined): string {
  return valor && valor.startsWith("/admin") ? valor : "/admin";
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; redirect?: string }>;
}) {
  const { erro, redirect } = await searchParams;
  const destino = destinoSeguro(redirect);

  return (
    <div className={styles.page}>
      <div className={loginStyles.card}>
        <h1 className={styles.titulo}>Acesso restrito</h1>
        <div className={styles.subtitulo}>Família em Foco · painel administrativo</div>

        {erro && <div className={loginStyles.erro}>Usuário ou senha incorretos.</div>}

        <form method="POST" action="/api/admin/login" className={loginStyles.form}>
          <input type="hidden" name="redirect" value={destino} />

          <label className={loginStyles.label}>
            Usuário
            <input type="text" name="usuario" required autoFocus className={loginStyles.input} />
          </label>

          <label className={loginStyles.label}>
            Senha
            <input type="password" name="senha" required className={loginStyles.input} />
          </label>

          <button type="submit" className={loginStyles.botao}>
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
