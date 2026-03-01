import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getActiveJobs, getApplications, applyToJob } from "@/lib/api";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Briefcase, MapPin, Banknote, Search, Send, Check, Clock, Building } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function BrowseJobs() {
    const { profile } = useAuth();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [selectedJob, setSelectedJob] = useState<string | null>(null);
    const [applying, setApplying] = useState<string | null>(null);

    const { data: jobs = [], isLoading } = useQuery({
        queryKey: ["activeJobs"],
        queryFn: getActiveJobs,
    });

    const { data: applications = [] } = useQuery({
        queryKey: ["applications", profile?.id],
        queryFn: () => getApplications(profile!.id),
        enabled: !!profile,
    });

    const appliedJobIds = new Set(applications.map((a) => a.job_id));

    const filtered = search
        ? jobs.filter(
            (j) =>
                j.title.toLowerCase().includes(search.toLowerCase()) ||
                j.company_name.toLowerCase().includes(search.toLowerCase()) ||
                j.location?.toLowerCase().includes(search.toLowerCase()) ||
                j.description.toLowerCase().includes(search.toLowerCase())
        )
        : jobs;

    const selectedJobData = jobs.find((j) => j.id === selectedJob);

    const handleApply = async (jobId: string) => {
        if (!profile) return;
        if (appliedJobIds.has(jobId)) { toast.info("You've already applied to this job"); return; }
        setApplying(jobId);
        const { error } = await applyToJob(profile.id, jobId);
        if (error) {
            toast.error("Failed to apply: " + error);
        } else {
            toast.success("Application submitted! 🎉");
            queryClient.invalidateQueries({ queryKey: ["applications"] });
            queryClient.invalidateQueries({ queryKey: ["activeJobs"] });
        }
        setApplying(null);
    };

    return (
        <PageWrapper className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Briefcase className="h-6 w-6 text-primary" /> Browse Jobs
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Discover open positions and apply directly.
                </p>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by title, company, or location..."
                    className="w-full bg-card text-card-foreground rounded-lg pl-10 pr-4 py-3 text-sm border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
            </div>

            {isLoading ? (
                <div className="grid lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-2 space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-card rounded-lg border border-border p-5">
                                <div className="h-4 w-3/4 bg-surface rounded animate-pulse" />
                                <div className="h-3 w-1/2 bg-surface rounded animate-pulse mt-3" />
                                <div className="h-3 w-1/3 bg-surface rounded animate-pulse mt-2" />
                            </div>
                        ))}
                    </div>
                    <div className="lg:col-span-3">
                        <div className="bg-card rounded-lg border border-border p-8 h-96 animate-pulse" />
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-card rounded-lg border border-border p-16 text-center">
                    <Briefcase className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium text-foreground">No open positions right now</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        {search ? "Try different search terms." : "Check back soon for new job postings!"}
                    </p>
                </div>
            ) : (
                <div className="grid lg:grid-cols-5 gap-6">
                    {/* Job List */}
                    <div className="lg:col-span-2 space-y-3 max-h-[calc(100vh-240px)] overflow-y-auto pr-1">
                        {filtered.map((job, i) => {
                            const isApplied = appliedJobIds.has(job.id);
                            return (
                                <motion.button
                                    key={job.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    onClick={() => setSelectedJob(job.id)}
                                    className={cn(
                                        "w-full text-left bg-card rounded-lg border p-5 transition-all duration-200 hover:-translate-y-0.5",
                                        selectedJob === job.id ? "border-primary bg-primary/5" : "border-border"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-surface flex items-center justify-center shrink-0">
                                            {job.company_logo ? (
                                                <img src={job.company_logo} alt="" className="h-8 w-8 rounded object-contain" />
                                            ) : (
                                                <Building className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-semibold text-card-foreground truncate">{job.title}</h3>
                                            <p className="text-xs text-muted-foreground mt-0.5">{job.company_name}</p>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                                {job.location && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" /> {job.location}
                                                    </span>
                                                )}
                                                {job.salary_range && (
                                                    <span className="flex items-center gap-1">
                                                        <Banknote className="h-3 w-3" /> {job.salary_range}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {isApplied && (
                                        <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold text-success">
                                            <Check className="h-3 w-3" /> Applied
                                        </div>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Job Detail */}
                    <div className="lg:col-span-3">
                        {selectedJobData ? (
                            <motion.div
                                key={selectedJobData.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-card rounded-lg border border-border p-6 sticky top-20"
                            >
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="h-14 w-14 rounded-xl bg-surface flex items-center justify-center shrink-0">
                                        {selectedJobData.company_logo ? (
                                            <img src={selectedJobData.company_logo} alt="" className="h-10 w-10 rounded-lg object-contain" />
                                        ) : (
                                            <Building className="h-7 w-7 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-lg font-bold text-card-foreground">{selectedJobData.title}</h2>
                                        <p className="text-sm text-muted-foreground">{selectedJobData.company_name}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            {selectedJobData.location && (
                                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {selectedJobData.location}</span>
                                            )}
                                            {selectedJobData.salary_range && (
                                                <span className="flex items-center gap-1"><Banknote className="h-3 w-3" /> {selectedJobData.salary_range}</span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> {new Date(selectedJobData.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Apply Button */}
                                <div className="mb-6">
                                    {appliedJobIds.has(selectedJobData.id) ? (
                                        <div className="flex items-center gap-2 bg-success/10 text-success font-semibold px-5 py-3 rounded-md text-sm">
                                            <Check className="h-4 w-4" /> You've applied to this position
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleApply(selectedJobData.id)}
                                            disabled={applying === selectedJobData.id}
                                            className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-md hover:bg-primary-dark hover:glow-primary transition-all duration-200 disabled:opacity-50 text-sm"
                                        >
                                            <Send className="h-4 w-4" />
                                            {applying === selectedJobData.id ? "Applying..." : "Apply Now"}
                                        </button>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-card-foreground mb-2">About This Role</h3>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{selectedJobData.description}</p>
                                    </div>

                                    {selectedJobData.requirements?.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-card-foreground mb-2">Requirements</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedJobData.requirements.map((req) => (
                                                    <span key={req} className="text-xs px-3 py-1.5 rounded-pill bg-surface text-muted-foreground font-medium">
                                                        {req}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="bg-card rounded-lg border border-border p-12 text-center sticky top-20">
                                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">Select a job to see details</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </PageWrapper>
    );
}
