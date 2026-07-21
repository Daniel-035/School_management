import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const titleMap: Record<string, string> = {
  "/": "Dashboard",
  "/users": "Users",
  "/academics": "Academics",
  "/fees": "Fees",
  "/calendar": "Calendar",
  "/announcements": "Announcements",
  "/settings": "Settings",
};

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  const crumbs = [{ label: "Home", href: "/" }];

  if (segments.length === 0) {
    crumbs.push({ label: "Dashboard", href: "/" });
  } else {
    segments.forEach((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join("/")}`;
      const label = titleMap[href] || segment;
      crumbs.push({ label, href });
    });
  }

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
      {crumbs.map((crumb, index) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {index === 0 ? <Home className="h-3 w-3" /> : null}
          {index < crumbs.length - 1 ? (
            <Link to={crumb.href} className="hover:text-foreground">{crumb.label}</Link>
          ) : (
            <span className="text-foreground">{crumb.label}</span>
          )}
          {index < crumbs.length - 1 ? <ChevronRight className="h-3 w-3" /> : null}
        </span>
      ))}
    </nav>
  );
}
