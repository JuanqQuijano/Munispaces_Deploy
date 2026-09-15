"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { CitizenShell } from "@/components/CitizenShell";
import { ReadOnlyMap } from "@/components/ReportsMap";
import { api } from "@/lib/api";
import { formatReservationDay } from "@/lib/format";
import type { Reservation } from "@/lib/types";

function canShowQr(estado: string) {
  return estado !== "tramitada" && estado !== "culminada";
}

function statusLabel(estado: string) {
  if (estado === "confirmada") return "Confirmada";
  if (estado === "pendiente") return "Pendiente";
  if (estado === "tramitada") return "Tramitada";
  if (estado === "culminada") return "Culminada";
  return estado;
}

export default function MyReservationsPage() {
  const [rows, setRows] = useState<Reservation[]>([]);
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [qr, setQr] = useState<Reservation | null>(null);

  useEffect(() => {
    api<Reservation[]>("/api/v1/reservations")
      .then((data) => {
        setRows(data);
        setSelected(data[0] || null);
      })
      .catch(() => {
        setRows([]);
        setSelected(null);
      });
  }, []);

  const activas = useMemo(
    () => rows.filter((row) => row.estado !== "culminada").length,
    [rows],
  );
  const historial = useMemo(() => rows.filter((row) => row.estado === "culminada").length, [rows]);
  const proxima = useMemo(() => {
    const candidates = rows
      .filter((row) => row.estado === "confirmada" || row.estado === "pendiente")
      .slice()
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
    return candidates[0] || null;
  }, [rows]);

  return (
    <CitizenShell>
      <div className="dashboard-grid">
        <section>
          <h1 className="page-title">Mis reservas</h1>
          <p className="page-subtitle">Toca una reserva activa para mostrar tu codigo QR al llegar</p>

          <div className="reservation-list">
            {rows.length === 0 ? (
              <p className="empty-hint">Aun no tienes reservas. Explora espacios y agenda tu primera visita.</p>
            ) : (
              rows.map((row) => (
                <article
                  key={row.id}
                  className={
                    selected?.id === row.id
                      ? "reservation-card reservation-card-clickable selected"
                      : "reservation-card reservation-card-clickable"
                  }
                  onClick={() => setSelected(row)}
                >
                  <div className="reservation-card-media">
                    <img src={row.espacio_imagen || "/images/ParqueElOlivar.png"} alt={row.espacio_nombre} />
                    {canShowQr(row.estado) ? (
                      <button
                        type="button"
                        className="btn-ver-qr-reserva"
                        onClick={(event) => {
                          event.stopPropagation();
                          setQr(row);
                        }}
                      >
                        Ver QR
                      </button>
                    ) : null}
                  </div>
                  <div className="reservation-card-info">
                    <h3>{row.espacio_nombre}</h3>
                    <p>
                      {row.espacio_nombre}
                      <br />
                      {row.espacio_distrito}
                    </p>
                  </div>
                  <p className="reserva-when">
                    <span className="reserva-when-label">Fecha y hora:</span>
                    <span className="reserva-when-dia">{formatReservationDay(row.fecha)}</span>
                    <span className="reserva-when-hora">{row.hora_texto}</span>
                  </p>
                  <span className={`status-badge ${row.estado}`}>{statusLabel(row.estado)}</span>
                </article>
              ))
            )}
          </div>
        </section>

        <aside>
          <div className="top-actions">
            <Link className="btn-action" href="/ciudadano/espacios">
              Nueva reserva
            </Link>
          </div>

          <div className="summary-panel">
            <h3>RESUMEN</h3>
            <div className="summary-stats">
              <div className="stat-box">
                <small>Reservas actuales</small>
                <span>{activas}</span>
              </div>
              <div className="stat-box">
                <small>Historial</small>
                <span>{historial}</span>
              </div>
            </div>
            <p className="summary-note">
              {proxima ? (
                <>
                  Tu proxima reserva es el
                  <br />
                  <strong className="reserva-when-dia">{formatReservationDay(proxima.fecha)}</strong>
                  <br />
                  <span className="reserva-when-hora">{proxima.hora_texto}</span>
                </>
              ) : (
                "Aun no tienes reservas programadas."
              )}
            </p>
          </div>

          <div className="summary-panel" style={{ marginTop: 20 }}>
            <h3>Mapa</h3>
            {selected?.lat != null && selected?.lng != null ? (
              <>
                <p className="summary-note map-detail-text">
                  {selected.espacio_nombre}
                  <br />
                  {selected.espacio_direccion}
                </p>
                <div className="map-box map-readonly">
                  <ReadOnlyMap lat={selected.lat} lng={selected.lng} title={selected.espacio_nombre} />
                </div>
              </>
            ) : (
              <p className="summary-note">Toca una reserva para ver la ubicacion del parque.</p>
            )}
          </div>
        </aside>
      </div>

      {qr ? (
        <div className="modal-overlay show" role="dialog" aria-modal="true">
          <div className="modal-box qr-reserva-modal">
            <h2>Acceso a tu reserva</h2>
            <p className="qr-reserva-info">
              {qr.espacio_nombre}
              <br />
              <span className="reserva-when-dia">{formatReservationDay(qr.fecha)}</span>
              <br />
              <span className="reserva-when-hora">{qr.hora_texto}</span>
            </p>
            <div className="qr-reserva-canvas-wrap">
              <QRCodeSVG value={qr.qr_payload} size={200} />
            </div>
            <p className="qr-reserva-hint">Muestra este codigo al administrador al llegar al espacio.</p>
            <button type="button" className="btn-modal" onClick={() => setQr(null)}>
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
    </CitizenShell>
  );
}
