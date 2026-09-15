"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const GUEST_LINKS = [
  ["/login", "Administrador"],
  ["/ciudadano/espacios", "Espacios"],
  ["/login", "Ingresar"],
] as const;

export function SiteHeader() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const admin = user?.role === "admin";
  const showGuest = !loading && !user;
  const showUser = !loading && !!user;

  const home = user ? (admin ? "/administrador" : "/ciudadano") : "/";

  return (
    <header className={showGuest ? "site-header site-header-guest" : "site-header"}>
      <nav className="navbar">
        <Link className="brand" href={home} aria-label="Ir al inicio">
          <img className="brand-icon" src="/logoVertical_sinletras.png" alt="" />
          <span>MuniSpaces</span>
        </Link>
        <div className="nav-links">
          {showGuest
            ? GUEST_LINKS.map(([href, label]) => (
                <Link
                  key={`desk-${href}-${label}`}
                  href={href}
                  className={`nav-text-link${pathname === href ? " active" : ""}`}
                >
                  {label}
                </Link>
              ))
            : null}
          {showUser ? (
            <Link
              href="/ciudadano/espacios"
              className={`nav-text-link${pathname === "/ciudadano/espacios" ? " active" : ""}`}
            >
              Espacios
            </Link>
          ) : null}
          {showUser ? (
            <button
              className="register-link nav-button"
              onClick={() => logout().then(() => (window.location.href = "/"))}
            >
              Salir
            </button>
          ) : null}
          {showGuest ? (
            <Link className="register-link" href="/registro">
              Registrar
            </Link>
          ) : null}
        </div>
      </nav>
      {showGuest ? (
        <div className="guest-nav-bar" aria-label="Navegacion principal">
          {GUEST_LINKS.map(([href, label]) => (
            <Link
              key={`mobile-${href}-${label}`}
              href={href}
              className={pathname === href ? "active" : undefined}
            >
              {label}
            </Link>
          ))}
        </div>
      ) : null}
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
