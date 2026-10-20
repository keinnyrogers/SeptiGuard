import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, Bell, Bot, CalendarDays, FileWarning,
  Home, LogOut, Menu, ShieldCheck, UserRound, Wrench,
  CheckCircle2, Clock, RefreshCw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import ResidentEmptyPage from "../components/ResidentEmptyPage.jsx";
import RequestMaintenancePanel from "../components/RequestMaintenancePanel.jsx";
import { fetchResidentComplaints, fetchResidentTankLatest } from "../api.js";
import ResidentAvatar from "../components/ResidentAvatar.jsx";

const NAV = [
  { icon: Home,        label: "Dashboard", path: "/dashboard" },
  { icon: Activity,    label: "Monitoring", path: "/monitor" },
  { icon: Bot,         label: "Predict", path: "/predict" },
  { icon: FileWarning, label: "Complaints", path: "/complaints" },
  { icon: Wrench,      label: "Maintenance", path: "/maintain", active: true },
  { icon: Bell,        label: "Alerts", path: "/alerts" },
  { icon: UserRound,   label: "Profile", path: "/profile" },
];

function createSampleData() {
  const today = new Date();
  const dateFromToday = (days) => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return date;
  };
  const formatDate = (date) => new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
  const installationDate = new Date(today);
  installationDate.setFullYear(today.getFullYear() - 3);

  return {
    installationDate: new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(installationDate),
    lastMaintenance: formatDate(dateFromToday(-59)),
    daysSinceLast: 59,
    nextDueEstimate: formatDate(dateFromToday(10)),
    daysUntilDue: 10,
    history: [
      { date: formatDate(dateFromToday(-59)), type: "Full pump-out", status: "completed", notes: "Routine desludging, no issues found." },
      { date: formatDate(dateFromToday(-365)), type: "Inspection", status: "completed", notes: "Annual system inspection, baffles intact." },
      { date: formatDate(dateFromToday(-730)), type: "Full pump-out", status: "completed", notes: "Scheduled maintenance following HOA advisory." },
    ],
  };
}

const SAMPLE_DATA = createSampleData();

