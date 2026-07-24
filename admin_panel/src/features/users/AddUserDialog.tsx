import { useEffect, useMemo, useState } from "react";
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
import type { User, UserRole, Student, Subject } from "@/types";
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

export const DEFAULT_CLASS_OPTIONS = [
  { id: "cs-nursery", name: "Nursery" },
  { id: "cs-lkg", name: "L.KG" },
  { id: "cs-ukg", name: "U.KG" },
  { id: "cs-1a", name: "Class 1" },
  { id: "cs-2a", name: "Class 2" },
  { id: "cs-3a", name: "Class 3" },
  { id: "cs-4a", name: "Class 4" },
  { id: "cs-5a", name: "Class 5" },
  { id: "cs-6a", name: "Class 6" },
  { id: "cs-7a", name: "Class 7" },
  { id: "cs-8a", name: "Class 8" },
  { id: "cs-9a", name: "Class 9" },
  { id: "cs-10a", name: "Class 10" },
  { id: "cs-11a", name: "Class 11" },
  { id: "cs-12a", name: "Class 12" },
];

const baseSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  governmentId: z.string().trim().optional(),
});

const studentSchema = baseSchema.extend({
  rollNumber: z.string().trim().min(1, "Roll number is required"),
  classSectionId: z.string().min(1, "Select a class"),
  fatherName: z.string().trim().optional(),
  fatherPhone: z.string().trim().optional(),
  motherName: z.string().trim().optional(),
  motherPhone: z.string().trim().optional(),
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

export function AddUserDialog({ open, onOpenChange, kind, editing, onSaved }: AddUserDialogProps) {
  const isStudent = kind === "student";
  const isStaff = kind === "staff";
  const role: UserRole = isStudent ? "student" : kind;

  const { data: classes = [] } = useQuery({ queryKey: queryKeys.classes, queryFn: academicService.getClasses });
  const { data: subjects = [] } = useQuery({ queryKey: queryKeys.subjects, queryFn: academicService.getSubjects });

  const classOptions = useMemo(() => {
    const list = [...DEFAULT_CLASS_OPTIONS];
    for (const c of classes) {
      if (!list.some((item) => item.id === c.id || item.name === c.name)) {
        list.push({ id: c.id, name: c.name || `Grade ${c.grade} - ${c.section}` });
      }
    }
    return list;
  }, [classes]);

  const schema = isStudent ? studentSchema : isStaff ? staffSchema : parentSchema;
  const { register, control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<AnyForm>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      firstName: "", lastName: "", email: "", phone: "", address: "",
      dateOfBirth: "", gender: undefined, governmentId: "",
      rollNumber: "", classSectionId: "",
      fatherName: "", fatherPhone: "", motherName: "", motherPhone: "",
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
      const ed = editing as unknown as Record<string, unknown>;
      const common = {
        firstName: "firstName" in editing ? (ed.firstName as string ?? "") : editing.name.split(" ")[0] ?? "",
        lastName: "lastName" in editing ? (ed.lastName as string ?? "") : editing.name.split(" ").slice(1).join(" ") ?? "",
        email: ("email" in editing ? (editing as User).email : "") ?? "",
        phone: (ed.phone as string ?? ""),
        address: (ed.address as string ?? ""),
        dateOfBirth: (ed.dateOfBirth as string ?? ""),
        gender: (ed.gender as "male" | "female" | "other" | undefined),
        governmentId: (ed.governmentId as string ?? ""),
      };
      if (isStudent && "classSectionId" in editing) {
        const s = editing as Student;
        reset({
          ...common,
          rollNumber: s.rollNumber ?? "",
          classSectionId: s.classSectionId,
          fatherName: s.fatherName ?? "",
          fatherPhone: s.fatherPhone ?? "",
          motherName: s.motherName ?? "",
          motherPhone: s.motherPhone ?? "",
        });
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
          firstName: values.firstName,
          lastName: values.lastName,
          rollNumber: values.rollNumber,
          classSectionId: values.classSectionId,
          governmentId: values.governmentId,
          email: values.email,
          phone: values.phone,
          address: values.address,
          dateOfBirth: values.dateOfBirth || undefined,
          gender: values.gender,
          fatherName: values.fatherName,
          fatherPhone: values.fatherPhone,
          motherName: values.motherName,
          motherPhone: values.motherPhone,
          profilePicturePath: photoPath,
        };
        if (editing) await userService.updateStudent(editing.id, payload);
        else {
          const result = await userService.createStudent(payload);
          if (result.provisionalPassword && result.username) {
            toast.success(`Student credentials created. Username: ${result.username} | Password: ${result.provisionalPassword}`);
          }
        }
      } else {
        const payload: CreateUserPayload | UpdateUserPayload = {
          firstName: values.firstName, lastName: values.lastName,
          email: values.email || `${values.firstName.toLowerCase()}.${values.lastName.toLowerCase()}@school.internal`, role,
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
              {editing ? "Update" : "Create"} {kind} profile. {isStudent ? "Enter student and parents details." : "Username and password are auto-generated."}
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
              <Label>Email Address {isStudent ? "(Optional)" : "*"}</Label>
              <Input type="email" {...register("email")} aria-invalid={Boolean(errors.email)} />
              <FieldError message={errors.email?.message} />
            </div>
            <div className="space-y-2">
              <Label>Phone number</Label>
              <Input {...register("phone")} placeholder="Student Phone" />
            </div>
          </div>

          {/* Government ID & Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Government ID</Label>
              <Input {...register("governmentId")} placeholder="e.g. Aadhaar / Govt ID" />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Controller name="gender" control={control} render={({ field }) => (
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

          {/* DOB & Address */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date of birth</Label>
              <Input type="date" {...register("dateOfBirth")} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input {...register("address")} />
            </div>
          </div>

          {/* Student Role Fields (Class & Parent Info) */}
          {isStudent && (
            <>
              <div className="border-t pt-3 mt-3">
                <h4 className="font-semibold text-sm mb-3">Academic Info</h4>
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
                          {classOptions.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )} />
                    <FieldError message={errors.classSectionId?.message} />
                  </div>
                </div>
              </div>

              {/* Parents Information */}
              <div className="border-t pt-3 mt-3 space-y-3">
                <h4 className="font-semibold text-sm">Parents Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Father's Name</Label>
                    <Input {...register("fatherName")} placeholder="Father's Name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Father's Phone</Label>
                    <Input {...register("fatherPhone")} placeholder="Father's Phone Number" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mother's Name</Label>
                    <Input {...register("motherName")} placeholder="Mother's Name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Mother's Phone</Label>
                    <Input {...register("motherPhone")} placeholder="Mother's Phone Number" />
                  </div>
                </div>
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
                        {classOptions.map((c) => (
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
              <p>Username and password will be generated automatically and sent to the email above.</p>
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
