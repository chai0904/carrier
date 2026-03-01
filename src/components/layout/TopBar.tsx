import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/store/appStore";
import { Bell, Menu, LogOut } from "lucide-react";

export function TopBar() {
  const { profile, signOut } = useAuth();
  const { toggleSidebar } = useAppStore();

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      <button onClick={toggleSidebar} className="md:hidden text-muted-foreground">
        <Menu className="h-5 w-5" />
      </button>
      <div />
      <div className="flex items-center gap-3">
        <button className="relative text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-destructive rounded-full" />
        </button>
        <img
          src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=default`}
          alt=""
          className="h-8 w-8 rounded-full bg-surface"
        />
      </div>
    </header>
  );
}
