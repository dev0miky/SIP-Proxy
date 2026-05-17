import { api } from "./client";

export type HistoryRow = {
  callid: string;
  started_at: string | null;
  last_seen: string | null;
  message_count: number;
  from_user: string | null;
  to_user: string | null;
  homer_url: string;
};

export const list = (limit = 50) => api<HistoryRow[]>(`/api/history?limit=${limit}`);
