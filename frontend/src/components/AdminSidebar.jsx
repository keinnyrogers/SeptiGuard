import {
  Gauge,
  Boxes,
  MessageSquare,
  Users,
  FileText,
  Cpu,
  Settings,
  ShieldCheck,
  LogOut,
  X,
} from "lucide-react";

const NAV = [
  { icon: Gauge, label: "Dashboard", to: "/admin/dashboard" },
  { icon: Boxes, label: "Tanks", to: "/admin/tanks" },
  { icon: MessageSquare, label: "Complaints", to: "/admin/complaints" },
  { icon: Users, label: "Residents", to: "/admin/residents" },
  { icon: FileText, label: "Reports" },
  { icon: Cpu, label: "Devices" },
  { icon: Settings, label: "Settings" },
];

// In your app, pass navigate from react-router-dom's useNavigate(), plus user/signOut from your auth.
export function AdminSidebar({
  open = false,
  setOpen = () => {},
  navigate = (to) => window.location.assign(to),
  user,
  signOut = () => {},
  active = "Complaints",
  soon = (label) => window.alert(`${label} is coming soon`),
}) {
  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-52 flex-col border-r border-border bg-card px-3 py-5 transition duration-200 ease-out lg:translate-x-0 lg:opacity-100 ${open ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none lg:pointer-events-auto"}`}>
      <div className="mb-5 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </span>
          <strong className="font-display text-sm">SeptiGuard</strong>
        </div>
        <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => (
          (() => {
            const isActive = item.label === active;
            return (
          <button
            key={item.label}
            onClick={() => (isActive ? setOpen(false) : item.to ? navigate(item.to) : soon(item.label))}
            className={`flex h-10 items-center gap-3 rounded-md px-3 text-xs font-medium ${
              isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
            );
          })()
        ))}
      </nav>

      <div className="flex items-center gap-2 border-t border-border pt-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-[10px] text-primary">
          AU
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium">{user?.name || "Admin User"}</p>
          <p className="text-[9px] text-muted-foreground">HOA Officer</p>
        </div>
        <button onClick={signOut} title="Sign out" className="p-2 text-muted-foreground hover:text-danger">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
