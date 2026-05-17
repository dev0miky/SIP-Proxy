import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/client";

export default function Login() {
  const nav = useNavigate();
  const [u, setU] = useState("admin");
  const [p, setP] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await api("/api/login", { method: "POST", body: JSON.stringify({ username: u, password: p }) });
      nav("/users");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "login failed");
    }
  };
  return (
    <div className="h-full flex items-center justify-center bg-muted/30">
      <form onSubmit={submit} className="w-80 space-y-3 bg-background p-6 rounded border border-border">
        <h1 className="text-lg font-semibold text-accent">sip-proxy</h1>
        <input
          className="w-full px-3 py-2 bg-muted rounded border border-border"
          value={u}
          onChange={e => setU(e.target.value)}
          placeholder="username"
          autoFocus
        />
        <input
          className="w-full px-3 py-2 bg-muted rounded border border-border"
          type="password"
          value={p}
          onChange={e => setP(e.target.value)}
          placeholder="password"
        />
        {err && <div className="text-red-500 text-sm">{err}</div>}
        <button className="w-full bg-accent text-white py-2 rounded">sign in</button>
      </form>
    </div>
  );
}
