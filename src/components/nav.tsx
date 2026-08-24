"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Calculator,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LifeBuoy,
  Receipt,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Pipeline", icon: FolderKanban },
  { href: "/calculadora", label: "Calculadora", icon: Calculator },
  { href: "/propostas", label: "Propostas", icon: FileText },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/projetos", label: "Projetos", icon: FolderKanban },
  { href: "/faturas", label: "Faturação", icon: Receipt },
  { href: "/manutencao", label: "Manutenção", icon: LifeBuoy },
  { href: "/referencias", label: "Referências", icon: BookOpen },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="shrink-0 border-b border-slate-200 bg-white lg:w-60 lg:border-r lg:border-b-0">
      <div className="flex items-center gap-2 px-4 py-4 lg:px-5">
        <span className="grid size-8 place-items-center rounded-md bg-slate-900 text-sm font-bold text-white">
          es
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold">esDEV CRM</p>
          <p className="text-[11px] text-slate-500">Sistema operacional v1</p>
        </div>
      </div>
      <ul className="flex gap-1 overflow-x-auto px-2 pb-3 lg:flex-col lg:overflow-visible lg:pb-6">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const ativo = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  ativo
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
