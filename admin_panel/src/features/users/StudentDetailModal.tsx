import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Mail, MapPin, Calendar, CreditCard, ShieldCheck, GraduationCap, Users } from "lucide-react";
import type { Student, ClassSection, User as StaffUser } from "@/types";

interface StudentDetailModalProps {
  student: Student | null;
  classes?: ClassSection[];
  staff?: StaffUser[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudentDetailModal({
  student,
  classes = [],
  staff = [],
  open,
  onOpenChange,
}: StudentDetailModalProps) {
  if (!student) return null;

  const targetClass = classes.find((c) => c.id === student.classSectionId);
  const classTeacher = staff.find((s) => s.id === targetClass?.classTeacherId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4 pt-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl border">
              {student.name ? student.name.charAt(0).toUpperCase() : "S"}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">{student.name}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Student ID: <span className="font-semibold text-foreground">{student.id}</span> · Roll No:{" "}
                <span className="font-semibold text-foreground">{student.rollNumber || "N/A"}</span>
              </DialogDescription>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="bg-primary/10 text-primary font-medium">
                  {targetClass ? targetClass.name : "Class N/A"}
                </Badge>
                {classTeacher && (
                  <Badge variant="secondary" className="text-xs">
                    Teacher: {classTeacher.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Academic & Class Information */}
          <div className="rounded-lg border p-4 bg-card space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-primary" /> Academic Profile
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">Class & Section</span>
                <span className="font-medium">{targetClass ? `${targetClass.name} (Grade ${targetClass.grade}-${targetClass.section})` : "N/A"}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Roll Number</span>
                <span className="font-medium">{student.rollNumber || "N/A"}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Class Teacher</span>
                <span className="font-medium">{classTeacher ? classTeacher.name : "Not Assigned"}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Account Status</span>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                  ACTIVE STUDENT
                </Badge>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="rounded-lg border p-4 bg-card space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="w-4 h-4 text-primary" /> Personal Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">Gender</span>
                <span className="font-medium capitalize">{student.gender || "Not Specified"}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Date of Birth</span>
                <span className="font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  {student.dateOfBirth || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Government / Aadhar ID</span>
                <span className="font-medium flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                  {student.governmentId || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Residential Address</span>
                <span className="font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  {student.address || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Parent & Guardian Contact Information */}
          <div className="rounded-lg border p-4 bg-card space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" /> Parent & Guardian Contact
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">Father's Name</span>
                <span className="font-medium">{student.fatherName || "N/A"}</span>
                {student.fatherPhone && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" /> {student.fatherPhone}
                  </span>
                )}
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Mother's Name</span>
                <span className="font-medium">{student.motherName || "N/A"}</span>
                {student.motherPhone && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" /> {student.motherPhone}
                  </span>
                )}
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Student / Guardian Email</span>
                <span className="font-medium flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  {student.email || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Student Phone</span>
                <span className="font-medium flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  {student.phone || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Account Credentials */}
          <div className="rounded-lg border p-4 bg-muted/40 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary" /> System Access & Credentials
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">System Username</span>
                <span className="font-mono text-xs font-semibold">{student.username || student.email || student.id}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Access Role</span>
                <span className="font-medium">Student (Parent Portal Access)</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
