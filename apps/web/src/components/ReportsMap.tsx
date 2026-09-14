"use client";

import { useEffect, useRef } from "react";
import { LIMA_CENTRO, loadGoogleMaps } from "@/lib/maps";

type Point = {
  id: string;
  lat: number | null;
  lng: number | null;
  title: string;
  subtitle?: string;
};

export function ReportsMap({
  points,
  onSelect,
}: {
  points: Point[];
  onSelect?: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const maps = await loadGoogleMaps();
      if (cancelled || !ref.current) return;

      const located = points.filter((item) => item.lat != null && item.lng != null);
      const map = new maps.Map(ref.current, {
        center: LIMA_CENTRO,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      if (!located.length) return;

      const bounds = new maps.LatLngBounds();
      located.forEach((item) => {
        const position = { lat: item.lat as number, lng: item.lng as number };
        const marker = new maps.Marker({
          map,
          position,
          title: item.title,
        });
        marker.addListener("click", () => onSelect?.(item.id));
        bounds.extend(position);
      });

      if (located.length === 1) {
        map.setCenter(bounds.getCenter());
        map.setZoom(15);
      } else {
        map.fitBounds(bounds);
      }
    }

    init().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [points, onSelect]);

  return <div className="map-frame map-frame-tall" ref={ref} />;
}

export function ReadOnlyMap({ lat, lng, title }: { lat: number; lng: number; title?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const maps = await loadGoogleMaps();
      if (cancelled || !ref.current) return;
      const map = new maps.Map(ref.current, {
        center: { lat, lng },
        zoom: 16,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      new maps.Marker({ map, position: { lat, lng }, title });
    }
    init().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [lat, lng, title]);

  return <div className="map-frame" ref={ref} />;
}
