import { useEffect, useRef, useState } from "react";
import * as Calls from "@/api/calls";
import { PhoneOff } from "lucide-react";

export default function CallsPage() {
  const [rows, setRows] = useState<Calls.Channel[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    const refresh = () => Calls.list().then(setRows).catch(() => {});
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
        Active calls <span className="text-xs opacity-50">polling 5s</span>
      </h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left opacity-60">
            <th>channel</th>
            <th>from</th>
            <th>to</th>
            <th>state</th>
            <th>app</th>
            <th>dur</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="py-4 opacity-50">
                no active calls
              </td>
            </tr>
          )}
          {rows.map(r => (
            <tr key={r.channel} className="border-t border-border">
              <td className="font-mono text-xs py-1.5">{r.channel}</td>
              <td>
                {r.callerid_num} <span className="opacity-50">({r.callerid_name})</span>
              </td>
              <td>{r.exten}</td>
              <td className="opacity-70">{r.state}</td>
              <td className="opacity-70">{r.application}</td>
              <td className="opacity-70">{r.duration}</td>
              <td className="text-right">
                <button onClick={() => Calls.hangup(r.channel)} className="text-red-500" aria-label="hangup">
                  <PhoneOff size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
