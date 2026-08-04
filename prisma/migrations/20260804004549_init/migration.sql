-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EstadoCivil" AS ENUM ('SOLTEIRO', 'NAMORANDO_NOIVO', 'CASADO_UNIAO_ESTAVEL', 'DIVORCIADO_SEPARADO', 'VIUVO');

-- CreateEnum
CREATE TYPE "TempoUniao" AS ENUM ('ATE_5_ANOS', 'MAIS_DE_5_ANOS');

-- CreateEnum
CREATE TYPE "FaixaEtaria" AS ENUM ('DE_0_A_3', 'DE_4_A_5', 'DE_6_A_7', 'DE_8_A_10', 'DE_11_A_13', 'DE_14_A_16', 'MAIS_DE_16');

-- CreateEnum
CREATE TYPE "MomentoEmocional" AS ENUM ('PILOTO_AUTOMATICO', 'FASE_DIFICIL', 'BEM_BUSCANDO_CRESCER', 'PREFIRO_NAO_RESPONDER');

-- CreateEnum
CREATE TYPE "StatusDiagnostico" AS ENUM ('PENDENTE', 'GERADO', 'ENVIADO', 'FALHOU');

-- CreateEnum
CREATE TYPE "TipoOferta" AS ENUM ('PROGRAMA', 'CONTEUDO_GENERICO', 'APOIO_PROFISSIONAL');

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estadoCivil" "EstadoCivil" NOT NULL,
    "temFilhos" BOOLEAN NOT NULL,
    "tempoUniao" "TempoUniao",
    "idadesFilhos" "FaixaEtaria"[],
    "faixaMaisDesafiadora" "FaixaEtaria",
    "prioridade" TEXT NOT NULL,
    "maiorDesafio" TEXT NOT NULL,
    "momentoEmocional" "MomentoEmocional" NOT NULL,
    "relatoLivre" TEXT,
    "cidade" TEXT,
    "comoConheceu" TEXT,
    "nome" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT NOT NULL,
    "consentimentoLgpdEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diagnostico" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "leadId" TEXT NOT NULL,
    "fase" TEXT NOT NULL,
    "programaRecomendado" TEXT,
    "tabelaUsada" TEXT,
    "status" "StatusDiagnostico" NOT NULL DEFAULT 'PENDENTE',
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "erro" TEXT,
    "conteudoJson" JSONB,
    "tipoOferta" "TipoOferta",
    "enviadoEm" TIMESTAMP(3),

    CONSTRAINT "Diagnostico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Diagnostico_leadId_key" ON "Diagnostico"("leadId");

-- AddForeignKey
ALTER TABLE "Diagnostico" ADD CONSTRAINT "Diagnostico_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

