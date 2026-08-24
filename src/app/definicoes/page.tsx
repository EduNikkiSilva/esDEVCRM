import { Trash2, Upload } from "lucide-react";
import { LogoEsdev } from "@/components/logotipo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui-kit";
import { guardarLogotipo, removerLogotipo } from "@/lib/actions";
import { caminhoBaseDados } from "@/lib/db";
import { logotipos } from "@/lib/logo";

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
          <CardTitle className="text-sm">Onde estão os teus dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Base de dados:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{caminhoBaseDados}</code>
          </p>
          <p>
            Copiar este ficheiro é copiar o CRM inteiro — leads, briefings, propostas, projetos,
            faturas e contratos. É a tua cópia de segurança.
          </p>
          <p>
            Os logótipos que carregas ficam guardados na própria base de dados, por isso entram
            nas tuas cópias de segurança. Em alternativa podes colocá-los na pasta{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">public</code> do projeto, com
            os nomes{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">logo.png</code> e{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">logo-branco.png</code>.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
