import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getMessageThreads, getMessages as fetchMessages, sendMessage } from "@/lib/api";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function Messages() {
  const { profile } = useAuth();
  const [selectedThread, setSelectedThread] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const { data: threads = [] } = useQuery({
    queryKey: ["messageThreads", profile?.id],
    queryFn: () => getMessageThreads(profile!.id),
    enabled: !!profile,
  });

  // Select first thread by default
  useEffect(() => {
    if (threads.length > 0 && !selectedThread) {
      setSelectedThread(threads[0].applicationId);
    }
  }, [threads, selectedThread]);

  // Fetch messages for selected thread
  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread).then(setMessages);

      // Subscribe to new messages
      const channel = supabase
        .channel(`messages:${selectedThread}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `application_id=eq.${selectedThread}`,
        }, (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedThread]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !profile || !selectedThread) return;
    setSending(true);
    const result = await sendMessage(selectedThread, profile.id, input);
    if (result) {
      setInput("");
    } else {
      toast.error("Failed to send message");
    }
    setSending(false);
  };

  const activeThread = threads.find((t) => t.applicationId === selectedThread);

  return (
    <PageWrapper className="p-6">
      <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <MessageSquare className="h-6 w-6 text-primary" /> Messages
      </h1>

      {threads.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No conversations yet. Messages will appear when you interact with recruiters.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-0 bg-card rounded-lg border border-border overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
          {/* Thread list */}
          <div className="border-r border-border overflow-y-auto">
            {threads.map((t) => (
              <button
                key={t.applicationId}
                onClick={() => setSelectedThread(t.applicationId)}
                className={cn(
                  "w-full text-left p-4 border-b border-border transition-colors",
                  selectedThread === t.applicationId ? "bg-surface" : "hover:bg-surface/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={t.otherParty?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${t.otherParty?.full_name}`}
                    alt=""
                    className="h-8 w-8 rounded-full bg-surface shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-card-foreground truncate">{t.otherParty?.full_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.companyName} — {t.jobTitle}</p>
                    {t.lastMessage && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{t.lastMessage.content}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Chat */}
          <div className="lg:col-span-2 flex flex-col">
            {activeThread ? (
              <>
                <div className="flex items-center gap-3 p-4 border-b border-border">
                  <img
                    src={activeThread.otherParty?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=default`}
                    alt=""
                    className="h-8 w-8 rounded-full bg-surface"
                  />
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{activeThread.otherParty?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{activeThread.companyName}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex", msg.sender_id === profile?.id ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[75%] rounded-lg px-4 py-2.5 text-sm",
                        msg.sender_id === profile?.id
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-surface text-surface-foreground rounded-bl-none"
                      )}>
                        {msg.content}
                        <p className="text-[10px] opacity-60 mt-1">{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSend} className="p-4 border-t border-border flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-surface text-card-foreground rounded-md px-3 py-2.5 text-sm border border-border focus:border-primary outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="bg-primary text-primary-foreground h-10 w-10 rounded-md flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Select a conversation</div>
            )}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
