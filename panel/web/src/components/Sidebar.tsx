import { NavLink } from "react-router-dom";
import { useTheme } from "@/theme";
import { Sun, Moon, LogOut } from "lucide-react";
import { api } from "@/api/client";

const groups = [
  {
    label: "Manage",
    items: [
      { to: "/users", label: "Users" },
      { to: "/regs", label: "Registrations" },
      { to: "/dids", label: "DID map" },
      { to: "/trunk", label: "Trunk" },
    ],
  },
  {
    label: "Live",
    items: [
      { to: "/calls", label: "Active calls" },
      { to: "/history", label: "Call history" },
    ],
  },
  { label: "System", items: [{ to: "/health", label: "Health" }] },
];

export function Sidebar({ user }: { user: string }) {
  const { theme, toggle } = useTheme();
  const logout = async () => {
    await api("/api/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/login";
  };
  return (
    <aside className="w-56 border-r border-border bg-muted/30 flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="font-semibold text-accent">sip-proxy</span>
        <button onClick={toggle} aria-label="toggle theme">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {groups.map(g => (
          <div key={g.label} className="mb-3">
            <div className="px-4 pb-1 text-[10px] uppercase opacity-60 tracking-wide">{g.label}</div>
            {g.items.map(i => (
              <NavLink
                key={i.to}
                to={i.to}
                className={({ isActive }) =>
                  `block px-4 py-1.5 text-sm border-l-2 ${
                    isActive ? "bg-accent/15 border-accent pl-[14px]" : "border-transparent"
                  }`
                }
              >
                {i.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-border px-4 py-2 flex items-center justify-between text-xs">
        <span className="opacity-70">{user}</span>
        <button onClick={logout} aria-label="logout" className="opacity-70 hover:opacity-100">
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}
