import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Brain, MessageCircle, Shield } from "lucide-react";

const features = [
  { icon: BarChart3, title: "Real-time Visibility", desc: "Track every application stage with live updates. No more black holes." },
  { icon: Brain, title: "AI Co-Pilot", desc: "Get tailored prep, resume optimization, and smart insights — powered by AI." },
  { icon: MessageCircle, title: "Direct Recruiter Line", desc: "Message recruiters directly. No more waiting for email replies." },
];

const companies = ["Razorpay", "Zepto", "CRED", "PhonePe", "Swiggy"];

export default function Landing() {
  return (
    <div className="min-h-screen bg-navy gradient-mesh">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-4">
        <div className="flex items-center gap-2">
          <span className="text-primary font-extrabold text-2xl">C</span>
          <span className="text-navy-foreground font-bold">andidateOS</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
          <Link
            to="/auth?mode=signup"
            className="bg-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-md hover:bg-primary-dark hover:glow-primary transition-all duration-200"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-flex items-center gap-2 rounded-pill bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 mb-6">
            <Shield className="h-3 w-3" /> Your career, finally in your control.
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-navy-foreground leading-tight mb-6">
            Your hiring journey,<br />
            <span className="text-primary">finally transparent.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Track applications, prep with AI, and own your narrative. The candidate portal nobody built — until now.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth?mode=signup"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-3.5 rounded-md hover:bg-primary-dark hover:glow-primary transition-all duration-200 text-base"
            >
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 border border-secondary text-muted-foreground font-medium px-8 py-3.5 rounded-md hover:border-primary hover:text-foreground transition-all duration-200 text-base"
            >
              See How It Works
            </a>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.4 }}
              className="bg-surface rounded-xl p-6 border border-border hover:-translate-y-1 transition-all duration-200 card-shadow"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-surface-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section className="max-w-5xl mx-auto px-6 pb-20 text-center">
        <p className="text-sm text-muted-foreground mb-4">Trusted by candidates at</p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {companies.map((c) => (
            <span key={c} className="text-muted-foreground/60 font-semibold text-lg">{c}</span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © 2024 CandidateOS. Built for candidates, by candidates.
      </footer>
    </div>
  );
}
