import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Megaphone, Plus, Send, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, ErrorState, FieldError, SkeletonRows } from "@/components/ui/async-state";
import { announcementService } from "@/services/announcementService";
import { academicService } from "@/services/academicService";
import type { Announcement, AnnouncementAudience, AnnouncementChannel } from "@/types";
import { useAuth } from "@/features/auth/AuthContext";
import { formatDate } from "@/lib/utils";
import { queryKeys } from "@/lib/queryClient";

const audiences: AnnouncementAudience[] = ["all", "staff", "parents", "class"];
const channels: AnnouncementChannel[] = ["push", "sms", "email"];
const schema = z.object({ title: z.string().trim().min(3, "Enter at least 3 characters"), body: z.string().trim().min(10, "Enter at least 10 characters"), audience: z.array(z.enum(["all", "staff", "parents", "class"])).min(1, "Select an audience"), channels: z.array(z.enum(["push", "sms", "email"])).min(1, "Select a channel"), classIds: z.array(z.string()), scheduledFor: z.string() });
type FormValues = z.infer<typeof schema>;

export function AnnouncementsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data = [], error, isLoading, refetch } = useQuery({ queryKey: queryKeys.announcements, queryFn: announcementService.getAll });
  const { data: classes = [] } = useQuery({ queryKey: queryKeys.classes, queryFn: academicService.getClasses });
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { title: "", body: "", audience: ["all"], channels: ["push"], classIds: [], scheduledFor: "" } });
  const selectedAudience = watch("audience");
  const selectedChannels = watch("channels");
  const selectedClasses = watch("classIds");
  const create = useMutation({
    mutationFn: announcementService.create,
    onSuccess: item => { queryClient.setQueryData<Announcement[]>(queryKeys.announcements, (old = []) => [item, ...old]); toast.success("Announcement created"); },
    onError: reason => toast.error(reason.message),
  });
  const submit = handleSubmit(async values => {
    if (!user) return toast.error("Your session is unavailable");
    const audience: AnnouncementAudience[] = values.audience.includes("class")
      ? [...values.audience.filter((a: string) => a !== "class"), ...values.classIds.map(() => "class" as AnnouncementAudience)]
      : values.audience;
    const created = await create.mutateAsync({ title: values.title, body: values.body, audience, channels: values.channels, pinned: false });
    if (values.scheduledFor) {
      toast.success("Announcement scheduled");
    } else {
      await announcementService.send(created.id, { channels: values.channels });
      toast.success("Announcement dispatched");
    }
    reset(); setOpen(false);
  });
  const toggle = <T extends string>(field: "audience" | "channels", values: T[], item: T) => setValue(field, (values.includes(item) ? values.filter(value => value !== item) : [...values, item]) as FormValues[typeof field], { shouldValidate: true });
  const toggleClass = (id: string) => setValue("classIds", selectedClasses.includes(id) ? selectedClasses.filter(c => c !== id) : [...selectedClasses, id], { shouldValidate: true });

  return <div className="space-y-6">
    <div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Announcements</h2><p className="text-sm text-muted-foreground">Send notifications to parents, staff, or the whole school.</p></div>
      <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Plus className="h-4 w-4" />New Announcement</Button></DialogTrigger><DialogContent><form onSubmit={submit} className="space-y-4" noValidate>
        <DialogHeader><DialogTitle>Create announcement</DialogTitle><DialogDescription>Configure audience and delivery channels.</DialogDescription></DialogHeader>
        <div className="space-y-2"><Label>Title</Label><Input {...register("title")} /><FieldError message={errors.title?.message} /></div>
        <div className="space-y-2"><Label>Message</Label><textarea rows={3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register("body")} /><FieldError message={errors.body?.message} /></div>
        <div className="space-y-2"><Label>Audience</Label><div className="flex flex-wrap gap-2">{audiences.map(item => <button type="button" key={item} onClick={() => toggle("audience", selectedAudience, item)} className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${selectedAudience.includes(item) ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{item}</button>)}</div>
          {selectedAudience.includes("class") ? <div className="flex flex-wrap gap-2 rounded border p-2"><span className="text-xs text-muted-foreground">Select classes:</span>{classes.map(cls => <button type="button" key={cls.id} onClick={() => toggleClass(cls.id)} className={`rounded-full border px-2 py-0.5 text-xs ${selectedClasses.includes(cls.id) ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{cls.name}</button>)}</div> : null}
          <FieldError message={errors.audience?.message} /></div>
        <div className="space-y-2"><Label>Channels</Label><div className="flex flex-wrap gap-2">{channels.map(item => <button type="button" key={item} onClick={() => toggle("channels", selectedChannels, item)} className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${selectedChannels.includes(item) ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{item}</button>)}</div><FieldError message={errors.channels?.message} /></div>
        <Tabs defaultValue="now" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="now"><Send className="mr-1 h-3 w-3" />Send Now</TabsTrigger>
            <TabsTrigger value="schedule"><Calendar className="mr-1 h-3 w-3" />Schedule</TabsTrigger>
          </TabsList>
          <TabsContent value="now" className="text-sm text-muted-foreground">Will dispatch immediately when sent.</TabsContent>
          <TabsContent value="schedule"><Input type="datetime-local" {...register("scheduledFor")} /></TabsContent>
        </Tabs>
        <DialogFooter><Button type="button" variant="outline" onClick={() => { reset(); setOpen(false); }}>Cancel</Button><Button type="submit" disabled={create.isPending}>{create.isPending ? "Sending..." : "Send"}</Button></DialogFooter>
      </form></DialogContent></Dialog>
    </div>
    {isLoading ? <SkeletonRows /> : error ? <ErrorState message={error.message} retry={() => void refetch()} /> : data.length === 0 ? <EmptyState title="No announcements" description="Create the first school announcement." /> : <div className="grid gap-4">{data.map(item => <Card key={item.id}><CardHeader className="flex flex-row items-start gap-3 space-y-0"><div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary"><Megaphone className="h-4 w-4" /></div><div className="flex-1"><CardTitle className="text-base">{item.title}</CardTitle><CardDescription className="text-xs">{formatDate(item.publishedAt)} · Audience: {item.audience.join(", ")}</CardDescription></div><div className="flex gap-1">{item.channels.map((channel: string) => <Badge key={channel} variant="secondary">{channel}</Badge>)}</div></CardHeader><CardContent><p className="text-sm text-muted-foreground">{item.body}</p></CardContent></Card>)}</div>}
  </div>;
}
