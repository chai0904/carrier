import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AIResponseBlock({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("ai-border ai-gradient rounded-lg p-4", className)}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-accent text-xs font-semibold">✨ AI Insight</span>
      </div>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
}
