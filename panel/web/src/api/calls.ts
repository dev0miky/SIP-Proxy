import { api } from "./client";

export type Channel = {
  channel: string;
  context?: string;
  exten?: string;
  callerid_num?: string;
  callerid_name?: string;
  account?: string;
  state?: string;
  application?: string;
  duration?: string;
  bridgeid?: string;
};

export const list = () => api<Channel[]>("/api/calls");
export const hangup = (channel: string) =>
  api<void>(`/api/calls/${encodeURIComponent(channel)}`, { method: "DELETE" });
