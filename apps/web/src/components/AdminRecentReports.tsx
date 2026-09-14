"use client";

import { useMemo, useState } from "react";
import { ReadOnlyMap } from "@/components/ReportsMap";
import { api } from "@/lib/api";
import { relativeTime } from "@/lib/format";
import type { Report } from "@/lib/types";

type ModalKind = "map" | "photo" | "serenazgo" | null;

const SERENAZGO_TEL = "715-9700";

function urgencyKey(urgencia: string) {
  const value = (urgencia || "medio").toLowerCase();
  if (value === "alto" || value === "urgente") return "alto";
  if (value === "bajo" || value === "baja") return "bajo";
  return "medio";
}

export function AdminRecentReports({ reports }: { reports: Report[] }) {
  const recientes = useMemo(
    () =>
      [...reports]
        .filter((row) => row.estado !== "resuelto")
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
        .slice(0, 4),
    [reports],
  );

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [active, setActive] = useState<Report | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [sendStatus, setSendStatus] = useState("");
  const [sendState, setSendState] = useState<"idle" | "loading" | "ok" | "error">("idle");

  function openModal(kind: ModalKind, report: Report) {
    setActive(report);
    setPhotoIndex(0);
    setSendStatus(
      "El reporte directo se envia de forma anonima. No se incluye informacion del administrador.",
    );
    setSendState("idle");
    setModal(kind);
  }

  function closeModal() {
    setModal(null);
    setActive(null);
  }

  async function sendTelegram(report: Report) {
    setSendState("loading");
    setSendStatus("Enviando reporte anonimo al canal de Serenazgo...");
    try {
      const data = await api<{ detalle: string }>("/api/v1/serenazgo/alert", {
        method: "POST",
        body: JSON.stringify({ report_id: report.id }),
      });
      setSendState("ok");
      setSendStatus(data.detalle || "Reporte enviado de forma anonima a Telegram.");
    } catch (err) {
      setSendState("error");
      setSendStatus(err instanceof Error ? err.message : "No se pudo enviar a Telegram.");
    }
  }

  const urgency = active ? urgencyKey(active.urgencia) : "medio";

  return (
    <>
      <div className="summary-panel pink admin-reportes-recientes">
        <h3>Reportes recientes</h3>
        {recientes.length === 0 ? <p className="admin-empty">Sin reportes pendientes.</p> : null}

        {recientes.map((row) => {
          const urg = urgencyKey(row.urgencia);
          const expanded = expandedId === row.id;
          const hasPhoto = row.fotos.length > 0;
          const hasMap = row.lat != null && row.lng != null;

          return (
            <article
              key={row.id}
              className={`admin-reporte-card clickable ${expanded ? "expanded" : ""} urgencia-${urg}`}
              onClick={() => setExpandedId(expanded ? null : row.id)}
            >
              <div className={`admin-reporte-franja urgencia-${urg}`} />
              <div className="admin-reporte-body">
                <div className="admin-reporte-top">
                  <strong>{row.tipo}</strong>
                  <span>{relativeTime(row.created_at)}</span>
                </div>
                <p className="admin-reporte-resumen">
                  {row.descripcion || "Sin descripcion"}
                  {row.direccion ? (
                    <>
                      <br />
                      <small>{row.direccion}</small>
                    </>
                  ) : null}
                </p>

                <div className="admin-reporte-actions" onClick={(event) => event.stopPropagation()}>
                  {hasMap ? (
                    <button
                      type="button"
                      className={`btn-accion-reporte urgencia-${urg}`}
                      onClick={() => openModal("map", row)}
                    >
                      Ver ubicacion
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={`btn-accion-reporte urgencia-${urg}`}
                    onClick={() => openModal("serenazgo", row)}
                  >
                    Llamar efectivo
                  </button>
                </div>

                {expanded ? (
                  <div className="admin-reporte-detalle" onClick={(event) => event.stopPropagation()}>
                    <div className="reporte-detalle-expandido">
                      {hasPhoto ? (
                        <button
                          type="button"
                          className="reporte-detalle-foto-btn"
                          onClick={() => openModal("photo", row)}
                        >
                          <img className="reporte-detalle-foto" src={row.fotos[0]} alt="Evidencia" />
                        </button>
                      ) : (
                        <p className="reporte-detalle-sin-foto">Este reporte no incluye fotografia.</p>
                      )}
                      <div className="reporte-detalle-texto">
                        <strong>Descripcion</strong>
                        <p>{row.descripcion || "Sin descripcion."}</p>
                        {row.direccion ? <small>{row.direccion}</small> : null}
                      </div>
                    </div>
                    {hasPhoto ? (
                      <button
                        type="button"
                        className={`btn-accion-reporte urgencia-${urg} full`}
                        onClick={() => openModal("photo", row)}
                      >
                        Ver foto completa
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}

      </div>

      {modal === "map" && active && active.lat != null && active.lng != null ? (
        <div className="modal-overlay show" onClick={closeModal}>
          <div className={`modal-box mapa-modal urgencia-${urgency}`} onClick={(e) => e.stopPropagation()}>
            <h2>{active.tipo}</h2>
            <p>{active.direccion || "Ubicacion registrada en el mapa"}</p>
            <div className="modal-mapa-frame">
              <ReadOnlyMap lat={active.lat} lng={active.lng} title={active.tipo} />
            </div>
            <button type="button" className={`btn-modal-urgencia urgencia-${urgency}`} onClick={closeModal}>
              Cerrar
            </button>
          </div>
        </div>
      ) : null}

      {modal === "photo" && active ? (
        <div className="modal-overlay show" onClick={closeModal}>
          <div className={`modal-box foto-modal urgencia-${urgency}`} onClick={(e) => e.stopPropagation()}>
            <h2>{active.tipo}</h2>
            <p>{active.descripcion || "Sin descripcion."}</p>
            {active.fotos[photoIndex] ? (
              <img
                className="modal-foto-principal"
                src={active.fotos[photoIndex]}
                alt={`Evidencia de ${active.tipo}`}
              />
            ) : (
              <p>Sin foto adjunta.</p>
            )}
            {active.fotos.length > 1 ? (
              <div className="modal-foto-galeria">
                {active.fotos.map((foto, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`modal-foto-mini ${index === photoIndex ? "active" : ""}`}
                    onClick={() => setPhotoIndex(index)}
                  >
                    <img src={foto} alt="" />
                  </button>
                ))}
              </div>
            ) : null}
            <button type="button" className={`btn-modal-urgencia urgencia-${urgency}`} onClick={closeModal}>
              Cerrar
            </button>
          </div>
        </div>
      ) : null}

      {modal === "serenazgo" && active ? (
        <div className="modal-overlay show" onClick={closeModal}>
          <div className="modal-box serenazgo" onClick={(e) => e.stopPropagation()}>
            <h2>Contacta con un agente de serenazgo ahora mismo</h2>
            <p className="serenazgo-texto">Para llamada directa a Serenazgo en tu zona:</p>
            <a className="serenazgo-telefono" href={`tel:${SERENAZGO_TEL.replace(/\D/g, "")}`}>
              {SERENAZGO_TEL}
            </a>
            <p className={`serenazgo-estado ${sendState === "ok" ? "exito" : sendState === "error" ? "error" : ""}`}>
              {sendStatus}
            </p>
            <div className="serenazgo-acciones">
              <button
                type="button"
                className={`btn-reporte-directo ${sendState === "ok" ? "enviado" : ""} ${
                  sendState === "error" ? "error" : ""
                }`}
                disabled={sendState === "loading" || sendState === "ok"}
                onClick={() => sendTelegram(active)}
              >
                {sendState === "loading"
                  ? "Enviando..."
                  : sendState === "ok"
                    ? "Reporte enviado"
                    : "Reporte directo"}
              </button>
              <button type="button" className="btn-modal-outline" onClick={closeModal}>
                Volver a inicio
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
