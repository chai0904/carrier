import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getApplications, getAssessments } from "@/lib/api";
import { ApplicationCard } from "@/components/dashboard/ApplicationCard";
import { AIResponseBlock } from "@/components/ui/AIResponseBlock";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Briefcase, Calendar, ClipboardCheck, User, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { profile } = useAuth();

  const { data: applications = [] } = useQuery({
    queryKey: ["applications", profile?.id],
    queryFn: () => getApplications(profile!.id),
    enabled: !!profile,
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ["assessments", profile?.id],
    queryFn: () => getAssessments(profile!.id),
    enabled: !!profile,
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const activeApps = applications.filter((a) => a.status !== "rejected");
  const interviews = applications.filter((a) => a.status === "interview_scheduled");
  const pendingAssessments = assessments.filter((a) => a.status === "pending");
  const upcomingInterview = interviews[0];

  const stats = [
    { label: "Active Applications", value: activeApps.length.toString(), icon: Briefcase, color: "text-primary" },
    { label: "Interviews Scheduled", value: interviews.length.toString(), icon: Calendar, color: "text-success" },
    { label: "Assessments Pending", value: pendingAssessments.length.toString(), icon: ClipboardCheck, color: "text-accent-warm" },
    { label: "Profile Strength", value: `${profile?.profile_completeness || 0}%`, icon: User, color: "text-accent" },
  ];

  return (
    <PageWrapper className="p-6 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {greeting}, {profile?.full_name?.split(" ")[0] || "there"} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* AI Insight */}
      {upcomingInterview ? (
        <AIResponseBlock>
          <div className="flex items-start justify-between gap-4">
            <p>You have an interview with <strong className="text-foreground">{upcomingInterview.job?.company_name}</strong> coming up. Want me to generate practice questions?</p>
            <Link
              to="/interview-prep"
              className="shrink-0 inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
            >
              <Sparkles className="h-3 w-3" /> Prepare Now
            </Link>
          </div>
        </AIResponseBlock>
      ) : applications.length === 0 ? (
        <AIResponseBlock>
          <p>Welcome to CandidateOS! 🎉 Start by uploading your resume in the <Link to="/resume" className="text-primary font-medium underline">Resume Studio</Link>, or browse open positions.</p>
        </AIResponseBlock>
      ) : null}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            className="bg-card rounded-lg p-4 border border-border"
          >
            <div className="flex items-center justify-between mb-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-card-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Applications */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Active Applications</h2>
            <Link to="/applications" className="text-xs text-primary hover:underline">View All</Link>
          </div>
          {applications.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-8 text-center">
              <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No applications yet. Start applying to jobs!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 5).map((app, i) => (
                <ApplicationCard key={app.id} app={app} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="lg:col-span-2 space-y-4">
          {/* Upcoming */}
          {upcomingInterview && (
            <div className="bg-card rounded-lg p-4 border border-border">
              <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Upcoming
              </h3>
              <div className="bg-surface rounded-md p-3">
                <p className="text-sm font-medium text-surface-foreground">{upcomingInterview.job?.title}</p>
                <p className="text-xs text-muted-foreground">{upcomingInterview.job?.company_name}</p>
              </div>
            </div>
          )}

          {/* Pending Actions */}
          <div className="bg-card rounded-lg p-4 border border-border">
            <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-accent-warm" /> Pending Actions
            </h3>
            <div className="space-y-2">
              {pendingAssessments.map((a) => (
                <Link key={a.id} to="/assessments" className="block bg-surface rounded-md p-3 hover:bg-primary/5 transition-colors">
                  <p className="text-sm font-medium text-surface-foreground">{a.title}</p>
                  <p className="text-xs text-accent-warm mt-1">Due: {a.due_date ? new Date(a.due_date).toLocaleDateString() : "TBD"}</p>
                </Link>
              ))}
              {(profile?.profile_completeness || 0) < 80 && (
                <div className="bg-accent-warm/10 rounded-md p-3">
                  <p className="text-xs font-medium text-accent-warm">Complete your profile ({profile?.profile_completeness || 0}%)</p>
                </div>
              )}
              {pendingAssessments.length === 0 && (profile?.profile_completeness || 0) >= 80 && (
                <p className="text-xs text-muted-foreground text-center py-2">No pending actions ✓</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
