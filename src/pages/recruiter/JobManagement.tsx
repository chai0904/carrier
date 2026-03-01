import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getRecruiterJobs, createJob } from "@/lib/api";
import { PlusCircle, Briefcase, X } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function JobManagement() {
    const { profile } = useAuth();
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        title: "",
        company_name: profile?.company_name || profile?.full_name || "",
        company_logo: "",
        location: "",
        salary_range: "",
        description: "",
        requirements: "",
    });

    const { data: jobs = [] } = useQuery({
        queryKey: ["recruiterJobs", profile?.id],
        queryFn: () => getRecruiterJobs(profile!.id),
        enabled: !!profile,
    });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        setLoading(true);

        const result = await createJob({
            recruiter_id: profile.id,
            title: form.title,
            company_name: form.company_name,
            company_logo: form.company_logo || null,
            location: form.location || null,
            salary_range: form.salary_range || null,
            description: form.description,
            requirements: form.requirements.split(",").map((r) => r.trim()).filter(Boolean),
            status: "active",
        });

        if (result) {
            toast.success("Job posted successfully!");
            queryClient.invalidateQueries({ queryKey: ["recruiterJobs"] });
            setShowForm(false);
            setForm({ title: "", company_name: profile.company_name || profile.full_name || "", company_logo: "", location: "", salary_range: "", description: "", requirements: "" });
        } else {
            toast.error("Failed to create job posting.");
        }
        setLoading(false);
    };

    return (
        <PageWrapper className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Job Postings</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage your open positions.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-md hover:bg-primary-dark transition-colors text-sm"
                >
                    {showForm ? <X className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                    {showForm ? "Cancel" : "New Job"}
                </button>
            </div>

            {/* Create Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleCreate}
                        className="bg-card rounded-lg border border-border p-6 space-y-4 overflow-hidden"
                    >
                        <h3 className="text-sm font-semibold text-card-foreground">Create New Job Posting</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Job Title *</label>
                                <input
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="w-full bg-surface text-card-foreground rounded-md px-3 py-2.5 text-sm border border-border focus:border-primary outline-none"
                                    placeholder="e.g., Senior Frontend Engineer"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Company Name *</label>
                                <input
                                    value={form.company_name}
                                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                                    className="w-full bg-surface text-card-foreground rounded-md px-3 py-2.5 text-sm border border-border focus:border-primary outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Location</label>
                                <input
                                    value={form.location}
                                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                                    className="w-full bg-surface text-card-foreground rounded-md px-3 py-2.5 text-sm border border-border focus:border-primary outline-none"
                                    placeholder="e.g., Bangalore, India (Remote OK)"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Salary Range</label>
                                <input
                                    value={form.salary_range}
                                    onChange={(e) => setForm({ ...form, salary_range: e.target.value })}
                                    className="w-full bg-surface text-card-foreground rounded-md px-3 py-2.5 text-sm border border-border focus:border-primary outline-none"
                                    placeholder="e.g., ₹18L – ₹28L"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Job Description *</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                rows={4}
                                className="w-full bg-surface text-card-foreground rounded-md px-3 py-2.5 text-sm border border-border focus:border-primary outline-none resize-none"
                                placeholder="Describe the role, responsibilities, and requirements..."
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Requirements (comma-separated)</label>
                            <input
                                value={form.requirements}
                                onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                                className="w-full bg-surface text-card-foreground rounded-md px-3 py-2.5 text-sm border border-border focus:border-primary outline-none"
                                placeholder="e.g., React, TypeScript, 3+ years experience"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-md hover:bg-primary-dark transition-all text-sm disabled:opacity-50"
                        >
                            {loading ? "Creating..." : "Create Job Posting"}
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Jobs List */}
            {jobs.length === 0 && !showForm ? (
                <div className="bg-card rounded-lg border border-border p-12 text-center">
                    <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No job postings yet. Click "New Job" to create one.</p>
                </div>
            ) : (
                <div className="space-y-3">
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
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold text-card-foreground">{job.title}</h3>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {job.company_name} · {job.location} · {job.salary_range}
                                        </p>
                                    </div>
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${job.status === "active" ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                                        }`}>
                                        {job.status}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{job.description}</p>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}
        </PageWrapper>
    );
}
