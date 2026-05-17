import { useEffect, useState, type FormEvent } from "react";
import * as Did from "@/api/did";
import { Trash2 } from "lucide-react";

export default function DidMapPage() {
  const [rows, setRows] = useState<Did.DidMap>({});
  const [did, setDid] = useState("");
  const [user, setUser] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const refresh = () => Did.list().then(setRows);
  useEffect(() => {
    refresh();
  }, []);
  const add = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await Did.upsert(did, user);
      setDid("");
      setUser("");
      refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "save failed");
    }
  };
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">DID → user map</h1>
      <p className="text-sm opacity-60">
        edits reload Kamailio via <code>kamcmd app_lua.reload</code> (sub-second).
      </p>
      <form onSubmit={add} className="flex gap-2">
        <input
          className="px-3 py-1.5 bg-muted rounded border border-border w-44"
          placeholder="DID digits"
          value={did}
          onChange={e => setDid(e.target.value)}
          required
        />
        <input
          className="px-3 py-1.5 bg-muted rounded border border-border w-32"
          placeholder="user"
          value={user}
          onChange={e => setUser(e.target.value)}
          required
        />
        <button className="bg-accent text-white px-3 py-1.5 rounded">save</button>
      </form>
      {err && <div className="text-red-500 text-sm">{err}</div>}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left opacity-60">
            <th>DID</th>
            <th>user</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(rows).length === 0 && (
            <tr>
              <td colSpan={3} className="py-4 opacity-50">
                no mappings
              </td>
            </tr>
          )}
          {Object.entries(rows).map(([d, u]) => (
            <tr key={d} className="border-t border-border">
              <td className="font-mono py-1.5">{d}</td>
              <td>{u}</td>
              <td className="text-right">
                <button
                  onClick={() => Did.remove(d).then(refresh)}
                  className="text-red-500 opacity-70 hover:opacity-100"
                  aria-label="delete"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
