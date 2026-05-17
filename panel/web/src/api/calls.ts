import { api } from "./client";

export type Channel = {
  uuid: string;
  cid_name?: string;
  cid_num?: string;
  dest?: string;
  created?: string;
  application?: string;
};

export const list = () => api<Channel[]>("/api/calls");
export const hangup = (uuid: string) => api<void>(`/api/calls/${uuid}`, { method: "DELETE" });
