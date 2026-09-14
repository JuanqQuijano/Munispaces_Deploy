"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { User } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const data = await api<{ user: User }>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });
      await refresh();
      const next = new URLSearchParams(window.location.search).get("next");
      if (next && next.startsWith("/")) {
        router.push(next);
        return;
      }
      router.push(data.user.role === "admin" ? "/administrador" : "/ciudadano");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo ingresar.");
    }
  }

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="auth-layout">
        <section>
          <h1>Iniciar sesion</h1>
          <p className="lede">Es bueno tenerte de vuelta!</p>
          <div className="secure-box">
            <h3>PROCESO SEGURO</h3>
            <p>Su informacion esta cifrada y solo se utilizara para validacion institucional.</p>
          </div>
        </section>
        <form className="auth-card form" onSubmit={onSubmit}>
          <label>
            Usuario
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="DNI o Admin01"
              required
            />
          </label>
          <label>
            Contrasena
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Ingrese su contrasena"
              required
            />
          </label>
          {error ? <p className="flash">{error}</p> : null}
          <button className="btn" type="submit">
            Continuar →
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
