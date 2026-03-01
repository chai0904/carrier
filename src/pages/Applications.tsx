import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getApplications } from "@/lib/api";
import { ApplicationCard } from "@/components/dashboard/ApplicationCard";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useState } from "react";

const filters = [
  { label: "All", value: "all" },
  { label: "In Progress", value: "interview_scheduled" },
  { label: "Assessment", value: "assessment" },
  { label: "Applied", value: "applied" },
  { label: "Offer", value: "offer" },
  { label: "Rejected", value: "rejected" },
];

export default function Applications() {
  const { profile } = useAuth();
  const [filter, setFilter] = useState("all");

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications", profile?.id],
    queryFn: () => getApplications(profile!.id),
    enabled: !!profile,
  });

  const apps = filter === "all" ? applications : applications.filter((a) => a.status === filter);

  return (
    <PageWrapper className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Applications</h1>
        <p className="text-sm text-muted-foreground mt-1">Track all your job applications in one place.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-pill text-xs font-semibold transition-colors ${filter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-muted-foreground hover:text-foreground"
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-lg border border-border p-4">
              <div className="h-10 bg-surface rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-surface rounded animate-pulse mt-3" />
              <div className="h-2 bg-surface rounded animate-pulse mt-3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {apps.map((app, i) => (
            <ApplicationCard key={app.id} app={app} index={i} />
          ))}
        </div>
      )}

      {!isLoading && apps.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No applications found</p>
          <p className="text-sm mt-1">
            {filter === "all" ? "Start applying to jobs to track them here." : "Try changing the filter."}
          </p>
        </div>
      )}
    </PageWrapper>
  );
}
