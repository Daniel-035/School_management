import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldError } from "@/components/ui/async-state";
import { userService, type CreateUserPayload, type UpdateUserPayload } from "@/services/userService";
import { academicService } from "@/services/academicService";
import type { User, UserRole, Student, ClassSection, Subject } from "@/types";
import { queryKeys } from "@/lib/queryClient";
import { Upload, X, Loader2 } from "lucide-react";

type EntityKind = "student" | "staff" | "parent";

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: EntityKind;
  editing?: Student | User | null;
  onSaved: () => void;
  parents: User[];
}

const baseSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
});

const studentSchema = baseSchema.extend({
  rollNumber: z.string().trim().min(1, "Roll number is required"),
  classSectionId: z.string().min(1, "Select a class"),
  parentId: z.string().min(1, "Select a parent"),
});
type StudentForm = z.infer<typeof studentSchema>;

const staffSchema = baseSchema.extend({
  department: z.string().trim().optional(),
  subjectIds: z.array(z.string()).default([]),
  isClassTeacher: z.boolean().default(false),
  classTeacherForId: z.string().optional(),
});
type StaffForm = z.infer<typeof staffSchema>;

const parentSchema = baseSchema;
type ParentForm = z.infer<typeof parentSchema>;

type AnyForm = StudentForm & StaffForm & ParentForm;

