import { api } from "./client";

export type Svc = {
  name: string;
  image: string;
  status: string;
  health: string | null;
  started_at: string;
};

export const list = () => api<Svc[]>("/api/health");
