import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getJobApplicants, updateApplicationStatus, addApplicationStage } from "@/lib/api";
import { ArrowLeft, Users, Check, Clock, X, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";

const statusColors: Record<string, string> = {
    applied: "bg-blue-500/20 text-blue-400",
    screening: "bg-yellow-500/20 text-yellow-400",
    assessment: "bg-purple-500/20 text-purple-400",
    interview_scheduled: "bg-emerald-500/20 text-emerald-400",
    offer: "bg-green-500/20 text-green-400",
    rejected: "bg-red-500/20 text-red-400",
};

const statusOptions = [
    { value: "applied", label: "Applied" },
    { value: "screening", label: "Screening" },
    { value: "assessment", label: "Assessment" },
    { value: "interview_scheduled", label: "Interview" },
    { value: "offer", label: "Offer" },
    { value: "rejected", label: "Rejected" },
];

export default function CandidatePipeline() {
    const { jobId } = useParams();
    const queryClient = useQueryClient();
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const { data: applicants = [], isLoading } = useQuery({
        queryKey: ["jobApplicants", jobId],
        queryFn: () => getJobApplicants(jobId!),
        enabled: !!jobId,
    });

    const handleStatusChange = async (applicationId: string, newStatus: string) => {
        setUpdatingId(applicationId);
        const { error } = await updateApplicationStatus(applicationId, newStatus);
        if (error) {
            toast.error("Failed to update status");
        } else {
            toast.success(`Status updated to ${newStatus}`);
            queryClient.invalidateQueries({ queryKey: ["jobApplicants", jobId] });
        }
        setUpdatingId(null);
    };

    return (
        <PageWrapper className="p-6 space-y-6">
            <Link to="/recruiter/jobs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to Jobs
            </Link>

            <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Users className="h-6 w-6 text-primary" /> Candidate Pipeline
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {applicants.length} applicant{applicants.length !== 1 ? "s" : ""}
                </p>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-card rounded-lg border border-border p-5">
                            <div className="h-4 w-40 bg-surface rounded animate-pulse" />
                            <div className="h-3 w-24 bg-surface rounded animate-pulse mt-2" />
                        </div>
                    ))}
                </div>
            ) : applicants.length === 0 ? (
                <div className="bg-card rounded-lg border border-border p-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No applicants yet for this position.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {applicants.map((app: any, i: number) => (
                        <motion.div
                            key={app.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-card rounded-lg border border-border p-5"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={app.candidate?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.candidate?.full_name}`}
                                        alt=""
                                        className="h-10 w-10 rounded-full bg-surface"
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-card-foreground">{app.candidate?.full_name}</p>
                                        <p className="text-xs text-muted-foreground">{app.candidate?.email}</p>
                                        {app.candidate?.skills?.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                {app.candidate.skills.slice(0, 5).map((skill: string) => (
                                                    <span key={skill} className="text-[10px] px-2 py-0.5 rounded-full bg-surface text-muted-foreground">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <select
                                        value={app.status}
                                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                        disabled={updatingId === app.id}
                                        className={cn(
                                            "text-xs font-semibold px-3 py-1.5 rounded-md border-none outline-none cursor-pointer",
                                            statusColors[app.status] || "bg-surface text-muted-foreground",
                                            updatingId === app.id && "opacity-50"
                                        )}
                                    >
                                        {statusOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-3 text-xs text-muted-foreground">
                                Applied: {new Date(app.applied_at).toLocaleDateString()}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </PageWrapper>
    );
}
