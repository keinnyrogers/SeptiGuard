import { useEffect, useState } from "react";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";
import SlidePanel from "./SlidePanel.jsx";

const FIELDS = [
  { value: "name", label: "Full Name" },
  { value: "email", label: "Email Address" },
  { value: "phone", label: "Phone Number" },
  { value: "household", label: "Household Members" },
  { value: "other", label: "Other" },
];

/* TODO backend: send to the HOA (e.g. POST /api/profile/change-requests)
   with { field, current_value, requested_value, reason }. */
export default function RequestInfoChangePanel({ open, onClose, current = {} }) {
  const [field, setField] = useState("phone");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) {
      setField("phone"); setValue(""); setReason(""); setError(""); setSending(false); setSent(false);
    }
  }, [open]);

  const currentValue = current[field];

  const submit = () => {
    setError("");
    if (!value.trim()) return setError("Please enter the new value you want.");
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 800);
  };

  const input = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none";

  return (
    <SlidePanel
      open={open}
      onClose={onClose}
      eyebrow="Profile"
      eyebrowIcon={Mail}
      title="Request Information Change"
      subtitle="These fields are managed by the HOA. Your request will be reviewed by an admin."
      footer={
        sent ? (
          <button onClick={onClose} className="flex-1 rounded-md border border-border bg-muted/40 py-2.5 text-xs font-medium hover:bg-muted">Close</button>
        ) : (
          <>
            <button onClick={onClose} disabled={sending} className="w-1/3 rounded-md border border-border bg-muted/40 py-2.5 text-xs font-medium hover:bg-muted disabled:opacity-40">Cancel</button>
            <button onClick={submit} disabled={sending} className="flex-1 rounded-md bg-primary py-2.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {sending ? "Sending..." : "Send Request"}
            </button>
          </>
        )
      }
    >
      {sent ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-success" />
          <p className="text-sm font-semibold">Request sent to the HOA</p>
          <p className="text-xs text-muted-foreground">You'll get a notification once an admin reviews your change.</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-medium">What do you want to change?</label>
            <select value={field} onChange={(e) => setField(e.target.value)} className={input}>
              {FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          {currentValue && (
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <p className="text-[11px] text-muted-foreground">Current value</p>
              <p className="mt-0.5 text-sm">{currentValue}</p>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-medium">New value</label>
            <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Type the correct information" className={input} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Reason <span className="text-muted-foreground">(optional)</span></label>
            <textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. I changed my mobile number" className={input} />
          </div>
        </>
      )}
    </SlidePanel>
  );
}
