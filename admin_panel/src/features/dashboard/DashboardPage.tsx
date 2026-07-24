import { useQueries } from "@tanstack/react-query";
import { TeacherMonitor } from "./components/TeacherMonitor";
import { StudentActivityMonitor } from "./components/StudentActivityMonitor";
import {
  Users,
  Wallet,
  Megaphone,
  GraduationCap,
  CalendarDays,
  TrendingUp,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { userService } from "@/services/userService";
import { feeService } from "@/services/feeService";
import { announcementService, calendarService } from "@/services/announcementService";
import { academicService } from "@/services/academicService";
import type { Announcement, CalendarEvent, Student, User } from "@/types";
import { queryKeys } from "@/lib/queryClient";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/async-state";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface DashboardData {
  students: Student[];
  staff: User[];
  announcements: Announcement[];
  events: CalendarEvent[];
  pendingFees: number;
  classes: { id: string; name: string; grade: string; section: string }[];
}

export function DashboardPage() {
  const results = useQueries({ queries: [
    { queryKey: queryKeys.students, queryFn: userService.getStudents },
    { queryKey: queryKeys.users("staff"), queryFn: () => userService.getByRole("staff") },
    { queryKey: queryKeys.announcements, queryFn: announcementService.getAll },
    { queryKey: queryKeys.events, queryFn: calendarService.getEvents },
    { queryKey: queryKeys.feeSummary, queryFn: feeService.getSummary },
    { queryKey: queryKeys.classes, queryFn: academicService.getClasses },
  ] });

  const isInitialLoading = results.some((r) => r.isPending && !r.data);
  const error = results.find((result) => result.error)?.error;
  if (error) return <ErrorState message={error.message} retry={() => void Promise.all(results.map(r => r.refetch()))} />;

  const students = (results[0].data ?? []) as Student[];
  const staff = (results[1].data ?? []) as User[];
  const announcements = (results[2].data ?? []) as Announcement[];
  const events = (results[3].data ?? []) as CalendarEvent[];
  const summary = (results[4].data ?? { totalPaid: 0, outstanding: 0 }) as { totalPaid: number; outstanding: number };
  const classes = (results[5].data ?? []) as { id: string; name: string; grade: string; section: string }[];

  const data: DashboardData = {
    students,
    staff,
    announcements,
    events,
    pendingFees: summary.outstanding ?? 0,
    classes,
  };

  if (isInitialLoading) {
    return <SkeletonRows rows={8} />;
  }

  const attendanceSeries = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return {
      date: date.toISOString().slice(5, 10),
      present: 0,
      absent: 0,
    };
  });
  const hasAttendanceData = attendanceSeries.some(item => item.present > 0 || item.absent > 0);

  const perClassSeries = data.classes
    .map(cls => ({ name: cls.name, value: data.students.filter(student => student.classSectionId === cls.id).length }))
    .filter(item => item.value > 0);

  const feeSummaryData = summary as Awaited<ReturnType<typeof feeService.getSummary>>;
  const hasFeeData = (feeSummaryData?.totalPaid ?? 0) > 0 || (feeSummaryData?.outstanding ?? 0) > 0;

  const activityFeed = [
    ...data.announcements.slice(0, 5).map(item => ({ id: `a-${item.id}`, type: "announcement" as const, title: item.title, date: item.publishedAt, label: item.audience.join(", ") })),
    ...data.events.slice(0, 5).map(item => ({ id: `e-${item.id}`, type: "event" as const, title: item.title, date: item.date, label: item.type.toUpperCase() })),
  ].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 8);

  const stats = [
    {
      title: "Total Students",
      value: data.students.length,
      icon: GraduationCap,
      description: "Active enrolled students",
    },
    {
      title: "Staff Members",
      value: data.staff.length,
      icon: Users,
      description: "Teaching & non-teaching",
    },
    {
      title: "Pending Fees",
      value: formatCurrency(data.pendingFees),
      icon: Wallet,
      description: "Across all students",
    },
    {
      title: "Announcements",
      value: data.announcements.length,
      icon: Megaphone,
      description: "Sent this month",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Operations Overview</h1>
        <p className="text-sm text-muted-foreground">Real-time monitoring of student attendance, teacher activities, and school operations.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4 pt-2">
        <h2 className="text-lg font-bold tracking-tight">Teacher Activity & Roll Call Monitor</h2>
        <TeacherMonitor />
      </div>

      <div className="space-y-4 pt-2">
        <h2 className="text-lg font-bold tracking-tight">Student Attendance & Leave Applications Desk</h2>
        <StudentActivityMonitor />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Attendance Trend</CardTitle>
            <CardDescription>Last 7 days of present vs absent</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {!hasAttendanceData ? (
              <EmptyState title="No Attendance Recorded" description="Attendance trends will populate here once daily attendance is recorded." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="present" fill="#16a34a" name="Present" />
                  <Bar dataKey="absent" fill="#dc2626" name="Absent" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wallet className="h-4 w-4" /> Fee Collection</CardTitle>
            <CardDescription>Collected vs outstanding</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {!hasFeeData ? (
              <EmptyState title="No Fee Data" description="Fee collection metrics will appear here once fee structures are assigned." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: "Collection", collected: feeSummaryData.totalPaid, outstanding: feeSummaryData.outstanding }]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="collected" fill="#16a34a" name="Collected" />
                  <Bar dataKey="outstanding" fill="#f59e0b" name="Outstanding" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PieChartIcon className="h-4 w-4" /> Per-Class Counts</CardTitle>
            <CardDescription>Students per class</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {perClassSeries.length === 0 ? (
              <EmptyState title="No Class Distribution" description="Class breakdown will appear here once students are enrolled in classes." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={perClassSeries} dataKey="value" nameKey="name" outerRadius={90}>
                    {perClassSeries.map((entry, index) => <Cell key={entry.name} fill={["#2563eb", "#16a34a", "#dc2626", "#f59e0b", "#9333ea", "#0891b2"][index % 6]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest announcements and events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activityFeed.length === 0 ? (
              <EmptyState title="No recent activity" description="Activity will appear here as announcements and events are created." />
            ) : (
              activityFeed.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-md border p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                    {item.type === "event" ? <CalendarDays className="h-4 w-4" /> : <Megaphone className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(item.date)} · {item.label}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
