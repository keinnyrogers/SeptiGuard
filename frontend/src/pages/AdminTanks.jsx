import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, Clock, LayoutGrid, List, MapPin, Menu, Search } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import TankPanel from "@/components/TankPanel";
import DispatchModal from "@/components/DispatchModal";
import { useAuth } from "../context/AuthContext.jsx";

// ---------- Status threshold rules (single source of truth) ----------
// fillLevel >= 80%        -> "critical" (red)
// 70% <= fillLevel < 80%  -> "warning" (amber)
// fillLevel < 70%         -> "normal"  (green)
function statusOf(level) {
  if (level >= 80) return "critical";
  if (level >= 70) return "warning";
  return "normal";
}

const STATUS_META = {
  critical: { label: "Critical", text: "text-danger", bg: "bg-danger/15", border: "border-danger", ring: "text-danger" },
  warning: { label: "Warning", text: "text-warning", bg: "bg-warning/15", border: "border-warning", ring: "text-warning" },
  normal: { label: "Normal", text: "text-success", bg: "bg-success/15", border: "border-success", ring: "text-success" },
};

// ---------- Sample data (replace with GET /api/admin/tanks) ----------
const FIRST_NAMES = ["Christofe", "Kein", "Niel", "Jessa", "Jhanna", "Maria", "Lorenzo", "Pia", "Ramon", "Sofia", "Andres", "Lina", "Bert", "Cora", "Dante", "Eve"];
const LAST_INITIAL = ["O", "T", "P", "A", "P", "R", "M", "S", "A", "L", "B", "C", "D", "E", "F", "G"];
// 3 critical + 11 warning + 34 normal = 48
const LEVELS = [
  96, 92, 87,
  78, 77, 75, 74, 73, 72, 72, 71, 71, 70, 70,
  ...[68, 65, 63, 61, 58, 55, 52, 49, 47, 45, 43, 41, 38, 36, 33, 31, 28, 26, 24, 22, 20, 18, 15, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].slice(0, 34),
];

const TANKS = LEVELS.map((level, i) => ({
  // Single identifier: septic_systems.device_id
  id: `TNK-${String(i + 1).padStart(3, "0")}`,
  resident: `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_INITIAL[i % LAST_INITIAL.length]}.`,
  block: (i % 15) + 1,
  lot: ((i * 3) % 28) + 1,
  level,
  status: statusOf(level),
  daysUntilFull: Math.max(1, Math.round((100 - level) * 0.6)),
  installed: "Jan 15, 2023",
}));

const PER_PAGE = 8;

