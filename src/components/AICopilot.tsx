import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/appStore";
import { useAuth } from "@/contexts/AuthContext";
import { chatWithCopilot } from "@/lib/ai";
import { saveCopilotMessage } from "@/lib/api";
import { Sparkles, X, Send } from "lucide-react";
import { CopilotMessage } from "@/types";

const quickPrompts = [
  "How should I prepare for my upcoming interview?",
  "Help me tailor my resume for a specific role",
  "What skills should I focus on developing?",
  "Give me tips for salary negotiation",
];

export function AICopilot() {
  const { copilotOpen, toggleCopilot, copilotMessages, addCopilotMessage } = useAppStore();
  const { profile } = useAuth();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [copilotMessages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: CopilotMessage = { id: Date.now().toString(), role: "user", content: text, timestamp: new Date().toISOString() };
    addCopilotMessage(userMsg);
    setInput("");
    setIsTyping(true);

    // Save user message to DB
    if (profile) {
      saveCopilotMessage(profile.id, "user", text);
    }

    try {
      const history = copilotMessages.map((m) => ({ role: m.role, content: m.content }));
      const response = await chatWithCopilot(text, history, {
        candidateName: profile?.full_name,
        skills: profile?.skills,
      });

      const aiMsg: CopilotMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      };
      addCopilotMessage(aiMsg);

      // Save AI response to DB
      if (profile) {
        saveCopilotMessage(profile.id, "assistant", response);
      }
    } catch (err) {
      const errorMsg: CopilotMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      };
      addCopilotMessage(errorMsg);
    }

    setIsTyping(false);
  };

  return (
    <>
      {/* FAB */}
      <motion.button
        onClick={toggleCopilot}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center glow-primary"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ boxShadow: ["0 0 20px hsl(217 90% 54% / 0.4)", "0 0 30px hsl(217 90% 54% / 0.6)", "0 0 20px hsl(217 90% 54% / 0.4)"] }}
        transition={{ boxShadow: { repeat: Infinity, duration: 2 } }}
      >
        {copilotOpen ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {copilotOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-card border border-border rounded-xl card-shadow flex flex-col"
            style={{ height: "520px" }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold text-card-foreground">AI Copilot</span>
              <span className="h-1.5 w-1.5 rounded-full bg-success ml-1" />
              <span className="text-[10px] text-muted-foreground">Powered by Gemini</span>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {copilotMessages.length === 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-3">Quick prompts:</p>
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="block w-full text-left text-xs px-3 py-2 rounded-md bg-surface text-surface-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
              {copilotMessages.map((msg) => (
                <div key={msg.id} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div className={msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-lg rounded-br-none px-3 py-2 text-sm max-w-[80%]"
                    : "ai-gradient ai-border rounded-lg rounded-bl-none px-3 py-2 text-sm max-w-[80%] text-card-foreground"
                  }>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-surface rounded-lg px-4 py-2 text-muted-foreground text-sm flex gap-1">
                    <span className="animate-bounce">·</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>·</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>·</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border">
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                className="flex items-center gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-surface text-card-foreground text-sm rounded-md px-3 py-2 border-none outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:bg-primary-dark transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
