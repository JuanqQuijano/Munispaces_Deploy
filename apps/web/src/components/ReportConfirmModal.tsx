"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { MapPicker } from "@/components/MapPicker";
import type { LatLng } from "@/lib/maps";

const TIPOS = [
  "Individuo sospechoso",
  "Instalaciones danadas",
  "Ocupacion informal",
  "Falta de mantenimiento",
] as const;

export type ReportDraft = {
  tipo: string;
  descripcion: string;
  urgencia?: "bajo" | "medio" | "alto";
  evidencia_ids?: string[];
  lat?: number | null;
  lng?: number | null;
  direccion?: string;
};

type EvidenceOut = {
  id: string;
  data_url: string;
};

type Props = {
  draft: ReportDraft;
  onClose: () => void;
  onReported: () => void;
};

export function ReportConfirmModal({ draft, onClose, onReported }: Props) {
  const [tipo, setTipo] = useState(draft.tipo || "");
  const [descripcion, setDescripcion] = useState(draft.descripcion || "");
  const [urgencia, setUrgencia] = useState<"bajo" | "medio" | "alto">(draft.urgencia || "medio");
  const [direccion, setDireccion] = useState(draft.direccion || "");
  const [coords, setCoords] = useState<LatLng | null>(
    draft.lat != null && draft.lng != null
      ? { lat: draft.lat, lng: draft.lng, direccion: draft.direccion }
      : null,
  );
  const [photos, setPhotos] = useState<EvidenceOut[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const ids = draft.evidencia_ids || [];
    if (!ids.length) return;
    Promise.all(ids.map((id) => api<EvidenceOut>(`/api/v1/evidencias/${id}`)))
      .then(setPhotos)
      .catch(() => setPhotos([]));
  }, [draft.evidencia_ids]);

  function handleMap(next: LatLng) {
    setCoords(next);
    if (next.direccion) setDireccion(next.direccion);
  }

  async function confirm() {
    setError("");
    if (!TIPOS.includes(tipo as (typeof TIPOS)[number])) {
      setError("Elige un tipo de problema.");
      return;
    }
    if (descripcion.trim().length < 4) {
      setError("Describe el problema con un poco mas de detalle.");
      return;
    }
    if (!accepted) {
      setError("Debes aceptar los terminos de uso de ubicacion.");
      return;
    }
    if (!coords?.lat || !coords?.lng) {
      setError("Marca la ubicacion del reporte en el mapa.");
      return;
    }

    setSubmitting(true);
    try {
      await api("/api/v1/reports", {
        method: "POST",
        body: JSON.stringify({
          tipo,
          urgencia,
          descripcion: descripcion.trim(),
          direccion,
          lat: coords.lat,
          lng: coords.lng,
          evidencia_ids: draft.evidencia_ids || [],
        }),
      });
      setDone(true);
      onReported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el reporte.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay show" role="dialog" aria-modal="true">
      <div className="modal-box reserva-confirm-modal report-confirm-modal">
        {done ? (
          <>
            <h2>¡Gestion realizada!</h2>
            <p className="reserva-confirm-done">Tu reporte quedo registrado.</p>
            <Link className="btn-modal" href="/ciudadano/reportes">
              Ver mis reportes
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
            <div className="reserva-confirm-card">
              <h3>Confirma tu reporte</h3>
              <p className="address">Revisa los datos. Puedes cambiar urgencia y ubicacion antes de enviar.</p>

              <div className="form-field">
                <label htmlFor="tipoReporteChat">Tipo de problema</label>
                <select id="tipoReporteChat" value={tipo} onChange={(event) => setTipo(event.target.value)}>
                  <option value="">Elige un tipo</option>
                  {TIPOS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Nivel de urgencia</label>
                <div className="urgency-buttons">
                  {(["bajo", "medio", "alto"] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      className={`urgency-btn ${level}${urgencia === level ? " selected" : ""}`}
                      onClick={() => setUrgencia(level)}
                    >
                      {level === "bajo" ? "Bajo" : level === "medio" ? "Medio" : "Alto"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="descReporteChat">Descripcion</label>
                <textarea
                  id="descReporteChat"
                  value={descripcion}
                  onChange={(event) => setDescripcion(event.target.value)}
                  minLength={8}
                />
              </div>

              {photos.length ? (
                <div className="report-confirm-thumbs">
                  {photos.map((photo) => (
                    <img key={photo.id} src={photo.data_url} alt="Evidencia adjunta" />
                  ))}
                </div>
              ) : null}

              <div className="form-field">
                <label>Ubicacion</label>
                <div className="reporte-map-picker">
                  <MapPicker value={coords} onChange={handleMap} />
                </div>
              </div>

              <label className="checkbox-row reserva-terms" htmlFor="terminosReporteChat">
                <input
                  id="terminosReporteChat"
                  type="checkbox"
                  checked={accepted}
                  onChange={(event) => setAccepted(event.target.checked)}
                />
                <span>Acepto los terminos de uso de mi ubicacion actual</span>
              </label>
              {error ? <p className="flash">{error}</p> : null}
              <button className="btn-confirm" type="button" onClick={confirm} disabled={submitting}>
                {submitting ? "Enviando..." : "Confirma tu reporte"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
