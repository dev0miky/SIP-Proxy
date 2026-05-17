import { api } from "./client";

export type DidMap = Record<string, string>;

export const list = () => api<DidMap>("/api/did");
export const upsert = (did: string, user: string) =>
  api<{ ok: boolean; count: number }>("/api/did", { method: "PUT", body: JSON.stringify({ did, user }) });
export const remove = (did: string) =>
  api<{ ok: boolean }>(`/api/did/${did}`, { method: "DELETE" });
