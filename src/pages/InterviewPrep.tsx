import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getApplications } from "@/lib/api";
import { generateInterviewQuestions, evaluateAnswer, type InterviewQuestion, type AnswerEvaluation } from "@/lib/ai";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { AIResponseBlock } from "@/components/ui/AIResponseBlock";
import { Brain, Sparkles, ChevronDown, ChevronUp, Send } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function InterviewPrep() {
  const { profile } = useAuth();
  const [selectedApp, setSelectedApp] = useState("");
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState("");
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);

  const { data: applications = [] } = useQuery({
    queryKey: ["applications", profile?.id],
    queryFn: () => getApplications(profile!.id),
    enabled: !!profile,
  });

  const activeApps = applications.filter((a) => a.status !== "rejected");

  const handleGenerate = async () => {
    if (!selectedApp) { toast.error("Select an application first"); return; }
    const app = applications.find((a) => a.id === selectedApp);
    if (!app) return;

    setLoading(true);
    try {
      const qs = await generateInterviewQuestions(
        app.job?.title || "Software Engineer",
        app.job?.description || "",
        profile?.skills || []
      );
      setQuestions(qs);
      setGenerated(true);
      toast.success("Questions generated!");
    } catch (e) {
      toast.error("Failed to generate questions");
    }
    setLoading(false);
  };

  const handleEvaluate = async () => {
    if (!answer.trim()) { toast.error("Write an answer first"); return; }
    setLoading(true);
    try {
      const result = await evaluateAnswer(questions[currentQ].question, answer);
      setEvaluation(result);
    } catch (e) {
      toast.error("Failed to evaluate answer");
    }
    setLoading(false);
  };

  return (
    <PageWrapper className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" /> Interview Prep
        </h1>
        <p className="text-sm text-muted-foreground mt-1">AI-powered question prediction and mock interview practice.</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Config */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-lg border border-border p-6 space-y-4">
            <h3 className="text-sm font-semibold text-card-foreground">Configuration</h3>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Select Application</label>
              <select
                value={selectedApp}
                onChange={(e) => setSelectedApp(e.target.value)}
                className="w-full bg-surface text-card-foreground rounded-md px-3 py-2.5 text-sm border border-border focus:border-primary outline-none"
              >
                <option value="">Choose an application...</option>
                {activeApps.map((a) => (
                  <option key={a.id} value={a.id}>{a.job?.company_name} — {a.job?.title}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-md hover:bg-primary-dark hover:glow-primary transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {loading && !generated ? "Generating with Gemini..." : "Generate Questions"}
            </button>
          </div>

          {generated && (
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-card-foreground">Practice Mode</h3>
                <button
                  onClick={() => { setPracticeMode(!practiceMode); setEvaluation(null); setAnswer(""); }}
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors",
                    practiceMode ? "bg-primary" : "bg-surface"
                  )}
                >
                  <span className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform",
                    practiceMode ? "translate-x-5" : "translate-x-0.5"
                  )} />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Answer questions and get AI evaluation on your responses.</p>
            </div>
          )}
        </div>

        {/* Questions / Practice */}
        <div className="lg:col-span-3 space-y-3">
          {!generated && !loading && (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Select an application and generate questions to start preparing.</p>
            </div>
          )}

          {loading && !generated && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-lg border border-border p-4 space-y-2">
                  <div className="h-3 w-20 bg-surface rounded animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-surface via-muted to-surface" />
                  <div className="h-4 w-full bg-surface rounded animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-surface via-muted to-surface" />
                </div>
              ))}
            </div>
          )}

          {generated && !practiceMode && questions.map((q) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: q.id * 0.05 }}
              className="bg-card rounded-lg border border-border p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-pill bg-primary/20 text-primary">{q.category}</span>
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-pill",
                      q.difficulty === "Hard" ? "bg-destructive/20 text-destructive" : q.difficulty === "Medium" ? "bg-accent-warm/20 text-accent-warm" : "bg-success/20 text-success"
                    )}>{q.difficulty}</span>
                  </div>
                  <p className="text-sm font-medium text-card-foreground">{q.question}</p>
                </div>
                <button onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)} className="text-muted-foreground shrink-0 ml-2">
                  {expandedQ === q.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
              {expandedQ === q.id && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 pt-3 border-t border-border space-y-2">
                  <p className="text-xs text-accent">💡 {q.coachingTip}</p>
                  <p className="text-xs text-muted-foreground">✅ {q.exampleAnswer}</p>
                </motion.div>
              )}
            </motion.div>
          ))}

          {generated && practiceMode && questions.length > 0 && (
            <div className="space-y-4">
              <AIResponseBlock>
                <p>Question {currentQ + 1} of {questions.length}</p>
              </AIResponseBlock>
              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-pill bg-primary/20 text-primary">{questions[currentQ].category}</span>
                </div>
                <p className="text-base font-medium text-card-foreground mb-4">{questions[currentQ].question}</p>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={6}
                  className="w-full bg-surface text-card-foreground rounded-md px-3 py-2.5 text-sm border border-border focus:border-primary outline-none resize-none"
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleEvaluate}
                    disabled={loading}
                    className="bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-md hover:bg-primary-dark transition-all text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" /> {loading ? "Evaluating..." : "Evaluate My Answer"}
                  </button>
                  <button
                    onClick={() => { setCurrentQ((currentQ + 1) % questions.length); setAnswer(""); setEvaluation(null); }}
                    className="border border-border text-muted-foreground px-6 py-2.5 rounded-md hover:text-foreground transition-colors text-sm"
                  >
                    Next Question
                  </button>
                </div>
              </div>

              {evaluation && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-lg border border-border p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-16 w-16 rounded-full border-4 border-primary flex items-center justify-center">
                      <span className="text-xl font-extrabold text-primary">{evaluation.score}</span>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-card-foreground">{evaluation.grade}</p>
                      <p className="text-xs text-muted-foreground">out of 10</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{evaluation.feedback}</p>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
