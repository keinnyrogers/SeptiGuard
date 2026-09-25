import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNowStrict, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import {
  Search,
  SlidersHorizontal,
  CalendarDays,
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle2,
  MoreHorizontal,
  ChevronDown,
  Menu,
} from "lucide-react";

import { AdminSidebar } from "@/components/AdminSidebar";
import { ComplaintPanel } from "@/components/ComplaintPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "../context/AuthContext.jsx";
import {
  CATEGORY_LABELS,
  SAMPLE_DATA,
  STATUS_LABELS,
} from "@/data/complaints";

const PRIORITY_BORDER = {
  high: "border-l-danger",
  medium: "border-l-warning",
  low: "border-l-success",
};

const PRIORITY_BADGE = {
  high: "bg-danger/15 text-danger",
  medium: "bg-warning/15 text-warning",
  low: "bg-success/15 text-success",
};

const STATUS_BADGE = {
  pending: "bg-danger/10 text-danger",
  in_progress: "bg-warning/10 text-warning",
  resolved: "bg-success/10 text-success",
};

const STATUS_DOT = {
  pending: "bg-danger",
  in_progress: "bg-warning",
  resolved: "bg-success",
};

function initials(name) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function AdminComplaints() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState(SAMPLE_DATA);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [priority, setPriority] = useState("all");
  const [range, setRange] = useState();
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState("newest");
  const [active, setActive] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const counts = useMemo(
    () => ({
      all: complaints.length,
      pending: complaints.filter((c) => c.status === "pending").length,
      in_progress: complaints.filter((c) => c.status === "in_progress").length,
      resolved: complaints.filter((c) => c.status === "resolved").length,
    }),
    [complaints],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = complaints.filter((c) => {
      if (tab !== "all" && c.status !== tab) return false;
      if (category !== "all" && c.category !== category) return false;
      if (priority !== "all" && c.priority !== priority) return false;
      const filed = new Date(c.filed_at);
      if (range?.from && isBefore(filed, startOfDay(range.from))) return false;
      if (range?.to && isAfter(filed, endOfDay(range.to))) return false;
      if (!q) return true;
      return [c.ticket_code, c.resident_name, c.tank_id ?? "", c.title, c.description, c.location]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });

    const weight = { high: 3, medium: 2, low: 1 };
    return [...list].sort((a, b) => {
      if (sort === "oldest")
        return new Date(a.filed_at).getTime() - new Date(b.filed_at).getTime();
      if (sort === "priority") return weight[b.priority] - weight[a.priority];
      return new Date(b.filed_at).getTime() - new Date(a.filed_at).getTime();
    });
  }, [complaints, tab, category, priority, range, query, sort]);

  function openPanel(complaint) {
    setActive(complaint);
    setPanelOpen(true);
  }

  function handleSave(id, values) {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              ...values,
              resolved_at:
                values.status === "resolved" ? (c.resolved_at ?? new Date().toISOString()) : null,
            }
          : c,
      ),
    );
    setPanelOpen(false);
  }

  const stats = [
    {
      label: "Total Complaints",
      value: counts.all,
      sub: "This month",
      icon: MessageSquare,
      tone: "text-foreground",
      chip: "bg-secondary text-muted-foreground",
    },
    {
      label: "Pending",
      value: counts.pending,
      sub: "Awaiting response",
      icon: AlertCircle,
      tone: "text-danger",
      chip: "bg-danger/15 text-danger",
    },
    {
      label: "In Progress",
      value: counts.in_progress,
      sub: "Being handled",
      icon: Clock,
      tone: "text-warning",
      chip: "bg-warning/15 text-warning",
    },
    {
      label: "Resolved",
      value: counts.resolved,
      sub: "This month",
      icon: CheckCircle2,
      tone: "text-success",
      chip: "bg-success/15 text-success",
    },
  ];

  const tabs = [
    { key: "all", label: "All", count: counts.all },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "in_progress", label: "In Progress", count: counts.in_progress },
    { key: "resolved", label: "Resolved", count: counts.resolved },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar
        open={menuOpen}
        setOpen={setMenuOpen}
        navigate={navigate}
        user={user}
        signOut={async () => {
          await logout();
          navigate("/");
        }}
      />
      <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu" className="fixed left-3 top-3 z-30 rounded-md border border-border bg-card p-2 lg:hidden"><Menu className="h-4 w-4" /></button>

      <main className="page-transition min-w-0 px-5 py-6 md:px-8 lg:ml-52">
        <p className="text-sm text-muted-foreground">
          Admin Portal <span className="mx-1">›</span>
          <span className="text-foreground">Complaints</span>
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          Complaints Management
        </h1>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <span className={cn("rounded-md p-1.5", s.chip)}>
                  <s.icon className="h-4 w-4" />
                </span>
              </div>
              <p className={cn("mt-3 font-display text-3xl font-bold", s.tone)}>{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-4 rounded-lg border border-border bg-card p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by complaint ID, resident, tank, or keyword..."
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Select
                value={category}
                onValueChange={setCategory}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue>
                    {category === "all" ? "Category" : CATEGORY_LABELS[category]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {Object.keys(CATEGORY_LABELS).map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={priority}
                onValueChange={setPriority}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue>
                    {priority === "all"
                      ? "Priority"
                      : priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {range?.from
                      ? `${range.from.toLocaleDateString()}${range.to ? ` – ${range.to.toLocaleDateString()}` : ""}`
                      : "Date Range"}
                    <ChevronDown className="h-4 w-4 opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={range}
                    onSelect={setRange}
                    numberOfMonths={1}
                    className={cn("pointer-events-auto p-3")}
                  />
                  <div className="border-t border-border p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setRange(undefined)}
                    >
                      Clear dates
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                More Filters
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                    tab === t.key
                      ? "bg-primary/15 font-medium text-primary"
                      : "text-muted-foreground hover:bg-secondary",
                  )}
                >
                  {t.key !== "all" && (
                    <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[t.key])} />
                  )}
                  {t.label}
                  <span className="rounded bg-background/60 px-1.5 text-xs">{t.count}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Sort by:
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-8 w-[150px]">
                  <SelectValue>
                    {sort === "newest"
                      ? "Newest first"
                      : sort === "oldest"
                        ? "Oldest first"
                        : "Priority"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {visible.map((c) => (
            <article
              key={c.id}
              className={cn(
                "rounded-lg border border-border border-l-4 bg-card p-4",
                PRIORITY_BORDER[c.priority],
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                  {initials(c.resident_name)}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold">{c.title}</h2>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        PRIORITY_BADGE[c.priority],
                      )}
                    >
                      {c.priority}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-mono">#{c.ticket_code}</span>
                    {" · "}
                    {c.resident_name}
                    {" · "}
                    {c.location}
                    {c.tank_id ? ` · ${c.tank_id}` : ""}
                    {" · "}
                    {formatDistanceToNowStrict(new Date(c.filed_at))} ago
                    {" · "}
                    {CATEGORY_LABELS[c.category]}
                  </p>
                  <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">{c.description}</p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
                      STATUS_BADGE[c.status],
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[c.status])} />
                    {STATUS_LABELS[c.status]}
                  </span>

                  {c.status !== "resolved" && (
                    <Button
                      size="sm"
                      variant={c.status === "pending" ? "default" : "outline"}
                      onClick={() => openPanel(c)}
                    >
                      {c.status === "pending" ? "Assign" : "Update"}
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" aria-label="More actions">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openPanel(c)}>View details</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openPanel(c)}>
                        Change status
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigator.clipboard?.writeText(c.ticket_code)}>
                        Copy ticket code
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </article>
          ))}

          {visible.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No complaints match the current filters.
            </div>
          )}
        </div>
      </main>

      <ComplaintPanel
        complaint={active}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        onSave={handleSave}
      />
    </div>
  );
}
