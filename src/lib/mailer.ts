import { BrevoClient } from "@getbrevo/brevo";
import type { DiagnosticoIa } from "@/lib/ai-diagnostic-schema";
import { renderEmailDiagnostico } from "@/lib/email-template";

const brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY ?? "" });

// Precisa ser um remetente verificado na conta Brevo (Settings > Senders), senão o
// envio falha. TODO: trocar pra um e-mail @portalibf.org.br assim que verificado.
const REMETENTE = {
  email: process.env.BREVO_SENDER_EMAIL ?? "send@edudebarros.com.br",
  name: "IBF · Instituto Brasileiro da Família",
};

export async function enviarEmailDiagnostico(params: {
  nome: string;
  email: string;
  fase: string;
  diagnostico: DiagnosticoIa;
}): Promise<void> {
  const html = renderEmailDiagnostico(params);

  await brevo.transactionalEmails.sendTransacEmail({
    sender: REMETENTE,
    to: [{ email: params.email, name: params.nome }],
    subject: params.diagnostico.assunto_email,
    htmlContent: html,
  });
}
