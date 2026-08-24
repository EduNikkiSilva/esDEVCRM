import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Nav } from "@/components/nav";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "esDEV CRM",
  description:
    "CRM interno da esDEV: pipeline, briefings, calculadora de preços, propostas, projetos, faturação e manutenção.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-PT"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900">
        <div className="flex min-h-screen flex-col lg:flex-row">
          <Nav />
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
