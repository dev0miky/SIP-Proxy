import { api } from "./client";

export type Reg = {
  id: number;
  username: string;
  contact: string;
  received: string | null;
  expires: string;
  user_agent: string;
};

export const list = () => api<Reg[]>("/api/regs");
