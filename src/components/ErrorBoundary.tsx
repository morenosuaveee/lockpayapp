import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface State {
  error: Error | null;
}

/**
 * Catches render-time crashes so a broken screen shows a recoverable
 * message instead of a blank white page.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[LockPay] Screen crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
          <AlertTriangle className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-base font-semibold">Something went wrong</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          This screen couldn't load. Your transfer is safe — nothing was charged or changed.
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            variant="secondary"
            className="h-12 rounded-2xl px-5"
            onClick={() => {
              this.setState({ error: null });
              window.history.back();
            }}
          >
            Go back
          </Button>
          <Button className="h-12 rounded-2xl px-5" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }
}
