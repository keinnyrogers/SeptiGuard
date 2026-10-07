import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, ArrowRight, Bell, Bot, CircleGauge, FileWarning, Home, LogOut, Menu, ShieldCheck, UserRound, Wrench } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const NAV = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Activity, label: "Monitoring", path: "/monitor" },
  { icon: Bot, label: "Predict", path: "/predict" },
  { icon: FileWarning, label: "Complaints", path: "/complaints" },
  { icon: Wrench, label: "Maintain", path: "/maintain" },
  { icon: Bell, label: "Alerts", path: "/alerts" },
  { icon: UserRound, label: "Profile", path: "/profile" },
];

export default function ResidentEmptyPage({ active, title, description, actionLabel, onAction }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const first = user?.name?.split(" ")[0] ?? "Resident";

  async function signOut() {
    await logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <aside className={`${menuOpen ? "flex" : "hidden"} fixed inset-y-0 left-0 z-40 w-24 flex-col border-r border-border bg-card px-2 py-5 lg:flex`}>
        <div className="mb-5 flex justify-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <button key={item.label} type="button" onClick={() => { setMenuOpen(false); navigate(item.path); }} className={`flex h-14 flex-col items-center justify-center gap-1 rounded-md text-[10px] ${item.label === active ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              <item.icon className="h-4 w-4" />{item.label}
            </button>
          ))}
        </nav>
        <div className="flex flex-col items-center gap-2 border-t border-border pt-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary text-[10px] font-semibold">{first.slice(0, 2).toUpperCase()}</div>
          <button type="button" onClick={signOut} title="Sign out" className="p-2 text-muted-foreground hover:text-danger"><LogOut className="h-4 w-4" /></button>
        </div>
      </aside>
      {menuOpen && <button type="button" className="fixed inset-0 z-30 bg-background/80 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Close menu" />}

      <div className="min-w-0 flex-1 lg:ml-24">
        <header className="flex h-20 items-center gap-3 border-b border-border px-4 sm:px-7">
          <button type="button" className="rounded-md border border-border p-2 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu className="h-4 w-4" /></button>
          <div>
            <p className="text-xs text-muted-foreground">Resident Portal › {title}</p>
            <h1 className="mt-1 font-display text-xl font-bold">{title}</h1>
          </div>
        </header>
        <main className="mx-auto max-w-[1440px] p-4 sm:p-7">
          <section className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><CircleGauge className="h-6 w-6" /></span>
            <h2 className="mt-4 font-display text-lg font-semibold">{title === "Predictions" ? "No readings to forecast yet" : "No tank linked yet"}</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
            {actionLabel && onAction && (
              <button type="button" onClick={onAction} className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                {actionLabel}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}