"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function SiteHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const admin = user?.role === "admin";

  const links = user
    ? [["/ciudadano/espacios", "Espacios"] as const]
    : [
        ["/login", "Administrador"] as const,
        ["/ciudadano/espacios", "Espacios"] as const,
        ["/login", "Ingresar"] as const,
      ];

  const home = user ? (admin ? "/administrador" : "/ciudadano") : "/";

  return (
    <header className={user ? "site-header" : "site-header site-header-guest"}>
      <nav className="navbar">
        <Link className="brand" href={home} aria-label="Ir al inicio">
          <img className="brand-icon" src="/logoVertical_sinletras.png" alt="" />
          <span>MuniSpaces</span>
        </Link>
        <div className="nav-links">
          {links.map(([href, label]) => (
            <Link key={`${href}-${label}`} href={href} className={pathname === href ? "active" : ""}>
              {label}
            </Link>
          ))}
          {user ? (
            <button className="register-link nav-button" onClick={() => logout().then(() => (window.location.href = "/"))}>
              Salir
            </button>
          ) : (
            <Link className="register-link" href="/registro">
              Registrar
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>MuniSpaces</p>
    </footer>
  );
}
