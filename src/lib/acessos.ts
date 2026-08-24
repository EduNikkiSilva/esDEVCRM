import { AGORA, consulta, executa } from "@/lib/db";

/**
 * Registo de tentativas de entrada. Serve para responderes a uma pergunta que
 * de outra forma não tem resposta: alguém tentou entrar na minha área reservada?
 */
export type Acesso = {
  id: number;
  email: string | null;
  resultado: string;
  ip: string | null;
  agente: string | null;
  quando: string;
};

export async function registarAcesso(
  resultado: "entrada" | "recusado" | "saida",
  dados: { email?: string | null; ip?: string | null; agente?: string | null },
) {
  try {
    await executa(
      `INSERT INTO acessos (email, resultado, ip, agente, quando) VALUES (?,?,?,?,${AGORA})`,
      dados.email ?? null,
      resultado,
      dados.ip ?? null,
      (dados.agente ?? "").slice(0, 300) || null,
    );
  } catch {
    // Um registo de auditoria não deve impedir alguém de entrar.
  }
}

export async function ultimosAcessos(limite = 8) {
  try {
    return await consulta<Acesso>(
      "SELECT * FROM acessos ORDER BY id DESC LIMIT ?",
      limite,
    );
  } catch {
    return [];
  }
}

/** Cabeçalhos que a Vercel preenche com o IP real do visitante. */
export function ipDoPedido(pedido: Request) {
  const cabecalhos = pedido.headers;
  return (
    cabecalhos.get("x-real-ip") ??
    cabecalhos.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null
  );
}
