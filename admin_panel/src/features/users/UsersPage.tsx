import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { userService } from "@/services/userService";
import { academicService } from "@/services/academicService";
import type { CreatedUserResult, Student, User, ClassSection } from "@/types";
import { Pencil, Trash2, Plus, Copy, Check, Mail } from "lucide-react";
import { EmptyState, ErrorState, FieldError, SkeletonRows } from "@/components/ui/async-state";
import { Checkbox } from "@/components/ui/checkbox";
import { PaginationControls, TableControls, applyTableState } from "@/components/ui/data-table-tools";
import { downloadCsv } from "@/lib/csv";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";

const studentSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  rollNumber: z.string().trim().min(1, "Roll number is required"),
  classSectionId: z.string().min(1, "Select a class"),
  parentId: z.string().min(1, "Select a parent"),
});
type StudentForm = z.infer<typeof studentSchema>;

const userSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().optional(),
  department: z.string().trim().optional(),
});
type UserForm = z.infer<typeof userSchema>;

const parentSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
});
type ParentForm = z.infer<typeof parentSchema>;

export function UsersPage() {
  const queryClient = useQueryClient();
  const queries = useQueries({ queries: [
    { queryKey: queryKeys.users("staff"), queryFn: () => userService.getByRole("staff") },
    { queryKey: queryKeys.users("parent"), queryFn: () => userService.getByRole("parent") },
    { queryKey: queryKeys.students, queryFn: userService.getStudents },
    { queryKey: queryKeys.classes, queryFn: academicService.getClasses },
  ] });
  const staff = (queries[0].data ?? []) as User[];
  const parents = (queries[1].data ?? []) as User[];
  const studentData = queries[2].data;
  const classes = (queries[3].data ?? []) as ClassSection[];
  const students = useMemo(() => (studentData ?? []) as Student[], [studentData]);
  const loading = queries.some((query) => query.isPending);
  const error = queries.find((query) => query.error)?.error;
  const reload = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.students }),
    queryClient.invalidateQueries({ queryKey: ["users"] }),
    queryClient.invalidateQueries({ queryKey: queryKeys.classes }),
  ]);

  const [studentOpen, setStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [staffOpen, setStaffOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [parentOpen, setParentOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<User | null>(null);
  const [credentials, setCredentials] = useState<CreatedUserResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("name-asc");
  const [page, setPage] = useState(1);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const studentForm = useForm<StudentForm>({ resolver: zodResolver(studentSchema), defaultValues: { firstName: "", lastName: "", rollNumber: "", classSectionId: "", parentId: "" } });
  const staffForm = useForm<UserForm>({ resolver: zodResolver(userSchema), defaultValues: { firstName: "", lastName: "", email: "", phone: "", department: "" } });
  const parentForm = useForm<ParentForm>({ resolver: zodResolver(parentSchema), defaultValues: { firstName: "", lastName: "", email: "", phone: "", address: "" } });

  const studentNameById = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [students]);

  const availableParents = parents.filter((p) => p.role === "parent" && p.status === "active");

  const sorters = {
    "name-asc": (a: Student | User, b: Student | User) => a.name.localeCompare(b.name),
    "name-desc": (a: Student | User, b: Student | User) => b.name.localeCompare(a.name),
    "created-desc": (a: Student | User, b: Student | User) => String(b.createdAt).localeCompare(String(a.createdAt)),
  };
  const studentTable = applyTableState(students, {
    search,
    filter: statusFilter,
    sort,
    page,
    searchText: row => {
      const cls = classes.find((c) => c.id === row.classSectionId);
      const className = cls ? (cls.name || `Grade ${cls.grade} - ${cls.section}`) : "";
      return `${row.name} ${row.rollNumber ?? ""} ${className}`;
    },
    filterValue: row => row.status,
    sorters
  });
  const staffTable = applyTableState(staff, { search, filter: statusFilter, sort, page, searchText: row => `${row.name} ${row.email}`, filterValue: row => row.status, sorters });
  const parentTable = applyTableState(parents, { search, filter: statusFilter, sort, page, searchText: row => `${row.name} ${row.email}`, filterValue: row => row.status, sorters });
  const toggleStudent = (id: string) => setSelectedStudents(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  const bulkDeleteStudents = async () => { try { await Promise.all(selectedStudents.map(id => userService.deleteStudent(id))); setSelectedStudents([]); await reload(); toast.success("Selected students deleted"); } catch (reason) { toast.error(reason instanceof Error ? reason.message : "Unable to delete selected students"); } };
  const importUsers = async (file?: File) => { if (!file) return; try { const result = await userService.importCsv(file); await reload(); toast.success(`Imported ${result.imported} users${result.failed ? `, ${result.failed} failed` : ""}`); } catch (reason) { toast.error(reason instanceof Error ? reason.message : "Unable to import users"); } };

  const resetStudent = () => { setEditingStudent(null); setStudentOpen(false); studentForm.reset(); };
  const resetStaff = () => { setEditingStaff(null); setStaffOpen(false); staffForm.reset(); };
  const resetParent = () => { setEditingParent(null); setParentOpen(false); parentForm.reset(); };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    studentForm.reset({
      firstName: student.firstName ?? student.name.split(" ")[0] ?? "",
      lastName: student.lastName ?? student.name.split(" ").slice(1).join(" ") ?? "",
      rollNumber: student.rollNumber ?? "",
      classSectionId: student.classSectionId,
      parentId: student.parentIds[0] ?? "",
    });
    setStudentOpen(true);
  };

  const handleEditStaff = (user: User) => {
    setEditingStaff(user);
    staffForm.reset({
      firstName: user.firstName ?? user.name.split(" ")[0] ?? "",
      lastName: user.lastName ?? user.name.split(" ").slice(1).join(" ") ?? "",
      email: user.email,
      phone: user.phone ?? "",
      department: user.department ?? "",
    });
    setStaffOpen(true);
  };

  const handleEditParent = (user: User) => {
    setEditingParent(user);
    parentForm.reset({
      firstName: user.firstName ?? user.name.split(" ")[0] ?? "",
      lastName: user.lastName ?? user.name.split(" ").slice(1).join(" ") ?? "",
      email: user.email,
      phone: user.phone ?? "",
      address: user.address ?? "",
    });
    setParentOpen(true);
  };

  const submitStudent = studentForm.handleSubmit(async (values) => {
    try {
      const payload = { firstName: values.firstName, lastName: values.lastName, rollNumber: values.rollNumber, classSectionId: values.classSectionId, parentIds: [values.parentId] };
      if (editingStudent) await userService.updateStudent(editingStudent.id, payload); else await userService.createStudent(payload);
      await reload();
      toast.success(editingStudent ? "Student updated" : "Student created");
      resetStudent();
    } catch (reason) { toast.error(reason instanceof Error ? reason.message : "Unable to save student"); }
  });

  const submitStaff = staffForm.handleSubmit(async (values) => {
    try {
      if (editingStaff) {
        await userService.updateUser(editingStaff.id, { firstName: values.firstName, lastName: values.lastName, email: values.email, phone: values.phone, department: values.department });
        await reload();
        toast.success("Staff member updated");
        resetStaff();
      } else {
        const result = await userService.createUser({ firstName: values.firstName, lastName: values.lastName, email: values.email, role: "staff", phone: values.phone, department: values.department });
        await reload();
        resetStaff();
        setCredentials(result);
      }
    } catch (reason) { toast.error(reason instanceof Error ? reason.message : "Unable to save staff member"); }
  });

  const submitParent = parentForm.handleSubmit(async (values) => {
    try {
      if (editingParent) {
        await userService.updateUser(editingParent.id, { firstName: values.firstName, lastName: values.lastName, email: values.email, phone: values.phone, address: values.address });
        await reload();
        toast.success("Parent updated");
        resetParent();
      } else {
        const result = await userService.createUser({ firstName: values.firstName, lastName: values.lastName, email: values.email, role: "parent", phone: values.phone, address: values.address });
        await reload();
        resetParent();
        setCredentials(result);
      }
    } catch (reason) { toast.error(reason instanceof Error ? reason.message : "Unable to save parent"); }
  });

  const handleDeleteStudent = async (id: string) => {
    try { await userService.deleteStudent(id); await reload(); toast.success("Student deleted"); }
    catch (reason) { toast.error(reason instanceof Error ? reason.message : "Unable to delete student"); }
  };
  const handleDeleteUser = async (id: string) => {
    try { await userService.deleteUser(id); await reload(); toast.success("User deactivated"); }
    catch (reason) { toast.error(reason instanceof Error ? reason.message : "Unable to deactivate user"); }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try { await navigator.clipboard.writeText(text); setCopiedField(field); setTimeout(() => setCopiedField(null), 2000); } catch { toast.error("Unable to copy to clipboard"); }
  };

  const renderCredentialsDialog = () => (
    <Dialog open={Boolean(credentials)} onOpenChange={(open) => { if (!open) setCredentials(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Account Created</DialogTitle>
          <DialogDescription>
            A Firebase account was created for <strong>{credentials?.user.name}</strong>.
            {credentials?.emailSent
              ? " Login credentials have been emailed to the user's registered email address."
              : " Email delivery is not configured, so the generated credentials are shown below for manual delivery."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="truncate text-sm font-medium">{credentials?.user.email}</p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => credentials && copyToClipboard(credentials.user.email, "email")}>
              {copiedField === "email" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          {credentials?.username && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Username</p>
                <p className="truncate text-sm font-medium font-mono">{credentials.username}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => credentials?.username && copyToClipboard(credentials.username, "username")}>
                {copiedField === "username" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}
          {credentials?.provisionalPassword && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-orange-400 bg-orange-50 dark:bg-orange-950/30 p-3">
              <div className="min-w-0">
                <p className="text-xs text-orange-600 dark:text-orange-400">Temporary Password</p>
                <p className="truncate text-sm font-mono font-bold tracking-wider">{credentials.provisionalPassword}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => credentials?.provisionalPassword && copyToClipboard(credentials.provisionalPassword, "password")}>
                {copiedField === "password" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}
          {!credentials?.provisionalPassword && credentials?.emailSent && (
            <p className="text-sm text-muted-foreground">Check your email inbox for the generated credentials.</p>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => setCredentials(null)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderUserFormDialog = (opts: { open: boolean; onOpenChange: (v: boolean) => void; editing: User | null; title: string; description: string; form: any; onSubmit: any; extraFields?: React.ReactNode }) => (
    <Dialog open={opts.open} onOpenChange={opts.onOpenChange}>
      <DialogContent>
        <form onSubmit={opts.onSubmit} className="space-y-4" noValidate>
          <DialogHeader>
            <DialogTitle>{opts.title}</DialogTitle>
            <DialogDescription>{opts.description}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input {...opts.form.register("firstName")} aria-invalid={Boolean(opts.form.formState.errors.firstName)} />
              <FieldError message={opts.form.formState.errors.firstName?.message} />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input {...opts.form.register("lastName")} aria-invalid={Boolean(opts.form.formState.errors.lastName)} />
              <FieldError message={opts.form.formState.errors.lastName?.message} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" {...opts.form.register("email")} aria-invalid={Boolean(opts.form.formState.errors.email)} />
            <FieldError message={opts.form.formState.errors.email?.message} />
          </div>
          {opts.extraFields}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => opts.onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={opts.form.formState.isSubmitting}>{opts.form.formState.isSubmitting ? "Saving..." : opts.editing ? "Save" : "Create & Send Credentials"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <Tabs defaultValue="students" className="space-y-4">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
          <TabsTrigger value="staff">Staff ({staff.length})</TabsTrigger>
          <TabsTrigger value="parents">Parents ({parents.length})</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="students">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Students</h3>
            <p className="text-sm text-muted-foreground">All enrolled students</p>
          </div>
          <Dialog open={studentOpen} onOpenChange={setStudentOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingStudent(null); studentForm.reset(); setStudentOpen(true); }}>
                <Plus className="h-4 w-4" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={submitStudent} className="space-y-4" noValidate>
                <DialogHeader>
                  <DialogTitle>{editingStudent ? "Edit" : "Add"} Student</DialogTitle>
                  <DialogDescription>{editingStudent ? "Update" : "Create"} student profile.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input {...studentForm.register("firstName")} aria-invalid={Boolean(studentForm.formState.errors.firstName)} />
                    <FieldError message={studentForm.formState.errors.firstName?.message} />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input {...studentForm.register("lastName")} aria-invalid={Boolean(studentForm.formState.errors.lastName)} />
                    <FieldError message={studentForm.formState.errors.lastName?.message} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Roll No</Label>
                  <Input {...studentForm.register("rollNumber")} aria-invalid={Boolean(studentForm.formState.errors.rollNumber)} />
                  <FieldError message={studentForm.formState.errors.rollNumber?.message} />
                </div>
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Controller name="classSectionId" control={studentForm.control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name || `Grade ${c.grade} - ${c.section}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>} />
                  <FieldError message={studentForm.formState.errors.classSectionId?.message} />
                </div>
                <div className="space-y-2">
                  <Label>Parent</Label>
                  <Controller name="parentId" control={studentForm.control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select parent" /></SelectTrigger>
                    <SelectContent>{availableParents.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>} />
                  <FieldError message={studentForm.formState.errors.parentId?.message} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetStudent}>Cancel</Button>
                  <Button type="submit" disabled={studentForm.formState.isSubmitting}>{studentForm.formState.isSubmitting ? "Saving..." : editingStudent ? "Save" : "Create"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-4 space-y-3">
          <TableControls search={search} onSearchChange={(value) => { setSearch(value); setPage(1); }} filter={statusFilter} filterLabel="Status" filterOptions={[{ label: "All statuses", value: "all" }, { label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]} onFilterChange={(value) => { setStatusFilter(value); setPage(1); }} sort={sort} sortOptions={[{ label: "Name A-Z", value: "name-asc" }, { label: "Name Z-A", value: "name-desc" }, { label: "Newest", value: "created-desc" }]} onSortChange={setSort} selectedCount={selectedStudents.length} onBulkDelete={() => void bulkDeleteStudents()} onExport={() => downloadCsv("students.csv", studentTable.allRows.map(row => ({ name: row.name, rollNumber: row.rollNumber, classSectionId: row.classSectionId, status: row.status })))} />
          <Input type="file" accept=".csv,text/csv" className="max-w-sm" onChange={(event) => void importUsers(event.target.files?.[0])} />
        </div>

        <Card className="mt-4">
          <CardContent className="pt-6">
            {loading ? <SkeletonRows /> : error ? <ErrorState message={error.message} retry={() => void reload().catch(() => undefined)} /> : students.length === 0 ? <EmptyState title="No students" description="Add the first enrolled student." /> : <Table>
              <TableHeader><TableRow>
                <TableHead className="w-10"><Checkbox checked={studentTable.rows.length > 0 && studentTable.rows.every(row => selectedStudents.includes(row.id))} onCheckedChange={(checked) => setSelectedStudents(checked ? studentTable.rows.map(row => row.id) : [])} /></TableHead>
                <TableHead>Name</TableHead><TableHead>Roll No</TableHead><TableHead>Class</TableHead><TableHead>Parent</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {studentTable.rows.map((s) => {
                  const parent = parents.find((p) => s.parentIds.includes(p.id));
                  return (<TableRow key={s.id}>
                    <TableCell><Checkbox checked={selectedStudents.includes(s.id)} onCheckedChange={() => toggleStudent(s.id)} /></TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.rollNumber}</TableCell>
                    <TableCell>
                      {classes.find((c) => c.id === s.classSectionId)?.name ?? s.classSectionId}
                    </TableCell>
                    <TableCell>{parent?.name ?? "—"}</TableCell>
                    <TableCell><Badge variant={s.status === "active" ? "success" : "secondary"}>{s.status}</Badge></TableCell>
                    <TableCell><div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEditStudent(s)}><Pencil className="h-3 w-3" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => void handleDeleteStudent(s.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div></TableCell>
                  </TableRow>);
                })}
              </TableBody>
            </Table>}
            {!loading && !error && students.length > 0 ? <PaginationControls page={studentTable.page} totalPages={studentTable.totalPages} onPageChange={setPage} /> : null}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="staff">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Staff Members</h3>
            <p className="text-sm text-muted-foreground">Teachers and operational staff. Credentials are auto-generated and emailed.</p>
          </div>
          <Button onClick={() => { setEditingStaff(null); staffForm.reset(); setStaffOpen(true); }}>
            <Plus className="h-4 w-4" />Add Staff
          </Button>
        </div>
        {renderUserFormDialog({
          open: staffOpen, onOpenChange: (v) => { if (!v) resetStaff(); else setStaffOpen(true); },
          editing: editingStaff, title: editingStaff ? "Edit Staff Member" : "Add Staff Member",
          description: editingStaff ? "Update staff profile." : "A Firebase account will be created and credentials emailed automatically.",
          form: staffForm, onSubmit: submitStaff,
          extraFields: (<>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Phone</Label><Input {...staffForm.register("phone")} /></div>
              <div className="space-y-2"><Label>Department</Label><Input {...staffForm.register("department")} /></div>
            </div>
          </>),
        })}

        <div className="mt-4">
          <TableControls search={search} onSearchChange={(value) => { setSearch(value); setPage(1); }} filter={statusFilter} filterOptions={[{ label: "All statuses", value: "all" }, { label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]} onFilterChange={(value) => { setStatusFilter(value); setPage(1); }} sort={sort} sortOptions={[{ label: "Name A-Z", value: "name-asc" }, { label: "Name Z-A", value: "name-desc" }, { label: "Newest", value: "created-desc" }]} onSortChange={setSort} onExport={() => downloadCsv("staff.csv", staffTable.allRows.map(row => ({ name: row.name, email: row.email, status: row.status })))} />
        </div>

        <Card className="mt-4">
          <CardContent className="pt-6">
            {loading ? <SkeletonRows /> : error ? <ErrorState message={error.message} retry={() => void reload().catch(() => undefined)} /> : staff.length === 0 ? <EmptyState title="No staff members" description="Add a staff member to get started." /> : <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Status</TableHead><TableHead>Joined</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {staffTable.rows.map((u) => (<TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell><Badge variant={u.status === "active" ? "success" : "warning"}>{u.status}</Badge></TableCell>
                  <TableCell>{u.createdAt}</TableCell>
                  <TableCell><div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEditStaff(u)}><Pencil className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => void handleDeleteUser(u.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div></TableCell>
                </TableRow>))}
              </TableBody>
            </Table>}
            {!loading && !error && staff.length > 0 ? <PaginationControls page={staffTable.page} totalPages={staffTable.totalPages} onPageChange={setPage} /> : null}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="parents">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Parents &amp; Guardians</h3>
            <p className="text-sm text-muted-foreground">Linked to student accounts. Credentials are auto-generated and emailed.</p>
          </div>
          <Button onClick={() => { setEditingParent(null); parentForm.reset(); setParentOpen(true); }}>
            <Plus className="h-4 w-4" />Add Parent
          </Button>
        </div>
        {renderUserFormDialog({
          open: parentOpen, onOpenChange: (v) => { if (!v) resetParent(); else setParentOpen(true); },
          editing: editingParent, title: editingParent ? "Edit Parent" : "Add Parent",
          description: editingParent ? "Update parent profile." : "A Firebase account will be created and credentials emailed automatically.",
          form: parentForm, onSubmit: submitParent,
          extraFields: (<>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Phone</Label><Input {...parentForm.register("phone")} /></div>
              <div className="space-y-2"><Label>Address</Label><Input {...parentForm.register("address")} /></div>
            </div>
          </>),
        })}

        <div className="mt-4">
          <TableControls search={search} onSearchChange={(value) => { setSearch(value); setPage(1); }} filter={statusFilter} filterOptions={[{ label: "All statuses", value: "all" }, { label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]} onFilterChange={(value) => { setStatusFilter(value); setPage(1); }} sort={sort} sortOptions={[{ label: "Name A-Z", value: "name-asc" }, { label: "Name Z-A", value: "name-desc" }, { label: "Newest", value: "created-desc" }]} onSortChange={setSort} onExport={() => downloadCsv("parents.csv", parentTable.allRows.map(row => ({ name: row.name, email: row.email, status: row.status })))} />
        </div>

        <Card className="mt-4">
          <CardContent className="pt-6">
            {loading ? <SkeletonRows /> : error ? <ErrorState message={error.message} retry={() => void reload().catch(() => undefined)} /> : parents.length === 0 ? <EmptyState title="No parents" description="Add a parent account to get started." /> : <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Children</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {parentTable.rows.map((p) => {
                  const children = students.filter((s) => s.parentIds.includes(p.id)).map((s) => studentNameById.get(s.id)).filter(Boolean).join(", ");
                  return (<TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.email}</TableCell>
                    <TableCell>{children || "—"}</TableCell>
                    <TableCell><Badge variant={p.status === "active" ? "success" : "secondary"}>{p.status}</Badge></TableCell>
                    <TableCell><div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEditParent(p)}><Pencil className="h-3 w-3" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => void handleDeleteUser(p.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div></TableCell>
                  </TableRow>);
                })}
              </TableBody>
            </Table>}
            {!loading && !error && parents.length > 0 ? <PaginationControls page={parentTable.page} totalPages={parentTable.totalPages} onPageChange={setPage} /> : null}
          </CardContent>
        </Card>
      </TabsContent>

      {renderCredentialsDialog()}
    </Tabs>
  );
}
