import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { academicService } from "@/services/academicService";
import { userService } from "@/services/userService";
import type { ClassSection, Student, User } from "@/types";
import { Pencil, Trash2, Plus, Users, GraduationCap, ChevronDown, ChevronUp, Search, UserCheck } from "lucide-react";
import { EmptyState, ErrorState, FieldError, SkeletonRows } from "@/components/ui/async-state";
import { useQueries, useQueryClient, useMutation } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { StudentDetailModal } from "../users/StudentDetailModal";

const classSchema = z.object({
  name: z.string().trim().min(2, "Class name is required"),
  grade: z.string().min(1, "Select grade"),
  section: z.string().min(1, "Select section"),
  classTeacherId: z.string().optional(),
});
type ClassForm = z.infer<typeof classSchema>;

export function AcademicsPage() {
  const queryClient = useQueryClient();
  const queries = useQueries({
    queries: [
      { queryKey: queryKeys.classes, queryFn: academicService.getClasses },
      { queryKey: queryKeys.students, queryFn: userService.getStudents },
      { queryKey: queryKeys.users("staff"), queryFn: () => userService.getByRole("staff") },
    ],
  });

  const classes = (queries[0].data ?? []) as ClassSection[];
  const students = (queries[1].data ?? []) as Student[];
  const staff = (queries[2].data ?? []) as User[];
  const loading = queries.some((query) => query.isPending);
  const error = queries.find((query) => query.error)?.error;

  const [classDialog, setClassDialog] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSection | null>(null);
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [search, setSearch] = useState("");

  const updateClassMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ClassSection> }) =>
      academicService.updateClass(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classes });
      toast.success("Class updated successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update class");
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: (id: string) => academicService.deleteClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classes });
      toast.success("Class deleted");
    },
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClassForm>({
    resolver: zodResolver(classSchema),
    defaultValues: { name: "", grade: "5", section: "A", classTeacherId: "" },
  });

  const handleAddClass = () => {
    setEditingClass(null);
    reset({ name: "", grade: "5", section: "A", classTeacherId: "" });
    setClassDialog(true);
  };

  const handleEditClass = (cls: ClassSection) => {
    setEditingClass(cls);
    reset({
      name: cls.name,
      grade: cls.grade,
      section: cls.section,
      classTeacherId: cls.classTeacherId ?? "",
    });
    setClassDialog(true);
  };

  const submitClass = handleSubmit(async (form) => {
    try {
      const payload = {
        name: form.name || `Grade ${form.grade} - ${form.section}`,
        grade: form.grade,
        section: form.section,
        classTeacherId: form.classTeacherId || undefined,
        subjectIds: editingClass?.subjectIds || [],
      };

      if (editingClass) {
        await academicService.updateClass(editingClass.id, payload);
        toast.success("Class updated");
      } else {
        await academicService.createClass(payload);
        toast.success("Class created");
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.classes });
      setClassDialog(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  });

  if (loading) return <SkeletonRows rows={6} />;
  if (error)
    return (
      <ErrorState
        message={error.message}
        retry={() => void queryClient.invalidateQueries({ queryKey: queryKeys.classes })}
      />
    );

  const filteredClasses = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.grade.toLowerCase().includes(search.toLowerCase()) ||
      c.section.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Class & Student Categorization</h1>
          <p className="text-sm text-muted-foreground">
            Manage school classes, assign Class Teachers, and view student rosters per class category.
          </p>
        </div>
        <Button onClick={handleAddClass} className="gap-2">
          <Plus className="h-4 w-4" /> Add New Class
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        <Input
          placeholder="Search class name, grade, section..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Class Categories Grid */}
      {filteredClasses.length === 0 ? (
        <EmptyState
          title="No Classes Found"
          description="Create a new class to start categorizing enrolled students."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((cls) => {
            const classStudents = students.filter((s) => s.classSectionId === cls.id);
            const isExpanded = expandedClassId === cls.id;
            const currentTeacher = staff.find((t) => t.id === cls.classTeacherId);

            return (
              <Card key={cls.id} className="flex flex-col border transition-shadow hover:shadow-md">
                <CardHeader className="pb-3 border-b bg-muted/20">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-primary" />
                        {cls.name}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Grade {cls.grade} · Section {cls.section}
                        {currentTeacher && <span className="block text-primary font-medium mt-0.5">Teacher: {currentTeacher.name}</span>}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleEditClass(cls)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => {
                          if (confirm(`Delete ${cls.name}?`)) {
                            deleteClassMutation.mutate(cls.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-4 pt-4">
                  {/* Class Teacher Selector */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-primary" /> Class Teacher
                    </Label>
                    <Select
                      value={cls.classTeacherId || "none"}
                      onValueChange={(val) => {
                        const newTeacherId = val === "none" ? undefined : val;
                        updateClassMutation.mutate({ id: cls.id, payload: { classTeacherId: newTeacherId } });
                      }}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Assign Class Teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Class Teacher Assigned</SelectItem>
                        {staff.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.name} ({teacher.email || teacher.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Enrolled Students Category Summary */}
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold">Enrolled Students</span>
                    </div>
                    <Badge variant="secondary" className="font-bold">
                      {classStudents.length} Students
                    </Badge>
                  </div>

                  {/* Expandable Class Roster Trigger */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between text-xs font-medium"
                    onClick={() => setExpandedClassId(isExpanded ? null : cls.id)}
                  >
                    <span>{isExpanded ? "Hide Class Students" : "View All Enrolled Students"}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                  </Button>

                  {/* Expanded Student List */}
                  {isExpanded && (
                    <div className="space-y-2 pt-2 border-t max-h-[260px] overflow-y-auto pr-1">
                      {classStudents.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          No students currently added to this class.
                        </p>
                      ) : (
                        classStudents.map((st) => (
                          <div
                            key={st.id}
                            onClick={() => setSelectedStudent(st)}
                            className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/40 hover:bg-accent hover:cursor-pointer transition-colors text-xs"
                          >
                            <div>
                              <p className="font-semibold text-sm text-primary">{st.name}</p>
                              <p className="text-[11px] text-muted-foreground">
                                Roll #{st.rollNumber || "N/A"} · {st.gender || "Gender N/A"}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-[10px]">
                              View Info
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Class Dialog */}
      <Dialog open={classDialog} onOpenChange={setClassDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{editingClass ? "Edit Class" : "Create New Class Category"}</DialogTitle>
            <DialogDescription>
              Set up the class name, grade, section, and assign its Class Teacher.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitClass} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Class Name</Label>
              <Input placeholder="e.g. Grade 5 - Section A" {...register("name")} />
              {errors.name && <FieldError message={errors.name.message} />}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Grade</Label>
                <Controller
                  name="grade"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map((g) => (
                          <SelectItem key={g} value={g}>
                            Grade {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1">
                <Label>Section</Label>
                <Controller
                  name="section"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["A", "B", "C", "D"].map((s) => (
                          <SelectItem key={s} value={s}>
                            Section {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Assign Class Teacher</Label>
              <Controller
                name="classTeacherId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Class Teacher</SelectItem>
                      {staff.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} ({t.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setClassDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingClass ? "Save Changes" : "Create Class"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Student Details Inspection Modal */}
      <StudentDetailModal
        student={selectedStudent}
        classes={classes}
        staff={staff}
        open={Boolean(selectedStudent)}
        onOpenChange={(open) => {
          if (!open) setSelectedStudent(null);
        }}
      />
    </div>
  );
}
