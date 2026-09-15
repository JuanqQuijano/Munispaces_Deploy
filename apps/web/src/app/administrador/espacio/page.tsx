"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { MONTHS } from "@/lib/format";
import type { Observation, Report, Reservation, Space } from "@/lib/types";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

export default function ManageSpacePage() {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [spaceId, setSpaceId] = useState("");
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState<Observation[]>([]);
  const [reservas, setReservas] = useState<Reservation[]>([]);
  const [reportes, setReportes] = useState<Report[]>([]);
  const [texto, setTexto] = useState("");

  useEffect(() => {
    api<Space[]>("/api/v1/spaces")
      .then((rows) => {
        setSpaces(rows);
        const assigned = rows.find((row) => row.id === user?.espacio_id) || rows[0];
        if (assigned) setSpaceId(assigned.id);
      })
      .catch(() => setSpaces([]));
    api<Reservation[]>("/api/v1/reservations").then(setReservas).catch(() => setReservas([]));
    api<Report[]>("/api/v1/reports").then(setReportes).catch(() => setReportes([]));
  }, [user?.espacio_id]);

  useEffect(() => {
    if (!spaceId) return;
    api<Observation[]>(`/api/v1/observations?space_id=${spaceId}&fecha=${selected}`)
      .then(setNotes)
      .catch(() => setNotes([]));
  }, [spaceId, selected]);

  const days = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = (new Date(year, month, 1).getDay() + 6) % 7;
    const total = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = Array.from({ length: first }, () => null);
    for (let day = 1; day <= total; day += 1) {
      const value = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push(value);
    }
    return cells;
  }, [cursor]);

  const reservedDates = useMemo(() => {
    const set = new Set<string>();
    for (const row of reservas) {
      if (row.space_id === spaceId && row.estado !== "cancelada") set.add(row.fecha);
    }
    return set;
  }, [reservas, spaceId]);

  const reportDates = useMemo(() => {
    const set = new Set<string>();
    for (const row of reportes) {
      if (row.estado === "resuelto") continue;
      set.add(row.created_at.slice(0, 10));
    }
    return set;
  }, [reportes]);

  async function addNote(event: FormEvent) {
    event.preventDefault();
    if (!texto.trim() || !spaceId) return;
    await api("/api/v1/observations", {
      method: "POST",
      body: JSON.stringify({ space_id: spaceId, fecha: selected, texto }),
    });
    setTexto("");
    setNotes(await api<Observation[]>(`/api/v1/observations?space_id=${spaceId}&fecha=${selected}`));
  }

  const booked = reservas.filter((row) => row.space_id === spaceId && row.fecha === selected);
  const dayReports = reportes.filter((row) => row.created_at.slice(0, 10) === selected);

  function dayClass(day: string) {
    const hasRes = reservedDates.has(day);
    const hasRep = reportDates.has(day);
    const parts = ["admin-cal-day"];
    if (hasRes && hasRep) parts.push("mixto");
    else if (hasRes) parts.push("ocupado");
    else if (hasRep) parts.push("con-reportes");
    else parts.push("libre");
    if (day === selected) parts.push("selected");
    return parts.join(" ");
  }

  return (
    <AdminShell>
      <h1 className="page-title">Gestionar espacio</h1>
      <p className="page-subtitle">
        {spaces.find((row) => row.id === spaceId)?.nombre || user?.espacio_nombre || "Tu espacio"} — reservas y
        reportes por dia
      </p>

      <div className="admin-calendario-wrap">
        <div className="admin-calendario-header">
          <span>
            {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
          </span>
          <div className="admin-cal-nav">
            <button
              type="button"
              aria-label="Mes anterior"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Mes siguiente"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            >
              →
            </button>
          </div>
        </div>

        <div className="admin-cal-weekdays">
          {WEEKDAYS.map((label, index) => (
            <span key={`${label}-${index}`}>{label}</span>
          ))}
        </div>

        <div className="admin-calendario-grid">
          {days.map((day, index) =>
            day ? (
              <button key={day} type="button" className={dayClass(day)} onClick={() => setSelected(day)}>
                {Number(day.slice(-2))}
              </button>
            ) : (
              <span key={`empty-${index}`} className="admin-cal-day empty" />
            ),
          )}
        </div>

        <div className="admin-calendario-detalle">
          <strong>Dia {selected}</strong>
          <div className="admin-cal-detalle-seccion">
            <strong>Reservas ({booked.length})</strong>
            {booked.length === 0 ? <p>Sin reservas este dia.</p> : null}
            {booked.map((row) => (
              <p key={row.id}>
                {row.hora_texto} · {row.estado}
              </p>
            ))}
          </div>
          <div className="admin-cal-detalle-seccion">
            <strong>Reportes ({dayReports.length})</strong>
            {dayReports.length === 0 ? <p>Sin reportes este dia.</p> : null}
            {dayReports.map((row) => (
              <p key={row.id}>
                {row.public_id} · {row.tipo} · {row.urgencia}
              </p>
            ))}
          </div>
        </div>

        <form className="admin-observaciones" onSubmit={addNote}>
          <div className="admin-observaciones-header">
            <h2>Agregar observacion</h2>
            <span>{selected}</span>
          </div>
          <textarea
            rows={3}
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
            placeholder="Escribe una nota para este dia..."
          />
          <button type="submit">Guardar observacion</button>
          <div className="observaciones-lista">
            {notes.map((note) => (
              <div key={note.id} className="observacion-item">
                <strong>{note.autor}</strong>
                <p>{note.texto}</p>
              </div>
            ))}
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
