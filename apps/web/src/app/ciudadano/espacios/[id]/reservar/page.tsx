"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { LocationMap } from "@/components/LocationMap";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { api } from "@/lib/api";
import { MONTHS, formatDate } from "@/lib/format";
import type { AvailabilitySlot, Reservation, Space } from "@/lib/types";

const DIAS_MAX = 7;
const DIAS_VISIBLES = 4;
const DIAS_CORTO = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

function toIsoLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(base.getDate() + days);
  return next;
}

function bookableDays() {
  const today = startOfToday();
  return Array.from({ length: DIAS_MAX }, (_, index) => addDays(today, index));
}

function minutesToLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? "pm" : "am";
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")} ${period}`;
}

function slotRangeLabel(slots: number[]) {
  if (!slots.length) return "Selecciona un horario";
  const ordered = [...slots].sort((a, b) => a - b);
  return `${minutesToLabel(ordered[0])} - ${minutesToLabel(ordered[ordered.length - 1] + 60)}`;
}

function areConsecutive(slots: number[]) {
  if (!slots.length) return false;
  const ordered = [...slots].sort((a, b) => a - b);
  return ordered.every((slot, index) => index === 0 || slot === ordered[index - 1] + 60);
}

export default function ReservePage() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const days = useMemo(() => bookableDays(), []);
  const initialFecha = search.get("fecha") || toIsoLocal(days[0]);

  const [space, setSpace] = useState<Space | null>(null);
  const [fecha, setFecha] = useState(initialFecha);
  const [ventana, setVentana] = useState(() => {
    const index = days.findIndex((day) => toIsoLocal(day) === initialFecha);
    if (index < 0) return 0;
    return Math.min(Math.max(0, index - (index % DIAS_VISIBLES)), DIAS_MAX - DIAS_VISIBLES);
  });
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api<Space>(`/api/v1/spaces/${id}`).then(setSpace).catch(() => setSpace(null));
  }, [id]);

  useEffect(() => {
    if (!id || !fecha) return;
    api<{ slots: AvailabilitySlot[] }>(`/api/v1/spaces/${id}/availability?fecha=${fecha}`)
      .then((data) => {
        setSlots(data.slots);
        setSelected([]);
      })
      .catch(() => {
        setSlots([]);
        setSelected([]);
      });
  }, [id, fecha]);

  const visibles = days.slice(ventana, ventana + DIAS_VISIBLES);
  const selectedDate = days.find((day) => toIsoLocal(day) === fecha) || days[0];
  const monthLabel = `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  const costo = space ? space.precio_aplicable * selected.length : 0;
  const maxVentana = DIAS_MAX - DIAS_VISIBLES;

  function selectFecha(value: string) {
    setFecha(value);
    setSelected([]);
  }

  function toggle(minutos: number) {
    setSelected((current) => {
      if (current.includes(minutos)) {
        return current.filter((item) => item !== minutos).sort((a, b) => a - b);
      }
      return [...current, minutos].sort((a, b) => a - b);
    });
  }

  async function reservar() {
    setError("");
    if (!accepted) {
      setError("Debes aceptar los terminos de uso.");
      return;
    }
    if (!selected.length) {
      setError("Selecciona al menos un horario.");
      return;
    }
    if (!areConsecutive(selected)) {
      setError("Los horarios seleccionados deben ser consecutivos.");
      return;
    }
    if (!space?.disponible) {
      setError("Este espacio no admite reservas por ahora.");
      return;
    }

    setSubmitting(true);
    try {
      await api<Reservation>("/api/v1/reservations", {
        method: "POST",
        body: JSON.stringify({ space_id: id, fecha, slots: selected }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reservar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthGuard role="ciudadano">
      <div className="page-shell">
        <SiteHeader />
        <main>
          <div className="reserva-intro">
            <h1 className="page-title reserva-page-title">
              Completa tu reserva o reporta un problema en la zona
            </h1>
            <p className="page-subtitle">Revisa detalles, selecciona horarios y haz tu reserva</p>
          </div>

          <div className="reserva-layout">
            <section className="reserva-panel">
              <h2>Selecciona fecha y horario</h2>
              <p className="time-hint">Puedes elegir varias horas consecutivas en el mismo dia</p>

              <div className="date-nav">
                <span>{monthLabel}</span>
                <div className="date-nav-arrows">
                  <button type="button" aria-label="Ver fechas anteriores" disabled={ventana <= 0} onClick={() => setVentana((v) => Math.max(0, v - DIAS_VISIBLES))}>
                    ←
                  </button>
                  <button
                    type="button"
                    aria-label="Ver fechas siguientes"
                    disabled={ventana >= maxVentana}
                    onClick={() => setVentana((v) => Math.min(maxVentana, v + DIAS_VISIBLES))}
                  >
                    →
                  </button>
                </div>
              </div>

              <div className="date-cards">
                {visibles.map((day) => {
                  const value = toIsoLocal(day);
                  return (
                    <button
                      key={value}
                      type="button"
                      className={fecha === value ? "date-card selected" : "date-card"}
                      onClick={() => selectFecha(value)}
                    >
                      <span>{DIAS_CORTO[day.getDay()]}</span>
                      <strong>{day.getDate()}</strong>
                    </button>
                  );
                })}
              </div>

              <h2>Horario</h2>
              <div className="reserva-time-grid">
                {slots.map((slot) => {
                  const ocupado = slot.ocupado || !space?.disponible;
                  const isSelected = selected.includes(slot.minutos);
                  return (
                    <button
                      key={slot.minutos}
                      type="button"
                      className={[
                        "time-slot",
                        isSelected ? "selected" : "",
                        ocupado ? "unavailable" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      disabled={ocupado}
                      onClick={() => toggle(slot.minutos)}
                    >
                      {minutesToLabel(slot.minutos)}
                    </button>
                  );
                })}
              </div>

              {space ? (
                <LocationMap
                  lat={space.lat}
                  lng={space.lng}
                  title={space.nombre}
                  height={280}
                />
              ) : null}
            </section>

            <aside className="reserva-summary">
              {space ? <img src={space.imagen} alt={space.nombre} /> : null}
              <h3>
                <span>{space?.nombre || "Espacio"}</span>
                <span className="rating">{space?.rating ?? "—"}</span>
              </h3>
              <p className="address">{space?.direccion}</p>
              <div className="reserva-details">
                <p>Fecha: {formatDate(fecha)}</p>
                <p>Hora: {slotRangeLabel(selected)}</p>
                <p>
                  Duracion:{" "}
                  {selected.length
                    ? `${selected.length} hora${selected.length === 1 ? "" : "s"}`
                    : "—"}
                </p>
                {space?.es_residente ? (
                  <p className="reserva-tarifa-nota">Tarifa residente: S/ {space.precio_aplicable} / hora</p>
                ) : space ? (
                  <p className="reserva-tarifa-nota">Tarifa: S/ {space.precio_aplicable} / hora</p>
                ) : null}
              </div>
              <div className="cost-box">
                <span>Costo total</span>
                <span>{costo} s/</span>
              </div>
              <label className="checkbox-row reserva-terms" htmlFor="terminosReserva">
                <input
                  id="terminosReserva"
                  type="checkbox"
                  checked={accepted}
                  onChange={(event) => setAccepted(event.target.checked)}
                />
                <span>
                  Acepto los terminos de uso de espacios publicos de la municipalidad y entiendo la
                  politica de cancelacion de servicio
                </span>
              </label>
              {error ? <p className="flash">{error}</p> : null}
              <button className="btn-confirm" type="button" onClick={reservar} disabled={submitting || !space?.disponible}>
                {submitting ? "Confirmando..." : "Confirma tu reserva"}
              </button>
            </aside>
          </div>
        </main>
        <SiteFooter />

        {done ? (
          <div className="modal-overlay show" role="dialog" aria-modal="true">
            <div className="modal-box">
              <h2>¡Gestion realizada!</h2>
              <Link className="btn-modal" href="/ciudadano/reservas">
                Ver mis reservas
              </Link>
              <button className="btn ghost" type="button" style={{ marginTop: 12 }} onClick={() => router.push("/ciudadano/espacios")}>
                Seguir explorando
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </AuthGuard>
  );
}
