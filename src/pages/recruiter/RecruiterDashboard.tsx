import { useAuth } from "@/contexts/AuthContext";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useQuery } from "@tanstack/react-query";
import { getRecruiterJobs, getJobApplicants } from "@/lib/api";
import { Briefcase, Users, ClipboardCheck, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function RecruiterDashboard() {
    const { profile } = useAuth();

    const { data: jobs = [] } = useQuery({
        queryKey: ["recruiterJobs", profile?.id],
        queryFn: () => getRecruiterJobs(profile!.id),
        enabled: !!profile,
    });

    const activeJobs = jobs.filter((j) => j.status === "active");
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    const stats = [
        { label: "Active Jobs", value: activeJobs.length.toString(), icon: Briefcase, color: "text-primary" },
        { label: "Total Postings", value: jobs.length.toString(), icon: ClipboardCheck, color: "text-success" },
    ];

    return (
        <PageWrapper className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">
                    {greeting}, {profile?.full_name?.split(" ")[0]} 👋
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </p>
            </div>

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

            {/* Quick Actions */}
            <div className="flex gap-3">
                <Link
                    to="/recruiter/jobs"
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-md hover:bg-primary-dark transition-colors text-sm"
                >
                    <PlusCircle className="h-4 w-4" /> Post New Job
                </Link>
            </div>

            {/* Recent Jobs */}
            <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">Your Job Postings</h2>
                {jobs.length === 0 ? (
                    <div className="bg-card rounded-lg border border-border p-8 text-center">
                        <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No jobs posted yet. Create your first job posting!</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                        {jobs.map((job, i) => (
                            <motion.div
                                key={job.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Link
                                    to={`/recruiter/pipeline/${job.id}`}
                                    className="block bg-card rounded-lg border border-border p-5 hover:-translate-y-0.5 transition-all duration-200"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-semibold text-card-foreground">{job.title}</h3>
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${job.status === "active" ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                                            }`}>
                                            {job.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{job.company_name} · {job.location}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{job.salary_range}</p>
                                    <div className="flex items-center gap-2 mt-3 text-xs text-primary">
                                        <Users className="h-3 w-3" /> View Pipeline →
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </PageWrapper>
    );
}
