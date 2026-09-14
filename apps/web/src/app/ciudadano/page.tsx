"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CitizenShell } from "@/components/CitizenShell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Report, Reservation } from "@/lib/types";

export default function CitizenHome() {
  const { user } = useAuth();
  const [reservasActivas, setReservasActivas] = useState(0);
  const [reportesActivos, setReportesActivos] = useState(0);

  useEffect(() => {
    api<Reservation[]>("/api/v1/reservations")
      .then((rows) => setReservasActivas(rows.filter((row) => row.estado !== "culminada" && row.estado !== "cancelada").length))
      .catch(() => setReservasActivas(0));
    api<Report[]>("/api/v1/reports")
      .then((rows) => setReportesActivos(rows.filter((row) => row.estado !== "resuelto").length))
      .catch(() => setReportesActivos(0));
  }, []);

  return (
    <CitizenShell>
      <h1 className="dashboard-welcome">¡Bienvenido, {user?.nombre}!</h1>

      <div className="dashboard-actions">
        <Link className="action-card blue" href="/ciudadano/espacios">
          <img className="action-card-image" src="/images/fotoreserva01.jpg" alt="Reservar espacio" />
          <div className="action-card-body">
            <h2>Reserva un espacio</h2>
            <p>Encuentra y reserva losas deportivas, centros culturales y mas!</p>
            <span className="action-link">Comenzar reserva →</span>
          </div>
        </Link>

        <Link className="action-card pink" href="/ciudadano/reportes/nuevo">
          <img
            className="action-card-image"
            src="/images/imgreporteciudadano1.png"
            alt="Reportar incidencia"
          />
          <div className="action-card-body">
            <h2>Reporta incidencias</h2>
            <p>Informa sobre irregularidades, desperfectos y urgencias</p>
            <span className="action-link">Envia un reporte →</span>
          </div>
        </Link>
      </div>

      <div className="dashboard-stats">
        <div className="dashboard-stat">
          <small>Reservas actuales</small>
          <span>{reservasActivas}</span>
        </div>
        <div className="dashboard-stat pink-stat">
          <small>Reportes actuales</small>
          <span>{reportesActivos}</span>
        </div>
      </div>
    </CitizenShell>
  );
}
