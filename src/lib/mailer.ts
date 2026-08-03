import { EmailParams, MailerSend, Recipient, Sender } from "mailersend";
import type { DiagnosticoIa } from "@/lib/ai-diagnostic-schema";
import { renderEmailDiagnostico } from "@/lib/email-template";

const mailerSend = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY ?? "" });

// TODO: confirmar domínio verificado no Mailersend antes de produção.
const REMETENTE = new Sender("diagnostico@portalibf.org.br", "IBF · Instituto Brasileiro da Família");

export async function enviarEmailDiagnostico(params: {
  nome: string;
  email: string;
  fase: string;
  diagnostico: DiagnosticoIa;
}): Promise<void> {
  const html = renderEmailDiagnostico(params);

  const emailParams = new EmailParams()
    .setFrom(REMETENTE)
    .setTo([new Recipient(params.email, params.nome)])
    .setSubject(params.diagnostico.assunto_email)
    .setHtml(html);

  await mailerSend.email.send(emailParams);
}
