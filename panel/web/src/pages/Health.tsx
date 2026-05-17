import { useEffect, useRef, useState } from "react";
import * as Health from "@/api/health";
import * as Logs from "@/api/logs";

const shortName = (n: string) => n.replace(/^sipproxy-/, "");

const SVC_LOG_KEYS: Record<string, string> = {
  "sipproxy-kamailio": "kamailio",
  "sipproxy-freeswitch": "freeswitch",
  "sipproxy-mysql": "mysql",
  "sipproxy-postgres": "postgres",
  "sipproxy-heplify": "heplify",
  "sipproxy-homer": "homer",
  "sipproxy-panel-api": "panel-api",
  "sipproxy-panel": "panel-web",
};

export default function HealthPage() {
  const [rows, setRows] = useState<Health.Svc[]>([]);
  const [tail, setTail] = useState<{ svc: string; lines: string[] } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    const refresh = () => Health.list().then(setRows).catch(() => {});
    refresh();
    timer.current = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 5000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);
  const view = (containerName: string) => {
    const svc = SVC_LOG_KEYS[containerName];
    if (!svc) return;
    Logs.tail(svc, 200)
      .then(r => setTail({ svc, lines: r.lines }))
      .catch(() => {});
  };
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">
        Service health <span className="text-xs opacity-50">polling 5s</span>
      </h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left opacity-60">
            <th>service</th>
            <th>status</th>
            <th>health</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.name} className="border-t border-border">
              <td className="py-1.5">{shortName(r.name)}</td>
              <td>
                <span className={r.status === "running" ? "text-green-500" : "text-red-500"}>{r.status}</span>
              </td>
              <td className="opacity-70">{r.health ?? "—"}</td>
              <td className="text-right">
                <button onClick={() => view(r.name)} className="text-xs text-accent">
                  logs ↗
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {tail && (
        <div className="border border-border rounded">
          <div className="px-3 py-1.5 border-b border-border flex justify-between">
            <span className="text-xs opacity-70">last 200 lines — {tail.svc}</span>
            <button onClick={() => setTail(null)} className="text-xs opacity-60">
              close
            </button>
          </div>
          <pre className="text-[10px] p-3 overflow-x-auto max-h-96 leading-tight bg-muted/40">{tail.lines.join("\n")}</pre>
        </div>
      )}
    </div>
  );
}
