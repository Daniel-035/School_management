import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, X } from "lucide-react";

interface ReceiptProps {
  studentName: string;
  className: string;
  structureName: string;
  term: string;
  amountDue: number;
  amountPaid: number;
  paymentMethod: string;
  transactionId: string;
  date: string;
  schoolName: string;
  onClose: () => void;
}

export function FeeReceipt(props: ReceiptProps) {
  const balance = props.amountDue - props.amountPaid;
  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Fee Receipt</CardTitle>
          <div className="flex gap-2">
            <Button size="icon" variant="outline" onClick={handlePrint} className="no-print">
              <Printer className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={props.onClose} className="no-print">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold">{props.schoolName}</h2>
            <p className="text-sm text-muted-foreground">Official Fee Receipt</p>
          </div>
          <div className="space-y-2 border-y py-4">
            <div className="flex justify-between text-sm"><span>Student:</span><span className="font-medium">{props.studentName}</span></div>
            <div className="flex justify-between text-sm"><span>Class:</span><span className="font-medium">{props.className}</span></div>
            <div className="flex justify-between text-sm"><span>Fee Structure:</span><span className="font-medium">{props.structureName}</span></div>
            <div className="flex justify-between text-sm"><span>Term:</span><span className="font-medium">{props.term}</span></div>
            <div className="flex justify-between text-sm"><span>Date:</span><span className="font-medium">{props.date}</span></div>
            <div className="flex justify-between text-sm"><span>Transaction ID:</span><span className="font-mono text-xs">{props.transactionId || "—"}</span></div>
            <div className="flex justify-between text-sm"><span>Payment Method:</span><span className="font-medium capitalize">{props.paymentMethod}</span></div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between"><span>Amount Due:</span><span>₹{props.amountDue.toLocaleString()}</span></div>
            <div className="flex justify-between text-green-600"><span>Amount Paid:</span><span>₹{props.amountPaid.toLocaleString()}</span></div>
            <div className="flex justify-between border-t pt-1 font-semibold"><span>Balance:</span><span>₹{balance.toLocaleString()}</span></div>
          </div>
          <p className="text-center text-xs text-muted-foreground">Thank you for your payment.</p>
        </CardContent>
      </Card>
    </div>
  );
}
