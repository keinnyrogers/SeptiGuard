import { useEffect, useState } from "react";
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import SlidePanel from "./SlidePanel.jsx";

/* TODO backend: replace the simulated save with PUT /api/user/password
   (current_password, password, password_confirmation) using septiguard_token. */
export default function ChangePasswordPanel({ open, onClose }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [show, setShow] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm({ current: "", next: "", confirm: "" });
      setShow({}); setError(""); setSaving(false); setSuccess(false);
    }
  }, [open]);

  const submit = () => {
    setError("");
    if (!form.current) return setError("Please enter your current password.");
    if (form.next.length < 8) return setError("New password must be at least 8 characters.");
    if (form.next === form.current) return setError("New password must be different from your current one.");
    if (form.next !== form.confirm) return setError("New passwords do not match.");
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      setTimeout(onClose, 1500);
    }, 800);
  };

  const field = (key, label, placeholder) => (
    <div className="space-y-1.5">
      <label className="text-xs font-medium">{label}</label>
      <div className="relative">
        <input
          type={show[key] ? "text" : "password"}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholder}
          disabled={saving || success}
          className="w-full rounded-md border border-border bg-background px-3 py-2 pr-9 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <button type="button" onClick={() => setShow({ ...show, [key]: !show[key] })} className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground">
          {show[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <SlidePanel
      open={open}
      onClose={onClose}
      eyebrow="Security"
      eyebrowIcon={KeyRound}
      title="Change Password"
      subtitle="Use at least 8 characters. You'll stay signed in on this device."
      footer={
        <>
          <button onClick={onClose} disabled={saving} className="w-1/3 rounded-md border border-border bg-muted/40 py-2.5 text-xs font-medium hover:bg-muted disabled:opacity-40">Cancel</button>
          <button onClick={submit} disabled={saving || success} className="flex-1 rounded-md bg-primary py-2.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {saving ? "Updating..." : "Update Password"}
          </button>
        </>
      }
    >
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 p-3 text-xs text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Password updated! Closing...
        </div>
      )}
      {field("current", "Current Password", "Enter current password")}
      {field("next", "New Password", "At least 8 characters")}
      {field("confirm", "Confirm New Password", "Re-type new password")}
    </SlidePanel>
  );
}
