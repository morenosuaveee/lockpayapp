import { NavLink, useLocation } from "react-router-dom";
import { Home, Send, Lock, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/send", label: "Send", icon: Send },
  { to: "/transactions", label: "Activity", icon: Lock },
  { to: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const location = useLocation();
  // Hide on auth/full-screen routes
  if (/^\/(login|signup|unlock\/)/.test(location.pathname)) return null;

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-border/60 bg-card/90 backdrop-blur-2xl"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.375rem)" }}
    >
      <ul className="flex items-stretch justify-around px-1.5 pt-1.5">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10.5px] font-semibold tracking-tight transition-all active:scale-[0.94]",
                  isActive ? "text-primary" : "text-muted-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "flex h-7 w-10 items-center justify-center rounded-xl transition-all",
                      isActive && "bg-accent-soft text-accent-foreground"
                    )}
                  >
                    <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                  </span>
                  <span className={cn("leading-none", isActive ? "opacity-100" : "opacity-80")}>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
