import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, LockKeyhole, TriangleAlert } from "lucide-react";
import { LogoEsdev } from "@/components/logotipo";
import { Card, CardContent } from "@/components/ui/card";
import { EMAILS_PERMITIDOS, authConfigurada, sessaoAtual } from "@/lib/auth";
import { logotipos } from "@/lib/logo";
import { MINUTOS_INATIVIDADE } from "@/lib/sessao";

export const metadata = { title: "Entrar" };
export const dynamic = "force-dynamic";

const ERROS: Record<string, string> = {
  "sem-permissao": "Essa conta Google não tem acesso a este CRM.",
  "estado-invalido": "O pedido expirou ou veio de outro sítio. Tenta outra vez.",
  "troca-falhou": "O Google recusou a autenticação. Verifica as credenciais configuradas.",
  "sem-id-token": "O Google não devolveu a identidade. Tenta outra vez.",
  "id-token-invalido": "Resposta do Google ilegível. Tenta outra vez.",
  "nao-configurado": "A autenticação ainda não está configurada neste servidor.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; para?: string; saiu?: string; expirou?: string }>;
}) {
  const { erro, para, saiu, expirou } = await searchParams;

  // Já autenticado, ou autenticação desligada (modo local): não há nada aqui.
  if (!authConfigurada() || (await sessaoAtual())) redirect(para ?? "/");

  const destino = `/api/auth/google?para=${encodeURIComponent(para ?? "/")}`;
  const logos = await logotipos();

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center">
      {/* Clicar no logótipo recarrega a raiz: é o gesto natural para voltar ao início. */}
      <Link href="/" className="mb-8 flex justify-center transition-opacity hover:opacity-80">
        {logos.claro ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logos.claro} alt="esDEV" className="h-14 w-auto" />
        ) : (
          <LogoEsdev tagline className="h-14 text-[#0a1b4d] dark:text-white" />
        )}
      </Link>

      <Card>
        <CardContent className="space-y-5 py-2">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
              <LockKeyhole className="size-4" />
            </span>
            <div>
              <h1 className="text-base font-semibold">Área reservada</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Acesso exclusivo a {EMAILS_PERMITIDOS.join(", ")}.
              </p>
            </div>
          </div>

          {erro ? (
            <p className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
              {ERROS[erro] ?? "Não foi possível autenticar. Tenta outra vez."}
            </p>
          ) : null}

          {saiu ? (
            <p className="rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
              Sessão terminada.
            </p>
          ) : null}

          {expirou ? (
            <p className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
              <Clock className="mt-0.5 size-4 shrink-0" />
              A sessão expirou por inatividade. Entra outra vez para continuares.
            </p>
          ) : null}

          <Link
            href={destino}
            prefetch={false}
            className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-border bg-card text-sm font-medium transition-colors hover:bg-muted"
          >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4.1h6.6c-.1 1.1-.9 2.8-2.5 3.9l-.1.1 3.7 2.8.3.1c2.3-2.1 3.5-5.2 3.5-8.8"
              />
              <path
                fill="#34A853"
                d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.2 0-5.9-2.1-6.9-5l-.1.1-3.7 2.9-.1.1C3.3 21.4 7.3 24 12 24"
              />
              <path
                fill="#FBBC05"
                d="M5.1 14.4c-.3-.8-.4-1.6-.4-2.4s.2-1.7.4-2.4V9.5L1.2 6.6l-.1.1C.4 8.3 0 10.1 0 12s.4 3.7 1.1 5.3z"
              />
              <path
                fill="#EA4335"
                d="M12 4.7c2.3 0 3.8 1 4.7 1.8l3.4-3.3C18 1.2 15.2 0 12 0 7.3 0 3.3 2.6 1.1 6.7l3.9 3c1-2.9 3.8-5 7-5"
              />
            </svg>
            Entrar com Google
          </Link>

          <p className="text-xs text-muted-foreground">
            A sessão fecha após {MINUTOS_INATIVIDADE} minutos sem atividade e dura no máximo 30
            dias. Todas as entradas ficam registadas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
