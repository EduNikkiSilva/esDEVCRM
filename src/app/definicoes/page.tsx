import { Download, ShieldCheck, Trash2, Upload } from "lucide-react";
import { LogoEsdev } from "@/components/logotipo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui-kit";
import { Badge } from "@/components/ui/badge";
import { ultimosAcessos } from "@/lib/acessos";
import { guardarLogotipo, removerLogotipo } from "@/lib/actions";
import { caminhoBaseDados } from "@/lib/db";
import { data } from "@/lib/format";
import { logotipos } from "@/lib/logo";
import { MINUTOS_INATIVIDADE } from "@/lib/sessao";

export const metadata = { title: "Definições" };

// Lê o disco a cada pedido.
export const dynamic = "force-dynamic";

const VARIANTES = [
  {
    id: "claro",
    titulo: "Logótipo principal",
    nota: "Usado em fundos claros: página Como usar, propostas impressas e ícone.",
    fundo: "bg-white",
  },
  {
    id: "escuro",
    titulo: "Versão para fundos escuros",
    nota: "Usada na barra lateral. Se não carregares nada aqui, é usado o logótipo principal.",
    fundo: "bg-[#0b1220]",
  },
] as const;

export default async function DefinicoesPage() {
  const logos = await logotipos();
  const acessos = await ultimosAcessos();

  return (
    <>
      <PageHeader
        titulo="Definições"
        descricao="Identidade da esDEV e localização dos dados. O que carregares aqui fica guardado no teu computador."
      />

      <section className="grid gap-4 lg:grid-cols-2">
        {VARIANTES.map((v) => {
          const atual = v.id === "escuro" ? logos.escuro : logos.claro;
          const proprio = v.id === "escuro" ? logos.escuroProprio : logos.claro;
          return (
            <Card key={v.id}>
              <CardHeader>
                <CardTitle className="text-sm">{v.titulo}</CardTitle>
                <p className="text-xs text-muted-foreground">{v.nota}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className={`grid h-28 place-items-center rounded-xl border border-border ${v.fundo}`}
                >
                  {atual ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={atual} alt="Logótipo esDEV" className="max-h-16 max-w-[80%]" />
                  ) : (
                    <LogoEsdev
                      className={`h-10 ${v.id === "escuro" ? "text-white" : "text-[#0a1b4d]"}`}
                    />
                  )}
                </div>

                <form action={guardarLogotipo} className="grid gap-2">
                  <input type="hidden" name="variante" value={v.id} />
                  <Label
                    htmlFor={`ficheiro-${v.id}`}
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Carregar imagem (PNG, SVG ou WebP, até 3 MB)
                  </Label>
                  <Input
                    id={`ficheiro-${v.id}`}
                    type="file"
                    name="ficheiro"
                    accept="image/png,image/svg+xml,image/webp,image/jpeg"
                    required
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">
                      <Upload className="size-4" /> Usar este ficheiro
                    </Button>
                  </div>
                </form>

                {proprio ? (
                  <form action={removerLogotipo}>
                    <input type="hidden" name="variante" value={v.id} />
                    <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                      <Trash2 className="size-4" /> Remover e voltar ao vetor
                    </Button>
                  </form>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShieldCheck className="size-4 text-success" /> Segurança
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            O que está ativo neste momento nesta instalação.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <li>Entrada só com a conta Google autorizada.</li>
            <li>Sessão fecha após {MINUTOS_INATIVIDADE} minutos sem atividade.</li>
            <li>Cookie assinado, httpOnly e restrito a HTTPS.</li>
            <li>HTTPS obrigatório, com HSTS de dois anos.</li>
            <li>Fora dos motores de busca (robots e X-Robots-Tag).</li>
            <li>Incorporação em iframes bloqueada.</li>
          </ul>

          <div>
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Últimos acessos
            </p>
            {acessos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ainda sem registos. Aparecem aqui as entradas, saídas e tentativas recusadas.
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {acessos.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                    <Badge
                      variant="outline"
                      className={
                        a.resultado === "recusado"
                          ? "border-destructive/30 bg-destructive/10 text-destructive"
                          : ""
                      }
                    >
                      {a.resultado}
                    </Badge>
                    <span className="font-medium">{a.email ?? "—"}</span>
                    <span className="text-xs text-muted-foreground">{data(a.quando)}</span>
                    {a.ip ? (
                      <span className="ml-auto font-mono text-xs text-muted-foreground">
                        {a.ip}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm">Cópia de segurança</CardTitle>
          <p className="text-xs text-muted-foreground">
            O ponto mais frágil a solo: um disco a falhar ou um ficheiro apagado perde leads,
            propostas e faturas. Exporta com regularidade — pelo menos uma vez por semana.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Base de dados:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{caminhoBaseDados}</code>
          </p>
          <Button asChild>
            <a href="/api/backup" download>
              <Download className="size-4" /> Exportar tudo (JSON)
            </a>
          </Button>
          <p className="text-xs">
            O ficheiro inclui tabelas de negócio, logótipos e documentos anexados. Guarda-o fora
            deste computador (Drive, OneDrive, pen). Em SQLite local, podes ainda copiar o
            ficheiro <code className="rounded bg-muted px-1 text-[11px]">.db</code> à mão.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
