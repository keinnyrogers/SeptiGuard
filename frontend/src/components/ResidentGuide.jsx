import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BookOpen, ChevronLeft, ChevronRight, CircleHelp } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

const GUIDE_STEPS = [
  {
    title: "Dashboard",
    description: "See your tank's latest fill level, status, sensor connection, and recent alerts. The sensor is considered online when it has reported within the last 15 minutes.",
    path: "/dashboard",
    action: "View dashboard",
  },
  {
    title: "Monitoring",
    description: "Review recent tank readings and history. If the sensor has not sent a recent reading, the dashboard shows it as offline; it cannot report while it has no power or connection.",
    path: "/monitor",
    action: "Open monitoring",
  },
  {
    title: "Predictions",
    description: "View an estimated trend toward the 80% critical level when enough recent readings are available. Predictions may be unavailable when the reading history is insufficient or stale.",
    path: "/predict",
    action: "View predictions",
  },
  {
    title: "Complaints",
    description: "Submit a complaint with its details and, when needed, a photo. You can return to track its status and any HOA response.",
    path: "/complaints",
    action: "View complaints",
  },
  {
    title: "Maintenance",
    description: "Check maintenance information and available service options for your household. Contact the HOA if you need help arranging a service.",
    path: "/maintain",
    action: "View maintenance",
  },
  {
    title: "Alerts",
    description: "Find in-portal updates about tank thresholds and complaint changes. Push notifications are optional and require permission on a supported device.",
    path: "/alerts",
    action: "View alerts",
  },
  {
    title: "Profile and settings",
    description: "Review your account and linked tank, manage notification preferences, and request changes to your information. On iPhone or iPad, add SeptiGuard to the Home Screen from Safari to use supported PWA push notifications.",
    path: "/profile",
    action: "Open profile",
  },
];

const GUIDE_SEEN_KEY = "septiguard_resident_guide_seen";
const RESIDENT_PATHS = ["/dashboard", "/monitor", "/predict", "/complaints", "/maintain", "/alerts", "/profile"];

function guideStorageKey(user) {
  const identifier = user?.id ?? user?.email;
  return identifier ? `${GUIDE_SEEN_KEY}:${identifier}` : null;
}

export default function ResidentGuide() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const storageKey = guideStorageKey(user);
  const isResidentPage = RESIDENT_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  const isResident = isAuthenticated && user?.role === "resident" && isResidentPage;
  const step = GUIDE_STEPS[stepIndex];

  useEffect(() => {
    if (!isResident || !storageKey) return;

    try {
      if (window.localStorage.getItem(storageKey) !== "completed") {
        setStepIndex(0);
        setOpen(true);
      }
    } catch (error) {
      console.error("Could not check the resident guide preference.", error);
    }
  }, [isResident, storageKey]);

  const closeGuide = () => {
    setOpen(false);
    if (!storageKey) return;

    try {
      window.localStorage.setItem(storageKey, "completed");
    } catch (error) {
      console.error("Could not save the resident guide preference.", error);
    }
  };

  const openGuide = () => {
    setStepIndex(0);
    setOpen(true);
  };

  const goToFeature = () => {
    navigate(step.path);
  };

  if (!isResident) return null;

  return (
    <>
      <button
        type="button"
        onClick={openGuide}
        aria-label="Open resident feature guide"
        title="Resident guide"
        className="fixed bottom-4 right-4 z-40 flex h-11 items-center gap-2 rounded-full border border-primary/30 bg-card px-4 text-sm font-medium text-foreground shadow-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CircleHelp className="h-4 w-4 text-primary" />
        <span>Guide</span>
      </button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) setOpen(true);
          else closeGuide();
        }}
      >
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader className="pr-7 text-left">
            <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
              <BookOpen className="h-4 w-4" />
              Resident quick guide
            </div>
            <DialogTitle>{step.title}</DialogTitle>
            <DialogDescription aria-live="polite">
              Step {stepIndex + 1} of {GUIDE_STEPS.length}
            </DialogDescription>
          </DialogHeader>

          <p className="text-sm leading-6 text-foreground">{step.description}</p>

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {stepIndex + 1} / {GUIDE_STEPS.length}
            </span>
            <button
              type="button"
              onClick={goToFeature}
              className="text-sm font-medium text-primary hover:underline"
            >
              {step.action}
            </button>
          </div>

          <DialogFooter className="gap-2 sm:justify-between sm:space-x-0">
            <button
              type="button"
              onClick={closeGuide}
              className="h-10 rounded-md border border-border px-4 text-sm hover:bg-muted"
            >
              Skip guide
            </button>
            <div className="flex gap-2">
              {stepIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setStepIndex((current) => current - 1)}
                  className="flex h-10 items-center gap-1 rounded-md border border-border px-3 text-sm hover:bg-muted"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              )}
              {stepIndex < GUIDE_STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setStepIndex((current) => current + 1)}
                  className="flex h-10 items-center gap-1 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={closeGuide}
                  className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Finish
                </button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
