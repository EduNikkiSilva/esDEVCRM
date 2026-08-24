import { NextResponse } from "next/server";
import { consulta, semAcento } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Alimenta a paleta de comandos (Ctrl+K) com tudo o que existe na base de dados. */
export async function GET() {
  const leads = await consulta<{ id: number; empresa: string; fase: string }>(
    "SELECT id, empresa, fase FROM leads ORDER BY atualizado_em DESC LIMIT 40",
  );
  const clientes = await consulta<{ id: number; empresa: string }>(
    `SELECT id, empresa FROM clientes ORDER BY ${semAcento("empresa")} LIMIT 40`,
  );
  const projetos = await consulta<{ id: number; nome: string; estado: string }>(
    "SELECT id, nome, estado FROM projetos ORDER BY id DESC LIMIT 40",
  );
  const contactos = await consulta<{ cliente_id: number; nome: string; cargo: string | null }>(
    `SELECT cliente_id, nome, cargo FROM contactos ORDER BY ${semAcento("nome")} LIMIT 40`,
  );

  return NextResponse.json({
    resultados: [
      ...leads.map((l) => ({
        grupo: "Leads",
        titulo: l.empresa,
        nota: l.fase,
        href: `/leads/${l.id}`,
      })),
      ...clientes.map((c) => ({
        grupo: "Clientes",
        titulo: c.empresa,
        nota: "Cliente",
        href: `/clientes/${c.id}`,
      })),
      ...projetos.map((p) => ({
        grupo: "Projetos",
        titulo: p.nome,
        nota: p.estado,
        href: `/projetos/${p.id}`,
      })),
      ...contactos.map((c) => ({
        grupo: "Contactos",
        titulo: c.nome,
        nota: c.cargo ?? "Contacto",
        href: `/clientes/${c.cliente_id}`,
      })),
    ],
  });
}
