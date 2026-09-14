"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CitizenShell } from "@/components/CitizenShell";
import { MapPicker } from "@/components/MapPicker";
import { api } from "@/lib/api";
import type { LatLng } from "@/lib/maps";

const TIPOS = [
  "Individuo sospechoso",
  "Instalaciones danadas",
  "Ocupacion informal",
  "Falta de mantenimiento",
];

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });
}

async function compressImage(file: File) {
  const raw = await readAsDataUrl(file);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Imagen invalida."));
    img.src = raw;
  });
  const maxSide = 900;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return raw;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

export default function NewReportPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tipo, setTipo] = useState("");
  const [urgencia, setUrgencia] = useState<"bajo" | "medio" | "alto">("medio");
  const [descripcion, setDescripcion] = useState("");
  const [direccion, setDireccion] = useState("");
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [fotos, setFotos] = useState<string[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function handleMap(next: LatLng) {
    setCoords(next);
    if (next.direccion) setDireccion(next.direccion);
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const next = [...fotos];
    for (const file of Array.from(files).slice(0, 2 - next.length)) {
      if (!file.type.startsWith("image/")) continue;
      next.push(await compressImage(file));
    }
    setFotos(next.slice(0, 2));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!tipo) {
      setError("Elige un tipo de problema.");
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
          descripcion,
          direccion,
          lat: coords.lat,
          lng: coords.lng,
          fotos,
        }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el reporte.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CitizenShell>
      <div className="reserva-intro">
        <h1 className="page-title">Nuevo reporte ciudadano</h1>
        <p className="page-subtitle">
          Reporta incidencias, individuos problematicos e infraestructura danada al instante.
        </p>
      </div>

      <form className="reporte-layout" onSubmit={onSubmit}>
        <section>
          <div className="reporte-panel">
            <h2>Detalles del problema</h2>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="tipoProblema">Tipo de problema</label>
                <select id="tipoProblema" value={tipo} onChange={(event) => setTipo(event.target.value)} required>
                  <option value="">Elige un tipo de problema</option>
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
                <label htmlFor="descripcion">Descripcion detallada</label>
                <textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(event) => setDescripcion(event.target.value)}
                  placeholder="Describe lo ocurrido con el mayor detalle posible"
                  required
                  minLength={8}
                />
              </div>
            </div>
          </div>

          <div className="reporte-panel">
            <h2>Evidencia visual</h2>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              hidden
              onChange={(event) => onFiles(event.target.files)}
            />
            <div
              className="upload-area"
              role="button"
              tabIndex={0}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") fileRef.current?.click();
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.currentTarget.classList.add("drag-over");
              }}
              onDragLeave={(event) => event.currentTarget.classList.remove("drag-over")}
              onDrop={(event) => {
                event.preventDefault();
                event.currentTarget.classList.remove("drag-over");
                onFiles(event.dataTransfer.files);
              }}
            >
              Arrastra tus fotos o explora archivos
              <small>En celular puedes tomar una foto con la camara</small>
            </div>
            {fotos.length ? (
              <div className="upload-thumbs">
                {fotos.map((foto, index) => (
                  <div key={index} className="upload-thumb has-image">
                    <img src={foto} alt={`Evidencia ${index + 1}`} />
                    <button
                      type="button"
                      className="upload-remove"
                      onClick={() => setFotos((current) => current.filter((_, i) => i !== index))}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <aside className="reporte-panel reporte-panel-aside">
          <h2>Ubicacion del reporte</h2>
          <div className="form-field">
            <label>Buscar direccion</label>
          </div>
          <p className="map-hint">Haz clic en el mapa para marcar el punto exacto del reporte</p>
          <div className="reporte-map-picker">
            <MapPicker value={coords} onChange={handleMap} />
          </div>
          <label className="checkbox-row" htmlFor="ubicacionTerminos" style={{ margin: "16px 0" }}>
            <input
              id="ubicacionTerminos"
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
            />
            <span>Acepto los terminos de uso de mi ubicacion actual</span>
          </label>
          {error ? <p className="flash">{error}</p> : null}
          <button className="btn-action pink" type="submit" style={{ width: "100%", textAlign: "center" }} disabled={submitting}>
            {submitting ? "Enviando..." : "Enviar reporte"}
          </button>
        </aside>
      </form>

      {done ? (
        <div className="modal-overlay show" role="dialog" aria-modal="true">
          <div className="modal-box pink">
            <h2>¡Gestion realizada!</h2>
            <Link className="btn-modal" href="/ciudadano/reportes">
              Ver mis reportes
            </Link>
          </div>
        </div>
      ) : null}
    </CitizenShell>
  );
}
