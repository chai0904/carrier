import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/store/appStore";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  ClipboardCheck,
  MessageSquare,
  Brain,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users,
  PlusCircle,
  Search,
} from "lucide-react";

const candidateNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Browse Jobs", icon: Search, path: "/jobs" },
  { label: "Applications", icon: Briefcase, path: "/applications" },
  { label: "Resume Studio", icon: FileText, path: "/resume" },
  { label: "Assessments", icon: ClipboardCheck, path: "/assessments" },
  { label: "Interview Prep", icon: Brain, path: "/interview-prep" },
  { label: "Messages", icon: MessageSquare, path: "/messages" },
];

const recruiterNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/recruiter/dashboard" },
  { label: "Job Postings", icon: PlusCircle, path: "/recruiter/jobs" },
  { label: "Messages", icon: MessageSquare, path: "/messages" },
];

export function AppSidebar() {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  const navItems = profile?.role === "recruiter" ? recruiterNavItems : candidateNavItems;

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 h-screen sticky top-0",
        sidebarCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-14 border-b border-sidebar-border">
        <span className="text-primary font-extrabold text-xl">C</span>
        {!sidebarCollapsed && <span className="text-sidebar-accent-foreground font-bold text-sm">andidateOS</span>}
      </div>

      {/* Role badge */}
      {!sidebarCollapsed && profile && (
        <div className="px-4 pt-3 pb-1">
          <span className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full",
            profile.role === "recruiter"
              ? "bg-accent-warm/20 text-accent-warm"
              : "bg-primary/20 text-primary"
          )}>
            {profile.role === "recruiter" ? "🏢 Recruiter" : "🎯 Candidate"}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && (
                <span className="flex-1">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        {!sidebarCollapsed && profile && (
          <div className="flex items-center gap-2 px-1">
            <img
              src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.full_name}`}
              alt=""
              className="h-7 w-7 rounded-full bg-sidebar-accent"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{profile.full_name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{profile.email}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={signOut}
            className={cn(
              "flex items-center gap-2 text-sidebar-foreground hover:text-destructive transition-colors text-sm rounded-md px-2 py-1.5",
              sidebarCollapsed && "mx-auto"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!sidebarCollapsed && <span className="text-xs">Sign Out</span>}
          </button>
          <button onClick={toggleSidebar} className="ml-auto text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors">
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
