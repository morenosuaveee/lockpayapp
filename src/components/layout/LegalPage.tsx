import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "./AppShell";
import { LegalFooter } from "./LegalFooter";

interface Props {
  title: string;
  subtitle?: string;
  updated?: string;
  children: ReactNode;
}

export function LegalPage({ title, subtitle, updated, children }: Props) {
  return (
    <AppShell>
      <div className="px-6 pt-4">
        <Link
          to="/profile"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        {updated && (
          <p className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground/80">
            Last updated {updated}
          </p>
        )}
        <article className="prose prose-sm mt-6 max-w-none text-sm leading-relaxed text-foreground [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold [&_p]:mt-2 [&_p]:text-muted-foreground [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:text-muted-foreground">
          {children}
        </article>
      </div>
      <LegalFooter />
    </AppShell>
  );
}