export function AddUserDialog({ open, onOpenChange, kind, editing, onSaved, parents }: AddUserDialogProps) {
  const isStudent = kind === "student";
  const isStaff = kind === "staff";
  const role: UserRole = isStudent ? "parent" : kind;

  const { data: classes = [] } = useQuery({ queryKey: queryKeys.classes, queryFn: academicService.getClasses });
  const { data: subjects = [] } = useQuery({ queryKey: queryKeys.subjects, queryFn: academicService.getSubjects });

  const activeParents = parents.filter((p) => p.role === "parent" && p.status === "active");

  const schema = isStudent ? studentSchema : isStaff ? staffSchema : parentSchema;
  const { register, control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<AnyForm>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      firstName: "", lastName: "", email: "", phone: "", address: "",
      dateOfBirth: "", gender: undefined,
      rollNumber: "", classSectionId: "", parentId: "",
      department: "", subjectIds: [], isClassTeacher: false, classTeacherForId: "",
    },
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const isClassTeacher = watch("isClassTeacher");

  useEffect(() => {
    if (!open) return;
    setPhotoPreview(null);
    setPhotoPath(undefined);
    if (editing) {
      const common = {
        firstName: "firstName" in editing ? (editing as any).firstName as string ?? "" : editing.name.split(" ")[0] ?? "",
        lastName: "lastName" in editing ? (editing as any).lastName as string ?? "" : editing.name.split(" ").slice(1).join(" ") ?? "",
        email: "email" in editing ? (editing as User).email ?? "" : "",
        phone: (editing as any).phone as string ?? "",
        address: (editing as any).address as string ?? "",
        dateOfBirth: (editing as any).dateOfBirth as string ?? "",
        gender: (editing as any).gender as "male" | "female" | "other" | undefined,
      };
      if (isStudent && "classSectionId" in editing) {
        const s = editing as Student;
        reset({ ...common, rollNumber: s.rollNumber ?? "", classSectionId: s.classSectionId, parentId: s.parentIds[0] ?? "" });
      } else if (isStaff && "department" in editing) {
        const u = editing as User;
        reset({ ...common, department: u.department ?? "", subjectIds: u.subjectIds ?? [], isClassTeacher: u.isClassTeacher ?? false, classTeacherForId: u.classTeacherForId ?? "" });
      } else {
        reset(common);
      }
    } else {
      reset();
    }
  }, [open, editing, isStudent, isStaff, reset]);

  const handlePhotoChange = async (file?: File) => {
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const result = await userService.uploadProfilePhoto(file);
      setPhotoPath(result.objectPath);
      toast.success("Profile photo uploaded");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Upload failed");
      setPhotoPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const submit = handleSubmit(async (values) => {
    try {
      if (isStudent) {
        const payload = {
          firstName: values.firstName, lastName: values.lastName,
          rollNumber: values.rollNumber, classSectionId: values.classSectionId,
          parentIds: [values.parentId],
          phone: values.phone, address: values.address,
          dateOfBirth: values.dateOfBirth || undefined, gender: values.gender,
          profilePicturePath: photoPath,
        };
        if (editing) await userService.updateStudent(editing.id, payload);
        else await userService.createStudent(payload);
      } else {
        const payload: CreateUserPayload | UpdateUserPayload = {
          firstName: values.firstName, lastName: values.lastName,
          email: values.email, role,
          phone: values.phone, address: values.address,
          dateOfBirth: values.dateOfBirth || undefined, gender: values.gender,
          profilePicturePath: photoPath,
          ...(isStaff ? {
            department: values.department || undefined,
            subjectIds: values.subjectIds,
            isClassTeacher: values.isClassTeacher,
            classTeacherForId: values.isClassTeacher ? values.classTeacherForId : undefined,
          } : {}),
        };
        if (editing) await userService.updateUser(editing.id, payload as UpdateUserPayload);
        else {
          const result = await userService.createUser(payload as CreateUserPayload);
          if (!result.emailSent && result.provisionalPassword) {
            toast.success(`Account created. Username: ${result.username} | Password: ${result.provisionalPassword}`);
          }
        }
      }
      onSaved();
      toast.success(editing ? `${kind} updated` : `${kind} created`);
      onOpenChange(false);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : `Unable to save ${kind}`);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Add"} {kind === "staff" ? "Staff / Faculty" : kind[0].toUpperCase() + kind.slice(1)}</DialogTitle>
            <DialogDescription>
              {editing ? "Update" : "Create"} {kind} profile. {isStudent ? "Login credentials are not generated for students." : "Username and password are auto-generated and emailed."}
            </DialogDescription>
          </DialogHeader>

          {/* Profile Picture */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              {photoPreview && (
                <button type="button" onClick={() => { setPhotoPreview(null); setPhotoPath(undefined); }} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div>
              <Label className="cursor-pointer">
                <span className="text-sm text-primary underline">{uploading ? "Uploading..." : "Upload photo"}</span>
                <Input type="file" accept="image/*" className="hidden" onChange={(e) => void handlePhotoChange(e.target.files?.[0])} disabled={uploading} />
              </Label>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, or WebP</p>
            </div>
            {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>

          {/* First & Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First name *</Label>
              <Input {...register("firstName")} aria-invalid={Boolean(errors.firstName)} />
              <FieldError message={errors.firstName?.message} />
            </div>
            <div className="space-y-2">
              <Label>Last name *</Label>
              <Input {...register("lastName")} aria-invalid={Boolean(errors.lastName)} />
              <FieldError message={errors.lastName?.message} />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" {...register("email")} aria-invalid={Boolean(errors.email)} />
              <FieldError message={errors.email?.message} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input {...register("phone")} />
            </div>
          </div>

          {/* DOB & Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date of birth</Label>
              <Input type="date" {...register("dateOfBirth")} />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Controller name="gender" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label>Address</Label>
            <Input {...register("address")} />
          </div>

          {/* Role-specific fields */}
          {isStudent && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Roll number *</Label>
                  <Input {...register("rollNumber")} aria-invalid={Boolean(errors.rollNumber)} />
                  <FieldError message={errors.rollNumber?.message} />
                </div>
                <div className="space-y-2">
                  <Label>Class *</Label>
                  <Controller name="classSectionId" control={control} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                      <SelectContent>
                        {classes.map((c: ClassSection) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                  <FieldError message={errors.classSectionId?.message} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Parent / Guardian *</Label>
                <Controller name="parentId" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select parent" /></SelectTrigger>
                    <SelectContent>
                      {activeParents.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
                <FieldError message={errors.parentId?.message} />
              </div>
            </>
          )}

          {isStaff && (
            <>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input {...register("department")} placeholder="e.g. Mathematics, Science, Administration" />
              </div>
              <div className="space-y-2">
                <Label>Subjects taught</Label>
                <Controller name="subjectIds" control={control} render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((s: Subject) => {
                      const checked = (field.value ?? []).includes(s.id);
                      return (
                        <label key={s.id} className="flex items-center gap-1.5 text-sm cursor-pointer border rounded-md px-2 py-1 hover:bg-accent">
                          <Checkbox checked={checked} onCheckedChange={(c) => {
                            if (c) field.onChange([...(field.value ?? []), s.id]);
                            else field.onChange((field.value ?? []).filter((id: string) => id !== s.id));
                          }} />
                          {s.name}
                        </label>
                      );
                    })}
                  </div>
                )} />
              </div>
              <div className="flex items-center gap-2">
                <Controller name="isClassTeacher" control={control} render={({ field }) => (
                  <Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} id="isClassTeacher" />
                )} />
                <Label htmlFor="isClassTeacher" className="cursor-pointer">Is class teacher?</Label>
              </div>
              {isClassTeacher && (
                <div className="space-y-2">
                  <Label>Class teacher for</Label>
                  <Controller name="classTeacherForId" control={control} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                      <SelectContent>
                        {classes.map((c: ClassSection) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                </div>
              )}
            </>
          )}

          {!isStudent && !editing && (
            <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Auto-generated credentials</p>
              <p>Username and password will be generated automatically and sent to the email above. You don't need to set them manually.</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || uploading}>
              {isSubmitting ? "Saving..." : editing ? "Save changes" : `Create ${kind}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
