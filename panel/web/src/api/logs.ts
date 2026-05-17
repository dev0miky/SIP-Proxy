import { api } from "./client";

export const tail = (svc: string, lines = 200) =>
  api<{ lines: string[] }>(`/api/logs/${svc}?lines=${lines}`);
