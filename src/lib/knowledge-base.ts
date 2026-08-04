import fs from "node:fs";
import path from "node:path";

const KB_ROOT = path.join(process.cwd(), "src/knowledge-base");

/** Mapeia o nome do programa (retornado por decidirFaseEPrograma) pro slug do arquivo em programas/. */
const PROGRAMA_SLUGS: Record<string, string> = {
  "Projeto Pessoal": "projeto-pessoal",
  "Amor Matrimonial 1": "amor-matrimonial-1",
  "Amor Matrimonial 2": "amor-matrimonial-2",
  "Primeiros Passos": "primeiros-passos",
  "Primeiras Conversas": "primeiras-conversas",
  "Primeiras Letras": "primeiras-letras",
  "Primeiras Decisões": "primeiras-decisoes",
  "Pré-adolescência": "pre-adolescencia",
  "Adolescência": "adolescencia",
};

export function lerConteudoPrograma(programaRecomendado: string | null): string | null {
  if (!programaRecomendado) return null;
  const slug = PROGRAMA_SLUGS[programaRecomendado];
  if (!slug) {
    throw new Error(`Programa sem slug de knowledge-base mapeado: "${programaRecomendado}"`);
  }
  return fs.readFileSync(path.join(KB_ROOT, "programas", `${slug}.md`), "utf-8");
}

export function lerDadosIffd(): string {
  return fs.readFileSync(path.join(KB_ROOT, "institucional/dados-iffd.md"), "utf-8");
}

export function lerAvisoSeguranca(): string {
  return fs.readFileSync(path.join(KB_ROOT, "institucional/aviso-seguranca.md"), "utf-8");
}

export function lerCtaGenerico(): string {
  return fs.readFileSync(path.join(KB_ROOT, "institucional/cta-generico.md"), "utf-8");
}

export interface LivroOuFilme {
  titulo: string;
  tipo: "livro" | "filme";
  fases: string[]; // nomes de fase, ou ["qualquer"]
  desafios: string[]; // strings livres, ou ["qualquer"]
  porque: string;
}

export function lerLivrosEFilmes(): LivroOuFilme[] {
  const raw = fs.readFileSync(path.join(KB_ROOT, "livros-e-filmes.json"), "utf-8");
  return JSON.parse(raw).itens as LivroOuFilme[];
}

/** Filtra a lista curada pra fase + desafio relevantes, pra não estourar o prompt com itens irrelevantes. */
export function filtrarLivrosEFilmes(fase: string, maiorDesafio: string): LivroOuFilme[] {
  return lerLivrosEFilmes().filter(
    (item) =>
      (item.fases.includes("qualquer") || item.fases.includes(fase)) &&
      (item.desafios.includes("qualquer") || item.desafios.includes(maiorDesafio))
  );
}
