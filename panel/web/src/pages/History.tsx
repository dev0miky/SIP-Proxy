import { useEffect, useState } from "react";
import * as History from "@/api/history";

export default function HistoryPage() {
  const [rows, setRows] = useState<History.HistoryRow[]>([]);
  useEffect(() => {
    History.list()
      .then(setRows)
      .catch(() => setRows([]));
  }, []);
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Call history (last 24h)</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left opacity-60">
            <th>started</th>
            <th>from</th>
            <th>to</th>
            <th>msgs</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 opacity-50">
                no calls in last 24h
              </td>
            </tr>
          )}
          {rows.map(r => (
            <tr key={r.callid} className="border-t border-border">
              <td className="py-1.5 text-xs opacity-70">{r.started_at}</td>
              <td>{r.from_user ?? "—"}</td>
              <td>{r.to_user ?? "—"}</td>
              <td>{r.message_count}</td>
              <td className="text-right">
                <button
                  type="button"
                  className="text-accent text-xs underline cursor-pointer"
                  onClick={() => {
                    window.open(`http://${window.location.hostname}:9080/`, "_blank", "noopener");
                    if (navigator.clipboard && window.isSecureContext) {
                      navigator.clipboard.writeText(r.callid).catch(() => {});
                    }
                  }}
                  title={`Open Homer (callid: ${r.callid})`}
                >
                  homer ↗
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
