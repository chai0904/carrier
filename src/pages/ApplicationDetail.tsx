import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getApplication, getMessages as fetchMessages } from "@/lib/api";
import { generateInterviewQuestions, type InterviewQuestion } from "@/lib/ai";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { StatusPill } from "@/components/ui/StatusPill";
import { AIResponseBlock } from "@/components/ui/AIResponseBlock";
import { useState, useEffect } from "react";
import { ArrowLeft, Check, Circle, X, ChevronDown, ChevronUp, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { sendMessage } from "@/lib/api";
import { toast } from "sonner";

const tabs = ["Timeline", "Interview Prep", "Messages"];

export default function ApplicationDetail() {
  const { id } = useParams();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("Timeline");
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [generatingQs, setGeneratingQs] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  const { data: app, isLoading } = useQuery({
    queryKey: ["application", id],
    queryFn: () => getApplication(id!),
    enabled: !!id,
  });

  // Fetch messages when tab switches
  useEffect(() => {
    if (activeTab === "Messages" && id) {
      fetchMessages(id).then(setMessages);

      // Subscribe to new messages
      const channel = supabase
        .channel(`messages:${id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `application_id=eq.${id}`,
        }, (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [activeTab, id]);

  const handleGenerateQuestions = async () => {
    if (!app) return;
    setGeneratingQs(true);
    try {
      const qs = await generateInterviewQuestions(
        app.job?.title || "Software Engineer",
        app.job?.description || "",
        profile?.skills || []
      );
      setQuestions(qs);
    } catch (e) {
      toast.error("Failed to generate questions");
    }
    setGeneratingQs(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() || !profile || !id) return;
    setSendingMsg(true);
    const result = await sendMessage(id, profile.id, msgInput);
    if (result) {
      setMsgInput("");
    } else {
      toast.error("Failed to send message");
    }
    setSendingMsg(false);
  };

  if (isLoading) {
    return (
      <PageWrapper className="p-6">
        <div className="space-y-4">
          <div className="h-6 w-40 bg-surface rounded animate-pulse" />
          <div className="h-14 bg-surface rounded animate-pulse" />
          <div className="h-40 bg-surface rounded animate-pulse" />
        </div>
      </PageWrapper>
    );
  }

  if (!app) return <PageWrapper className="p-6"><p className="text-muted-foreground">Application not found.</p></PageWrapper>;

  return (
    <PageWrapper className="p-6 space-y-6">
      {/* Header */}
      <Link to="/applications" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Applications
      </Link>

      <div className="flex flex-col sm:flex-row items-start gap-4">
        <img
          src={app.job?.company_logo || `https://ui-avatars.com/api/?name=${app.job?.company_name}&background=1e293b&color=2563eb&bold=true`}
          alt={app.job?.company_name}
          className="h-14 w-14 rounded-xl bg-surface object-contain p-2"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${app.job?.company_name || "Co"}&background=1e293b&color=2563eb&bold=true`;
          }}
        />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{app.job?.title}</h1>
          <p className="text-sm text-muted-foreground">{app.job?.company_name} · {app.job?.location} · {app.job?.salary_range}</p>
        </div>
        <StatusPill status={app.status} />
      </div>

      {app.status === "rejected" && (
        <Link to={`/applications/${app.id}/skill-gap`} className="block">
          <AIResponseBlock>
            <p>Want to understand why and how to come back stronger? <span className="text-primary font-medium underline">View Skill Gap Analysis →</span></p>
          </AIResponseBlock>
        </Link>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {activeTab === "Timeline" && (
        <div className="space-y-0">
          {(app.stages || []).map((stage, i) => {
            const statusIcon: Record<string, JSX.Element> = {
              completed: <Check className="h-3 w-3" />,
              active: <Circle className="h-3 w-3 fill-current" />,
              rejected: <X className="h-3 w-3" />,
              skipped: <Circle className="h-3 w-3" />,
              pending: <Circle className="h-3 w-3" />,
            };
            const statusColor: Record<string, string> = {
              completed: "bg-success text-success-foreground",
              active: "bg-primary text-primary-foreground pulse-dot",
              rejected: "bg-destructive text-destructive-foreground",
              skipped: "bg-muted text-muted-foreground",
              pending: "bg-muted text-muted-foreground",
            };
            return (
              <motion.div
                key={stage.name + i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4"
              >
                <div className="flex flex-col items-center">
                  <div className={cn("h-6 w-6 rounded-full flex items-center justify-center shrink-0", statusColor[stage.status] || "bg-muted text-muted-foreground")}>
                    {statusIcon[stage.status] || <Circle className="h-3 w-3" />}
                  </div>
                  {i < (app.stages?.length || 0) - 1 && <div className="w-0.5 flex-1 bg-border my-1" />}
                </div>
                <div className="pb-6">
                  <p className="text-sm font-medium text-foreground">{stage.name}</p>
                  {stage.date && <p className="text-xs text-muted-foreground">{new Date(stage.date).toLocaleDateString()}</p>}
                  {stage.note && <p className="text-xs text-muted-foreground mt-1">{stage.note}</p>}
                </div>
              </motion.div>
            );
          })}
          {(app.stages || []).length === 0 && (
            <p className="text-sm text-muted-foreground">No stages recorded yet.</p>
          )}
        </div>
      )}

      {/* Interview Prep */}
      {activeTab === "Interview Prep" && (
        <div className="space-y-3">
          {questions.length === 0 && !generatingQs ? (
            <div className="bg-card rounded-lg border border-border p-8 text-center">
              <p className="text-sm text-muted-foreground mb-4">Generate AI-powered interview questions for this role.</p>
              <button
                onClick={handleGenerateQuestions}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-md hover:bg-primary-dark transition-colors text-sm"
              >
                <Sparkles className="h-4 w-4" /> Generate Questions
              </button>
            </div>
          ) : generatingQs ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-lg border border-border p-4 space-y-2">
                  <div className="h-3 w-20 bg-surface rounded animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-surface via-muted to-surface" />
                  <div className="h-4 w-full bg-surface rounded animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-surface via-muted to-surface" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <AIResponseBlock>AI-predicted interview questions based on the role and your profile.</AIResponseBlock>
              {questions.map((q) => (
                <div key={q.id} className="bg-card rounded-lg border border-border p-4">
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
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 pt-3 border-t border-border space-y-2">
                      <div><p className="text-xs font-semibold text-accent mb-1">💡 Coaching Tip</p><p className="text-xs text-muted-foreground">{q.coachingTip}</p></div>
                      <div><p className="text-xs font-semibold text-success mb-1">✅ Example Answer</p><p className="text-xs text-muted-foreground">{q.exampleAnswer}</p></div>
                    </motion.div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Messages */}
      {activeTab === "Messages" && (
        <div className="space-y-3">
          <div className="bg-card rounded-lg border border-border overflow-hidden" style={{ height: "400px" }}>
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No messages yet. Start the conversation!</p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={cn("flex", msg.sender_id === profile?.id ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[75%] rounded-lg px-4 py-2.5 text-sm",
                        msg.sender_id === profile?.id
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-surface text-surface-foreground rounded-bl-none"
                      )}>
                        {msg.content}
                        <p className="text-[10px] opacity-60 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleSendMessage} className="p-3 border-t border-border flex gap-2">
                <input
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-surface text-card-foreground rounded-md px-3 py-2.5 text-sm border border-border focus:border-primary outline-none"
                />
                <button
                  type="submit"
                  disabled={sendingMsg || !msgInput.trim()}
                  className="bg-primary text-primary-foreground h-10 w-10 rounded-md flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
