import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const TITULO = "Família em Foco · IBF";
const DESCRICAO =
  "Diagnóstico gratuito e personalizado sobre o momento da sua família, feito pelo Instituto Brasileiro da Família (IBF).";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_BASE_URL ?? "https://quiz.portalibf.org.br"),
  title: TITULO,
  description: DESCRICAO,
  openGraph: {
    title: TITULO,
    description: DESCRICAO,
    siteName: "IBF · Instituto Brasileiro da Família",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRICAO,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
