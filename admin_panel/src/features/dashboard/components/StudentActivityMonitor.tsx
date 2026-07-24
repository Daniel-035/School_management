import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserCheck, UserX, Clock, CalendarCheck, Check, X, Search, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { userService } from "@/services/userService";
import { academicService, AttendanceRecordItem, LeaveRequestItem } from "@/services/academicService";
import type { Student, ClassSection } from "@/types";
import { useState } from "react";

export function StudentActivityMonitor() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: userService.getStudents,
  });

  const { data: classes = [] } = useQuery<ClassSection[]>({
    queryKey: ["classes"],
    queryFn: academicService.getClasses,
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const { data: attendance = [] } = useQuery<AttendanceRecordItem[]>({
    queryKey: ["attendance", todayStr],
    queryFn: () => academicService.getAttendance(undefined, todayStr),
  });

  const { data: leaveRequests = [] } = useQuery<LeaveRequestItem[]>({
    queryKey: ["leaveRequests"],
    queryFn: academicService.getLeaveRequests,
  });

  const updateLeaveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) =>
      academicService.updateLeaveStatus(id, status, "admin"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaveRequests"] });
    },
  });

  const presentCount = attendance.filter((a) => a.status === "present").length;
  const absentCount = attendance.filter((a) => a.status === "absent").length;
  const lateCount = attendance.filter((a) => a.status === "late").length;
  const pendingLeaves = leaveRequests.filter((l) => l.status === "pending");

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Student Metrics Highlights */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <UserCheck className="w-5 h-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{presentCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Students marked present</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <UserX className="w-5 h-5 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{absentCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Absence records logged</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <Clock className="w-5 h-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lateCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Tardiness records</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-sky-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Leave Requests</CardTitle>
            <CalendarCheck className="w-5 h-5 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingLeaves.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting admin review</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Parent Leave Requests Desk */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-primary" /> Parent Leave Applications Desk
            </CardTitle>
            <CardDescription>Review and approve leave requests submitted by parents</CardDescription>
          </CardHeader>
          <CardContent>
            {leaveRequests.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">No active leave applications found.</div>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {leaveRequests.map((leave) => {
                  const student = students.find((s) => s.id === leave.studentId);
                  return (
                    <div key={leave.id} className="p-3 rounded-lg border bg-card space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{student ? student.name : `Student ID: ${leave.studentId}`}</span>
                        <Badge
                          variant="outline"
                          className={
                            leave.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : leave.status === "rejected"
                              ? "bg-rose-50 text-rose-700 border-rose-300"
                              : "bg-amber-50 text-amber-700 border-amber-300"
                          }
                        >
                          {leave.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{leave.reason}</p>
                      <div className="flex items-center justify-between text-xs pt-1 border-t">
                        <span className="text-muted-foreground">
                          {leave.fromDate} to {leave.toDate}
                        </span>
                        {leave.status === "pending" && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                              onClick={() => updateLeaveMutation.mutate({ id: leave.id, status: "approved" })}
                              disabled={updateLeaveMutation.isPending}
                            >
                              <Check className="w-3.5 h-3.5 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-rose-600 border-rose-300 hover:bg-rose-50"
                              onClick={() => updateLeaveMutation.mutate({ id: leave.id, status: "rejected" })}
                              disabled={updateLeaveMutation.isPending}
                            >
                              <X className="w-3.5 h-3.5 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Enrolled Directory & Activity Tracker */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" /> Enrolled Student Roster & Activity
            </CardTitle>
            <CardDescription>Search and monitor enrolled student records</CardDescription>
            <div className="pt-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search student name, roll number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm rounded-md border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">No matching students found.</div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredStudents.slice(0, 10).map((st) => {
                  const cls = classes.find((c) => c.id === st.classSectionId);
                  const att = attendance.find((a) => a.studentId === st.id);
                  return (
                    <div key={st.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-card text-xs">
                      <div>
                        <p className="font-medium text-sm">{st.name}</p>
                        <p className="text-muted-foreground">
                          {cls ? cls.name : "Class N/A"} · Roll #{st.rollNumber || "N/A"}
                        </p>
                      </div>
                      <div>
                        {att ? (
                          <Badge
                            variant="outline"
                            className={
                              att.status === "present"
                                ? "bg-emerald-50 text-emerald-700"
                                : att.status === "absent"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-amber-50 text-amber-700"
                            }
                          >
                            {att.status.toUpperCase()}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            NOT MARKED
                          </Badge>
                        )}
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
