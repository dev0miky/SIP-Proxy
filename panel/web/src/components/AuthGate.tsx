import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { api, ApiError } from "@/api/client";
import { Sidebar } from "./Sidebar";

export function AuthGate() {
  const nav = useNavigate();
  const [user, setUser] = useState<string | null>(null);
  useEffect(() => {
    api<{ user: string }>("/api/me")
      .then(r => setUser(r.user))
      .catch((e: ApiError) => {
        if (e.status !== 401) console.error(e);
        nav("/login", { replace: true });
      });
  }, [nav]);
  if (!user) return <div className="h-full flex items-center justify-center opacity-60">loading…</div>;
  return (
    <div className="h-full flex">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
