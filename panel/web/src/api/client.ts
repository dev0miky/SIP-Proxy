export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
  });
  if (res.status === 401) {
    if (!path.endsWith("/api/login")) window.location.href = "/login";
    throw new ApiError(401, "unauthorized");
  }
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const detail = typeof body === "object" && body && "detail" in body ? (body as { detail: string }).detail : res.statusText;
    throw new ApiError(res.status, String(detail));
  }
  return body as T;
}
