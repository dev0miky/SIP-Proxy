import { api } from "./client";

export type Trunk = {
  ITSP_USER: string;
  ITSP_PASS: string;
  ITSP_REALM: string;
  ITSP_PROXY: string;
};

export const read = () => api<Trunk>("/api/trunk");
export const write = (b: Trunk) => api<{ ok: boolean }>("/api/trunk", { method: "PUT", body: JSON.stringify(b) });
