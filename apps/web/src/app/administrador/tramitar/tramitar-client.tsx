"use client";

import { useEffect, useRef, useState } from "react";
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
  const [submitting, setSubmitting] = useState(false);
  const scanner = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<{ stop: () => Promise<void> } | null>(null);

  async function tramitar(code: string) {
    if (!code.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const data = await api<Reservation>("/api/v1/reservations/tramitar", {
        method: "POST",
        body: JSON.stringify({ payload: code }),
      });
      await cameraRef.current?.stop().catch(() => undefined);
      cameraRef.current = null;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo tramitar.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    const initial = search.get("payload");
    if (initial) {
      setPayload(initial);
      setStatus("Codigo listo. Confirma para tramitar.");
    }
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      if (!scanner.current) return;
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled || !scanner.current) return;
      const camera = new Html5Qrcode(scanner.current.id);
      cameraRef.current = camera;
      try {
        await camera.start(
          { facingMode: "environment" },
          { fps: 8, qrbox: 220 },
          (decoded) => {
            setPayload(decoded);
            setStatus("QR leido. Confirma para tramitar.");
            camera.stop().catch(() => undefined);
            cameraRef.current = null;
          },
          () => undefined,
        );
        if (!cancelled) setStatus("Apunta la camara al QR del ciudadano.");
      } catch {
        if (!cancelled) {
          setStatus("No se pudo abrir la camara. Usa un dispositivo con camara para escanear el QR.");
        }
      }
    }
    start();
    return () => {
      cancelled = true;
      cameraRef.current?.stop().catch(() => undefined);
      cameraRef.current = null;
    };
  }, []);

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
                Apunta la camara al codigo QR que muestra el ciudadano.
              </div>
              <div id="qr-reader" ref={scanner} className="tramitar-reader" />
              <p className={`tramitar-estado ${error ? "error" : ""}`}>{error || status}</p>
              <div className="tramitar-acciones">
                <Link className="btn ghost" href="/administrador">
                  Cancelar
                </Link>
                <button
                  className="btn"
                  type="button"
                  disabled={!payload || submitting}
                  onClick={() => tramitar(payload)}
                >
                  {submitting ? "Tramitando..." : "Marcar tramitada"}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
