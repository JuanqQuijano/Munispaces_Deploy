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
  const isLanding = pathname === "/";
  // Landing always shows marketing links (desktop + mobile bar).
  const showMarketingLinks = isLanding || showGuest;
  const showGuestBar = showMarketingLinks;

  const home = user ? (admin ? "/administrador" : "/ciudadano") : "/";

  async function onLogout() {
    await logout();
    window.location.assign("/");
  }

  return (
    <header className={showGuestBar ? "site-header site-header-guest" : "site-header"}>
      <nav className="navbar">
        <Link className="brand" href={home} aria-label="Ir al inicio">
          <img className="brand-icon" src="/logoVertical_sinletras.png" alt="" />
          <span>MuniSpaces</span>
        </Link>
        <div className="nav-links">
          {showMarketingLinks
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
          {showUser && !isLanding ? (
            <Link
              href="/ciudadano/espacios"
              className={`nav-text-link${pathname === "/ciudadano/espacios" ? " active" : ""}`}
            >
              Espacios
            </Link>
          ) : null}
          {showUser ? (
            <button className="register-link nav-button" type="button" onClick={() => void onLogout()}>
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
      {showGuestBar ? (
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
