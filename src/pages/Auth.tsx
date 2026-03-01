import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">(searchParams.get("mode") === "signup" ? "signup" : "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("candidate");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "signup") {
      if (!name.trim()) { toast.error("Please enter your name"); setLoading(false); return; }
      if (!email.trim()) { toast.error("Please enter your email"); setLoading(false); return; }
      if (password.length < 6) { toast.error("Password must be at least 6 characters"); setLoading(false); return; }

      const { error } = await signUp(email, password, role, name);
      if (error) {
        toast.error(error);
        setLoading(false);
        return;
      }
      toast.success("Account created! Welcome to CandidateOS!");
    } else {
      if (!email.trim()) { toast.error("Please enter your email"); setLoading(false); return; }
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error);
        setLoading(false);
        return;
      }
      toast.success("Welcome back!");
    }

    // Navigate will happen automatically via auth state change
    // But we also navigate to ensure it works 
    navigate(role === "recruiter" ? "/recruiter/dashboard" : "/dashboard");
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-navy gradient-mesh flex">
      {/* Left branding */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          <span className="text-primary font-extrabold text-6xl">C</span>
          <h2 className="text-3xl font-bold text-navy-foreground mt-4">Your career,<br />finally in your control.</h2>
          <p className="text-muted-foreground mt-4 max-w-sm">Track applications, prep with AI, and own your narrative.</p>
        </motion.div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-card rounded-xl p-8 card-shadow border border-border"
        >
          {/* Tabs */}
          <div className="flex gap-1 bg-surface rounded-lg p-1 mb-8">
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === "signin" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >Sign In</button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >Sign Up</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Full Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface text-card-foreground rounded-md px-3 py-2.5 text-sm border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                    placeholder="Your full name"
                    required
                  />
                </div>

                {/* Role Selector */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">I am a</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("candidate")}
                      className={`flex-1 py-2.5 text-sm font-medium rounded-md border transition-all ${role === "candidate"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                    >
                      🎯 Candidate
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("recruiter")}
                      className={`flex-1 py-2.5 text-sm font-medium rounded-md border transition-all ${role === "recruiter"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                    >
                      🏢 Recruiter
                    </button>
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface text-card-foreground rounded-md px-3 py-2.5 text-sm border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                placeholder="you@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface text-card-foreground rounded-md px-3 py-2.5 text-sm border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-md hover:bg-primary-dark hover:glow-primary transition-all duration-200 disabled:opacity-50"
            >
              {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or</span></div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full border border-border text-muted-foreground font-medium py-3 rounded-md hover:border-primary hover:text-foreground transition-all duration-200 text-sm"
          >
            Continue with Google
          </button>
        </motion.div>
      </div>
    </div>
  );
}
