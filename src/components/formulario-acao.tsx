"use client";

import type { ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ResultadoAcao } from "@/lib/validacao";
import { cn } from "@/lib/utils";

type Props = Omit<ComponentProps<"form">, "action"> & {
  action: (fd: FormData) => Promise<ResultadoAcao | void>;
  /** Mensagem de sucesso quando a action devolve `{ ok: true }` sem mensagem própria. */
  sucesso?: string;
};

/**
 * Formulário que liga Server Actions ao sonner: erros de validação/DB aparecem
 * como toast; redirects (criar lead, etc.) passam sem toast extra.
 */
export function FormularioAcao({ action, sucesso, className, children, ...rest }: Props) {
  const router = useRouter();

  return (
    <form
      {...rest}
      className={cn(className)}
      action={async (fd) => {
        try {
          const r = await action(fd);
          if (!r) {
            router.refresh();
            return;
          }
          if (!r.ok) {
            toast.error(r.erro);
            return;
          }
          toast.success(r.mensagem ?? sucesso ?? "Guardado");
          router.refresh();
        } catch (e) {
          // redirect() / notFound() do Next lançam; não engolir.
          const digest = typeof e === "object" && e && "digest" in e ? String((e as { digest?: string }).digest) : "";
          if (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND")) throw e;
          toast.error(e instanceof Error ? e.message : "Algo correu mal.");
        }
      }}
    >
      {children}
    </form>
  );
}
