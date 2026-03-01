import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ApplicationWithDetails } from "@/lib/api";

const statusLabels: Record<string, string> = {
  applied: "Applied",
  screening: "Screening",
  assessment: "Assessment",
  interview_scheduled: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

const statusColors: Record<string, string> = {
  applied: "bg-blue-500/20 text-blue-400",
  screening: "bg-yellow-500/20 text-yellow-400",
  assessment: "bg-purple-500/20 text-purple-400",
  interview_scheduled: "bg-emerald-500/20 text-emerald-400",
  offer: "bg-green-500/20 text-green-400",
  rejected: "bg-red-500/20 text-red-400",
};

export function ApplicationCard({ app, index }: { app: ApplicationWithDetails; index: number }) {
  const navigate = useNavigate();
  const totalStages = app.stages?.length || 1;
  const completedStages = app.stages?.filter((s) => s.status === "completed").length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => navigate(`/applications/${app.id}`)}
      className="bg-card rounded-lg border border-border p-4 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <img
          src={app.job?.company_logo || `https://ui-avatars.com/api/?name=${app.job?.company_name || "Job"}&background=1e293b&color=2563eb&bold=true`}
          alt={app.job?.company_name}
          className="h-10 w-10 rounded-lg bg-surface object-contain p-1.5"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${app.job?.company_name || "Job"}&background=1e293b&color=2563eb&bold=true`;
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-card-foreground truncate">{app.job?.title || "Untitled Role"}</h3>
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0", statusColors[app.status] || "bg-surface text-muted-foreground")}>
              {statusLabels[app.status] || app.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {app.job?.company_name} · {app.job?.location || "Remote"}
          </p>
          {app.job?.salary_range && (
            <p className="text-xs text-muted-foreground">{app.job.salary_range}</p>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="mt-3">
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
          <span>Stage {completedStages}/{totalStages}</span>
          {app.next_action && <span className="text-primary">{app.next_action}</span>}
        </div>
        <div className="h-1.5 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
            style={{ width: `${(completedStages / totalStages) * 100}%` }}
          />
        </div>
      </div>

      {app.ai_insight && (
        <p className="text-[10px] text-accent mt-2 line-clamp-1">✨ {app.ai_insight}</p>
      )}
    </motion.div>
  );
}
