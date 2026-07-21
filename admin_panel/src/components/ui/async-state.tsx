import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import { Button } from "./button";

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 py-2" aria-label="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-11 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}

export function ErrorState({ message, retry }: { message?: string; retry: () => void }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center" role="alert">
      <AlertCircle className="h-7 w-7 text-destructive" />
      <div>
        <p className="font-medium">Unable to load this data</p>
        <p className="text-sm text-muted-foreground">{message || "Check your connection and try again."}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={retry}>
        <RefreshCw className="h-4 w-4" /> Retry
      </Button>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center">
      <Inbox className="h-7 w-7 text-muted-foreground" />
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs font-medium text-destructive">{message}</p> : null;
}
