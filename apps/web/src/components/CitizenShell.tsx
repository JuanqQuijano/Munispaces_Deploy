"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

const LINKS = [
  { href: "/ciudadano", label: "Interfaz", exact: true },
  { href: "/ciudadano/reservas", label: "Reservas" },
  { href: "/ciudadano/reportes", label: "Reportes" },
  { href: "/ciudadano/asistente", label: "Asistente IA" },
];

export function CitizenShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AuthGuard role="ciudadano">
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
