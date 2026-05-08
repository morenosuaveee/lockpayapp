import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="scroll-smooth-native mx-auto min-h-screen w-full max-w-md bg-surface pb-[calc(6rem+var(--safe-bottom))] pt-safe">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
