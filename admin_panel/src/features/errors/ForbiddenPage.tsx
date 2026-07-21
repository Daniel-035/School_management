import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock, Home } from "lucide-react";

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <Lock className="mx-auto h-16 w-16 text-destructive" />
        <h1 className="mt-4 text-4xl font-bold">403</h1>
        <p className="mt-2 text-muted-foreground">Access denied</p>
        <p className="mt-1 text-sm text-muted-foreground">You don't have permission to access this resource.</p>
        <Button asChild className="mt-6">
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
