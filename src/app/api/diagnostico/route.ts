import { NextResponse } from "next/server";
import { caminhoBaseDados, consulta, urlPostgres, usaPostgres } from "@/lib/db";
import { EMAILS_PERMITIDOS, authConfigurada } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Diagnóstico da instalação, para não ser preciso adivinhar quando algo falha.
 * Fica atrás do login (o proxy só deixa passar /login e /api/auth), e nunca
 * devolve segredos: da ligação à base de dados só sai o servidor, sem password.
 */
export async function GET() {
  const relatorio: Record<string, unknown> = {
    motor: usaPostgres ? "PostgreSQL" : "SQLite (ficheiro local)",
    baseDeDados: caminhoBaseDados,
    variaveis: {
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
      POSTGRES_URL: Boolean(process.env.POSTGRES_URL),
      GOOGLE_CLIENT_ID: Boolean(process.env.GOOGLE_CLIENT_ID),
      GOOGLE_CLIENT_SECRET: Boolean(process.env.GOOGLE_CLIENT_SECRET),
      SESSAO_SECRET: Boolean(process.env.SESSAO_SECRET),
      EMAILS_PERMITIDOS: EMAILS_PERMITIDOS.join(", "),
    },
    autenticacaoAtiva: authConfigurada(),
  };

  if (usaPostgres && urlPostgres) {
    try {
      const u = new URL(urlPostgres);
      relatorio.ligacao = {
        servidor: u.hostname,
        porta: u.port || "5432",
        // O pooler da Supabase usa 6543; a ligação direta (5432) não aguenta serverless.
        modo: u.port === "6543" ? "pooler (recomendado)" : "ligação direta",
        temPassword: Boolean(u.password),
      };
    } catch {
      relatorio.ligacao = { erro: "A cadeia de ligação não é um URL válido." };
    }
  }

  try {
    const linhas = await consulta<{ n: number }>("SELECT COUNT(*) AS n FROM leads");
    relatorio.baseDeDadosOk = true;
    relatorio.leads = Number(linhas[0]?.n ?? 0);
  } catch (erro) {
    relatorio.baseDeDadosOk = false;
    relatorio.erro = erro instanceof Error ? erro.message : String(erro);
  }

  return NextResponse.json(relatorio, { status: relatorio.baseDeDadosOk ? 200 : 500 });
}