export default function AdminTanks() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [blockFilter, setBlockFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedTank, setSelectedTank] = useState(null);
  const [dispatchTank, setDispatchTank] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const soon = (name) => window.alert(`${name} will be connected in the next step.`);

  const counts = useMemo(() => {
    const c = { total: TANKS.length, normal: 0, warning: 0, critical: 0 };
    for (const t of TANKS) c[t.status]++;
    return c;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TANKS.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (blockFilter !== "all" && t.block !== Number(blockFilter)) return false;
      if (q) {
        const hay = `${t.id} ${t.resident} Blk ${t.block} Lot ${t.lot}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [query, statusFilter, blockFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);
  const blocks = useMemo(() => [...new Set(TANKS.map((t) => t.block))].sort((a, b) => a - b), []);

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <AdminSidebar
        open={open}
        setOpen={setOpen}
        navigate={navigate}
        user={user}
        active="Tanks"
        signOut={async () => {
          await logout();
          navigate("/");
        }}
      />
      {open && (
        <button className="fixed inset-0 z-30 bg-background/80 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu" />
      )}
      <div className="min-w-0 flex-1 lg:ml-52">
        <header className="flex h-20 items-center justify-between border-b border-border px-4 sm:px-7">
          <div className="flex items-center gap-3">
            <button className="rounded-md border border-border p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <p className="text-[10px] text-muted-foreground">
                Admin Portal <span className="px-1">›</span> Tanks
              </p>
              <h1 className="mt-1 font-display text-xl font-bold">All Septic Tanks</h1>
            </div>
          </div>
          <button onClick={() => soon("Notifications")} className="relative rounded-full bg-muted p-2" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            <b className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[8px]">5</b>
          </button>
        </header>

        <main className="mx-auto max-w-[1440px] space-y-5 p-4 sm:p-7">
          <section className="relative flex flex-col gap-4 rounded-lg border border-primary/20 bg-primary/25 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] text-primary">
                <span className="rounded border border-primary/40 px-2 py-0.5 font-semibold uppercase">Sample data</span>
                <span>Status computed from fill level</span>
              </div>
              <h2 className="font-display text-lg font-bold">Community Septic Tanks</h2>
              <p className="mt-1 text-xs text-foreground/75">Browse every tank, filter by status, and dispatch or schedule maintenance.</p>
            </div>
            <div className="flex items-center gap-3 rounded-md bg-background/40 px-4 py-3">
              <MapPin className="h-4 w-4 text-primary" />
              <div>
                <p className="text-[8px] uppercase text-muted-foreground">Location</p>
                <p className="text-[10px]">Sitio Broadway, Antipolo</p>
              </div>
            </div>
          </section>

          {/* Filters */}
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by tank ID, resident, or block/lot..."
                  style={{ paddingLeft: "3rem" }}
                  className="h-10 w-full rounded-md border border-border bg-background pl-12 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <AnimatedFilter
                  value={statusFilter}
                  onChange={(value) => {
                    setStatusFilter(value);
                    setPage(1);
                  }}
                  options={[
                    { value: "all", label: "Status: All" },
                    { value: "critical", label: "Status: Critical" },
                    { value: "warning", label: "Status: Warning" },
                    { value: "normal", label: "Status: Normal" },
                  ]}
                  ariaLabel="Filter tanks by status"
                />
                <AnimatedFilter
                  value={blockFilter}
                  onChange={(value) => {
                    setBlockFilter(value);
                    setPage(1);
                  }}
                  options={[{ value: "all", label: "Block/Lot: All" }, ...blocks.map((block) => ({ value: String(block), label: `Block ${block}` }))]}
                  ariaLabel="Filter tanks by block"
                />
                <div className="flex items-center gap-1 rounded-md border border-border bg-background p-1" aria-label="Tank view">
                  <button type="button" aria-label="Grid view" aria-pressed={viewMode === "grid"} onClick={() => setViewMode("grid")} className={`flex h-8 w-8 items-center justify-center rounded ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button type="button" aria-label="List view" aria-pressed={viewMode === "list"} onClick={() => setViewMode("list")} className={`flex h-8 w-8 items-center justify-center rounded ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Chip
                active={statusFilter === "all"}
                onClick={() => {
                  setStatusFilter("all");
                  setPage(1);
                }}
                className="bg-muted text-foreground"
              >
                <span className="text-muted-foreground">Total</span> {counts.total}
              </Chip>
              <Chip
                active={statusFilter === "normal"}
                onClick={() => {
                  setStatusFilter("normal");
                  setPage(1);
                }}
                className="border-success/40 text-success"
              >
                <i className="h-2 w-2 rounded-full bg-success" /> Normal {counts.normal}
              </Chip>
              <Chip
                active={statusFilter === "warning"}
                onClick={() => {
                  setStatusFilter("warning");
                  setPage(1);
                }}
                className="border-warning/40 text-warning"
              >
                <i className="h-2 w-2 rounded-full bg-warning" /> Warning {counts.warning}
              </Chip>
              <Chip
                active={statusFilter === "critical"}
                onClick={() => {
                  setStatusFilter("critical");
                  setPage(1);
                }}
                className="border-danger/40 text-danger"
              >
                <i className="h-2 w-2 rounded-full bg-danger" /> Critical {counts.critical}
              </Chip>
            </div>
          </div>

          {/* Tank grid */}
          {pageItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
              <p className="text-sm font-medium">No tanks match these filters</p>
              <p className="mt-1 text-xs text-muted-foreground">Try another search or reset the selected filters.</p>
              <button type="button" onClick={() => { setQuery(""); setStatusFilter("all"); setBlockFilter("all"); setPage(1); }} className="mt-4 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-muted">
                Clear filters
              </button>
            </div>
          ) : viewMode === "list" ? (
            <div className="overflow-x-auto rounded-lg border border-border bg-card">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="border-b border-border text-[10px] uppercase text-muted-foreground">
                  <tr><th className="px-4 py-3">Tank</th><th>Resident</th><th>Block / Lot</th><th>Fill</th><th>Status</th><th className="text-right">Actions</th></tr>
                </thead>
                <tbody>
                  {pageItems.map((tank) => (
                    <tr key={tank.id} className="border-b border-border/70 last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-primary">{tank.id}</td>
                      <td>{tank.resident}</td>
                      <td className="text-muted-foreground">Blk {tank.block}, Lot {tank.lot}</td>
                      <td>{tank.level}%</td>
                      <td><span className={`rounded-md px-2 py-1 text-[10px] font-medium ${STATUS_META[tank.status].bg} ${STATUS_META[tank.status].text}`}>{STATUS_META[tank.status].label}</span></td>
                      <td className="px-4 py-3 text-right">
                        <button type="button" onClick={() => setSelectedTank(tank)} className="rounded-md border border-border px-2.5 py-1.5 text-[10px] hover:bg-muted">Details</button>
                        <button type="button" onClick={() => setDispatchTank({ ...tank, address: `Blk ${tank.block} Lot ${tank.lot}, Broadway`, action: tank.status === "critical" ? "Dispatch" : "Schedule" })} className="ml-2 rounded-md bg-primary px-2.5 py-1.5 text-[10px] text-primary-foreground">{tank.status === "critical" ? "Dispatch" : "Schedule"}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {pageItems.map((t) => (
                <TankCard
                  key={t.id}
                  tank={t}
                  onView={() => setSelectedTank(t)}
                  onSchedule={() => setDispatchTank({ ...t, address: `Blk ${t.block} Lot ${t.lot}, Broadway`, action: t.status === "critical" ? "Dispatch" : "Schedule" })}
                />
              ))}
            </div>
          )}

          {selectedTank && (
            <TankPanel
              tank={selectedTank}
              onClose={() => setSelectedTank(null)}
              onAction={(label) => {
                soon(label);
                setSelectedTank(null);
              }}
            />
          )}
          <DispatchModal
            tank={dispatchTank}
            onClose={() => setDispatchTank(null)}
            onConfirm={({ tankId, contractor, date }) => window.alert(`Demo: ${tankId} desludging scheduled with ${contractor} for ${date}.`)}
          />

          {/* Pagination */}
          <div className="flex flex-col items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row">
            <p className="text-[10px] text-muted-foreground">
              Showing {pageItems.length === 0 ? 0 : (safePage - 1) * PER_PAGE + 1}–{(safePage - 1) * PER_PAGE + pageItems.length} of {filtered.length} tanks
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={safePage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex h-9 items-center gap-1 rounded-md border border-border px-3 text-[10px] hover:bg-muted disabled:opacity-40"
              >
                ‹ Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(0, 5)
                .map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-[10px] ${
                      n === safePage ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              {totalPages > 5 && <span className="px-1 text-muted-foreground">…</span>}
              <button
                disabled={safePage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex h-9 items-center gap-1 rounded-md border border-border px-3 text-[10px] hover:bg-muted disabled:opacity-40"
              >
                Next ›
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Chip({ active, onClick, className, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-medium transition ${
        active ? "border-primary bg-primary/15 text-primary" : `bg-transparent ${className}`
      }`}
    >
      {children}
    </button>
  );
}

function AnimatedFilter({ value, onChange, options, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 min-w-32 items-center justify-between gap-3 rounded-md border border-border bg-background px-3 text-xs text-foreground transition-colors hover:border-primary focus:border-primary focus:outline-none"
      >
        {selected.label}
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} aria-label="Close filter menu" />
          <div className="absolute right-0 top-full z-20 mt-1 min-w-full overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg">
            {options.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`block w-full whitespace-nowrap rounded px-3 py-2 text-left text-xs transition-colors hover:bg-muted ${
                  option.value === value ? "bg-primary/15 text-primary" : ""
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TankCard({ tank, onView, onSchedule }) {
  const meta = STATUS_META[tank.status];
  const circ = 2 * Math.PI * 42;
  const dash = (tank.level / 100) * circ;
  const actionLabel = tank.status === "critical" ? "Dispatch" : "Schedule";
  return (
    <div className={`relative overflow-hidden rounded-lg border border-border bg-card p-4 ${tank.status !== "normal" ? `border-l-4 ${meta.border}` : ""}`}>
      <div className="flex items-start justify-between">
        <span className="font-display text-xs font-semibold text-primary">{tank.id}</span>
        <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${meta.bg} ${meta.text}`}>{meta.label}</span>
      </div>
      <div className="mt-2">
        <p className="text-xs font-medium">
          Blk {tank.block}, Lot {tank.lot}
        </p>
        <p className="text-[10px] text-muted-foreground">{tank.resident}</p>
      </div>
      <div className="relative mx-auto my-3 h-24 w-24">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r="42" fill="none" stroke="currentColor" strokeWidth="12" className="text-muted" />
          <circle
            cx="60"
            cy="60"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            className={meta.ring}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <b className="font-display text-xl">{tank.level}%</b>
          <span className="text-[8px] text-muted-foreground">FILL</span>
        </div>
      </div>
      <div className={`flex items-center justify-center gap-1.5 rounded-md bg-muted/60 px-2 py-2 text-[10px] ${meta.text}`}>
        <Clock className="h-3.5 w-3.5" />
        <span className="text-muted-foreground">Until full:</span>
        <b>{tank.daysUntilFull} days</b>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={onView}
          className="flex-1 rounded-md border border-border bg-muted px-3 py-2 text-[10px] font-medium hover:bg-muted/70"
        >
          View Details
        </button>
        <button
          onClick={onSchedule}
          className={`flex-1 rounded-md px-3 py-2 text-[10px] font-medium ${
            tank.status === "normal" ? "border border-border bg-muted text-foreground hover:bg-muted/70" : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
