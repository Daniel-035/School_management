import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { useTheme } from "@/components/layout/ThemeProvider";
import { toast } from "sonner";

const roles = [
  {
    role: "Admin",
    permissions: [
      "Full system access",
      "User management",
      "Fee management",
      "Broadcasts",
    ],
  },
  {
    role: "Staff",
    permissions: [
      "View assigned classes",
      "Mark attendance",
      "Manage homework & grades",
      "Message parents",
    ],
  },
  {
    role: "Parent",
    permissions: [
      "View child profile",
      "Track attendance & academics",
      "Pay fees & download receipts",
      "Receive announcements",
    ],
  },
];

const schoolProfileKey = "educonnect.schoolProfile";

interface SchoolProfile {
  name: string;
  academicYear: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
}

const defaultProfile: SchoolProfile = {
  name: "OmniSchool International",
  academicYear: "2025-26",
  address: "123 School Lane, Bengaluru, KA",
  contactEmail: "office@omnischool.edu",
  contactPhone: "+91 80 1234 5678",
};

export function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<SchoolProfile>(() => {
    const raw = localStorage.getItem(schoolProfileKey);
    return raw ? { ...defaultProfile, ...(JSON.parse(raw) as Partial<SchoolProfile>) } : defaultProfile;
  });

  useEffect(() => { localStorage.setItem(schoolProfileKey, JSON.stringify(profile)); }, [profile]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>School Profile</CardTitle>
          <CardDescription>Visible to staff, parents, and announcements.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>School Name</Label><Input value={profile.name} onChange={event => setProfile({ ...profile, name: event.target.value })} /></div>
          <div className="space-y-2"><Label>Academic Year</Label><Input value={profile.academicYear} onChange={event => setProfile({ ...profile, academicYear: event.target.value })} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Address</Label><Input value={profile.address} onChange={event => setProfile({ ...profile, address: event.target.value })} /></div>
          <div className="space-y-2"><Label>Contact Email</Label><Input value={profile.contactEmail} onChange={event => setProfile({ ...profile, contactEmail: event.target.value })} /></div>
          <div className="space-y-2"><Label>Contact Phone</Label><Input value={profile.contactPhone} onChange={event => setProfile({ ...profile, contactPhone: event.target.value })} /></div>
          <div className="sm:col-span-2"><Button onClick={() => toast.success("School profile saved")}>Save</Button></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Theme preference applies to the admin panel.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-medium">Dark mode</p>
            <p className="text-sm text-muted-foreground">Switch to a low-light color scheme.</p>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roles & Permissions</CardTitle>
          <CardDescription>Role-based access policies for the admin panel.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Permissions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((r) => (
                <TableRow key={r.role}>
                  <TableCell className="font-medium">{r.role}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {r.permissions.map((p) => (
                        <Badge key={p} variant="secondary">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Account</CardTitle>
          <CardDescription>Information used for administrative actions.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div><p className="text-xs uppercase text-muted-foreground">Name</p><p className="text-sm font-medium">{user?.name ?? "-"}</p></div>
          <div><p className="text-xs uppercase text-muted-foreground">Email</p><p className="text-sm font-medium">{user?.email ?? "-"}</p></div>
          <div><p className="text-xs uppercase text-muted-foreground">Role</p><p className="text-sm font-medium capitalize">{user?.role ?? "-"}</p></div>
          <div><p className="text-xs uppercase text-muted-foreground">Theme</p><p className="text-sm font-medium capitalize">{theme}</p></div>
        </CardContent>
      </Card>
    </div>
  );
}
