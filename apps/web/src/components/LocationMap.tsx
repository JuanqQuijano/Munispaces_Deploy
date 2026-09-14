"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/maps";

export function LocationMap({
  lat,
  lng,
  title,
  height = 260,
}: {
  lat: number;
  lng: number;
  title?: string;
  height?: number;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Cargando mapa...");

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!mapRef.current || Number.isNaN(lat) || Number.isNaN(lng)) return;
      try {
        const maps = await loadGoogleMaps();
        if (cancelled || !mapRef.current) return;
        const center = { lat, lng };
        const map = new maps.Map(mapRef.current, {
          center,
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        new maps.Marker({
          map,
          position: center,
          title: title || "Ubicacion del espacio",
        });
        setStatus("");
        // Some layouts need a resize after paint.
        setTimeout(() => maps.event.trigger(map, "resize"), 120);
      } catch {
        if (!cancelled) setStatus("No se pudo cargar Google Maps.");
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [lat, lng, title]);

  return (
    <div className="reserva-map">
      <h2>Ubicacion</h2>
      <div className="map-frame map-frame-reserva" ref={mapRef} style={{ height }} />
      {status ? <p className="map-status">{status}</p> : null}
    </div>
  );
}
