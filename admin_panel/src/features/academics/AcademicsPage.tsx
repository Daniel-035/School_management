import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { academicService } from "@/services/academicService";
import { userService } from "@/services/userService";
import type { ClassSection, Subject, User } from "@/types";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, FieldError, SkeletonRows } from "@/components/ui/async-state";
import { PaginationControls, TableControls, applyTableState } from "@/components/ui/data-table-tools";
import { downloadCsv } from "@/lib/csv";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";

const classSchema = z.object({ name: z.string().trim().min(2), grade: z.string().min(1), section: z.string().min(1), classTeacherId: z.string(), subjectIds: z.array(z.string()).min(1, "Select at least one subject") });
type ClassForm = z.infer<typeof classSchema>;

export function AcademicsPage() {
  const queryClient = useQueryClient();
  const queries = useQueries({ queries: [
    { queryKey: queryKeys.classes, queryFn: academicService.getClasses },
    { queryKey: queryKeys.subjects, queryFn: academicService.getSubjects },
    { queryKey: queryKeys.users("staff"), queryFn: () => userService.getByRole("staff") },
  ] });
  const classes = (queries[0].data ?? []) as ClassSection[];
  const subjects = (queries[1].data ?? []) as Subject[];
  const staff = (queries[2].data ?? []) as User[];
  const loading = queries.some((query) => query.isPending);
  const error = queries.find((query) => query.error)?.error;
  const reload = () => queryClient.invalidateQueries({ queryKey: queryKeys.classes });
  const [classDialog, setClassDialog] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSection | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name-asc");
  const [page, setPage] = useState(1);

  const subjectName = (id: string) =>
    subjects.find((sub) => sub.id === id)?.name ?? id;
  const teacherName = (id?: string) =>
    id ? (staff.find((t) => t.id === id)?.name ?? id) : "—";
  const classTable = applyTableState(classes, { search, sort, page, searchText: row => `${row.name} ${row.grade} ${row.section} ${teacherName(row.classTeacherId)}`, sorters: { "name-asc": (a, b) => a.name.localeCompare(b.name), "name-desc": (a, b) => b.name.localeCompare(a.name), "grade-asc": (a, b) => `${a.grade}${a.section}`.localeCompare(`${b.grade}${b.section}`) } });
  const subjectTable = applyTableState(subjects, { search, sort: sort === "name-desc" ? "name-desc" : "name-asc", page, searchText: row => `${row.name} ${row.code}`, sorters: { "name-asc": (a, b) => a.name.localeCompare(b.name), "name-desc": (a, b) => b.name.localeCompare(a.name) } });

  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<ClassForm>({ resolver: zodResolver(classSchema), defaultValues: { name: "", grade: "5", section: "A", classTeacherId: "", subjectIds: [] } });
  const subjectIds = watch("subjectIds");

  const handleAddClass = () => {
    setEditingClass(null);
    reset({ name: "", grade: "5", section: "A", classTeacherId: "", subjectIds: [] });
    setClassDialog(true);
  };

  const handleEditClass = (cls: ClassSection) => {
    setEditingClass(cls);
    reset({
      name: cls.name,
      grade: cls.grade,
      section: cls.section,
      classTeacherId: cls.classTeacherId ?? "",
      subjectIds: cls.subjectIds,
    });
    setClassDialog(true);
  };

  const submitClass = handleSubmit(async (form) => {
    const payload = {
      ...form,
      name: form.name || `Grade ${form.grade} - ${form.section}`,
      classTeacherId: form.classTeacherId || undefined,
    };
    try { if (editingClass) await academicService.updateClass(editingClass.id, payload); else await academicService.createClass(payload); await reload(); toast.success(editingClass ? "Class updated" : "Class created"); setClassDialog(false); }
    catch (reason) { toast.error(reason instanceof Error ? reason.message : "Unable to save class"); }
  });

  const handleDeleteClass = async (id: string) => {
    try { await academicService.deleteClass(id); await reload(); toast.success("Class deleted"); }
    catch (reason) { toast.error(reason instanceof Error ? reason.message : "Unable to delete class"); }
  };

  const toggleSubject = (subjectId: string) => {
    setValue("subjectIds", subjectIds.includes(subjectId) ? subjectIds.filter((id) => id !== subjectId) : [...subjectIds, subjectId], { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Classes & Sections</h2>
          <p className="text-sm text-muted-foreground">
            Class teachers, subjects, and assigned sections
          </p>
        </div>
        <Dialog open={classDialog} onOpenChange={setClassDialog}>
          <DialogTrigger asChild>
            <Button onClick={handleAddClass}>
              <Plus className="h-4 w-4" />
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={submitClass} className="space-y-4" noValidate>
              <DialogHeader>
                <DialogTitle>
                  {editingClass ? "Edit" : "Add"} Class
                </DialogTitle>
                <DialogDescription>
                  {editingClass ? "Update" : "Create"} class details.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label>Class Name</Label>
                <Input {...register("name")} aria-invalid={Boolean(errors.name)} />
                <FieldError message={errors.name?.message} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Grade</Label>
                  <Controller name="grade" control={control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 6, 7, 8, 9, 10].map((g) => (
                        <SelectItem key={g} value={String(g)}>
                          Grade {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>} />
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Controller name="section" control={control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["A", "B", "C", "D"].map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Class Teacher</Label>
                <Controller name="classTeacherId" control={control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>} />
              </div>
              <div className="space-y-2">
                <Label>Subjects</Label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((s) => {
                    const active = subjectIds.includes(s.id);
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => toggleSubject(s.id)}
                        className={`rounded-md border px-2 py-1 text-xs ${
                          active
                            ? "border-primary bg-primary/10"
                            : "border-border bg-background"
                        }`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
                <FieldError message={errors.subjectIds?.message} />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setClassDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : editingClass ? "Save" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <TableControls search={search} onSearchChange={(value) => { setSearch(value); setPage(1); }} sort={sort} sortOptions={[{ label: "Name A-Z", value: "name-asc" }, { label: "Name Z-A", value: "name-desc" }, { label: "Grade", value: "grade-asc" }]} onSortChange={setSort} onExport={() => downloadCsv("classes.csv", classTable.allRows.map(row => ({ name: row.name, grade: row.grade, section: row.section, teacher: teacherName(row.classTeacherId), subjects: row.subjectIds.map(subjectName).join("; ") })))} />

      <Card>
        <CardContent className="pt-6">
          {loading ? <SkeletonRows /> : error ? <ErrorState message={error.message} retry={() => void reload().catch(() => undefined)} /> : classes.length === 0 ? <EmptyState title="No classes" description="Create the first class section." /> : <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Class Teacher</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classTable.rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.grade}</TableCell>
                  <TableCell>{c.section}</TableCell>
                  <TableCell>{teacherName(c.classTeacherId)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.subjectIds.map((sid: string) => (
                        <Badge key={sid} variant="secondary">
                          {subjectName(sid)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditClass(c)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteClass(c.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>}
          {!loading && !error && classes.length > 0 ? <PaginationControls page={classTable.page} totalPages={classTable.totalPages} onPageChange={setPage} /> : null}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Subjects</h2>
          <p className="text-sm text-muted-foreground">
            All subjects offered across grades
          </p>
        </div>
      </div>

      <TableControls search={search} onSearchChange={(value) => { setSearch(value); setPage(1); }} sort={sort} sortOptions={[{ label: "Name A-Z", value: "name-asc" }, { label: "Name Z-A", value: "name-desc" }]} onSortChange={setSort} onExport={() => downloadCsv("subjects.csv", subjectTable.allRows.map(row => ({ code: row.code, name: row.name })))} />

      <Card>
        <CardContent className="pt-6">
          {loading ? <SkeletonRows /> : error ? <ErrorState message={error.message} retry={() => void reload().catch(() => undefined)} /> : subjects.length === 0 ? <EmptyState title="No subjects" description="Subjects will appear here once configured." /> : <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjectTable.rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono">{s.code}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost">
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>}
          {!loading && !error && subjects.length > 0 ? <PaginationControls page={subjectTable.page} totalPages={subjectTable.totalPages} onPageChange={setPage} /> : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div><h2 className="text-lg font-medium">Timetable Builder</h2><p className="text-sm text-muted-foreground">Draft weekly periods for classes and teachers.</p></div>
          <div className="grid gap-3 md:grid-cols-5">
            {classes.slice(0, 3).map(cls => <div key={cls.id} className="rounded-md border p-3"><p className="font-medium">{cls.name}</p>{["Mon", "Tue", "Wed", "Thu", "Fri"].map(day => <div key={day} className="mt-2 rounded bg-muted p-2 text-xs"><span className="font-medium">{day}</span><br />{cls.subjectIds.slice(0, 3).map(subjectName).join(" · ") || "No subjects"}</div>)}</div>)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
