import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, Cpu, UserPlus, AlertTriangle, Pencil, Eye, Check, X, Plus, Menu } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import ResidentPanel from "@/components/ResidentPanel";
import { SAMPLE_RESIDENTS } from "@/data/residents";
import { useAuth } from "../context/AuthContext.jsx";

const ACCOUNT_BADGE = {
  pending: "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  rejected: "bg-danger/15 text-danger",
};
const TANK_BADGE = {
  normal: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  critical: "bg-danger/15 text-danger",
};

function fillColor(v) {
  if (v >= 80) return "bg-danger";
  if (v >= 70) return "bg-warning";
  return "bg-success";
}
function initials(name) {
  return name.split(" ").slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}
function timeAgo(iso) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.round(h / 24)} d ago`;
}

const EMPTY_FORM = { name: "", email: "", phone: "", block_lot: "", tank_id: "", approve: true };

export default function AdminResidents() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [residents, setResidents] = useState(SAMPLE_RESIDENTS);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [panelMode, setPanelMode] = useState("view");
  const [form, setForm] = useState(EMPTY_FORM);

  const inTab = (r, t) => {
    if (t === "active") return r.status === "approved" && r.is_active;
    if (t === "pending") return r.status === "pending";
    if (t === "flagged") return r.status === "rejected";
    if (t === "inactive") return r.status === "approved" && !r.is_active;
    return true;
  };

  const counts = useMemo(() => {
    const c = {};
    ["all", "active", "pending", "flagged", "inactive"].forEach((t) => (c[t] = residents.filter((r) => inTab(r, t)).length));
    c.sensors = residents.filter((r) => r.tank_status !== null).length;
    return c;
  }, [residents]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return residents.filter(
      (r) => inTab(r, tab) && (!q || [r.name, r.block_lot, r.tank_id ?? ""].join(" ").toLowerCase().includes(q)),
    );
  }, [residents, tab, query]);

  const setStatus = (id, status) => setResidents((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));

  function submit(e) {
    e.preventDefault();
    // Later: POST to Laravel — creates users row (role=resident) + linked septic_systems row.
    setResidents((prev) => [
      {
        id: Date.now(),
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: "Homeowner",
        block_lot: form.block_lot,
        tank_id: form.tank_id || null,
        fill_level: null,
        tank_status: null,
        status: form.approve ? "approved" : "pending",
        is_active: true,
        last_activity: new Date().toISOString(),
      },
      ...prev,
    ]);
    setForm(EMPTY_FORM);
    setFormOpen(false);
  }

  function handleResidentSave(updatedResident) {
    setResidents((prev) =>
      prev.map((resident) =>
        resident.id === updatedResident.id ? { ...resident, ...updatedResident } : resident,
      ),
    );
    setSelectedResident(null);
  }

  const stats = [
    { label: "Total Residents", value: counts.all, sub: "One account per household", icon: Users, tone: "text-foreground", chip: "bg-primary/15 text-primary" },
    { label: "Active Sensors", value: counts.sensors, sub: `${counts.all - counts.sensors} awaiting install`, icon: Cpu, tone: "text-foreground", chip: "bg-primary/15 text-primary" },
    { label: "Pending Registrations", value: counts.pending, sub: "Awaiting approval", icon: UserPlus, tone: "text-warning", chip: "bg-warning/15 text-warning" },
    { label: "Flagged Accounts", value: counts.flagged, sub: "Rejected registrations", icon: AlertTriangle, tone: "text-danger", chip: "bg-danger/15 text-danger" },
  ];
  const tabs = [
    ["all", "All Residents"],
    ["active", "Active"],
    ["pending", "Pending Approval"],
    ["flagged", "Flagged"],
    ["inactive", "Inactive"],
  ];
  const field = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring";

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar
        open={menuOpen}
        setOpen={setMenuOpen}
        navigate={navigate}
        user={user}
        active="Residents"
        signOut={async () => {
          await logout();
          navigate("/");
        }}
      />
      <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu" className="fixed left-3 top-3 z-30 rounded-md border border-border bg-card p-2 lg:hidden"><Menu className="h-4 w-4" /></button>

      <main className="min-w-0 px-5 py-6 md:px-8 lg:ml-52">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Admin Portal <span className="mx-1">›</span><span className="text-foreground">Residents</span></p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Resident &amp; Household Management</h1>
          </div>
          <button onClick={() => setFormOpen(true)} className="flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> Add Resident
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-4">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <span className={`mt-2 flex h-8 w-8 items-center justify-center rounded-md ${s.chip}`}><s.icon className="h-4 w-4" /></span>
              <p className={`mt-2 font-display text-3xl font-bold ${s.tone}`}>{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by resident name, block/lot, or tank ID..." className={`${field} h-11 bg-card pl-9`} />
        </div>

        <div className="mt-4 flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
          {tabs.map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${tab === key ? "bg-primary/15 font-medium text-primary" : "text-muted-foreground hover:bg-muted"}`}>
              {label}<span className="rounded bg-background/60 px-1.5 text-xs">{counts[key]}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                {["Resident", "Block/Lot", "Tank ID", "Fill Level", "Account Status", "Tank Status", "Last Activity", "Actions"].map((h) => (
                  <th key={h} className={`px-4 py-3 font-medium ${h === "Actions" ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">{initials(r.name)}</span>
                      <div><p className="font-medium">{r.name}</p><p className="text-xs text-muted-foreground">{r.role}{!r.is_active && " · Inactive"}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{r.block_lot}</td>
                  <td className="px-4 py-3 font-mono text-xs text-primary">{r.tank_id ?? "—"}</td>
                  <td className="px-4 py-3">
                    {r.fill_level == null ? <span className="text-xs text-muted-foreground">No sensor</span> : (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"><div className={`h-full ${fillColor(r.fill_level)}`} style={{ width: `${r.fill_level}%` }} /></div>
                        <span className="text-xs">{r.fill_level}%</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3"><span className={`rounded-md px-2 py-1 text-xs font-medium capitalize ${ACCOUNT_BADGE[r.status]}`}>{r.status}</span></td>
                  <td className="px-4 py-3">
                    {r.tank_status ? <span className={`rounded-md px-2 py-1 text-xs font-medium capitalize ${TANK_BADGE[r.tank_status]}`}>{r.tank_status}</span> : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{timeAgo(r.last_activity)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {r.status === "pending" ? (
                        <>
                          <button onClick={() => setStatus(r.id, "approved")} className="flex items-center gap-1 rounded-md bg-success/15 px-2.5 py-1 text-xs font-medium text-success hover:bg-success/25"><Check className="h-3.5 w-3.5" />Approve</button>
                          <button onClick={() => setStatus(r.id, "rejected")} className="flex items-center gap-1 rounded-md bg-danger/15 px-2.5 py-1 text-xs font-medium text-danger hover:bg-danger/25"><X className="h-3.5 w-3.5" />Reject</button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedResident(r);
                              setPanelMode("edit");
                            }}
                            className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-primary hover:bg-muted"
                          >
                            <Pencil className="h-3.5 w-3.5" />Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedResident(r);
                              setPanelMode("view");
                            }}
                            className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted"
                          >
                            <Eye className="h-3.5 w-3.5" />View
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={8} className="p-10 text-center text-muted-foreground">No residents match the current filters.</td></tr>
              )}
            </tbody>
          </table>
          <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">Showing {visible.length} of {residents.length} residents</p>
        </div>
      </main>

      {selectedResident && (
        <ResidentPanel
          resident={selectedResident}
          mode={panelMode}
          onClose={() => setSelectedResident(null)}
          onModeChange={setPanelMode}
          onSave={handleResidentSave}
        />
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4" onClick={() => setFormOpen(false)}>
          <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-3 rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Resident</h2>
              <button type="button" onClick={() => setFormOpen(false)} aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
            {[["name", "Full name", "text"], ["email", "Email", "email"], ["phone", "Phone", "tel"], ["block_lot", "Block / Lot (e.g. Blk 3 Lot 7)", "text"], ["tank_id", "Tank assignment (e.g. TNK-052)", "text"]].map(([k, label, type]) => (
              <label key={k} className="block text-xs text-muted-foreground">{label}
                <input type={type} required={k !== "tank_id"} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className={`${field} mt-1 text-foreground`} />
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.approve} onChange={(e) => setForm({ ...form, approve: e.target.checked })} className="accent-primary" />
              Approve immediately (otherwise saved as pending)
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setFormOpen(false)} className="h-9 rounded-md border border-border px-4 text-sm hover:bg-muted">Cancel</button>
              <button type="submit" className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">Create Resident</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
