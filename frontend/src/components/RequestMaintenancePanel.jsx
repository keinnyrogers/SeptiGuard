import { useState } from "react";
import { Wrench, CheckCircle2, AlertCircle } from "lucide-react";
import SlidePanel from "./SlidePanel.jsx";
import DatePicker from "./DatePicker.jsx";
import { createResidentComplaint } from "../api.js";

/* Request Maintenance slide-in panel (Resident → Maintain page).
   Maintenance requests are saved through the resident complaints API. */
const TYPES = [
  { id: "pump_out",   label: "Full pump-out / desludging", note: "Routine cleaning of the tank",         priority: "medium" },
  { id: "inspection", label: "Inspection",                 note: "Check baffles, pipes, or the sensor",  priority: "low" },
  { id: "urgent",     label: "Urgent service",             note: "Odor, backup, or near overflow",       priority: "high" },
];

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function RequestMaintenancePanel({ open, onClose, lastMaintenance, token, onSubmitted }) {
  const [type, setType] = useState("pump_out");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent
  const [error, setError] = useState("");

  const close = () => {
    setType("pump_out");
    setDate("");
    setNotes("");
    setStatus("idle");
    setError("");
    onClose();
  };

  const submit = async () => {
    if (date && date < today()) return setError("Preferred date can't be in the past.");
    setError("");
    setStatus("sending");
    const t = TYPES.find((x) => x.id === type);
    /* ---------- API CALL — i-uncomment kapag ready na ang backend ----------
    const token = localStorage.getItem("septiguard_token");
    axios.post("http://localhost:8000/api/complaints", {
      category: "septic_tank",
      priority: t.priority,
      title: `Maintenance request: ${t.label}`,
      description: `Preferred date: ${date || "any"}. Notes: ${notes || "none"}`,
    }, { headers: { Authorization: `Bearer ${token}` } });
    ---------------------------------------------------------------------- */
    try {
      await createResidentComplaint(token, {
        category: "septic_tank",
        priority: t.priority,
        title: `Maintenance request: ${t.label}`,
        description: `Preferred date: ${date || "Any available date"}. Notes: ${notes || "None"}`,
      });
      setStatus("sent");
      onSubmitted?.();
    } catch (submitError) {
      setStatus("idle");
      setError(submitError.message);
    }
  };

  const sent = status === "sent";

  return (
    <SlidePanel
      open={open}
      onClose={close}
      eyebrow="Maintenance"
      eyebrowIcon={Wrench}
      title={sent ? "Request sent" : "Request Maintenance"}
      subtitle={sent ? "Your HOA administrator will contact you to confirm the schedule." : "Your HOA will coordinate with an accredited service provider."}
      footer={
        sent ? (
          <button onClick={close} className="h-10 flex-1 rounded-md bg-primary text-sm font-medium text-primary-foreground">Done</button>
        ) : (
          <>
            <button onClick={close} className="h-10 flex-1 rounded-md border border-border text-sm">Cancel</button>
            <button onClick={submit} disabled={status === "sending"} className="h-10 flex-1 rounded-md bg-primary text-sm font-medium text-primary-foreground disabled:opacity-60">
              {status === "sending" ? "Sending..." : "Send Request"}
            </button>
          </>
        )
      }
    >
      {sent ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-6 text-center">
          <CheckCircle2 className="h-10 w-10 text-success" />
          <p className="text-sm font-semibold">{TYPES.find((x) => x.id === type)?.label}</p>
          <p className="text-xs text-muted-foreground">Preferred date: {date || "Any available date"}</p>
        </div>
      ) : (
        <>
          {lastMaintenance && (
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Last recorded service</p>
              <p className="mt-1 text-sm font-semibold">{lastMaintenance}</p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-medium">Service type</p>
            {TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={`w-full rounded-md border p-3 text-left transition ${type === t.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}
              >
                <p className={`text-sm font-medium ${t.id === "urgent" ? "text-danger" : ""}`}>{t.label}</p>
                <p className="text-[11px] text-muted-foreground">{t.note}</p>
              </button>
            ))}
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium">Preferred date (optional)</span>
            <DatePicker
              value={date}
              onChange={setDate}
              min={today()}
              placeholder="Choose a preferred date"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium">Access notes for the crew (optional)</span>
            <textarea rows={3} maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Side gate unlocked, dogs inside the house"
              className="w-full rounded-md border border-border bg-background p-3 text-sm" />
          </label>

          {error && (
            <p className="flex items-center gap-2 text-xs text-danger"><AlertCircle className="h-4 w-4" /> {error}</p>
          )}
        </>
      )}
    </SlidePanel>
  );
}