export default function Maintain() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [liveTank, setLiveTank] = useState(null);
  const demoMode = Boolean(user?.demo_mode);
  const [hasLoaded, setHasLoaded] = useState(demoMode);
  const loading = !demoMode && Boolean(token) && !hasLoaded;
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [tankError, setTankError] = useState("");
  const [requestsError, setRequestsError] = useState("");
  const [complaints, setComplaints] = useState([]);
  const data = demoMode
    ? SAMPLE_DATA
    : liveTank?.has_sensor
      ? {
        installationDate: liveTank.installation_date ? new Date(liveTank.installation_date).toLocaleDateString() : "Not recorded",
        lastMaintenance: liveTank.last_maintenance_date ? new Date(liveTank.last_maintenance_date).toLocaleDateString() : null,
      }
      : null;
  const maintenanceRequests = demoMode
    ? []
    : complaints.filter((complaint) =>
      complaint.category === "septic_tank"
      && complaint.title?.toLowerCase().startsWith("maintenance request:"));
  const [requestPanelOpen, setRequestPanelOpen] = useState(false);

  useEffect(() => {
    if (demoMode) return undefined;
    if (!token) return undefined;
    let active = true;
    let inFlight = false;
    const load = async () => {
      if (inFlight) return;
      inFlight = true;
      setRefreshing(true);
      const [tankResult, requestsResult] = await Promise.allSettled([
        fetchResidentTankLatest(token),
        fetchResidentComplaints(token),
      ]);
      if (active) {
        if (tankResult.status === "fulfilled") {
          setLiveTank(tankResult.value);
          setTankError("");
        } else {
          setTankError(tankResult.reason?.message ?? "Could not load tank details.");
        }
        if (requestsResult.status === "fulfilled") {
          setComplaints(requestsResult.value);
          setRequestsError("");
        } else {
          setRequestsError(requestsResult.reason?.message ?? "Could not load maintenance requests.");
        }
        setHasLoaded(true);
        setRefreshing(false);
      }
      inFlight = false;
    };

    load();
    const interval = window.setInterval(load, 30000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [token, demoMode, refreshKey]);

  const soon = (name) => window.alert(`${name} will be connected in the next step.`);
  const signOut = async () => { await logout(); navigate("/"); };
  const refresh = () => setRefreshKey((key) => key + 1);

  if (loading) {
    return <ResidentEmptyPage active="Maintenance" title="Maintenance History" loading />;
  }

  if (!data) {
    return (
      <ResidentEmptyPage
        active="Maintenance"
        title="Maintenance History"
        description={tankError || (!token
          ? "Your session is unavailable. Please sign in again."
          : "Tank service records appear after a septic system is linked to your household. Pair your registered device before requesting tank maintenance.")}
        actionLabel={tankError ? "Retry" : token ? "Pair device" : undefined}
        onAction={tankError ? refresh : token ? () => navigate("/profile") : undefined}
      />
    );
  }

  /* ---------- API CALL — i-uncomment kapag ready na ang backend ----------
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get("http://localhost:8000/api/septic-system/maintenance", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => setData(res.data))
    .catch(err => console.error(err));
  }, []);
  ---------------------------------------------------------------------- */

  const requestMaintenance = () => setRequestPanelOpen(true);
  /* ---------- Reuses the existing complaints endpoint ----------
    Ito ang pinaka-simpleng paraan: mag-file lang ng complaint
    na category = "septic_tank", tapos
    ang subject/description ay auto-filled na "Maintenance /
    desludging request". Ang HOA admin ang bahalang mag-review
    at mag-dispatch — tugma sa flow ng paper mo.

    axios.post("http://localhost:8000/api/complaints", {
      category: "septic_tank",
      title: "Maintenance / desludging request",
      description: "Resident is requesting scheduled maintenance for their septic tank.",
    }, { headers: { Authorization: `Bearer ${token}` } });
    ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      {/* ======================= SIDEBAR ======================= */}
      <aside className={`${open ? "flex" : "hidden"} fixed inset-y-0 left-0 z-40 w-24 flex-col border-r border-border bg-card px-2 py-5 lg:flex`}>
        <div className="mb-5 flex justify-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((x) => (
            <button
              key={x.label}
              onClick={() => {
                if (x.active) setOpen(false);
                else if (x.path) navigate(x.path);
                else soon(x.label);
              }}
              className={`relative flex h-14 flex-col items-center justify-center gap-1 rounded-md text-[10px] ${
                x.active
                  ? "bg-primary font-medium text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <x.icon className="h-4 w-4" />
              {x.label}
            </button>
          ))}
        </nav>
        <div className="flex flex-col items-center gap-2 border-t border-border pt-4">
          <ResidentAvatar />
          <button onClick={signOut} title="Sign out" className="p-2 text-muted-foreground hover:text-danger">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>
      {open && <button className="fixed inset-0 z-30 bg-background/80 lg:hidden" onClick={() => setOpen(false)} />}

      {/* ======================= MAIN ======================= */}
      <div className="page-transition min-w-0 flex-1 lg:ml-24">
        <header className="flex items-start justify-between gap-2 border-b border-border px-4 py-4 sm:px-7 sm:py-0 sm:h-20 sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button className="shrink-0 rounded-md border border-border p-2 lg:hidden" onClick={() => setOpen(true)}>
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">Resident Portal › Maintenance</p>
              <h1 className="mt-1 truncate font-display text-lg font-bold sm:text-xl">Maintenance History</h1>
            </div>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {!demoMode && (
              <button
                type="button"
                onClick={refresh}
                disabled={refreshing}
                aria-label="Refresh maintenance data"
                title="Refresh maintenance data"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-wait disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            )}
            <button
              onClick={requestMaintenance}
              className="flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground sm:px-4 sm:py-2 sm:text-sm"
            >
              <Wrench className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="whitespace-nowrap">Request Maintenance</span>
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] space-y-5 p-4 sm:p-7">
          <p className="text-xs text-muted-foreground">
            {demoMode
              ? "Sample service history for demonstration"
              : "Your recorded service date and maintenance requests"}
          </p>

          {!demoMode && tankError && (
            <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 p-3 text-xs text-danger">
              Could not refresh tank details: {tankError}
            </p>
          )}
          {!demoMode && requestsError && (
            <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 p-3 text-xs text-danger">
              Could not refresh maintenance requests: {requestsError}
            </p>
          )}
          {!demoMode && (
            <p className="text-[11px] text-muted-foreground">
              Automatically checks for updates every 30 seconds.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {demoMode ? (
              <>
                <SummaryCard icon={Wrench} label="Total Services" value={data.history.length} note={`Since ${data.installationDate}`} />
                <SummaryCard icon={Clock} label="Last Service" value={data.lastMaintenance} note={`${data.daysSinceLast} days ago`} />
                <SummaryCard icon={CalendarDays} label="Next Due" value={data.nextDueEstimate} note={`In ${data.daysUntilDue} days`} valueClass="text-primary" />
                <SummaryCard icon={CalendarDays} label="Installed" value={data.installationDate} note="Tank installation date" />
              </>
            ) : (
              <>
                <SummaryCard icon={Wrench} label="Maintenance Requests" value={maintenanceRequests.length} note="Requests submitted to your HOA" />
                <SummaryCard icon={Clock} label="Open Requests" value={maintenanceRequests.filter((request) => ["pending", "in_progress"].includes(request.status)).length} note="Pending or in progress" />
                <SummaryCard icon={CalendarDays} label="Last Recorded Service" value={data.lastMaintenance ?? "No record"} note={data.lastMaintenance ? "Recorded for your tank" : "No service date recorded"} />
                <SummaryCard icon={CalendarDays} label="Installed" value={data.installationDate} note="Tank installation date" />
              </>
            )}
          </div>

          <section className="flex items-start gap-3 rounded-lg border border-primary/25 bg-primary/5 p-4">
            <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-xs text-muted-foreground">
              Need a pump-out or inspection? Tapping{" "}
              <span className="font-medium text-foreground">Request Maintenance</span>{" "}
              sends a request directly to your HOA administrator, who will coordinate
              scheduling with an accredited service provider on your behalf.
            </p>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <h2 className="font-display font-semibold">{demoMode ? "Sample Service History" : "Maintenance Requests"}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {demoMode
                ? "Example completed service records shown in demo mode"
                : "Requests submitted to the HOA and their latest status"}
            </p>

            <div className="mt-4 space-y-2">
              {demoMode && data.history.length === 0 && (
                <p className="rounded-md border border-border bg-muted/30 p-6 text-center text-xs text-muted-foreground">
                  No maintenance records yet.
                </p>
              )}
              {demoMode && data.history.map((h, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{h.type}</p>
                      <span className="text-[11px] text-muted-foreground">{h.date}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{h.notes}</p>
                  </div>
                </div>
              ))}
              {!demoMode && maintenanceRequests.length === 0 && (
                <p className="rounded-md border border-border bg-muted/30 p-6 text-center text-xs text-muted-foreground">
                  No maintenance requests yet. Use “Request Maintenance” to ask your HOA to arrange a service.
                </p>
              )}
              {!demoMode && maintenanceRequests.map((request) => (
                <MaintenanceRequestRow key={request.id} request={request} />
              ))}
            </div>
          </section>
        </main>
      </div>
      <RequestMaintenancePanel
        open={requestPanelOpen}
        onClose={() => setRequestPanelOpen(false)}
        lastMaintenance={data.lastMaintenance}
        token={token}
        onSubmitted={refresh}
      />
    </div>
  );
}

function MaintenanceRequestRow({ request }) {
  const statusLabel = {
    pending: "Pending",
    in_progress: "In progress",
    resolved: "Completed",
    rejected: "Rejected",
  }[request.status] ?? request.status.replaceAll("_", " ");
  const statusClass = {
    pending: "border-warning/30 bg-warning/10 text-warning",
    in_progress: "border-primary/30 bg-primary/10 text-primary",
    resolved: "border-success/30 bg-success/10 text-success",
    rejected: "border-danger/30 bg-danger/10 text-danger",
  }[request.status] ?? "border-border bg-muted text-muted-foreground";
  const filedAt = request.filed_at ? new Date(request.filed_at) : null;
  const dateLabel = filedAt && !Number.isNaN(filedAt.getTime())
    ? filedAt.toLocaleDateString()
    : "Date unavailable";

  return (
    <article className="rounded-md border border-border bg-muted/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">{request.title}</p>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${statusClass}`}>
          {statusLabel}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {request.ticket_code} · Submitted {dateLabel}
      </p>
      {request.scheduled_for && (
        <p className="mt-2 text-xs font-medium text-primary">
          Scheduled service: {new Date(`${request.scheduled_for}T00:00:00`).toLocaleDateString()}
        </p>
      )}
      {request.description && (
        <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{request.description}</p>
      )}
      {request.hoa_response && (
        <p className="mt-3 rounded-md border border-border bg-background/60 p-3 text-xs">
          <span className="font-medium">HOA response: </span>{request.hoa_response}
        </p>
      )}
    </article>
  );
}

function SummaryCard({ icon: Icon, label, value, note, valueClass = "" }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="truncate text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <p className={`mt-3 truncate font-display text-lg font-bold ${valueClass}`}>{value}</p>
      <p className="mt-2 text-[9px] text-muted-foreground">{note}</p>
    </div>
  );
}
