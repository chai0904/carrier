import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getApplication } from "@/lib/api";
import { analyzeSkillGap, type SkillGapResult } from "@/lib/ai";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ArrowLeft, BookOpen, Target, Lightbulb, Heart, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function SkillGapAnalysis() {
  const { id } = useParams();
  const { profile } = useAuth();
  const [analysis, setAnalysis] = useState<SkillGapResult | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: app } = useQuery({
    queryKey: ["application", id],
    queryFn: () => getApplication(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (app && app.status === "rejected" && !analysis && !loading) {
      runAnalysis();
    }
  }, [app]);

  const runAnalysis = async () => {
    if (!app || !profile) return;
    setLoading(true);
    try {
      const rejectionNote = app.stages?.find((s) => s.status === "rejected")?.note || undefined;
      const result = await analyzeSkillGap(
        app.job?.title || "Role",
        app.job?.description || "",
        profile.skills || [],
        rejectionNote
      );
      setAnalysis(result);
    } catch (e) {
      toast.error("Failed to generate analysis");
    }
    setLoading(false);
  };

  if (!app || app.status !== "rejected") {
    return (
      <PageWrapper className="p-6">
        <p className="text-muted-foreground">Skill gap analysis is only available for rejected applications.</p>
        <Link to="/applications" className="text-primary text-sm mt-2 inline-block">← Back to Applications</Link>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="p-6 space-y-6 max-w-3xl">
      <Link to={`/applications/${app.id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to {app.job?.company_name}
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Here's how to come back stronger 💪</h1>
        <p className="text-sm text-muted-foreground mt-1">{app.job?.company_name} · {app.job?.title}</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="bg-card rounded-lg border border-border p-5 space-y-3">
            <div className="h-4 bg-surface rounded animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-surface via-muted to-surface" />
            <div className="h-4 w-3/4 bg-surface rounded animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-surface via-muted to-surface" />
            <div className="h-4 w-1/2 bg-surface rounded animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-surface via-muted to-surface" />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            <Sparkles className="h-3 w-3 inline mr-1" />AI is analyzing your skill gaps...
          </p>
        </div>
      ) : analysis ? (
        <>
          {/* Summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ai-border ai-gradient rounded-lg p-5">
            <p className="text-sm text-foreground">{analysis.summary}</p>
          </motion.div>

          {/* Skill Gaps */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Skill Gaps</h2>
            {analysis.skillGaps.map((gap, i) => (
              <motion.div
                key={gap.skill}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="bg-card rounded-lg border border-border p-4"
              >
                <h3 className="text-sm font-semibold text-card-foreground">{gap.skill}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>{gap.currentLevel}</span>
                      <span>{gap.requiredLevel}</span>
                    </div>
                    <div className="h-2 bg-surface rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent-warm to-primary rounded-full transition-all"
                        style={{ width: gap.currentLevel === "Beginner" ? "25%" : gap.currentLevel === "Intermediate" ? "55%" : "75%" }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">~{gap.time}</span>
                </div>
                <div className="mt-3">
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">Resources:</p>
                  {gap.resources.map((r) => (
                    <p key={r} className="text-xs text-accent flex items-center gap-1 mt-0.5">
                      <BookOpen className="h-3 w-3" /> {r}
                    </p>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Next Steps */}
          <div className="bg-card rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2 mb-3"><Lightbulb className="h-4 w-4 text-accent-warm" /> Next Steps</h2>
            <ul className="space-y-2">
              {analysis.nextSteps.map((step) => (
                <li key={step} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">→</span> {step}
                </li>
              ))}
            </ul>
          </div>

          {/* Alternative Roles */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Roles You're Ready For</h2>
            <div className="flex flex-wrap gap-2">
              {analysis.alternativeRoles.map((role) => (
                <span key={role} className="px-4 py-2 rounded-lg bg-success/10 text-success text-sm font-medium">{role}</span>
              ))}
            </div>
          </div>

          {/* Motivation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-card rounded-lg border border-border p-5 text-center"
          >
            <Heart className="h-6 w-6 text-destructive mx-auto mb-2" />
            <p className="text-sm text-card-foreground italic">{analysis.motivationalNote}</p>
          </motion.div>
        </>
      ) : (
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <button
            onClick={runAnalysis}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-md hover:bg-primary-dark transition-colors text-sm"
          >
            <Sparkles className="h-4 w-4" /> Generate Skill Gap Analysis
          </button>
        </div>
      )}
    </PageWrapper>
  );
}
