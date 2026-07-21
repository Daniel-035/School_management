import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, FieldError, SkeletonRows } from "@/components/ui/async-state";
import { calendarService } from "@/services/announcementService";
import type { CalendarEvent, EventType } from "@/types";
import { formatDate } from "@/lib/utils";
import { queryKeys } from "@/lib/queryClient";

const eventSchema = z.object({ title: z.string().trim().min(2, "Enter an event title"), type: z.enum(["holiday", "exam", "event", "ptm"]), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Select a date"), description: z.string().trim().min(2, "Enter a description") });
type EventForm = z.infer<typeof eventSchema>;
const typeVariant: Record<CalendarEvent["type"], "default" | "success" | "warning" | "danger"> = { holiday: "danger", exam: "warning", event: "default", ptm: "success" };

export function CalendarPage() {
  const queryClient = useQueryClient();
  const { data: events = [], error, isLoading, refetch } = useQuery({ queryKey: queryKeys.events, queryFn: calendarService.getEvents });
  const [open, setOpen] = useState(false);
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<EventForm>({ resolver: zodResolver(eventSchema), defaultValues: { title: "", type: "event", date: "", description: "" } });
  const createEvent = useMutation({
    mutationFn: calendarService.createEvent,
    onMutate: async input => {
      await queryClient.cancelQueries({ queryKey: queryKeys.events });
      const previous = queryClient.getQueryData<CalendarEvent[]>(queryKeys.events);
      const now = new Date().toISOString();
      const optimistic: CalendarEvent = { ...input, id: `optimistic-${Date.now()}`, createdAt: now, updatedAt: now };
      queryClient.setQueryData<CalendarEvent[]>(queryKeys.events, (old = []) => [...old, optimistic]);
      return { previous, optimisticId: optimistic.id };
    },
    onSuccess: (created, _input, context) => { queryClient.setQueryData<CalendarEvent[]>(queryKeys.events, (old = []) => old.map(current => current.id === context.optimisticId ? created : current)); toast.success("Event created"); },
    onError: (reason, _input, context) => { queryClient.setQueryData(queryKeys.events, context?.previous); toast.error(reason.message); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.events }),
  });
  const submit = handleSubmit(async values => { await createEvent.mutateAsync(values); reset(); setOpen(false); });

  return <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div><h2 className="text-lg font-medium">School Calendar</h2><p className="text-sm text-muted-foreground">Holidays, exams, events, and parent-teacher meetings</p></div>
      <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Plus className="h-4 w-4" />Add Event</Button></DialogTrigger><DialogContent>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <DialogHeader><DialogTitle>Add Calendar Event</DialogTitle><DialogDescription>Create a new school event or holiday.</DialogDescription></DialogHeader>
          <div className="space-y-2"><Label>Title</Label><Input {...register("title")} aria-invalid={Boolean(errors.title)} /><FieldError message={errors.title?.message} /></div>
          <div className="space-y-2"><Label>Type</Label><Controller name="type" control={control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(["holiday", "exam", "event", "ptm"] as EventType[]).map(type => <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>)}</SelectContent></Select>} /></div>
          <div className="space-y-2"><Label>Date</Label><Input type="date" {...register("date")} aria-invalid={Boolean(errors.date)} /><FieldError message={errors.date?.message} /></div>
          <div className="space-y-2"><Label>Description</Label><Input {...register("description")} aria-invalid={Boolean(errors.description)} /><FieldError message={errors.description?.message} /></div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => { reset(); setOpen(false); }}>Cancel</Button><Button type="submit" disabled={createEvent.isPending}>{createEvent.isPending ? "Creating..." : "Create"}</Button></DialogFooter>
        </form>
      </DialogContent></Dialog>
    </div>
    <Card><CardContent className="pt-6">{isLoading ? <SkeletonRows /> : error ? <ErrorState message={error.message} retry={() => void refetch()} /> : events.length === 0 ? <EmptyState title="No calendar events" description="Add the first school event or holiday." /> : <Table><TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Date</TableHead><TableHead>Description</TableHead></TableRow></TableHeader><TableBody>{events.map(event => <TableRow key={event.id}><TableCell className="font-medium">{event.title}</TableCell><TableCell><Badge variant={typeVariant[event.type]}>{event.type.toUpperCase()}</Badge></TableCell><TableCell>{formatDate(event.date)}</TableCell><TableCell className="text-muted-foreground">{event.description || "-"}</TableCell></TableRow>)}</TableBody></Table>}</CardContent></Card>
  </div>;
}
