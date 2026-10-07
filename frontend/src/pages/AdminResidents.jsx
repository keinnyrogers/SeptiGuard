import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, Cpu, UserPlus, AlertTriangle, Pencil, Eye, Check, X, Menu } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import ResidentPanel from "@/components/ResidentPanel";
import { fetchAdminResidents, updateAdminResidentApproval } from "../api.js";
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

export default function AdminResidents() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [residents, setResidents] = useState([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [panelMode, setPanelMode] = useState("view");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [approvalError, setApprovalError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    if (!token) {
      return () => {
        isCurrent = false;
      };
    }

    fetchAdminResidents(token)
      .then((items) => {
        if (isCurrent) setResidents(items);
      })
      .catch((error) => {
        if (isCurrent) setLoadError(error.message);
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [token, reloadKey]);

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

  async function setStatus(id, status) {
    setUpdatingId(id);
    setApprovalError("");
    try {
      const result = await updateAdminResidentApproval(token, id, status);
      setResidents((prev) => prev.map((resident) => (resident.id === id ? result.data : resident)));
    } catch (error) {
      setApprovalError(error.message);
    } finally {
      setUpdatingId(null);
    }
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
  const requestError = token ? loadError : "Sign in with an HOA admin account to view resident registrations.";
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
      <main className="min-w-0 flex-1 lg:ml-52">
        <header className="flex min-h-20 items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu" className="shrink-0 rounded-md border border-border p-2 lg:hidden"><Menu className="h-4 w-4" /></button>
            <div className="min-w-0">
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">Admin Portal › Residents</p>
              <h1 className="mt-1 font-display text-lg font-bold sm:text-xl">Resident &amp; Household Management</h1>
            </div>
          </div>
          <button onClick={() => navigate("/register")} className="flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90 sm:h-10 sm:gap-2 sm:px-4 sm:text-sm">
            <UserPlus className="h-4 w-4" /> <span className="whitespace-nowrap">Open Sign-up</span>
          </button>
        </header>
        <div className="px-5 py-6 md:px-8">

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

        {approvalError && <p role="alert" className="mt-4 rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{approvalError}</p>}

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
              {token && loading && <tr><td colSpan={8} className="p-10 text-center text-sm text-muted-foreground">Loading resident accounts…</td></tr>}
              {(!token || (!loading && loadError)) && <tr><td colSpan={8} className="p-10 text-center"><p role="alert" className="text-sm text-danger">{requestError}</p>{token && <button type="button" onClick={() => { setLoading(true); setLoadError(""); setReloadKey((key) => key + 1); }} className="mt-3 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-muted">Try again</button>}</td></tr>}
              {token && !loading && !loadError && visible.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">{initials(r.name)}</span>
                      <div><p className="font-medium">{r.name}</p><p className="text-xs text-muted-foreground">{r.role}{r.status === "approved" && !r.is_active && " · Inactive"}</p></div>
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
                          <button disabled={updatingId === r.id} onClick={() => setStatus(r.id, "approved")} className="flex items-center gap-1 rounded-md bg-success/15 px-2.5 py-1 text-xs font-medium text-success hover:bg-success/25 disabled:cursor-wait disabled:opacity-50"><Check className="h-3.5 w-3.5" />{updatingId === r.id ? "Saving…" : "Approve"}</button>
                          <button disabled={updatingId === r.id} onClick={() => setStatus(r.id, "rejected")} className="flex items-center gap-1 rounded-md bg-danger/15 px-2.5 py-1 text-xs font-medium text-danger hover:bg-danger/25 disabled:cursor-wait disabled:opacity-50"><X className="h-3.5 w-3.5" />Reject</button>
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
              {token && !loading && !loadError && visible.length === 0 && (
                <tr><td colSpan={8} className="p-10 text-center">
                  <p className="text-sm font-medium">{residents.length === 0 ? "No residents registered" : "No residents match these filters"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{residents.length === 0 ? "Add a household account to begin managing residents." : "Try another search or return to all residents."}</p>
                  {residents.length === 0 ? (
                    <button type="button" onClick={() => navigate("/register")} className="mt-3 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">Open resident sign-up</button>
                  ) : (
                    <button type="button" onClick={() => { setQuery(""); setTab("all"); }} className="mt-3 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-muted">Clear filters</button>
                  )}
                </td></tr>
              )}
            </tbody>
          </table>
          <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">{token && loading ? "Loading residents…" : token && !loadError ? `Showing ${visible.length} of ${residents.length} residents` : ""}</p>
        </div>
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

    </div>
  );
}
