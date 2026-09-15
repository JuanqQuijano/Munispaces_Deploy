import { api } from "@/lib/api";
import type { Space } from "@/lib/types";

export function spacesUrl(lat?: number | null, lng?: number | null) {
  if (lat == null || lng == null) return "/api/v1/spaces";
  return `/api/v1/spaces?lat=${lat}&lng=${lng}`;
}

export function loadSpaces(lat?: number | null, lng?: number | null) {
  return api<Space[]>(spacesUrl(lat, lng));
}
