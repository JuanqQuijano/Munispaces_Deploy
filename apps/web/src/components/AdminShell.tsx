"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

const LINKS = [
  { href: "/administrador", label: "Interfaz", exact: true },
  { href: "/administrador/espacio", label: "Gestionar espacio" },
  { href: "/administrador/reportes", label: "Reportes" },
  { href: "/administrador/asistente", label: "Asistente IA" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AuthGuard role="admin">
      <div className="page-shell dash-shell">
        <SiteHeader />
        <div className="dash-body">
          <aside className="dash-sidebar">
            {LINKS.map((link) => {
              const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
              return (
                <Link key={link.href} href={link.href} className={active ? "active" : undefined}>
                  {link.label}
                </Link>
              );
            })}
          </aside>
          <section className="dash-content">{children}</section>
        </div>
        <SiteFooter />
      </div>
    </AuthGuard>
  );
}
