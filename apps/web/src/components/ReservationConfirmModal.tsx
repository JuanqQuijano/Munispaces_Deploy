"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Reservation, Space } from "@/lib/types";

export type ReservationDraft = {
  spaceId: string;
  fecha: string;
  inicio?: string;
  fin?: string;
  code?: string;
};

function parseTimeLabel(text: string): number | null {
  const raw = text.trim().toLowerCase().replace(/\./g, "");
  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
  if (!match) return null;
  let hours = Number(match[1]);
  const mins = Number(match[2]);
  const period = match[3];
  if (Number.isNaN(hours) || Number.isNaN(mins)) return null;
  if (period === "pm" && hours !== 12) hours += 12;
  if (period === "am" && hours === 12) hours = 0;
  return hours * 60 + mins;
}

function minutesToLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? "pm" : "am";
  const hour12 = hours % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${String(mins).padStart(2, "0")} ${period}`;
}

function slotsFromRange(inicio?: string, fin?: string): number[] {
  if (!inicio) return [];
  const start = parseTimeLabel(inicio);
  if (start == null) return [];
  const end = fin ? parseTimeLabel(fin) : start + 60;
  if (end == null || end <= start) return [start];
  const slots: number[] = [];
  for (let minute = start; minute < end; minute += 60) {
    slots.push(minute);
  }
  return slots;
}

function slotRangeLabel(slots: number[]) {
  if (!slots.length) return "Selecciona un horario";
  const ordered = [...slots].sort((a, b) => a - b);
  return `${minutesToLabel(ordered[0])} - ${minutesToLabel(ordered[ordered.length - 1] + 60)}`;
}

export function parseReservationUrl(url: string): ReservationDraft | null {
  try {
    const parsed = new URL(url, "http://local");
    const match = parsed.pathname.match(/^\/ciudadano\/espacios\/([0-9a-fA-F-]{36})\/reservar$/);
    if (!match) return null;
    return {
      spaceId: match[1],
      fecha: parsed.searchParams.get("fecha") || new Date().toISOString().slice(0, 10),
      inicio: parsed.searchParams.get("inicio") || undefined,
      fin: parsed.searchParams.get("fin") || undefined,
      code: parsed.searchParams.get("code") || undefined,
    };
  } catch {
    return null;
  }
}

type Props = {
  draft: ReservationDraft;
  onClose: () => void;
  onBooked: () => void;
};

export function ReservationConfirmModal({ draft, onClose, onBooked }: Props) {
  const [space, setSpace] = useState<Space | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);

  const slots = useMemo(() => slotsFromRange(draft.inicio, draft.fin), [draft.inicio, draft.fin]);
  const costo = space ? space.precio_aplicable * Math.max(slots.length, 0) : 0;
  const horaLabel = slotRangeLabel(slots);
  const duracionLabel = slots.length
    ? `${slots.length} hora${slots.length === 1 ? "" : "s"}`
    : "—";

  useEffect(() => {
    setLoading(true);
    api<Space>(`/api/v1/spaces/${draft.spaceId}`)
      .then(setSpace)
      .catch(() => setSpace(null))
      .finally(() => setLoading(false));
  }, [draft.spaceId]);

  async function confirm() {
    setError("");
    if (!accepted) {
      setError("Debes aceptar los terminos de uso.");
      return;
    }
    if (!slots.length) {
      setError("Falta el horario de la reserva. Vuelve a pedirlo al asistente.");
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
        body: JSON.stringify({
          space_id: draft.spaceId,
          fecha: draft.fecha,
          slots,
        }),
      });
      setDone(true);
      onBooked();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo confirmar la reserva.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay show" role="dialog" aria-modal="true">
      <div className="modal-box reserva-confirm-modal">
        {done ? (
          <>
            <h2>¡Gestion realizada!</h2>
            <p className="reserva-confirm-done">Tu reserva quedo registrada.</p>
            <Link className="btn-modal" href="/ciudadano/reservas">
              Ver mis reservas
            </Link>
            <button type="button" className="btn-modal ghost" onClick={onClose}>
              Seguir con el asistente
            </button>
          </>
        ) : (
          <>
            <button type="button" className="reserva-confirm-close" onClick={onClose} aria-label="Cerrar">
              ×
            </button>
            {loading || !space ? (
              <p className="empty-hint">{loading ? "Cargando resumen..." : "No se encontro el espacio."}</p>
            ) : (
              <div className="reserva-confirm-card">
                <img src={space.imagen} alt={space.nombre} />
                <h3>
                  <span>{space.nombre}</span>
                  <span className="rating">{space.rating}</span>
                </h3>
                <p className="address">{space.direccion}</p>
                <div className="reserva-details">
                  <p>
                    Fecha: <strong>{formatDate(draft.fecha)}</strong>
                  </p>
                  <p>
                    Hora: <strong>{horaLabel}</strong>
                  </p>
                  <p>
                    Duracion: <strong>{duracionLabel}</strong>
                  </p>
                  {space.es_residente ? (
                    <p className="reserva-tarifa-nota">
                      Tarifa residente: S/ {space.precio_aplicable} / hora
                    </p>
                  ) : (
                    <p className="reserva-tarifa-nota">Tarifa: S/ {space.precio_aplicable} / hora</p>
                  )}
                </div>
                <div className="cost-box">
                  <span>Costo total</span>
                  <span>{costo} s/</span>
                </div>
                <label className="checkbox-row reserva-terms" htmlFor="terminosReservaChat">
                  <input
                    id="terminosReservaChat"
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
                <button
                  className="btn-confirm"
                  type="button"
                  onClick={confirm}
                  disabled={submitting || !space.disponible || !slots.length}
                >
                  {submitting ? "Confirmando..." : "Confirma tu reserva"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
