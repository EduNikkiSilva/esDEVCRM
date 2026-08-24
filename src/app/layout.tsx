import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Estrutura } from "@/components/estrutura";
import { ProvedorTema } from "@/components/tema";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "esDEV CRM", template: "%s · esDEV CRM" },
  description:
    "CRM interno da esDEV: pipeline, briefings, calculadora de preços, propostas, projetos, faturação e manutenção.",
  applicationName: "esDEV CRM",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#131318" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-PT"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ProvedorTema>
          <Estrutura>{children}</Estrutura>
          <Toaster position="bottom-right" />
        </ProvedorTema>
      </body>
    </html>
  );
}
