"use client";

import { useEffect, useRef, useState } from "react";
import { LIMA_CENTRO, loadGoogleMaps, reverseGeocode, type LatLng } from "@/lib/maps";

export function MapPicker({
  value,
  onChange,
}: {
  value: LatLng | null;
  onChange: (coords: LatLng) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const markerRef = useRef<{ setPosition: (p: LatLng) => void; getPosition: () => { lat: () => number; lng: () => number } | null } | null>(null);
  const [status, setStatus] = useState("Haz clic en el mapa o busca una direccion.");
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const maps = await loadGoogleMaps();
      if (cancelled || !mapRef.current) return;

      const start = value || LIMA_CENTRO;
      const map = new maps.Map(mapRef.current, {
        center: start,
        zoom: value ? 16 : 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      const marker = new maps.Marker({
        map,
        position: start,
        draggable: true,
      });
      markerRef.current = marker;

      async function apply(lat: number, lng: number, direccion?: string) {
        marker.setPosition({ lat, lng });
        map.panTo({ lat, lng });
        const address = direccion || (await reverseGeocode(lat, lng));
        onChange({ lat, lng, direccion: address });
        setStatus(address ? `Ubicacion marcada: ${address}` : "Ubicacion marcada en el mapa.");
      }

      map.addListener("click", (event) => {
        apply(event.latLng.lat(), event.latLng.lng());
      });

      marker.addListener("dragend", () => {
        const pos = marker.getPosition();
        if (pos) apply(pos.lat(), pos.lng());
      });

      if (inputRef.current) {
        const autocomplete = new maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "geometry"],
          componentRestrictions: { country: "pe" },
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place.geometry?.location) return;
          apply(
            place.geometry.location.lat(),
            place.geometry.location.lng(),
            place.formatted_address,
          );
          map.setZoom(16);
        });
      }

      if (value?.lat && value?.lng) {
        setStatus(
          value.direccion
            ? `Ubicacion marcada: ${value.direccion}`
            : "Ubicacion marcada en el mapa.",
        );
      }
    }

    init().catch(() => {
      setStatus("No se pudo cargar Google Maps. Revisa NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function locate() {
    if (!navigator.geolocation) {
      setStatus("Tu navegador no soporta geolocalizacion.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const direccion = await reverseGeocode(lat, lng);
        markerRef.current?.setPosition({ lat, lng });
        onChange({ lat, lng, direccion });
        setStatus(direccion ? `Ubicacion marcada: ${direccion}` : "Ubicacion marcada en el mapa.");
        setLocating(false);
      },
      () => {
        setStatus("No se pudo obtener tu ubicacion. Marca el punto en el mapa.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="map-picker">
      <input
        ref={inputRef}
        defaultValue={value?.direccion || ""}
        placeholder="Busca una direccion en Lima"
      />
      <div className="map-frame" ref={mapRef} />
      <p className="map-status">{status}</p>
      <button type="button" className="btn ghost" onClick={locate} disabled={locating}>
        {locating ? "Obteniendo ubicacion..." : "Usar mi ubicacion"}
      </button>
    </div>
  );
}
