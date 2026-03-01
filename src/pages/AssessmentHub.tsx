import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getAssessments } from "@/lib/api";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ClipboardCheck, Clock, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AssessmentHub() {
  const { profile } = useAuth();

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ["assessments", profile?.id],
    queryFn: () => getAssessments(profile!.id),
    enabled: !!profile,
  });

  const pending = assessments.filter((a) => a.status === "pending");
  const completed = assessments.filter((a) => a.status === "completed");

  return (
    <PageWrapper className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6 text-primary" /> Assessments
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Track and complete your pending assessments.</p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card rounded-lg border border-border p-5">
              <div className="h-4 w-40 bg-surface rounded animate-pulse" />
              <div className="h-3 w-24 bg-surface rounded animate-pulse mt-3" />
              <div className="h-2 bg-surface rounded animate-pulse mt-3" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Pending */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Pending ({pending.length})</h2>
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending assessments. 🎉</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {pending.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-card rounded-lg border border-border p-5 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <h3 className="text-sm font-semibold text-card-foreground">{a.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{a.company}</p>

                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {a.duration} min</span>
                      <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {a.question_count} questions</span>
                    </div>

                    {a.topics?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {a.topics.map((t) => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded-pill bg-surface text-muted-foreground">{t}</span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4">
                      <span className={cn(
                        "text-xs font-medium",
                        a.due_date && new Date(a.due_date) < new Date(Date.now() + 3 * 86400000) ? "text-accent-warm" : "text-muted-foreground"
                      )}>
                        Due: {a.due_date ? new Date(a.due_date).toLocaleDateString() : "TBD"}
                      </span>
                      <button
                        onClick={() => toast("Assessment flow coming soon!")}
                        className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
                      >
                        Start Assessment
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Completed */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Completed ({completed.length})</h2>
            {completed.length === 0 ? (
              <div className="bg-card rounded-lg border border-border p-8 text-center">
                <p className="text-sm text-muted-foreground">No completed assessments yet. Your results will appear here.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {completed.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card rounded-lg border border-border p-5"
                  >
                    <h3 className="text-sm font-semibold text-card-foreground">{a.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{a.company}</p>
                    {a.score !== null && (
                      <div className="mt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-primary">{a.score}</span>
                          <span className="text-xs text-muted-foreground">/ 100</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </PageWrapper>
  );
}
