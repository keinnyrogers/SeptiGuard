import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Cpu, Wifi, WifiOff, BatteryLow, Plus, Eye, MoreHorizontal, Menu, X, Check } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import DevicePanel from "@/components/DevicePanel";
import { SAMPLE_DEVICES, LOW_BATTERY_THRESHOLD } from "@/data/devices";
import { useAuth } from "../context/AuthContext.jsx";

const STATUS_BADGE = {
  online: "bg-success/15 text-success",
  offline: "bg-danger/15 text-danger",
};
const SIGNAL_BADGE = {
  strong: "bg-success/15 text-success",
  moderate: "bg-warning/15 text-warning",
  weak: "bg-danger/15 text-danger",
};

function batteryColor(v) {
  if (v == null) return "bg-muted";
  if (v <= LOW_BATTERY_THRESHOLD) return "bg-danger";
  if (v <= 50) return "bg-warning";
  return "bg-success";
}
function timeAgo(iso) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.round(h / 24)} d ago`;
}

const EMPTY_FORM = { device_id: "", resident: "", block_lot: "" };

export default function AdminDevices() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [devices, setDevices] = useState(SAMPLE_DEVICES);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [signalFilter, setSignalFilter] = useState("all");
  const [blockFilter, setBlockFilter] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const blocks = useMemo(
    () => [...new Set(devices.map((d) => d.block_lot.split(" ")[0]))].sort(),
    [devices],
  );

  const counts = useMemo(() => {
    const online = devices.filter((d) => d.status === "online").length;
    return {
      total: devices.length,
      online,
      offline: devices.length - online,
      lowBattery: devices.filter((d) => d.battery != null && d.battery <= LOW_BATTERY_THRESHOLD).length,
    };
  }, [devices]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return devices.filter(
      (d) =>
        (statusFilter === "all" || d.status === statusFilter) &&
        (signalFilter === "all" || d.signal === signalFilter) &&
        (blockFilter === "all" || d.block_lot.startsWith(blockFilter)) &&
        (!q || [d.device_id, d.resident, d.block_lot].join(" ").toLowerCase().includes(q)),
    );
  }, [devices, query, statusFilter, signalFilter, blockFilter]);

  function submit(e) {
    e.preventDefault();
    // Later: POST to Laravel — creates a septic_systems row with this device_id.
    setDevices((prev) => [
      {
        id: Date.now(),
        device_id: form.device_id,
        resident: form.resident,
        block_lot: form.block_lot,
        status: "offline",
        signal: null,
        battery: null,
        last_reading_at: new Date().toISOString(),
        firmware: "v2.4.1",
      },
      ...prev,
    ]);
    setForm(EMPTY_FORM);
    setFormOpen(false);
  }

  function handleDeviceSave(updatedDevice) {
    setDevices((prev) =>
      prev.map((device) => (device.id === updatedDevice.id ? { ...device, ...updatedDevice } : device)),
    );
    setSelectedDevice(null);
  }

  const stats = [
    { label: "Total Devices", value: counts.total, sub: "Registered sensors", icon: Cpu, tone: "text-foreground", chip: "bg-primary/15 text-primary" },
    { label: "Online Sensors", value: counts.online, sub: "Reporting normally", icon: Wifi, tone: "text-success", chip: "bg-success/15 text-success" },
    { label: "Offline Devices", value: counts.offline, sub: "No recent reading", icon: WifiOff, tone: "text-danger", chip: "bg-danger/15 text-danger" },
    { label: "Low Battery", value: counts.lowBattery, sub: `At or below ${LOW_BATTERY_THRESHOLD}%`, icon: BatteryLow, tone: "text-warning", chip: "bg-warning/15 text-warning" },
  ];
  const field = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring";
  const select = "h-10 rounded-md border border-input bg-card px-3 text-sm outline-none focus:border-ring";

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar
        open={menuOpen}
        setOpen={setMenuOpen}
        navigate={navigate}
        user={user}
        active="Devices"
        signOut={async () => {
          await logout();
          navigate("/");
        }}
      />
      <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu" className="fixed left-3 top-3 z-30 rounded-md border border-border bg-card p-2 lg:hidden"><Menu className="h-4 w-4" /></button>

      <main className="min-w-0 px-5 py-6 md:px-8 lg:ml-52">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Admin Portal <span className="mx-1">›</span><span className="text-foreground">Devices</span></p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Sensor / IoT Devices</h1>
          </div>
          <button onClick={() => setFormOpen(true)} className="flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> Add Device
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

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by device ID, tank, or resident..." className={`${field} h-11 bg-card pl-9`} />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={select} aria-label="Status filter">
            <option value="all">Status: All</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
          <select value={signalFilter} onChange={(e) => setSignalFilter(e.target.value)} className={select} aria-label="Signal filter">
            <option value="all">Signal: All</option>
            <option value="strong">Strong</option>
            <option value="moderate">Moderate</option>
            <option value="weak">Weak</option>
          </select>
          <select value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)} className={select} aria-label="Block filter">
            <option value="all">Block: All</option>
            {blocks.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[950px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                {["Device / Tank ID", "Resident", "Status", "Signal", "Battery", "Last Reading", "Firmware", "Actions"].map((h) => (
                  <th key={h} className={`px-4 py-3 font-medium ${h === "Actions" ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((d) => (
                <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3 font-mono text-xs text-primary">{d.device_id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{d.resident}</p>
                    <p className="text-xs text-muted-foreground">{d.block_lot}</p>
                  </td>
                  <td className="px-4 py-3"><span className={`rounded-md px-2 py-1 text-xs font-medium capitalize ${STATUS_BADGE[d.status]}`}>{d.status}</span></td>
                  <td className="px-4 py-3">
                    {d.status === "offline" ? (
                      <span className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground">No signal</span>
                    ) : (
                      <span className={`rounded-md px-2 py-1 text-xs font-medium capitalize ${SIGNAL_BADGE[d.signal]}`}>{d.signal}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {d.status === "offline" ? (
                      <span className="text-muted-foreground">--</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"><div className={`h-full ${batteryColor(d.battery)}`} style={{ width: `${d.battery}%` }} /></div>
                        <span className="text-xs">{d.battery}%</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{timeAgo(d.last_reading_at)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{d.firmware}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedDevice(d)}
                        className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-primary hover:bg-muted"
                      >
                        <Eye className="h-3.5 w-3.5" />View
                      </button>
                      <button aria-label="More actions" className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"><MoreHorizontal className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={8} className="p-10 text-center text-muted-foreground">No devices match the current filters.</td></tr>
              )}
            </tbody>
          </table>
          <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">Showing {visible.length} of {devices.length} devices</p>
        </div>
      </main>

      {selectedDevice && (
        <DevicePanel
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
          onSave={handleDeviceSave}
        />
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4" onClick={() => setFormOpen(false)}>
          <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-3 rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Device</h2>
              <button type="button" onClick={() => setFormOpen(false)} aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
            {[["device_id", "Device ID (e.g. SG-012A)", "text"], ["resident", "Resident name", "text"], ["block_lot", "Block / Lot (e.g. Blk 3 Lot 7)", "text"]].map(([k, label, type]) => (
              <label key={k} className="block text-xs text-muted-foreground">{label}
                <input type={type} required value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className={`${field} mt-1 text-foreground`} />
              </label>
            ))}
            <p className="text-xs text-muted-foreground">New devices start offline until the hardware reports its first reading.</p>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setFormOpen(false)} className="h-9 rounded-md border border-border px-4 text-sm hover:bg-muted">Cancel</button>
              <button type="submit" className="flex h-9 items-center gap-1 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"><Check className="h-4 w-4" />Register Device</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
