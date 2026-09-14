"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CitizenShell } from "@/components/CitizenShell";
import { ReadOnlyMap } from "@/components/ReportsMap";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Report } from "@/lib/types";

function estadoLabel(estado: string) {
  return estado === "en_proceso" ? "En proceso" : estado === "resuelto" ? "Resuelto" : estado;
}

function urgenciaClass(urgencia: string) {
  if (urgencia === "bajo") return "urgencia-bajo";
  if (urgencia === "alto") return "urgencia-alto";
  return "urgencia-medio";
}

export default function MyReportsPage() {
  const [rows, setRows] = useState<Report[]>([]);
  const [selected, setSelected] = useState<Report | null>(null);
  const [foto, setFoto] = useState<string | null>(null);

  useEffect(() => {
    api<Report[]>("/api/v1/reports")
      .then((data) => {
        setRows(data);
        setSelected(data[0] || null);
      })
      .catch(() => {
        setRows([]);
        setSelected(null);
      });
  }, []);

  const activos = useMemo(() => rows.filter((row) => row.estado === "en_proceso").length, [rows]);
  const historial = useMemo(() => rows.filter((row) => row.estado === "resuelto").length, [rows]);

  return (
    <CitizenShell>
      <div className="dashboard-grid">
        <section>
          <h1 className="page-title">Mis reportes</h1>
          <p className="page-subtitle">Gestiona tus reportes y revisa su estado</p>

          <div className="reports-table-wrap">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Id-reporte</th>
                  <th>Tipo de incidencia</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th className="urgencia-franja-cell" aria-hidden="true" />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5}>Aun no tienes reportes.</td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <Fragment key={row.id}>
                      <tr
                        className={selected?.id === row.id ? "report-row selected" : "report-row"}
                        onClick={() => setSelected(row)}
                      >
                        <td>{row.public_id}</td>
                        <td>{row.tipo}</td>
                        <td>{formatDate(row.created_at.slice(0, 10))}</td>
                        <td>
                          <span className={`status-badge ${row.estado === "en_proceso" ? "proceso" : "resuelto"}`}>
                            {estadoLabel(row.estado)}
                          </span>
                        </td>
                        <td className="urgencia-franja-cell">
                          <span className={`urgencia-franja ${urgenciaClass(row.urgencia)}`} />
                        </td>
                      </tr>
                      {selected?.id === row.id ? (
                        <tr className="report-detail-row">
                          <td colSpan={5}>
                            <div className="report-detail">
                              <div className="report-detail-media">
                                {row.fotos?.[0] ? (
                                  <>
                                    <img src={row.fotos[0]} alt="Evidencia" />
                                    <button type="button" className="btn-ver-foto" onClick={() => setFoto(row.fotos[0])}>
                                      Ver foto completa
                                    </button>
                                  </>
                                ) : (
                                  <p className="empty-hint">Sin evidencia fotografica</p>
                                )}
                              </div>
                              <div>
                                <h4>Descripcion</h4>
                                <p>{row.descripcion}</p>
                                <p className="report-detail-address">{row.direccion || "Sin direccion registrada"}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
            <div className="table-pagination">&lt; 1 / 1 &gt;</div>
          </div>
        </section>

        <aside>
          <div className="top-actions">
            <Link className="btn-action pink" href="/ciudadano/reportes/nuevo">
              Nuevo reporte
            </Link>
          </div>

          <div className="summary-panel pink">
            <h3>RESUMEN</h3>
            <div className="summary-stats">
              <div className="stat-box">
                <small>Reportes actuales</small>
                <span>{activos}</span>
              </div>
              <div className="stat-box">
                <small>Historial</small>
                <span>{historial}</span>
              </div>
            </div>
          </div>

          <div className="summary-panel pink" style={{ marginTop: 20 }}>
            <h3>UBICACION DEL REPORTE</h3>
            {selected?.lat != null && selected?.lng != null ? (
              <>
                <p className="summary-note map-detail-text">
                  {selected.tipo}
                  <br />
                  {selected.direccion}
                </p>
                <div className="map-box map-readonly">
                  <ReadOnlyMap lat={selected.lat} lng={selected.lng} title={selected.tipo} />
                </div>
              </>
            ) : (
              <p className="map-hint">Selecciona un reporte para ver su ubicacion en el mapa.</p>
            )}
          </div>
        </aside>
      </div>

      {foto ? (
        <div className="modal-overlay show" role="dialog" aria-modal="true">
          <div className="modal-box pink foto-modal">
            <h2>Evidencia del reporte</h2>
            <img className="modal-foto-principal" src={foto} alt="Evidencia" />
            <button type="button" className="btn-modal" style={{ marginTop: 16 }} onClick={() => setFoto(null)}>
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
    </CitizenShell>
  );
}
