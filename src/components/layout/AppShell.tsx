import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-background">
      <div className="scroll-smooth-native mx-auto min-h-screen w-full max-w-md bg-surface pb-[calc(5.5rem+var(--safe-bottom))] pt-safe">
        <div key={pathname} className="page-enter">
          {children}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
