import { BrevoClient } from "@getbrevo/brevo";
import type { DiagnosticoIa } from "@/lib/ai-diagnostic-schema";
import { renderEmailDiagnostico } from "@/lib/email-template";

const brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY ?? "" });

// TODO: confirmar remetente/domínio verificado na conta Brevo antes de produção.
const REMETENTE = { email: "diagnostico@portalibf.org.br", name: "IBF · Instituto Brasileiro da Família" };

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
