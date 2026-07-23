import { ReactNode, useMemo, useState } from "react";
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
import { DEFAULT_CLASS_OPTIONS } from "./AddUserDialog";

const studentSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  rollNumber: z.string().trim().min(1, "Roll number is required"),
  classSectionId: z.string().min(1, "Select a class"),
  governmentId: z.string().trim().optional(),
  email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  fatherName: z.string().trim().optional(),
  fatherPhone: z.string().trim().optional(),
  motherName: z.string().trim().optional(),
  motherPhone: z.string().trim().optional(),
});
type StudentForm = z.infer<typeof studentSchema>;

const userSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().optional(),
  governmentId: z.string().trim().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
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

  const classOptions = useMemo(() => {
    const list = [...DEFAULT_CLASS_OPTIONS];
    for (const c of classes) {
      if (!list.some((item) => item.id === c.id || item.name === c.name)) {
        list.push({ id: c.id, name: c.name || `Grade ${c.grade} - ${c.section}` });
      }
    }
    return list;
  }, [classes]);

  const studentForm = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      firstName: "", lastName: "", rollNumber: "", classSectionId: "",
      governmentId: "", email: "", phone: "", gender: undefined,
      fatherName: "", fatherPhone: "", motherName: "", motherPhone: "",
    },
  });
  const staffForm = useForm<UserForm>({ resolver: zodResolver(userSchema), defaultValues: { firstName: "", lastName: "", email: "", phone: "", department: "" } });
  const parentForm = useForm<ParentForm>({ resolver: zodResolver(parentSchema), defaultValues: { firstName: "", lastName: "", email: "", phone: "", address: "" } });

  const studentNameById = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [students]);

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
      const clsName = classOptions.find((c) => c.id === row.classSectionId)?.name ?? "";
      return `${row.name} ${row.rollNumber ?? ""} ${clsName} ${row.governmentId ?? ""} ${row.fatherName ?? ""} ${row.motherName ?? ""}`;
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
      governmentId: student.governmentId ?? "",
      email: student.email ?? "",
      phone: student.phone ?? "",
      gender: student.gender,
      fatherName: student.fatherName ?? "",
      fatherPhone: student.fatherPhone ?? "",
      motherName: student.motherName ?? "",
      motherPhone: student.motherPhone ?? "",
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
      governmentId: user.governmentId ?? "",
      gender: user.gender,
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
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        rollNumber: values.rollNumber,
        classSectionId: values.classSectionId,
        governmentId: values.governmentId,
        email: values.email,
        phone: values.phone,
        gender: values.gender,
        fatherName: values.fatherName,
        fatherPhone: values.fatherPhone,
        motherName: values.motherName,
        motherPhone: values.motherPhone,
      };
      if (editingStudent) {
        await userService.updateStudent(editingStudent.id, payload);
        await reload();
        toast.success("Student updated");
        resetStudent();
      } else {
        const result = await userService.createStudent(payload);
        await reload();
        resetStudent();
        setCredentials({
          user: {
            id: result.student.id,
            name: result.student.name,
            email: result.student.email || `${result.username}@student.school.internal`,
            role: "parent" as never,
            status: "active",
            createdAt: String(result.student.createdAt),
            updatedAt: String(result.student.updatedAt),
          },
          username: result.username,
          provisionalPassword: result.provisionalPassword,
          emailSent: false,
        });
      }
    } catch (reason) { toast.error(reason instanceof Error ? reason.message : "Unable to save student"); }
  });

  const submitStaff = staffForm.handleSubmit(async (values) => {
    try {
      if (editingStaff) {
        await userService.updateUser(editingStaff.id, {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
          governmentId: values.governmentId,
          gender: values.gender,
          department: values.department,
        });
        await reload();
        toast.success("Staff member updated");
        resetStaff();
      } else {
        const result = await userService.createUser({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          role: "staff",
          phone: values.phone,
          governmentId: values.governmentId,
          gender: values.gender,
          department: values.department,
        });
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderUserFormDialog = (opts: { open: boolean; onOpenChange: (v: boolean) => void; editing: User | null; title: string; description: string; form: any; onSubmit: any; extraFields?: ReactNode }) => (
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
            <p className="text-sm text-muted-foreground">All enrolled students with embedded parents and academic info.</p>
          </div>
          <Dialog open={studentOpen} onOpenChange={setStudentOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingStudent(null); studentForm.reset(); setStudentOpen(true); }}>
                <Plus className="h-4 w-4" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <form onSubmit={submitStudent} className="space-y-4" noValidate>
                <DialogHeader>
                  <DialogTitle>{editingStudent ? "Edit" : "Add"} Student</DialogTitle>
                  <DialogDescription>{editingStudent ? "Update" : "Create"} student profile and parent details.</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>First Name *</Label>
                    <Input {...studentForm.register("firstName")} aria-invalid={Boolean(studentForm.formState.errors.firstName)} />
                    <FieldError message={studentForm.formState.errors.firstName?.message} />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name *</Label>
                    <Input {...studentForm.register("lastName")} aria-invalid={Boolean(studentForm.formState.errors.lastName)} />
                    <FieldError message={studentForm.formState.errors.lastName?.message} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input type="email" {...studentForm.register("email")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Student Phone</Label>
                    <Input {...studentForm.register("phone")} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Government ID</Label>
                    <Input {...studentForm.register("governmentId")} placeholder="e.g. Aadhaar / Govt ID" />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Controller name="gender" control={studentForm.control} render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    )} />
                  </div>
                </div>

                <div className="border-t pt-3 space-y-3">
                  <h4 className="font-semibold text-sm">Academic Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Roll No *</Label>
                      <Input {...studentForm.register("rollNumber")} aria-invalid={Boolean(studentForm.formState.errors.rollNumber)} />
                      <FieldError message={studentForm.formState.errors.rollNumber?.message} />
                    </div>
                    <div className="space-y-2">
                      <Label>Class *</Label>
                      <Controller name="classSectionId" control={studentForm.control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>
                          {classOptions.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>} />
                      <FieldError message={studentForm.formState.errors.classSectionId?.message} />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-3">
                  <h4 className="font-semibold text-sm">Parents Information</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Father's Name</Label>
                      <Input {...studentForm.register("fatherName")} placeholder="Father's Name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Father's Phone</Label>
                      <Input {...studentForm.register("fatherPhone")} placeholder="Father's Phone Number" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Mother's Name</Label>
                      <Input {...studentForm.register("motherName")} placeholder="Mother's Name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Mother's Phone</Label>
                      <Input {...studentForm.register("motherPhone")} placeholder="Mother's Phone Number" />
                    </div>
                  </div>
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
          <TableControls search={search} onSearchChange={(value) => { setSearch(value); setPage(1); }} filter={statusFilter} filterLabel="Status" filterOptions={[{ label: "All statuses", value: "all" }, { label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]} onFilterChange={(value) => { setStatusFilter(value); setPage(1); }} sort={sort} sortOptions={[{ label: "Name A-Z", value: "name-asc" }, { label: "Name Z-A", value: "name-desc" }, { label: "Newest", value: "created-desc" }]} onSortChange={setSort} selectedCount={selectedStudents.length} onBulkDelete={() => void bulkDeleteStudents()} onExport={() => downloadCsv("students.csv", studentTable.allRows.map(row => ({ name: row.name, rollNumber: row.rollNumber, classSectionId: row.classSectionId, governmentId: row.governmentId, fatherName: row.fatherName, motherName: row.motherName, status: row.status })))} />
          <Input type="file" accept=".csv,text/csv" className="max-w-sm" onChange={(event) => void importUsers(event.target.files?.[0])} />
        </div>

        <Card className="mt-4">
          <CardContent className="pt-6">
            {loading ? <SkeletonRows /> : error ? <ErrorState message={error.message} retry={() => void reload().catch(() => undefined)} /> : students.length === 0 ? <EmptyState title="No students" description="Add the first enrolled student." /> : <Table>
              <TableHeader><TableRow>
                <TableHead className="w-10"><Checkbox checked={studentTable.rows.length > 0 && studentTable.rows.every(row => selectedStudents.includes(row.id))} onCheckedChange={(checked) => setSelectedStudents(checked ? studentTable.rows.map(row => row.id) : [])} /></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Govt ID</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Father Info</TableHead>
                <TableHead>Mother Info</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {studentTable.rows.map((s) => {
                  const clsName = classOptions.find((c) => c.id === s.classSectionId)?.name ?? classes.find((c) => c.id === s.classSectionId)?.name ?? s.classSectionId;
                  return (<TableRow key={s.id}>
                    <TableCell><Checkbox checked={selectedStudents.includes(s.id)} onCheckedChange={() => toggleStudent(s.id)} /></TableCell>
                    <TableCell className="font-medium">
                      <div>{s.name}</div>
                      {s.email && <div className="text-xs text-muted-foreground">{s.email}</div>}
                    </TableCell>
                    <TableCell>{s.rollNumber}</TableCell>
                    <TableCell><Badge variant="outline">{clsName}</Badge></TableCell>
                    <TableCell>{s.governmentId || "—"}</TableCell>
                    <TableCell className="capitalize">{s.gender || "—"}</TableCell>
                    <TableCell>
                      {s.fatherName ? (
                        <div className="text-sm">
                          <div>{s.fatherName}</div>
                          {s.fatherPhone && <div className="text-xs text-muted-foreground">{s.fatherPhone}</div>}
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {s.motherName ? (
                        <div className="text-sm">
                          <div>{s.motherName}</div>
                          {s.motherPhone && <div className="text-xs text-muted-foreground">{s.motherPhone}</div>}
                        </div>
                      ) : "—"}
                    </TableCell>
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
              <div className="space-y-2"><Label>Phone Number</Label><Input {...staffForm.register("phone")} placeholder="Phone Number" /></div>
              <div className="space-y-2"><Label>Government ID</Label><Input {...staffForm.register("governmentId")} placeholder="e.g. Govt ID / Aadhaar" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Controller name="gender" control={staffForm.control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-2"><Label>Department</Label><Input {...staffForm.register("department")} placeholder="e.g. Mathematics, Science" /></div>
            </div>
          </>),
        })}

        <div className="mt-4">
          <TableControls search={search} onSearchChange={(value) => { setSearch(value); setPage(1); }} filter={statusFilter} filterOptions={[{ label: "All statuses", value: "all" }, { label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]} onFilterChange={(value) => { setStatusFilter(value); setPage(1); }} sort={sort} sortOptions={[{ label: "Name A-Z", value: "name-asc" }, { label: "Name Z-A", value: "name-desc" }, { label: "Newest", value: "created-desc" }]} onSortChange={setSort} onExport={() => downloadCsv("staff.csv", staffTable.allRows.map(row => ({ name: row.name, email: row.email, phone: row.phone, governmentId: row.governmentId, gender: row.gender, department: row.department, status: row.status })))} />
        </div>

        <Card className="mt-4">
          <CardContent className="pt-6">
            {loading ? <SkeletonRows /> : error ? <ErrorState message={error.message} retry={() => void reload().catch(() => undefined)} /> : staff.length === 0 ? <EmptyState title="No staff members" description="Add a staff member to get started." /> : <Table>
              <TableHeader><TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email &amp; Phone</TableHead>
                <TableHead>Govt ID</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {staffTable.rows.map((u) => (<TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>
                    <div>{u.email}</div>
                    {u.phone && <div className="text-xs text-muted-foreground">{u.phone}</div>}
                  </TableCell>
                  <TableCell>{u.governmentId || "—"}</TableCell>
                  <TableCell className="capitalize">{u.gender || "—"}</TableCell>
                  <TableCell>{u.department || "—"}</TableCell>
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
            <h3 className="text-lg font-medium">Parents &amp; Guardians List</h3>
            <p className="text-sm text-muted-foreground">Parent details are automatically gathered when registering students.</p>
          </div>
        </div>
        {renderUserFormDialog({
          open: parentOpen, onOpenChange: (v) => { if (!v) resetParent(); else setParentOpen(true); },
          editing: editingParent, title: editingParent ? "Edit Parent" : "Add Parent",
          description: editingParent ? "Update parent profile." : "Parent account information.",
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
            {loading ? <SkeletonRows /> : error ? <ErrorState message={error.message} retry={() => void reload().catch(() => undefined)} /> : parents.length === 0 ? <EmptyState title="No parents registered" description="Parent information is attached when adding students." /> : <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Children</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {parentTable.rows.map((p) => {
                  const children = students.filter((s) => (s.parentIds ?? []).includes(p.id)).map((s) => studentNameById.get(s.id)).filter(Boolean).join(", ");
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
