"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { api } from "@/lib/api";
import type { Space } from "@/lib/types";

const TIPOS = [
  "Parques y areas verdes",
  "Infraestructura y Areas Culturales",
  "Losas deportivas",
] as const;

export default function SpacesPage() {
  const router = useRouter();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [query, setQuery] = useState("");
  const [draftQuery, setDraftQuery] = useState("");
  const [distrito, setDistrito] = useState("");
  const [disponibilidad, setDisponibilidad] = useState("");
  const [tipos, setTipos] = useState<string[]>([]);

  useEffect(() => {
    api<Space[]>("/api/v1/spaces").then(setSpaces).catch(() => setSpaces([]));
  }, []);

  const distritos = useMemo(
    () => [...new Set(spaces.map((space) => space.distrito))].sort((a, b) => a.localeCompare(b)),
    [spaces],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return spaces.filter((space) => {
      if (needle) {
        const haystack = `${space.nombre} ${space.distrito} ${space.direccion} ${space.tipo}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      if (distrito && space.distrito !== distrito) return false;
      if (tipos.length && !tipos.includes(space.tipo)) return false;
      if (disponibilidad === "disponibles" && !space.disponible) return false;
      if (disponibilidad === "ocupados" && space.disponible) return false;
      return true;
    });
  }, [spaces, query, distrito, tipos, disponibilidad]);

  function toggleTipo(tipo: string) {
    setTipos((current) => (current.includes(tipo) ? current.filter((item) => item !== tipo) : [...current, tipo]));
  }

  function openSpace(space: Space) {
    if (!space.disponible) {
      window.alert("Este espacio no tiene disponibilidad en este momento.");
      return;
    }
    router.push(`/ciudadano/espacios/${space.id}/reservar`);
  }

  return (
    <AuthGuard role="ciudadano">
      <div className="page-shell">
        <SiteHeader />
        <main className="espacios-layout">
          <aside className="espacios-filters">
            <h2>FILTROS</h2>

            <div className="filter-group">
              <h3>Tipo de Espacios</h3>
              {TIPOS.map((tipo) => (
                <label key={tipo} className="filter-check">
                  <input type="checkbox" checked={tipos.includes(tipo)} onChange={() => toggleTipo(tipo)} />
                  {tipo === "Parques y areas verdes"
                    ? "Parques y áreas verdes"
                    : tipo === "Infraestructura y Areas Culturales"
                      ? "Infraestructura y Áreas Culturales"
                      : tipo}
                </label>
              ))}
            </div>

            <div className="filter-group">
              <h3>Distrito</h3>
              <select value={distrito} onChange={(event) => setDistrito(event.target.value)}>
                <option value="">Selecciona distrito</option>
                {distritos.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <h3>Fecha Disponible</h3>
              <select value={disponibilidad} onChange={(event) => setDisponibilidad(event.target.value)}>
                <option value="">Selecciona fecha</option>
                <option value="disponibles">Solo disponibles</option>
                <option value="ocupados">Solo ocupados</option>
              </select>
            </div>
          </aside>

          <section className="espacios-content">
            <div className="espacios-search-bar">
              <input
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") setQuery(draftQuery);
                }}
                placeholder="Busca un lugar en específico"
              />
              <button type="button" onClick={() => setQuery(draftQuery)}>
                Buscar
              </button>
            </div>

            <div className="espacios-header">
              <h1>EXPLORA ESPACIOS</h1>
              <p>
                Mostrando {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="espacios-grid">
              {filtered.length === 0 ? (
                <p className="espacios-empty">No hay espacios con esos filtros.</p>
              ) : (
                filtered.map((space) => (
                  <article
                    key={space.id}
                    className={space.disponible ? "espacio-card" : "espacio-card espacio-card-disabled"}
                    onClick={() => openSpace(space)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openSpace(space);
                      }
                    }}
                    role="link"
                    tabIndex={0}
                  >
                    <div className="espacio-card-image">
                      <img src={space.imagen} alt={space.nombre} />
                      <span className={`espacio-estado ${space.disponible ? "disponible" : "ocupado"}`}>
                        {space.disponible ? "Disponible" : "Ocupado"}
                      </span>
                    </div>
                    <div className="espacio-card-body">
                      <h3>{space.nombre}</h3>
                      <p className="espacio-distrito">{space.distrito}</p>
                      <p className="espacio-direccion">{space.direccion}</p>
                      <p className="espacio-precio">
                        {space.precio_aplicable} soles/hora
                        {space.es_residente ? (
                          <span className="espacio-precio-residente"> · tarifa residente</span>
                        ) : null}
                      </p>
                      <span className="espacio-rating">{space.rating}</span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    </AuthGuard>
  );
}
