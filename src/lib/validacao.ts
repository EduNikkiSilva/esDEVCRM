import { z } from "zod";
import { ESTADOS_CONTRATO, ESTADOS_PROPOSTA, FASES } from "@/lib/dominio";

/** Resultado tipado das Server Actions críticas — o cliente mostra toast. */
export type ResultadoAcao =
  | { ok: true; mensagem?: string }
  | { ok: false; erro: string };

const vazioParaNulo = (s: string) => (s.trim() ? s.trim() : null);

const emailOpcional = z
  .string()
  .transform((s) => s.trim())
  .refine((s) => !s || z.email().safeParse(s).success, { error: "Email inválido." })
  .transform(vazioParaNulo);

const dataOpcional = z
  .string()
  .transform((s) => s.trim())
  .refine((s) => !s || /^\d{4}-\d{2}-\d{2}$/.test(s), { error: "Data inválida (AAAA-MM-DD)." })
  .transform(vazioParaNulo);

const numeroNaoNegativo = z.coerce.number({ error: "Valor numérico inválido." }).min(0, {
  error: "O valor não pode ser negativo.",
});

const idOpcional = z
  .string()
  .transform((s) => s.trim())
  .transform((s) => (s ? Number(s) : 0))
  .refine((n) => Number.isFinite(n) && n >= 0, { error: "Identificador inválido." });

export const esquemaLead = z.object({
  empresa: z.string().trim().min(1, { error: "A empresa é obrigatória." }).max(200),
  contacto_nome: z.string().transform(vazioParaNulo),
  email: emailOpcional,
  telefone: z.string().transform(vazioParaNulo),
  origem: z.string().transform(vazioParaNulo),
  responsavel: z.string().transform(vazioParaNulo),
  fase: z
    .string()
    .transform((s) => s.trim() || "Novo Lead")
    .refine((s): s is (typeof FASES)[number] => (FASES as readonly string[]).includes(s), {
      error: "Fase inválida.",
    }),
  tipo_solucao: z.string().transform(vazioParaNulo),
  orcamento_indicado: z.string().transform(vazioParaNulo),
  valor_estimado: numeroNaoNegativo.optional().default(0),
  notas: z.string().transform(vazioParaNulo),
  primeiro_contacto: dataOpcional,
});

export const esquemaCliente = z.object({
  id: idOpcional.optional().default(0),
  empresa: z.string().trim().min(1, { error: "A empresa é obrigatória." }).max(200),
  nif: z.string().transform(vazioParaNulo),
  contacto_nome: z.string().transform(vazioParaNulo),
  contacto_cargo: z.string().transform(vazioParaNulo),
  email: emailOpcional,
  telefone: z.string().transform(vazioParaNulo),
  website: z.string().transform(vazioParaNulo),
  notas: z.string().transform(vazioParaNulo),
});

export const esquemaProposta = z.object({
  lead_id: z.coerce.number().int().positive({ error: "Lead em falta." }),
  analise_id: idOpcional.optional().default(0),
  nivel: z.string().trim().min(1).default("BUSINESS"),
  valor: numeroNaoNegativo,
  mensalidade: numeroNaoNegativo.optional().default(0),
  validade_dias: z.coerce.number().int().min(1).max(365).optional().default(30),
  estado: z
    .string()
    .transform((s) => s.trim() || "Rascunho")
    .refine(
      (s): s is (typeof ESTADOS_PROPOSTA)[number] =>
        (ESTADOS_PROPOSTA as readonly string[]).includes(s),
      { error: "Estado de proposta inválido." },
    ),
  ambito: z.string().transform(vazioParaNulo),
  exclusoes: z.string().transform(vazioParaNulo),
  condicoes: z.string().transform(vazioParaNulo),
  observacoes: z.string().transform(vazioParaNulo),
  rondas_alteracoes: z.coerce.number().int().min(0).max(20).optional().default(2),
});

export const esquemaFatura = z.object({
  projeto_id: idOpcional.optional().default(0),
  cliente_id: idOpcional.optional().default(0),
  descricao: z.string().trim().min(1, { error: "A descrição é obrigatória." }).max(300),
  tipo: z.string().trim().min(1).default("Adjudicação"),
  valor: z.coerce.number({ error: "Valor inválido." }).positive({ error: "O valor tem de ser positivo." }),
  estado: z.string().trim().min(1).default("Pendente"),
  emitida_em: dataOpcional,
  vence_em: dataOpcional,
});

export const esquemaContrato = z.object({
  id: idOpcional.optional().default(0),
  cliente_id: z.coerce.number().int().positive({ error: "Cliente em falta." }),
  proposta_id: idOpcional.optional().default(0),
  projeto_id: idOpcional.optional().default(0),
  titulo: z.string().trim().min(1, { error: "O título é obrigatório." }).max(200),
  estado: z
    .string()
    .transform((s) => s.trim() || "Pendente")
    .refine(
      (s): s is (typeof ESTADOS_CONTRATO)[number] =>
        (ESTADOS_CONTRATO as readonly string[]).includes(s),
      { error: "Estado de contrato inválido." },
    ),
  data: dataOpcional,
  ficheiro: z.string().transform(vazioParaNulo),
  notas: z.string().transform(vazioParaNulo),
});

/** Inputs da calculadora — evita gravar análises com pacote/horas absurdos. */
export const esquemaAnalise = z.object({
  pacoteId: z.string().trim().min(1, { error: "Pacote em falta." }),
  extras: z.record(z.string(), z.number().int().min(0).max(99)).default({}),
  complexidade: z.record(z.string(), z.number().min(1).max(5)),
  urgencia: z.number().min(1).max(5),
  risco: z.number().min(1).max(5),
  prioritario: z.boolean(),
  horasEstimadas: z.number().min(1, { error: "Indica horas estimadas." }).max(2000),
  custosExternos: z.number().min(0),
  ajusteComercial: z.number().min(-100).max(100),
});

/** Lê campos texto do FormData e valida com Zod. */
export function validarFormulario<T>(
  esquema: z.ZodType<T>,
  fd: FormData,
): { ok: true; dados: T } | { ok: false; erro: string } {
  const bruto: Record<string, string> = {};
  for (const [chave, valor] of fd.entries()) {
    if (typeof valor === "string") bruto[chave] = valor;
  }
  const r = esquema.safeParse(bruto);
  if (!r.success) {
    return { ok: false, erro: r.error.issues[0]?.message ?? "Dados inválidos." };
  }
  return { ok: true, dados: r.data };
}

export function falha(erro: string): ResultadoAcao {
  return { ok: false, erro };
}

export function ok(mensagem?: string): ResultadoAcao {
  return mensagem ? { ok: true, mensagem } : { ok: true };
}
