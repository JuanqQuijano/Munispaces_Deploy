export const LIMA_CENTRO = { lat: -12.0464, lng: -77.0428 };

export const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export type LatLng = { lat: number; lng: number; direccion?: string };

type MapsApi = {
  Map: new (el: HTMLElement, opts: object) => GoogleMap;
  Marker: new (opts: object) => GoogleMarker;
  Geocoder: new () => {
    geocode: (
      req: object,
      cb: (results: Array<{ formatted_address: string }> | null, status: string) => void,
    ) => void;
  };
  LatLngBounds: new () => { extend: (p: LatLng) => void; getCenter: () => LatLng };
  places: {
    Autocomplete: new (
      input: HTMLInputElement,
      opts: object,
    ) => {
      addListener: (name: string, cb: () => void) => void;
      getPlace: () => {
        formatted_address?: string;
        geometry?: { location: { lat: () => number; lng: () => number } };
      };
    };
  };
  event: { trigger: (instance: unknown, name: string) => void };
};

type GoogleMap = {
  addListener: (name: string, cb: (e: { latLng: { lat: () => number; lng: () => number } }) => void) => void;
  panTo: (p: LatLng) => void;
  setCenter: (p: LatLng) => void;
  setZoom: (z: number) => void;
  fitBounds: (b: unknown) => void;
};

type GoogleMarker = {
  setPosition: (p: LatLng) => void;
  setMap: (map: GoogleMap | null) => void;
  setOpacity: (n: number) => void;
  setZIndex: (n: number) => void;
  getPosition: () => { lat: () => number; lng: () => number } | null;
  addListener: (name: string, cb: () => void) => void;
};

declare global {
  interface Window {
    google?: { maps: MapsApi };
  }
}

let loading: Promise<MapsApi> | null = null;

export function loadGoogleMaps(): Promise<MapsApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps solo corre en el navegador."));
  }
  if (window.google?.maps?.places) {
    return Promise.resolve(window.google.maps);
  }
  if (loading) {
    return loading;
  }

  loading = new Promise((resolve, reject) => {
    const finish = () => {
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error("Google Maps no inicializo."));
      }
    };

    const existing = document.getElementById("google-maps-js") as HTMLScriptElement | null;
    if (existing) {
      if (window.google?.maps) {
        finish();
        return;
      }
      existing.addEventListener("load", finish);
      existing.addEventListener("error", () => reject(new Error("No se pudo cargar Google Maps.")));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-js";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = finish;
    script.onerror = () => reject(new Error("No se pudo cargar Google Maps."));
    document.head.appendChild(script);
  });

  return loading;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const maps = await loadGoogleMaps();
  return new Promise((resolve) => {
    const geocoder = new maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      resolve(status === "OK" && results?.[0] ? results[0].formatted_address : "");
    });
  });
}
