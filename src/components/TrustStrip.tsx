import { ShieldCheck, Lock, BadgeCheck, Scale } from "lucide-react";

const items = [
  { icon: Lock, label: "Encrypted" },
  { icon: ShieldCheck, label: "Verification first" },
  { icon: BadgeCheck, label: "Identity-confirmed" },
  { icon: Scale, label: "Dispute support" },
];

export function TrustStrip({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-border/70 bg-card p-3 shadow-card ${className}`}>
      <div className="grid grid-cols-4 gap-1">
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1 px-1 text-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-medium leading-tight text-muted-foreground">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
