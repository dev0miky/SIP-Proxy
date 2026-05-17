import { useEffect, useState, type FormEvent } from "react";
import * as Trunk from "@/api/trunk";

export default function TrunkPage() {
  const [t, setT] = useState<Trunk.Trunk>({ ITSP_USER: "", ITSP_PASS: "", ITSP_REALM: "", ITSP_PROXY: "" });
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    Trunk.read().then(setT);
  }, []);
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!confirm("Saving will restart FreeSWITCH (~6s downtime). Continue?")) return;
    setMsg("restarting freeswitch…");
    try {
      await Trunk.write(t);
      setMsg("saved. freeswitch restarted.");
    } catch (e) {
      setMsg(e instanceof Error ? `failed: ${e.message}` : "failed");
    }
  };
  const field = (k: keyof Trunk.Trunk, label: string, type = "text") => (
    <label className="block">
      <span className="text-xs uppercase opacity-60 tracking-wide">{label}</span>
      <input
        type={type}
        className="mt-1 w-full px-3 py-1.5 bg-muted rounded border border-border font-mono text-sm"
        value={t[k]}
        onChange={e => setT({ ...t, [k]: e.target.value })}
      />
    </label>
  );
  return (
    <div className="space-y-4 max-w-md">
      <h1 className="text-lg font-semibold">Upstream trunk credentials</h1>
      <p className="text-sm opacity-60">
        stored in <code>.env</code>. Saving restarts FreeSWITCH.
      </p>
      <form onSubmit={save} className="space-y-3">
        {field("ITSP_USER", "user")}
        {field("ITSP_PASS", "password", "password")}
        {field("ITSP_REALM", "realm")}
        {field("ITSP_PROXY", "proxy (host:port)")}
        <button className="bg-accent text-white px-3 py-1.5 rounded">save & restart FS</button>
        {msg && <div className="text-sm opacity-80">{msg}</div>}
      </form>
    </div>
  );
}
