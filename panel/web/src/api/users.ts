import { api } from "./client";

export type User = { id: number; username: string; domain: string };

export const list = () => api<User[]>("/api/users");
export const create = (b: { username: string; password: string; domain?: string }) =>
  api<User>("/api/users", { method: "POST", body: JSON.stringify(b) });
export const resetPassword = (id: number, password: string) =>
  api<User>(`/api/users/${id}/password`, { method: "POST", body: JSON.stringify({ password }) });
export const remove = (id: number) => api<void>(`/api/users/${id}`, { method: "DELETE" });
