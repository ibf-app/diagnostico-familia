-- DropForeignKey
ALTER TABLE "Diagnostico" DROP CONSTRAINT "Diagnostico_leadId_fkey";

-- AddForeignKey
ALTER TABLE "Diagnostico" ADD CONSTRAINT "Diagnostico_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
