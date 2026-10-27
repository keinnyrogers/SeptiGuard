import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, Cpu, UserPlus, AlertTriangle, Pencil, Eye, Check, X, Menu } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { formatResidentAddress } from "@/lib/addresses";
import ResidentPanel from "@/components/ResidentPanel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  createAdminResident,
  deactivateAdminResident,
  fetchAdminInformationChangeRequests,
  fetchAdminResidents,
  reviewAdminInformationChangeRequest,
  updateAdminResidentApproval,
} from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

const ACCOUNT_BADGE = {
  pending: "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  rejected: "bg-danger/15 text-danger",
  inactive: "bg-muted text-muted-foreground",
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
  const [activeSection, setActiveSection] = useState("residents");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [panelMode, setPanelMode] = useState("view");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [approvalError, setApprovalError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [informationRequests, setInformationRequests] = useState([]);
  const [informationRequestsLoading, setInformationRequestsLoading] = useState(true);
  const [informationRequestsError, setInformationRequestsError] = useState("");
  const [reviewingRequestId, setReviewingRequestId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [residentToDeactivate, setResidentToDeactivate] = useState(null);
  const [deactivationError, setDeactivationError] = useState("");
  const [creatingResident, setCreatingResident] = useState(false);
  const [createResidentError, setCreateResidentError] = useState("");
  const [createResidentSuccess, setCreateResidentSuccess] = useState("");
  const [newResident, setNewResident] = useState({
    name: "",
    email: "",
    address: "",
    contact_number: "",
    password: "",
    password_confirmation: "",
  });

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

    fetchAdminInformationChangeRequests(token)
      .then((items) => {
        if (isCurrent) setInformationRequests(items);
      })
      .catch((error) => {
        if (isCurrent) setInformationRequestsError(error.message);
      })
      .finally(() => {
        if (isCurrent) setInformationRequestsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [token, reloadKey]);

  const inTab = (r, t) => {
    if (t === "active") return r.status === "approved" && r.is_active;
    if (t === "pending") return r.status === "pending";
    if (t === "flagged") return r.status === "rejected";
    if (t === "inactive") return r.status === "inactive";
    return true;
  };

  const counts = useMemo(() => {
    const c = {};
    ["all", "active", "pending", "flagged", "inactive"].forEach((t) => (c[t] = residents.filter((r) => inTab(r, t)).length));
    c.sensors = residents.filter((r) => r.tank_status !== null).length;
    return c;
  }, [residents]);
  const pendingInformationRequests = informationRequests.filter((request) => request.status === "pending").length;

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

  async function reviewInformationRequest(requestId, status) {
    setReviewingRequestId(requestId);
    setInformationRequestsError("");
    try {
      const result = await reviewAdminInformationChangeRequest(token, requestId, status);
      setInformationRequests((requests) =>
        requests.map((item) => (item.id === requestId ? result.data : item)),
      );
    } catch (error) {
      setInformationRequestsError(error.message);
    } finally {
      setReviewingRequestId(null);
    }
  }

  async function deactivateResident(resident) {
    setUpdatingId(resident.id);
    setDeactivationError("");
    try {
      const result = await deactivateAdminResident(token, resident.id);
      setResidents((prev) => prev.map((item) => (item.id === resident.id ? result.data : item)));
      setResidentToDeactivate(null);
    } catch (error) {
      setDeactivationError(error.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleCreateResident(event) {
    event.preventDefault();
    setCreatingResident(true);
    setCreateResidentError("");
    setCreateResidentSuccess("");
    try {
      const result = await createAdminResident(token, newResident);
      setResidents((prev) => [result.data, ...prev]);
      setCreateResidentSuccess("Resident account created and approved. Share the initial password with the resident privately.");
      setCreateOpen(false);
      setNewResident({
        name: "",
        email: "",
        address: "",
        contact_number: "",
        password: "",
        password_confirmation: "",
      });
    } catch (error) {
      setCreateResidentError(error.message);
    } finally {
      setCreatingResident(false);
    }
  }

  function changeCreateOpen(open) {
    if (creatingResident) return;
    setCreateOpen(open);
    setCreateResidentError("");
    if (!open) {
      setNewResident({
        name: "",
        email: "",
        address: "",
        contact_number: "",
        password: "",
        password_confirmation: "",
      });
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
          if (await logout()) navigate("/admin/login");
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
          {activeSection === "residents" && (
            <button type="button" onClick={() => { setCreateResidentSuccess(""); setCreateOpen(true); }} className="flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90 sm:h-10 sm:gap-2 sm:px-4 sm:text-sm">
              <UserPlus className="h-4 w-4" /> <span className="whitespace-nowrap">Add Resident</span>
            </button>
          )}
        </header>
        <div className="px-5 py-6 md:px-8">

        <div className="mb-6 flex flex-wrap gap-2 border-b border-border">
          <button
            type="button"
            aria-pressed={activeSection === "residents"}
            onClick={() => setActiveSection("residents")}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeSection === "residents"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Residents
          </button>
          <button
            type="button"
            aria-pressed={activeSection === "requests"}
            onClick={() => setActiveSection("requests")}
            className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeSection === "requests"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Information change requests
            {pendingInformationRequests > 0 && (
              <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs text-warning">
                {pendingInformationRequests}
              </span>
            )}
          </button>
        </div>

        {activeSection === "residents" && (
          <>
        {createResidentSuccess && <p role="status" className="mt-2 rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">{createResidentSuccess}</p>}

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
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by resident name, house number, or tank ID..." className={`${field} h-11 bg-card pl-9`} />
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
                {["Resident", "Address", "Tank ID", "Fill Level", "Account Status", "Tank Status", "Last Activity", "Actions"].map((h) => (
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
                  <td className="px-4 py-3 text-xs">{formatResidentAddress(r.block_lot) ?? "Address not set"}</td>
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
                          {r.status === "approved" && (
                            <button
                              type="button"
                              disabled={updatingId === r.id}
                              onClick={() => {
                                setDeactivationError("");
                                setResidentToDeactivate(r);
                              }}
                              className="flex items-center gap-1 rounded-md bg-danger/15 px-2.5 py-1 text-xs font-medium text-danger hover:bg-danger/25 disabled:opacity-50"
                            >
                              <X className="h-3.5 w-3.5" />Deactivate
                            </button>
                          )}
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
          </>
        )}

        {activeSection === "requests" && (
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-4">
            <h2 className="font-display text-base font-semibold">Information change requests</h2>
            <p className="mt-1 text-xs text-muted-foreground">Approving a request updates the resident account. “Other” requests should be handled manually before marking resolved.</p>
          </div>
          {informationRequestsError && <p role="alert" className="mx-4 mt-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{informationRequestsError}</p>}
          {informationRequestsLoading ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Loading information change requests…</p>
          ) : informationRequests.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No information change requests.</p>
          ) : (
            <ul className="divide-y divide-border">
              {informationRequests.map((request) => {
                const fieldName = {
                  name: "Full name",
                  email: "Email address",
                  phone: "Phone number",
                  address: "Registered address",
                  household: "Household members",
                  other: "Other",
                }[request.field] ?? request.field;
                return (
                  <li key={request.id} className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{request.resident?.name ?? "Resident"}</p>
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${
                          request.status === "pending"
                            ? "bg-warning/15 text-warning"
                            : request.status === "approved"
                              ? "bg-success/15 text-success"
                              : "bg-danger/15 text-danger"
                        }`}>{request.status}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{request.resident?.email} · {fieldName}</p>
                      <p className="break-words text-sm">
                        {request.current_value ? `${request.current_value} → ` : ""}<span className="font-medium">{request.requested_value}</span>
                      </p>
                      {request.reason && <p className="text-xs text-muted-foreground">Reason: {request.reason}</p>}
                    </div>
                    {request.status === "pending" && (
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          disabled={reviewingRequestId === request.id}
                          onClick={() => reviewInformationRequest(request.id, "rejected")}
                          className="rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          disabled={reviewingRequestId === request.id}
                          onClick={() => reviewInformationRequest(request.id, "approved")}
                          className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                        >
                          {reviewingRequestId === request.id ? "Saving…" : request.field === "other" ? "Mark resolved" : "Approve"}
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        )}
        </div>
      </main>

      {selectedResident && (
        <ResidentPanel
          resident={selectedResident}
          mode={panelMode}
          onClose={() => setSelectedResident(null)}
          onModeChange={setPanelMode}
          onSave={handleResidentSave}
          onApproval={(status) => setStatus(selectedResident.id, status)}
          updating={updatingId === selectedResident.id}
        />
      )}

      <Dialog open={createOpen} onOpenChange={changeCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Add resident account</DialogTitle>
            <DialogDescription>
              Accounts added by the HOA are approved immediately. Public sign-ups still require HOA approval.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateResident}>
            <div className="space-y-2">
              <label htmlFor="new-resident-name" className="text-sm font-medium">Full name</label>
              <input id="new-resident-name" autoComplete="name" required maxLength={255} value={newResident.name} onChange={(event) => setNewResident((current) => ({ ...current, name: event.target.value }))} className={field} />
            </div>
            <div className="space-y-2">
              <label htmlFor="new-resident-email" className="text-sm font-medium">Email address</label>
              <input id="new-resident-email" type="email" autoComplete="email" required maxLength={255} value={newResident.email} onChange={(event) => setNewResident((current) => ({ ...current, email: event.target.value }))} className={field} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="new-resident-address" className="text-sm font-medium">House number</label>
                <input id="new-resident-address" autoComplete="off" required maxLength={60} placeholder="e.g. 12" value={newResident.address} onChange={(event) => setNewResident((current) => ({ ...current, address: event.target.value }))} className={field} />
                <p className="mt-1 text-xs text-muted-foreground">The HOA address is added automatically.</p>
              </div>
              <div className="space-y-2">
                <label htmlFor="new-resident-phone" className="text-sm font-medium">Contact number</label>
                <input id="new-resident-phone" type="tel" autoComplete="tel" required maxLength={20} value={newResident.contact_number} onChange={(event) => setNewResident((current) => ({ ...current, contact_number: event.target.value }))} className={field} />
              </div>
            </div>
            <div className="rounded-md border border-border bg-background/50 p-3 text-xs text-muted-foreground">
              Set a temporary password with at least 8 characters, then give it to the resident privately. They can change it after signing in.
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="new-resident-password" className="text-sm font-medium">Temporary password</label>
                <input id="new-resident-password" type="password" autoComplete="new-password" required minLength={8} value={newResident.password} onChange={(event) => setNewResident((current) => ({ ...current, password: event.target.value }))} className={field} />
              </div>
              <div className="space-y-2">
                <label htmlFor="new-resident-password-confirmation" className="text-sm font-medium">Confirm password</label>
                <input id="new-resident-password-confirmation" type="password" autoComplete="new-password" required minLength={8} value={newResident.password_confirmation} onChange={(event) => setNewResident((current) => ({ ...current, password_confirmation: event.target.value }))} className={field} />
              </div>
            </div>
            {createResidentError && <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{createResidentError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={creatingResident} onClick={() => changeCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={creatingResident}>{creatingResident ? "Creating…" : "Create approved account"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={residentToDeactivate !== null}
        onOpenChange={(open) => {
          if (!open && updatingId === null) {
            setResidentToDeactivate(null);
            setDeactivationError("");
          }
        }}
      >
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader>
            <span className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-danger/10 text-danger">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <DialogTitle className="font-display">Deactivate resident account?</DialogTitle>
            <DialogDescription>
              {residentToDeactivate && (
                <>
                  <span className="font-medium text-foreground">{residentToDeactivate.name}</span> will no longer be able to sign in.
                  Their tank device will be unpaired, but their account history and records will be kept.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {deactivationError && (
            <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {deactivationError}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={updatingId !== null}
              onClick={() => {
                setResidentToDeactivate(null);
                setDeactivationError("");
              }}
            >
              Keep account
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!residentToDeactivate || updatingId === residentToDeactivate.id}
              onClick={() => residentToDeactivate && deactivateResident(residentToDeactivate)}
            >
              {residentToDeactivate && updatingId === residentToDeactivate.id ? "Deactivating…" : "Deactivate account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
