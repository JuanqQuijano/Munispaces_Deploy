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

function todayIso() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysIso(baseIso: string, days: number) {
  const [year, month, day] = baseIso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function SpacesPage() {
  const router = useRouter();
  const minFecha = useMemo(() => todayIso(), []);
  const maxFecha = useMemo(() => addDaysIso(minFecha, 6), [minFecha]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [draftQuery, setDraftQuery] = useState("");
  const [distrito, setDistrito] = useState("");
  const [fecha, setFecha] = useState("");
  const [tipos, setTipos] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const path = fecha ? `/api/v1/spaces?fecha=${encodeURIComponent(fecha)}` : "/api/v1/spaces";
    api<Space[]>(path)
      .then((data) => {
        if (!cancelled) setSpaces(data);
      })
      .catch(() => {
        if (!cancelled) setSpaces([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fecha]);

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
      return true;
    });
  }, [spaces, query, distrito, tipos]);

  function toggleTipo(tipo: string) {
    setTipos((current) => (current.includes(tipo) ? current.filter((item) => item !== tipo) : [...current, tipo]));
  }

  function openSpace(space: Space) {
    if (!space.disponible) {
      window.alert("Este espacio no tiene disponibilidad en este momento.");
      return;
    }
    const queryFecha = fecha ? `?fecha=${encodeURIComponent(fecha)}` : "";
    router.push(`/ciudadano/espacios/${space.id}/reservar${queryFecha}`);
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
              <h3>Fecha disponible</h3>
              <input
                type="date"
                value={fecha}
                min={minFecha}
                max={maxFecha}
                onChange={(event) => setFecha(event.target.value)}
              />
              {fecha ? (
                <button type="button" className="filter-clear" onClick={() => setFecha("")}>
                  Quitar fecha
                </button>
              ) : (
                <p className="filter-hint">Elige un dia (proximos 7) para ver espacios con horario libre.</p>
              )}
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
                {loading
                  ? "Buscando espacios..."
                  : `Mostrando ${filtered.length} resultado${filtered.length === 1 ? "" : "s"}`}
                {fecha && !loading ? ` · ${fecha}` : ""}
              </p>
            </div>

            <div className="espacios-grid">
              {!loading && filtered.length === 0 ? (
                <p className="espacios-empty">
                  {fecha
                    ? "No hay espacios con horario libre en esa fecha."
                    : "No hay espacios con esos filtros."}
                </p>
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
