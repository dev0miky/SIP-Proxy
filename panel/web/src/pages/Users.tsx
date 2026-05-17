import { useEffect, useState, type FormEvent } from "react";
import * as Users from "@/api/users";
import { Trash2, KeyRound } from "lucide-react";

export default function UsersPage() {
  const [rows, setRows] = useState<Users.User[]>([]);
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const refresh = () => Users.list().then(setRows);
  useEffect(() => {
    refresh();
  }, []);
  const add = async (e: FormEvent) => {
    e.preventDefault();
    await Users.create({ username: u, password: p });
    setU("");
    setP("");
    refresh();
  };
  const reset = async (id: number) => {
    const pwd = prompt("new password?");
    if (pwd) {
      await Users.resetPassword(id, pwd);
      refresh();
    }
  };
  const remove = async (id: number) => {
    if (confirm("delete user?")) {
      await Users.remove(id);
      refresh();
    }
  };
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Users</h1>
      <form onSubmit={add} className="flex gap-2">
        <input
          className="px-3 py-1.5 bg-muted rounded border border-border"
          placeholder="username"
          value={u}
          onChange={e => setU(e.target.value)}
          required
        />
        <input
          className="px-3 py-1.5 bg-muted rounded border border-border"
          placeholder="password"
          value={p}
          onChange={e => setP(e.target.value)}
          required
        />
        <button className="bg-accent text-white px-3 py-1.5 rounded">add</button>
      </form>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left opacity-60">
            <th>user</th>
            <th>domain</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="border-t border-border">
              <td className="py-1.5">{r.username}</td>
              <td>{r.domain}</td>
              <td className="text-right space-x-3">
                <button onClick={() => reset(r.id)} className="opacity-70 hover:opacity-100" aria-label="reset password">
                  <KeyRound size={14} />
                </button>
                <button onClick={() => remove(r.id)} className="text-red-500 opacity-70 hover:opacity-100" aria-label="delete">
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
