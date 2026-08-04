/**
 * Extrai o conteúdo de grounding (só as seções "Nota técnica") das apostilas
 * brutas em docs/casos_programas_ibf/ e escreve em src/knowledge-base/programas/.
 *
 * Descarta de propósito:
 * - "Leitura do caso" e "Guia para preparar a reunião plenária" — narrativas
 *   fictícias com nomes de personagens que não devem vazar pro e-mail de um
 *   lead de verdade.
 * - "Quiz" — validação de aprendizado do curso, não é conteúdo de referência.
 * - "Referências" — bibliografia acadêmica; não é a lista curada de
 *   recomendação de livros (isso é outro pendente, ver knowledge-base/README.md).
 *
 * Rode com: npx tsx scripts/build-knowledge-base.ts [slug-do-programa]
 * Passe um slug (ex.: primeiras-decisoes) pra processar só um programa — útil
 * pra revisar o resultado antes de rodar pra todos. Sem argumento, roda todos.
 * Reexecutável: sempre que a pasta docs/casos_programas_ibf/ for atualizada.
 */
import fs from "node:fs";
import path from "node:path";

const RAIZ_BRUTA = path.join(process.cwd(), "docs/casos_programas_ibf");
const RAIZ_PROCESSADA = path.join(process.cwd(), "src/knowledge-base/programas");

const SECAO_PERMITIDA = /^nota técnica/i;

interface Secao {
  titulo: string;
  linhas: string[];
}

function dividirEmSecoes(conteudo: string): Secao[] {
  const linhas = conteudo.split("\n");
  const secoes: Secao[] = [];
  let atual: Secao | null = null;

  for (const linha of linhas) {
    const match = linha.match(/^# (.+)$/);
    if (match) {
      atual = { titulo: match[1].trim(), linhas: [] };
      secoes.push(atual);
    } else if (atual) {
      atual.linhas.push(linha);
    }
  }

  return secoes;
}

function extrairNotasTecnicas(conteudo: string): string {
  return dividirEmSecoes(conteudo)
    .filter((secao) => SECAO_PERMITIDA.test(secao.titulo))
    .map((secao) => `### ${secao.titulo}\n${secao.linhas.join("\n").trim()}`)
    .join("\n\n");
}

function preservarCabecalho(arquivoAtual: string): string {
  // Mantém só "# Título" + linhas "**Público:**"/"**Link oficial:**" do arquivo
  // placeholder atual; descarta o comentário PLACEHOLDER e o corpo TODO.
  const linhas = arquivoAtual.split("\n");
  const cabecalho = linhas.filter(
    (linha) => linha.startsWith("# ") || linha.startsWith("**Público:**") || linha.startsWith("**Link oficial:**")
  );
  return cabecalho.join("\n");
}

function main() {
  const filtro = process.argv[2];
  const programas = fs
    .readdirSync(RAIZ_BRUTA, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((slug) => !filtro || slug === filtro)
    .sort();

  for (const slug of programas) {
    const pastaPrograma = path.join(RAIZ_BRUTA, slug);
    const arquivosCaso = fs
      .readdirSync(pastaPrograma)
      .filter((nome) => nome.endsWith(".md"))
      .sort();

    if (arquivosCaso.length === 0) continue;

    const arquivoDestino = path.join(RAIZ_PROCESSADA, `${slug}.md`);
    if (!fs.existsSync(arquivoDestino)) {
      console.warn(`Aviso: ${slug} não tem arquivo placeholder em knowledge-base/programas/, pulando.`);
      continue;
    }

    const cabecalho = preservarCabecalho(fs.readFileSync(arquivoDestino, "utf-8"));

    const blocosPorCaso = arquivosCaso.map((nomeArquivo, index) => {
      const conteudo = fs.readFileSync(path.join(pastaPrograma, nomeArquivo), "utf-8");
      const notasTecnicas = extrairNotasTecnicas(conteudo);
      return `## Caso ${index + 1}\n\n${notasTecnicas}`;
    });

    const saida = [
      cabecalho,
      "",
      "## Notas técnicas (extraídas das apostilas oficiais do IBF)",
      "",
      blocosPorCaso.join("\n\n"),
      "",
    ].join("\n");

    fs.writeFileSync(arquivoDestino, saida, "utf-8");
    console.log(`✔ ${slug}.md — ${arquivosCaso.length} caso(s) processado(s)`);
  }
}

main();
