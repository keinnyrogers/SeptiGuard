import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  ASSIGNEES,
  CATEGORY_LABELS,
  STATUS_LABELS,
} from "@/data/complaints";

export function ComplaintPanel({ complaint, open, onOpenChange, onSave }) {
  const [status, setStatus] = useState("pending");
  const [assignedTo, setAssignedTo] = useState("");
  const [response, setResponse] = useState("");

  useEffect(() => {
    if (complaint) {
      setStatus(complaint.status);
      setAssignedTo(complaint.assigned_to ?? "");
      setResponse(complaint.hoa_response ?? "");
    }
  }, [complaint]);

  if (!complaint) return null;

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

        <div className="space-y-6 px-4 pb-6">
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
          </dl>

          <p className="text-sm leading-relaxed text-muted-foreground">{complaint.description}</p>

          {complaint.photo_path && (
            <div className="rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
              Attached photo: <span className="font-mono">{complaint.photo_path}</span>
            </div>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned">Assigned to</Label>
            <Input
              id="assigned"
              list="assignee-options"
              placeholder="Select or type a name"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            />
            <datalist id="assignee-options">
              {ASSIGNEES.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hoa_response">HOA response</Label>
            <Textarea
              id="hoa_response"
              rows={5}
              placeholder="Message sent back to the resident..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() =>
                onSave(complaint.id, {
                  status,
                  assigned_to: assignedTo.trim() || null,
                  hoa_response: response.trim() || null,
                })
              }
            >
              Save &amp; dispatch
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
