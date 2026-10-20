import { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function dateKeyToDate(dateKey) {
  if (!dateKey) return undefined;
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function dateToKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = "Select date",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const selected = dateKeyToDate(value);
  const minDate = dateKeyToDate(min);
  const maxDate = dateKeyToDate(max);
  const label = selected?.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={label ? `Selected date: ${label}` : placeholder}
          className={`h-10 w-full justify-start gap-2 border-border !bg-background text-left font-normal !text-foreground hover:!bg-muted hover:!text-foreground focus-visible:!ring-primary ${className}`}
        >
          <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
          <span className={selected ? "flex-1" : "flex-1 text-muted-foreground"}>
            {label ?? placeholder}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) onChange(dateToKey(date));
            setOpen(false);
          }}
          disabled={(date) => (
            (minDate !== undefined && dateKeyToDate(dateToKey(date)) < minDate) ||
            (maxDate !== undefined && dateKeyToDate(dateToKey(date)) > maxDate)
          )}
          initialFocus
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}
