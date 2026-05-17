import { useEffect, useRef, useState } from "react";
import * as Regs from "@/api/regs";

export default function RegistrationsPage() {
  const [rows, setRows] = useState<Regs.Reg[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    const refresh = () => Regs.list().then(setRows).catch(() => {});
    refresh();
    timer.current = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 5000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">
        Registrations <span className="text-xs opacity-50">polling 5s</span>
      </h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left opacity-60">
            <th>user</th>
            <th>contact</th>
            <th>UA</th>
            <th>expires</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 opacity-50">
                no active registrations
              </td>
            </tr>
          )}
          {rows.map(r => (
            <tr key={r.id} className="border-t border-border">
              <td className="py-1.5">{r.username}</td>
              <td className="font-mono text-xs">{r.contact}</td>
              <td className="text-xs opacity-70">{r.user_agent}</td>
              <td className="text-xs opacity-70">{r.expires}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
