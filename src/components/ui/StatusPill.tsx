import { ApplicationStatus } from "@/types";
import { cn } from "@/lib/utils";

const statusConfig: Record<ApplicationStatus, { label: string; className: string; dot?: boolean }> = {
  applied: { label: "Applied", className: "bg-primary/20 text-primary" },
  screening: { label: "Screening", className: "bg-accent/20 text-accent", dot: true },
  assessment: { label: "Assessment", className: "bg-accent-warm/20 text-accent-warm", dot: true },
  interview_scheduled: { label: "Interview", className: "bg-primary/20 text-primary", dot: true },
  offer: { label: "Offer", className: "bg-success/20 text-success" },
  rejected: { label: "Rejected", className: "bg-destructive/20 text-destructive" },
};

export function StatusPill({ status }: { status: ApplicationStatus }) {
  const config = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-semibold", config.className)}>
      {config.dot && <span className="h-1.5 w-1.5 rounded-full bg-current pulse-dot" />}
      {config.label}
    </span>
  );
}
