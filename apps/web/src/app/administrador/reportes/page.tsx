"use client";

import { Fragment, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { ReadOnlyMap, ReportsMap } from "@/components/ReportsMap";
import { api } from "@/lib/api";
import { formatDateParts } from "@/lib/format";
import type { Report } from "@/lib/types";

function urgencyClass(urgencia: string) {
  const value = (urgencia || "medio").toLowerCase();
  if (value === "alto" || value === "alta" || value === "urgente") return "alto";
  if (value === "bajo" || value === "baja") return "bajo";
  return "medio";
}

export default function AdminReportsPage() {
  const [rows, setRows] = useState<Report[]>([]);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [foto, setFoto] = useState<Report | null>(null);

  async function load() {
    try {
      const data = await api<Report[]>("/api/v1/reports");
      setRows(data);
      if (data[0]) setSelected((prev) => prev ?? data[0].id);
    } catch {
      setRows([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function resolve(id: string) {
    await api(`/api/v1/reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ estado: "resuelto" }),
    });
    load();
  }

  async function alertar(id: string) {
    setMessage("");
    try {
      const data = await api<{ detalle: string }>("/api/v1/serenazgo/alert", {
        method: "POST",
        body: JSON.stringify({ report_id: id }),
      });
      setMessage(data.detalle);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo enviar.");
    }
  }

  function selectReport(id: string) {
    setSelected(id);
    setExpanded((prev) => (prev === id ? null : id));
  }

  const active = rows.find((row) => row.id === selected) || null;
  const activos = rows.filter((row) => row.estado !== "resuelto").length;
  const activeUrg = active ? urgencyClass(active.urgencia) : "medio";

  return (
    <AdminShell>
      <div className="dashboard-grid">
        <div>
          <h1 className="page-title">Reportes de la zona</h1>
          <p className="page-subtitle">Incidencias reportadas en tu espacio</p>

          <div className="summary-panel pink" style={{ marginBottom: 20 }}>
            <h3>RESUMEN</h3>
            <div className="summary-stats" style={{ gridTemplateColumns: "1fr" }}>
              <div className="stat-box">
                <small>Reportes actuales</small>
                <span>{activos}</span>
              </div>
            </div>
            {message ? <p className="summary-note">{message}</p> : null}
          </div>

          <div className="reports-table-wrap">
            <table className="reports-table reports-table-desktop">
              <thead>
                <tr>
                  <th>Id-reporte</th>
                  <th>Tipo de incidencia</th>
                  <th>Fecha</th>
                  <th>Urgencia</th>
                  <th>Estado</th>
                  <th>Foto</th>
                  <th className="urgencia-franja-cell" aria-hidden />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No hay reportes.</td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const parts = formatDateParts(row.created_at);
                    const rowUrg = urgencyClass(row.urgencia);
                    const isSelected = selected === row.id;
                    const isExpanded = expanded === row.id;
                    const hasPhoto = row.fotos.length > 0;

                    return (
                      <Fragment key={row.id}>
                        <tr
                          className={`report-row urgencia-bg-${rowUrg} ${isSelected ? "selected" : ""} ${
                            isExpanded ? "expanded" : ""
                          }`}
                          onClick={() => selectReport(row.id)}
                        >
                          <td>{row.public_id}</td>
                          <td>{row.tipo}</td>
                          <td>
                            <div className="report-fecha-stack">
                              <span>{parts.day}</span>
                              <small>{parts.time}</small>
                            </div>
                          </td>
                          <td>{row.urgencia}</td>
                          <td>
                            <span
                              className={`status-badge ${row.estado === "en_proceso" ? "proceso" : row.estado}`}
                            >
                              {row.estado.replace("_", " ")}
                            </span>
                          </td>
                          <td>
                            {hasPhoto ? (
                              <button
                                type="button"
                                className="btn-accion-reporte"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setFoto(row);
                                }}
                              >
                                Foto
                              </button>
                            ) : (
                              <span className="reporte-sin-foto">—</span>
                            )}
                          </td>
                          <td className="urgencia-franja-cell">
                            <span className={`urgencia-franja urgencia-${rowUrg}`} />
                          </td>
                        </tr>
                        {isExpanded ? (
                          <tr className={`report-row-detail urgencia-bg-${rowUrg}`}>
                            <td colSpan={7}>
                              <div className="reporte-detalle-expandido">
                                {hasPhoto ? (
                                  <button
                                    type="button"
                                    className="reporte-detalle-foto-btn"
                                    onClick={() => setFoto(row)}
                                  >
                                    <img
                                      className="reporte-detalle-foto"
                                      src={row.fotos[0]}
                                      alt="Evidencia del reporte"
                                    />
                                  </button>
                                ) : (
                                  <p className="reporte-detalle-sin-foto">
                                    Este reporte no incluye fotografia.
                                  </p>
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
                                  className="btn-accion-reporte"
                                  style={{ marginTop: 10 }}
                                  onClick={() => setFoto(row)}
                                >
                                  Ver foto completa
                                </button>
                              ) : null}
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>

            <div className="reports-cards">
              {rows.length === 0 ? (
                <p className="admin-empty">No hay reportes.</p>
              ) : (
                rows.map((row) => {
                  const parts = formatDateParts(row.created_at);
                  const rowUrg = urgencyClass(row.urgencia);
                  const isSelected = selected === row.id;
                  const isExpanded = expanded === row.id;
                  const hasPhoto = row.fotos.length > 0;

                  return (
                    <article
                      key={row.id}
                      className={`report-card urgencia-${rowUrg}${isSelected ? " selected" : ""}`}
                      onClick={() => selectReport(row.id)}
                    >
                      <div className="report-card-top">
                        <strong>{row.public_id}</strong>
                        <span
                          className={`status-badge ${row.estado === "en_proceso" ? "proceso" : row.estado}`}
                        >
                          {row.estado.replace("_", " ")}
                        </span>
                      </div>
                      <p className="report-card-tipo">{row.tipo}</p>
                      <p className="report-card-fecha">
                        {parts.day} · {parts.time} · Urgencia {row.urgencia}
                      </p>
                      {isExpanded ? (
                        <div className="report-card-detail">
                          {hasPhoto ? (
                            <button
                              type="button"
                              className="reporte-detalle-foto-btn"
                              onClick={(event) => {
                                event.stopPropagation();
                                setFoto(row);
                              }}
                            >
                              <img
                                className="reporte-detalle-foto"
                                src={row.fotos[0]}
                                alt="Evidencia del reporte"
                              />
                            </button>
                          ) : (
                            <p className="reporte-detalle-sin-foto">
                              Este reporte no incluye fotografia.
                            </p>
                          )}
                          <div className="reporte-detalle-texto">
                            <strong>Descripcion</strong>
                            <p>{row.descripcion || "Sin descripcion."}</p>
                            {row.direccion ? <small>{row.direccion}</small> : null}
                          </div>
                          <div className="admin-reporte-actions">
                            <button
                              type="button"
                              className={`btn-accion-reporte urgencia-${rowUrg}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                alertar(row.id);
                              }}
                            >
                              Serenazgo
                            </button>
                            {row.estado !== "resuelto" ? (
                              <button
                                type="button"
                                className={`btn-accion-reporte urgencia-${rowUrg}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  resolve(row.id);
                                }}
                              >
                                Resolver
                              </button>
                            ) : null}
                            {hasPhoto ? (
                              <button
                                type="button"
                                className="btn-accion-reporte"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setFoto(row);
                                }}
                              >
                                Ver foto
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <aside>
          <div className="summary-panel pink">
            <h3>UBICACION DEL REPORTE</h3>
            {active ? (
              <div className="map-detail-text">
                <p className="map-hint">
                  <strong>{active.tipo}</strong>
                  <br />
                  {active.direccion || "Sin direccion"}
                  <br />
                  {formatDateParts(active.created_at).day} · Urgencia {active.urgencia}
                </p>
                <div className="admin-reporte-actions">
                  <button
                    type="button"
                    className={`btn-accion-reporte urgencia-${activeUrg}`}
                    onClick={() => alertar(active.id)}
                  >
                    Serenazgo
                  </button>
                  {active.estado !== "resuelto" ? (
                    <button
                      type="button"
                      className={`btn-accion-reporte urgencia-${activeUrg}`}
                      onClick={() => resolve(active.id)}
                    >
                      Resolver
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="map-hint">Selecciona un reporte de la tabla para ver su ubicacion.</p>
            )}
            <div className="map-box admin-map">
              {active && active.lat != null && active.lng != null ? (
                <ReadOnlyMap key={active.id} lat={active.lat} lng={active.lng} title={active.tipo} />
              ) : (
                <ReportsMap
                  points={rows.map((row) => ({
                    id: row.id,
                    lat: row.lat,
                    lng: row.lng,
                    title: row.tipo,
                    subtitle: row.direccion,
                  }))}
                  onSelect={(id) => {
                    setSelected(id);
                    setExpanded(id);
                  }}
                />
              )}
            </div>
          </div>
        </aside>
      </div>

      {foto ? (
        <div className="modal-overlay show" onClick={() => setFoto(null)}>
          <div className="modal-box foto-modal" onClick={(event) => event.stopPropagation()}>
            <h2>{foto.tipo}</h2>
            <p>{foto.descripcion || "Sin descripcion."}</p>
            {foto.fotos[0] ? (
              <img src={foto.fotos[0]} alt="Evidencia" className="modal-foto-principal" />
            ) : (
              <p>Sin foto adjunta.</p>
            )}
            <button type="button" className="btn-accion-reporte" style={{ marginTop: 16 }} onClick={() => setFoto(null)}>
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
