"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { AdminRecentReports } from "@/components/AdminRecentReports";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatReservationDay } from "@/lib/format";
import type { Report, Reservation } from "@/lib/types";

export default function AdminHome() {
  const { user } = useAuth();
  const [reservas, setReservas] = useState<Reservation[]>([]);
  const [reportes, setReportes] = useState<Report[]>([]);
  const [page, setPage] = useState(0);
  const pageSize = 3;

  useEffect(() => {
    api<Reservation[]>("/api/v1/reservations").then(setReservas).catch(() => setReservas([]));
    api<Report[]>("/api/v1/reports").then(setReportes).catch(() => setReportes([]));
  }, []);

  const activas = reservas.filter((row) => row.estado !== "cancelada" && row.estado !== "tramitada");
  const reportesActivos = reportes.filter((row) => row.estado !== "resuelto");
  const totalPages = Math.max(1, Math.ceil(activas.length / pageSize));
  const slice = activas.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <AdminShell>
      <div className="dashboard-grid">
        <div>
          <h1 className="page-title">Panel administrador</h1>
          <p className="page-subtitle">
            {user?.espacio_nombre || "Tu espacio"} — reservas y reportes de tu jurisdiccion
          </p>

          <div className="admin-stats">
            <div className="admin-stat green">
              <small>Reservas actuales</small>
              <span>{activas.length}</span>
            </div>
            <div className="admin-stat pink">
              <small>Reportes actuales</small>
              <span>{reportesActivos.length}</span>
            </div>
          </div>

          <div className="admin-section">
            <h2>Reservas recientes</h2>
            {slice.length === 0 ? <p className="admin-empty">No hay reservas activas.</p> : null}
            {slice.map((row) => (
              <article key={row.id} className="admin-reserva-card">
                <img src={row.espacio_imagen || "/images/parque-default.jpg"} alt="" />
                <div className="admin-reserva-fecha">
                  <span className="admin-reserva-dia">{formatReservationDay(row.fecha)}</span>
                  <span className="admin-reserva-hora">{row.hora_texto}</span>
                </div>
                <div className="admin-reserva-info">
                  <h3>{row.espacio_nombre}</h3>
                  <p>{row.espacio_distrito}</p>
                </div>
                <div className="admin-reserva-acciones">
                  <span className={`status-badge ${row.estado}`}>{row.estado}</span>
                  <Link
                    className="btn-tramitar"
                    href={`/administrador/tramitar?payload=${encodeURIComponent(row.qr_payload)}`}
                  >
                    Tramitar
                  </Link>
                </div>
              </article>
            ))}
            {activas.length > pageSize ? (
              <div className="admin-pagination">
                <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  ←
                </button>
                <span>
                  {page + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  →
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <aside>
          <AdminRecentReports reports={reportes} />
        </aside>
      </div>
    </AdminShell>
  );
}
