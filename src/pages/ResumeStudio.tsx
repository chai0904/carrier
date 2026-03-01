import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { AIResponseBlock } from "@/components/ui/AIResponseBlock";
import { tailorResume, type ResumeTailorResult } from "@/lib/ai";
import { updateProfile } from "@/lib/api";
import { Upload, FileText, Sparkles, Copy, Check, Save } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function ResumeStudio() {
  const { profile, refreshProfile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<ResumeTailorResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Load saved resume text from profile
  useEffect(() => {
    if (profile?.resume_text) {
      setResumeText(profile.resume_text);
    }
  }, [profile?.resume_text]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    if (f.type === "text/plain") {
      const text = await f.text();
      setResumeText(text);
      setDirty(true);
      toast.success("Resume text loaded!");
    } else if (f.type === "application/pdf") {
      // Read PDF as text (basic extraction)
      try {
        const buffer = await f.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        // Try to extract text from PDF by finding text stream markers
        let text = "";
        const decoder = new TextDecoder("utf-8", { fatal: false });
        const raw = decoder.decode(bytes);
        // Extract text between parentheses in PDF text streams (basic)
        const matches = raw.match(/\(([^)]+)\)/g);
        if (matches && matches.length > 5) {
          text = matches.map(m => m.slice(1, -1)).join(" ").replace(/\\n/g, "\n").replace(/\\\\/g, "\\");
        }
        if (text.trim().length > 50) {
          setResumeText(text);
          setDirty(true);
          toast.success("Resume text extracted from PDF!");
        } else {
          toast.info("Could not extract text from this PDF. Please paste your resume text below.");
        }
      } catch {
        toast.info("Could not read PDF. Please paste your resume text manually.");
      }
    } else {
      toast.info("File uploaded! Please paste your resume text below for best results.");
    }
  };

  const handleSaveResume = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await updateProfile(profile.id, { resume_text: resumeText });
    if (error) {
      toast.error("Failed to save resume: " + error);
    } else {
      toast.success("Resume saved to your profile!");
      setDirty(false);
      await refreshProfile();
    }
    setSaving(false);
  };

  const handleTailor = async () => {
    if (!resumeText.trim()) { toast.error("Please paste or upload your resume text first"); return; }
    if (!jobTitle.trim()) { toast.error("Please enter a job title"); return; }
    setAnalyzing(true);
    try {
      const result = await tailorResume(resumeText, jobTitle, jobDesc);
      setResults(result);
      toast.success("AI analysis complete!");
    } catch (err) {
      toast.error("Failed to analyze resume. Please try again.");
    }
    setAnalyzing(false);
  };

  const handleCopy = () => {
    if (results) {
      navigator.clipboard.writeText(results.suggestions.map(s => s.improved).join("\n"));
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <PageWrapper className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Resume Studio</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload your resume, save it to your profile, and tailor it for any role with AI.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Upload + JD */}
        <div className="space-y-4">
          {/* Upload */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">Upload Resume</h3>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-primary/50 transition-colors">
              {file ? (
                <div className="flex items-center gap-2 text-success">
                  <FileText className="h-5 w-5" />
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Drop your resume or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, TXT</p>
                </>
              )}
              <input type="file" accept=".pdf,.txt" className="hidden" onChange={handleUpload} />
            </label>
          </div>

          {/* Resume text area */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-card-foreground">Resume Text</h3>
              <div className="flex items-center gap-2">
                {dirty && <span className="text-[10px] text-accent-warm font-medium">Unsaved changes</span>}
                <button
                  onClick={handleSaveResume}
                  disabled={saving || !resumeText.trim()}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark transition-colors disabled:opacity-40"
                >
                  <Save className="h-3.5 w-3.5" />
                  {saving ? "Saving..." : "Save to Profile"}
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {profile?.resume_text ? "Your saved resume is loaded. Edit and save changes." : "Paste your resume content here and save it to your profile."}
            </p>
            <textarea
              value={resumeText}
              onChange={(e) => { setResumeText(e.target.value); setDirty(true); }}
              placeholder="Paste your resume content here...&#10;&#10;Example:&#10;John Doe&#10;Software Engineer&#10;&#10;Experience:&#10;- Built scalable web applications using React and Node.js&#10;- Led a team of 5 engineers..."
              rows={10}
              className="w-full bg-surface text-card-foreground rounded-md px-3 py-2.5 text-sm border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">{resumeText.length} characters · {resumeText.split(/\s+/).filter(Boolean).length} words</p>
          </div>

          {/* Job description */}
          <div className="bg-card rounded-lg border border-border p-6 space-y-3">
            <h3 className="text-sm font-semibold text-card-foreground">Target Role</h3>
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g., Senior Frontend Engineer"
              className="w-full bg-surface text-card-foreground rounded-md px-3 py-2.5 text-sm border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
            <textarea
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              placeholder="Paste the job description here..."
              rows={5}
              className="w-full bg-surface text-card-foreground rounded-md px-3 py-2.5 text-sm border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
            />
            <button
              onClick={handleTailor}
              disabled={analyzing}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-md hover:bg-primary-dark hover:glow-primary transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {analyzing ? "Analyzing with Gemini..." : "Tailor Resume with AI"}
            </button>
          </div>
        </div>

        {/* Right: Results */}
        <div className="space-y-4">
          {analyzing && (
            <div className="bg-card rounded-lg border border-border p-6 space-y-3">
              <div className="h-4 bg-surface rounded animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-surface via-muted to-surface" />
              <div className="h-4 w-3/4 bg-surface rounded animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-surface via-muted to-surface" />
              <div className="h-4 w-1/2 bg-surface rounded animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-surface via-muted to-surface" />
              <p className="text-xs text-muted-foreground text-center mt-2">AI is analyzing your resume...</p>
            </div>
          )}

          {results && !analyzing && (
            <>
              {/* Match Score */}
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-lg border border-border p-6 text-center">
                <div className="inline-flex items-center justify-center h-24 w-24 rounded-full border-4 border-primary mb-3">
                  <span className="text-3xl font-extrabold text-primary">{results.matchScore}</span>
                </div>
                <p className="text-sm font-semibold text-card-foreground">Match Score</p>
                <p className="text-xs text-muted-foreground mt-2">{results.matchSummary}</p>
              </motion.div>

              {/* Suggestions */}
              <div className="bg-card rounded-lg border border-border p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-card-foreground">Tailoring Suggestions</h3>
                  <button onClick={handleCopy} className="text-xs text-primary flex items-center gap-1">
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy All"}
                  </button>
                </div>
                {results.suggestions.map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="space-y-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-pill bg-primary/20 text-primary">{s.section}</span>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="bg-destructive/5 rounded-md p-2">
                        <p className="text-[10px] text-destructive font-medium mb-1">Current</p>
                        <p className="text-xs text-muted-foreground">{s.current}</p>
                      </div>
                      <div className="bg-success/5 rounded-md p-2">
                        <p className="text-[10px] text-success font-medium mb-1">Improved</p>
                        <p className="text-xs text-card-foreground">{s.improved}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">💡 {s.reason}</p>
                  </motion.div>
                ))}
              </div>

              {/* Keywords */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-sm font-semibold text-card-foreground mb-3">Keywords to Add</h3>
                <div className="flex flex-wrap gap-2">
                  {results.keywordsToAdd.map((kw) => (
                    <span key={kw} className="text-xs px-3 py-1 rounded-pill bg-accent/20 text-accent font-medium">{kw}</span>
                  ))}
                </div>
              </div>

              {/* Strengths */}
              {results.strengthsToHighlight?.length > 0 && (
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-sm font-semibold text-card-foreground mb-3">Strengths to Highlight</h3>
                  <div className="flex flex-wrap gap-2">
                    {results.strengthsToHighlight.map((s) => (
                      <span key={s} className="text-xs px-3 py-1 rounded-pill bg-success/20 text-success font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!results && !analyzing && (
            <div className="bg-card rounded-lg border border-border p-8 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Upload a resume and enter a job description to get AI-powered tailoring suggestions.</p>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
