const API = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function detailMessage(detail: unknown): string {
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item) {
          return String((item as { msg: unknown }).msg);
        }
        return "";
      })
      .filter(Boolean)
      .join(" ");
  }
  return "No se pudo completar la solicitud.";
}

async function parse(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, detailMessage(data.detail));
  }
  return data;
}

function isAuthProbe(path: string) {
  return (
    path.includes("/auth/me") ||
    path.includes("/auth/refresh") ||
    path.includes("/auth/logout") ||
    path.includes("/auth/login") ||
    path.includes("/auth/register")
  );
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  if (path.startsWith("/login") || path.startsWith("/registro")) return;
  const next = encodeURIComponent(path + window.location.search);
  window.location.assign(`/login?next=${next}`);
}

export async function api<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (init.body && !headers.has("Content-Type") && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && retry && !isAuthProbe(path)) {
    const refreshed = await fetch(`${API}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (refreshed.ok) {
      return api<T>(path, init, false);
    }
    redirectToLogin();
    throw new ApiError(401, "No autenticado.");
  }

  if (response.status === 401 && !isAuthProbe(path)) {
    redirectToLogin();
  }

  return parse(response) as Promise<T>;
}

export const apiUrl = API;
