import { useLocation } from "react-router-dom";
import { LogOut, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthContext";

const titleMap: Record<string, string> = {
  "/": "Dashboard",
  "/users": "Users",
  "/academics": "Classes & Subjects",
  "/fees": "Fees",
  "/calendar": "Timetable & Calendar",
  "/announcements": "Announcements",
  "/settings": "Settings",
};

export function Topbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const title = titleMap[location.pathname] ?? "EduConnect";

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 text-sm sm:flex">
          <UserCircle2 className="h-5 w-5 text-muted-foreground" />
          <div className="text-right leading-tight">
            <p className="font-medium">{user?.name ?? "Guest"}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {user?.role ?? "—"}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => void logout()}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
