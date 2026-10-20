import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertCircle, ImageIcon, Info } from "lucide-react";
import ComplaintAttachment from "@/components/ComplaintAttachment";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
} from "@/data/complaints";

export function ComplaintPanel({ complaint, open, onOpenChange, onSave, token }) {
  const [status, setStatus] = useState(complaint?.status ?? "pending");
  const [response, setResponse] = useState(complaint?.hoa_response ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  if (!complaint) return null;
  const hasChanges = status !== complaint.status
    || response.trim() !== (complaint.hoa_response ?? "").trim();

  async function saveChanges() {
    setSaving(true);
    setSaveError("");
    try {
      const saved = await onSave(complaint.id, {
        status,
        hoa_response: response.trim() || null,
      });
      if (saved === false) {
        setSaveError("Could not save this update. Please review the error and try again.");
      }
    } catch (error) {
      setSaveError(error.message || "Could not save this update. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-border bg-card sm:max-w-md">
        <SheetHeader className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-secondary-foreground">
              #{complaint.ticket_code}
            </span>
            <span>{CATEGORY_LABELS[complaint.category]}</span>
          </div>
          <SheetTitle className="font-display text-lg leading-snug">{complaint.title}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-4 pb-6">
          <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-background/40 p-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Resident</dt>
              <dd>{complaint.resident_name}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Tank ID</dt>
              <dd>{complaint.tank_id ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Location</dt>
              <dd>{complaint.location}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Filed</dt>
              <dd>{format(new Date(complaint.filed_at), "MMM d, yyyy h:mm a")}</dd>
            </div>
            {complaint.scheduled_for && (
              <div>
                <dt className="text-xs text-muted-foreground">Scheduled service</dt>
                <dd>{format(new Date(`${complaint.scheduled_for}T00:00:00`), "MMM d, yyyy")}</dd>
              </div>
            )}
          </dl>

          <p className="text-sm leading-relaxed text-muted-foreground">{complaint.description}</p>

          {complaint.photo_url && (
            <section className="space-y-2">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <ImageIcon className="h-3.5 w-3.5" /> Attached photo
              </h3>
              <ComplaintAttachment key={complaint.photo_url} token={token} photoUrl={complaint.photo_url} />
            </section>
          )}

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue>{STATUS_LABELS[status]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.keys(STATUS_LABELS).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">The resident will see the updated status after refreshing their complaints page.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hoa_response">Response to resident <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Textarea
              id="hoa_response"
              rows={5}
              maxLength={5000}
              placeholder="Write an update the resident can read, such as the next steps or a question."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
            />
            <div className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-2.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>Saving a changed status or response creates an in-app notification. This update does not dispatch a contractor.</span>
            </div>
            <p className="text-right text-[11px] text-muted-foreground">{response.length}/5000</p>
          </div>

          {saveError && (
            <p role="alert" className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {saveError}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              className="flex-1"
              disabled={saving || !hasChanges}
              onClick={saveChanges}
            >
              {saving ? "Saving…" : "Save update"}
            </Button>
            <Button variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
