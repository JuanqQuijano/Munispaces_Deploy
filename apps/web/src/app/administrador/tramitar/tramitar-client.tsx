"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";
import type { Reservation } from "@/lib/types";

export default function TramitarClient() {
  const search = useSearchParams();
  const [payload, setPayload] = useState("");
  const [result, setResult] = useState<Reservation | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Preparando camara...");
  const scanner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initial = search.get("payload");
    if (initial) setPayload(initial);
  }, [search]);

  useEffect(() => {
    let control: { stop: () => Promise<void> } | null = null;
    async function start() {
      if (!scanner.current) return;
      const { Html5Qrcode } = await import("html5-qrcode");
      const camera = new Html5Qrcode(scanner.current.id);
      control = camera;
      try {
        await camera.start(
          { facingMode: "environment" },
          { fps: 8, qrbox: 220 },
          (decoded) => {
            setPayload(decoded);
            setStatus("QR leido. Confirma para tramitar.");
          },
          () => undefined,
        );
        setStatus("Apunta la camara al QR del ciudadano.");
      } catch {
        setStatus("Camara no disponible. Pega el codigo del QR manualmente.");
      }
    }
    start();
    return () => {
      control?.stop().catch(() => undefined);
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const data = await api<Reservation>("/api/v1/reservations/tramitar", {
        method: "POST",
        body: JSON.stringify({ payload }),
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo tramitar.");
    }
  }

  return (
    <AdminShell>
      <div className="tramitar-main">
        <section className="tramitar-panel">
          <h1 className="page-title">Tramitar reserva</h1>
          <p className="page-subtitle">Escanea el codigo QR del ciudadano para validar el ingreso</p>

          {result ? (
            <div className="tramitar-exito">
              <h2>Reserva tramitada</h2>
              <p>
                {result.public_id} de {result.espacio_nombre} ahora esta {result.estado}.
              </p>
              <div className="tramitar-acciones">
                <Link className="btn" href="/administrador">
                  Volver al panel
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="tramitar-resumen">
                <strong>Escaneo QR</strong>
                Apunta la camara al codigo QR del ciudadano, o pegalo abajo si ya lo tienes.
              </div>
              <div id="qr-reader" ref={scanner} className="tramitar-reader" />
              <p className={`tramitar-estado ${error ? "error" : ""}`}>{error || status}</p>
              <form className="form" onSubmit={onSubmit}>
                <label>
                  Codigo del QR
                  <input
                    value={payload}
                    onChange={(event) => setPayload(event.target.value)}
                    placeholder="MUNISPACES:RES:..."
                    required
                  />
                </label>
                <div className="tramitar-acciones">
                  <Link className="btn ghost" href="/administrador">
                    Cancelar
                  </Link>
                  <button className="btn" type="submit">
                    Marcar tramitada
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
