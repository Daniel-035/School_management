import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, BookOpen, UserCheck, ShieldAlert, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { userService } from "@/services/userService";
import { academicService, HomeworkItem, AttendanceRecordItem } from "@/services/academicService";
import type { User, ClassSection } from "@/types";

export function TeacherMonitor() {
  const { data: staff = [] } = useQuery<User[]>({
    queryKey: ["users", "staff"],
    queryFn: () => userService.getByRole("staff"),
  });

  const { data: classes = [] } = useQuery<ClassSection[]>({
    queryKey: ["classes"],
    queryFn: academicService.getClasses,
  });

  const { data: homework = [] } = useQuery<HomeworkItem[]>({
    queryKey: ["homework"],
    queryFn: () => academicService.getHomework(),
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const { data: todayAttendance = [] } = useQuery<AttendanceRecordItem[]>({
    queryKey: ["attendance", todayStr],
    queryFn: () => academicService.getAttendance(undefined, todayStr),
  });

  // Calculate attendance marking completion status for each class
  const classAttendanceStatus = classes.map((cls) => {
    const records = todayAttendance.filter((r) => r.classSectionId === cls.id);
    const marked = records.length > 0;
    const teacher = staff.find((s) => s.id === cls.classTeacherId || s.classTeacherForId === cls.id);
    return {
      class: cls,
      marked,
      recordCount: records.length,
      teacherName: teacher ? teacher.name : "Unassigned",
    };
  });

  const completedClasses = classAttendanceStatus.filter((c) => c.marked).length;
  const pendingClasses = classAttendanceStatus.length - completedClasses;

  return (
    <div className="space-y-6">
      {/* Teacher Activity Highlights Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Daily Roll Call Completed</CardTitle>
            <UserCheck className="w-5 h-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedClasses} / {classes.length || 1} Classes</div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingClasses > 0 ? `${pendingClasses} class roll calls pending today` : "All classes marked today!"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Assigned Homework Tasks</CardTitle>
            <BookOpen className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{homework.length} Active</div>
            <p className="text-xs text-muted-foreground mt-1">Assignments posted across subject classes</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Teaching Staff</CardTitle>
            <FileSpreadsheet className="w-5 h-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length} Teachers</div>
            <p className="text-xs text-muted-foreground mt-1">Instructors monitoring coursework</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Class Attendance Roll Call Monitor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Teacher Attendance Completion Monitor
            </CardTitle>
            <CardDescription>Status of today's attendance roll call by class teachers</CardDescription>
          </CardHeader>
          <CardContent>
            {classAttendanceStatus.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">No classes configured.</div>
            ) : (
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {classAttendanceStatus.map((item) => (
                  <div
                    key={item.class.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-sm">{item.class.name}</p>
                      <p className="text-xs text-muted-foreground">Class Teacher: {item.teacherName}</p>
                    </div>
                    <div>
                      {item.marked ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Marked ({item.recordCount})
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300">
                          <ShieldAlert className="w-3 h-3 mr-1" /> Pending Roll Call
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assigned Homework & Coursework Audit */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> Teacher Homework Posting Log
            </CardTitle>
            <CardDescription>Latest homework entries assigned by teachers to students</CardDescription>
          </CardHeader>
          <CardContent>
            {homework.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">No active homework assignments recorded.</div>
            ) : (
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {homework.slice(0, 6).map((hw) => {
                  const targetClass = classes.find((c) => c.id === hw.classSectionId);
                  return (
                    <div key={hw.id} className="p-3 rounded-lg border bg-card space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{hw.title}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          Due: {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : "TBD"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{hw.description}</p>
                      <div className="text-[11px] text-primary/80 font-medium pt-1">
                        Class: {targetClass ? targetClass.name : hw.classSectionId}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
