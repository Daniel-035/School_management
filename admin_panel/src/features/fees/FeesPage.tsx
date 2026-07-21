import { useState } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { feeService } from "@/services/feeService";
import { userService } from "@/services/userService";
import type { FeePayment, FeeStructure, FeeSummary, Student } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Pencil, Download, Plus } from "lucide-react";
import { queryKeys } from "@/lib/queryClient";
import { EmptyState, ErrorState, FieldError, SkeletonRows } from "@/components/ui/async-state";
import { PaginationControls, TableControls, applyTableState } from "@/components/ui/data-table-tools";
import { downloadCsv } from "@/lib/csv";
import { FeeReceipt } from "@/components/FeeReceipt";

const feeSchema = z.object({ studentId: z.string().min(1, "Select a student"), feeStructureId: z.string().min(1, "Select a fee structure"), amountDue: z.number().positive("Amount must be greater than zero") });
const recordSchema = z.object({ amountPaid: z.number().positive("Amount must be greater than zero"), paymentMethod: z.string().min(1, "Enter payment method"), transactionId: z.string().optional() });
type FeeForm = z.infer<typeof feeSchema>;
type RecordForm = z.infer<typeof recordSchema>;

export function FeesPage() {
  const queryClient = useQueryClient();
  const queries = useQueries({ queries: [
    { queryKey: queryKeys.feePayments, queryFn: feeService.getAll },
    { queryKey: queryKeys.feeStructures, queryFn: feeService.getStructures },
    { queryKey: queryKeys.feeSummary, queryFn: feeService.getSummary },
    { queryKey: queryKeys.students, queryFn: userService.getStudents },
  ] });
  const fees = (queries[0].data ?? []) as FeePayment[];
  const structures = (queries[1].data ?? []) as FeeStructure[];
  const summary = (queries[2].data ?? null) as FeeSummary | null;
  const students = (queries[3].data ?? []) as Student[];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FeePayment | null>(null);
  const [paymentDialog, setPaymentDialog] = useState<FeePayment | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const loading = queries.some(query => query.isPending);
  const loadError = queries.find((query) => query.error)?.error;
  const retry = () => Promise.all(queries.map(query => query.refetch()));
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<FeeForm>({ resolver: zodResolver(feeSchema), defaultValues: { studentId: "", feeStructureId: "", amountDue: 0 } });
  const recordForm = useForm<RecordForm>({ resolver: zodResolver(recordSchema), defaultValues: { amountPaid: 0, paymentMethod: "Cash", transactionId: "" } });
  const refreshFees = () => Promise.all([queryClient.invalidateQueries({ queryKey: queryKeys.feePayments }), queryClient.invalidateQueries({ queryKey: queryKeys.feeSummary })]);
  const savePayment = useMutation({ mutationFn: (values: FeeForm) => editing ? feeService.updatePayment(editing.id, values) : feeService.createPayment(values), onSuccess: async () => { await refreshFees(); toast.success(editing ? "Fee record updated" : "Fee record created"); setDialogOpen(false); reset(); }, onError: reason => toast.error(reason.message) });
  const recordPayment = useMutation({ mutationFn: (values: RecordForm) => feeService.recordPayment(paymentDialog!.id, { ...values, paidAt: new Date().toISOString().slice(0, 10) }), onSuccess: async (payment) => { await refreshFees(); toast.success("Payment recorded"); setShowReceipt(payment); setPaymentDialog(null); recordForm.reset(); }, onError: reason => toast.error(reason.message) });
  const feeTable = applyTableState(fees, { search, filter: statusFilter, sort, page, searchText: row => `${studentName(row.studentId)} ${row.status} ${structureFor(row.feeStructureId)?.classSectionId ?? ""}`, filterValue: row => row.status, sorters: { recent: (a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)), "amount-desc": (a, b) => b.amountDue - a.amountDue, "amount-asc": (a, b) => a.amountDue - b.amountDue } });
  const [showReceipt, setShowReceipt] = useState<FeePayment | null>(null);
  const createReceipt = (payment: FeePayment) => setShowReceipt(payment);

  function studentName(id: string) {
    return students.find((st) => st.id === id)?.name ?? id;
  }

  function structureFor(id: string) {
    return structures.find((st) => st.id === id);
  }

  const statusVariant: Record<FeePayment["status"], "success" | "warning" | "danger"> = {
    paid: "success",
    pending: "warning",
    overdue: "danger",
  };

  const handleAdd = () => {
    setEditing(null);
    reset({ studentId: "", feeStructureId: structures[0]?.id ?? "", amountDue: 0 });
    setDialogOpen(true);
  };

  const handleEdit = (fee: FeePayment) => {
    setEditing(fee);
    reset({ studentId: fee.studentId, feeStructureId: fee.feeStructureId, amountDue: fee.amountDue });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {summary ? formatCurrency(summary.totalPaid) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {summary ? formatCurrency(summary.outstanding) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Due</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-rose-600">
              {summary ? formatCurrency(summary.totalDue) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Fee Records</h2>
          <p className="text-sm text-muted-foreground">
            All student fee invoices
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4" />
              Add Fee
            </Button>
          </DialogTrigger>
          <DialogContent><form onSubmit={handleSubmit(values => savePayment.mutateAsync(values))} noValidate>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit" : "Add"} Fee Record
              </DialogTitle>
              <DialogDescription>
                {editing ? "Update" : "Create"} a fee invoice.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Student</Label>
                <Controller name="studentId" control={control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>} />
                <FieldError message={errors.studentId?.message} />
              </div>
              <div className="space-y-2">
                <Label>Fee Structure</Label>
                <Controller name="feeStructureId" control={control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="Select fee structure" /></SelectTrigger><SelectContent>{structures.map(item => <SelectItem key={item.id} value={item.id}>{item.name} · {formatDate(item.dueDate)}</SelectItem>)}</SelectContent></Select>} />
                <FieldError message={errors.feeStructureId?.message} />
              </div>
              <div className="space-y-2">
                <Label>Amount Due</Label>
                <Input type="number" step="0.01" {...register("amountDue", { valueAsNumber: true })} />
                <FieldError message={errors.amountDue?.message} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savePayment.isPending}>{savePayment.isPending ? "Saving..." : editing ? "Save" : "Create"}</Button>
            </DialogFooter>
          </form></DialogContent>
        </Dialog>
      </div>

      <TableControls
        search={search}
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        filter={statusFilter}
        filterOptions={[{ label: "All", value: "all" }, { label: "Pending", value: "pending" }, { label: "Paid", value: "paid" }, { label: "Overdue", value: "overdue" }]}
        onFilterChange={(value) => { setStatusFilter(value); setPage(1); }}
        sort={sort}
        sortOptions={[{ label: "Recent", value: "recent" }, { label: "Amount high-low", value: "amount-desc" }, { label: "Amount low-high", value: "amount-asc" }]}
        onSortChange={setSort}
        onExport={() => downloadCsv("fees.csv", feeTable.allRows.map(row => ({ student: studentName(row.studentId), classSection: structureFor(row.feeStructureId)?.classSectionId ?? "-", amountDue: row.amountDue, amountPaid: row.amountPaid, status: row.status, transactionId: row.transactionId ?? "" })))}
      />

      <Card>
        <CardContent className="pt-6">
          {loading ? <SkeletonRows /> : loadError ? <ErrorState message={loadError.message} retry={() => void retry()} /> : fees.length === 0 ? <EmptyState title="No fee records" description="Create the first student fee invoice." /> : <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feeTable.rows.map((f) => {
                const structure = structureFor(f.feeStructureId);
                return (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">
                      {studentName(f.studentId)}
                    </TableCell>
                    <TableCell>{structure?.classSectionId ?? "—"}</TableCell>
                    <TableCell>{formatCurrency(f.amountDue)}</TableCell>
                    <TableCell>{formatCurrency(f.amountPaid)}</TableCell>
                    <TableCell>{structure ? formatDate(structure.dueDate) : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[f.status]}>
                        {f.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(f)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPaymentDialog(f)}
                          disabled={f.status === "paid"}
                        >
                          Pay
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => createReceipt(f)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>}
          {!loading && !loadError && fees.length > 0 ? <PaginationControls page={feeTable.page} totalPages={feeTable.totalPages} onPageChange={setPage} /> : null}
        </CardContent>
      </Card>

      <Dialog open={Boolean(paymentDialog)} onOpenChange={(open) => !open && setPaymentDialog(null)}>
        <DialogContent>
          <form onSubmit={recordForm.handleSubmit(values => recordPayment.mutateAsync(values))} className="space-y-4" noValidate>
            <DialogHeader><DialogTitle>Record Payment</DialogTitle><DialogDescription>{paymentDialog ? studentName(paymentDialog.studentId) : ""}</DialogDescription></DialogHeader>
            <div className="space-y-2"><Label>Amount Paid</Label><Input type="number" step="0.01" {...recordForm.register("amountPaid", { valueAsNumber: true })} /><FieldError message={recordForm.formState.errors.amountPaid?.message} /></div>
            <div className="space-y-2"><Label>Payment Method</Label><Input {...recordForm.register("paymentMethod")} /><FieldError message={recordForm.formState.errors.paymentMethod?.message} /></div>
            <div className="space-y-2"><Label>Transaction ID</Label><Input {...recordForm.register("transactionId")} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setPaymentDialog(null)}>Cancel</Button><Button type="submit" disabled={recordPayment.isPending}>{recordPayment.isPending ? "Recording..." : "Record Payment"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {showReceipt ? (() => {
        const structure = structureFor(showReceipt.feeStructureId);
        return <FeeReceipt studentName={studentName(showReceipt.studentId)} className={structure?.classSectionId ?? "-"} structureName={structure?.name ?? "-"} term={structure?.term ?? "-"} amountDue={showReceipt.amountDue} amountPaid={showReceipt.amountPaid} paymentMethod={showReceipt.paymentMethod ?? "Cash"} transactionId={showReceipt.transactionId ?? ""} date={showReceipt.paidAt ?? new Date().toISOString().slice(0, 10)} schoolName="EduConnect Public School" onClose={() => setShowReceipt(null)} />;
      })() : null}
    </div>
  );
}
