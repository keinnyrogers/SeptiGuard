import { useState } from "react";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import SlidePanel from "./SlidePanel.jsx";
import { submitResidentInformationChangeRequest } from "../api.js";

const FIELDS = [
  { value: "name", label: "Full Name" },
  { value: "email", label: "Email Address" },
  { value: "phone", label: "Phone Number" },
  { value: "address", label: "House Number" },
  { value: "household", label: "Household Members" },
  { value: "other", label: "Other" },
];

export default function RequestInfoChangePanel({ open, onClose, current = {}, token, demoMode = false }) {
  const [field, setField] = useState("phone");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");

  const currentValue = current[field];

  function closePanel() {
    if (sending) return;
    setField("phone");
    setValue("");
    setReason("");
    setError("");
    setSuccess("");
    onClose();
  }

  const submit = async () => {
    setError("");
    setSuccess("");
    if (!value.trim()) return setError("Please enter the new value you want.");
    if (demoMode) return setError("Information change requests are unavailable in demo mode.");
    setSending(true);
    try {
      await submitResidentInformationChangeRequest(token, {
        field,
        requested_value: value.trim(),
        reason: reason.trim() || null,
      });
      setValue("");
      setReason("");
      setSuccess("Your request was sent to the HOA for review.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSending(false);
    }
  };

  const input = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none";

  return (
    <SlidePanel
      open={open}
      onClose={closePanel}
      eyebrow="Profile"
      eyebrowIcon={Mail}
      title="Request Information Change"
      subtitle="These fields are managed by the HOA. Your request will be reviewed by an admin."
      footer={
        <>
          <button onClick={closePanel} disabled={sending} className="w-1/3 rounded-md border border-border bg-muted/40 py-2.5 text-xs font-medium hover:bg-muted disabled:opacity-40">Cancel</button>
          <button onClick={submit} disabled={sending || demoMode} className="flex-1 rounded-md bg-primary py-2.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {sending ? "Sending…" : "Request Change"}
          </button>
        </>
      }
    >
      <>
          {demoMode && (
            <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> Requests are disabled in demo mode.
            </div>
          )}
          {success && (
            <div role="status" className="flex items-start gap-2 rounded-md border border-success/30 bg-success/10 p-3 text-xs text-success">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {success}
            </div>
          )}
          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
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
            <input
              type={field === "email" ? "email" : field === "household" ? "number" : "text"}
              min={field === "household" ? 1 : undefined}
              step={field === "household" ? 1 : undefined}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Type the correct information"
              className={input}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Reason <span className="text-muted-foreground">(optional)</span></label>
            <textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. I changed my mobile number" className={input} />
          </div>
      </>
    </SlidePanel>
  );
}
