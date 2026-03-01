import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CopilotMessage } from "@/types";

interface AppState {
  copilotOpen: boolean;
  copilotMessages: CopilotMessage[];
  sidebarCollapsed: boolean;
  toggleCopilot: () => void;
  addCopilotMessage: (msg: CopilotMessage) => void;
  clearCopilotMessages: () => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      copilotOpen: false,
      copilotMessages: [],
      sidebarCollapsed: false,
      toggleCopilot: () => set((s) => ({ copilotOpen: !s.copilotOpen })),
      addCopilotMessage: (msg) =>
        set((s) => ({ copilotMessages: [...s.copilotMessages, msg] })),
      clearCopilotMessages: () => set({ copilotMessages: [] }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: "candidateos-store" }
  )
);
