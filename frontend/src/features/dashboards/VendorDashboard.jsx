import { purchaseOrders, bills, payments } from "../../data/store";
import { useAuth } from "../auth/AuthContext";
import { Stat, Section, Table, Pill, Empty } from "./CustomerDashboard";

export default function VendorDashboard() {
  const { user } = useAuth();
  const email = user.email.toLowerCase();

  const myPOs = purchaseOrders.filter((p) => p.vendorEmail.toLowerCase() === email);
  const myBills = bills.filter((b) => b.vendorEmail.toLowerCase() === email);
  const myPayments = payments.filter(
    (p) => p.kind === "send" && p.partnerEmail.toLowerCase() === email
  );

  const totalBilled = myBills.reduce((s, b) => s + b.amount, 0);
  const totalReceived = myBills.reduce((s, b) => s + b.paid, 0);
  const outstanding = myBills.filter((b) => b.amount - b.paid > 0);
  const totalOutstanding = outstanding.reduce((s, b) => s + (b.amount - b.paid), 0);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Purchase Orders" value={myPOs.length} />
        <Stat label="Total Billed" value={`₹${totalBilled.toLocaleString()}`} />
        <Stat label="Received" value={`₹${totalReceived.toLocaleString()}`} tone="text-emerald-700" />
        <Stat label="Awaiting Payment" value={`₹${totalOutstanding.toLocaleString()}`} tone="text-amber-700" />
      </div>

      <Section title="Outstanding Payables" subtitle="Bills not yet settled by Urban Furniture">
        {outstanding.length === 0 ? <Empty text="All your bills have been paid." /> : (
          <Table head={["Bill", "Due Date", "Amount", "Received", "Pending"]}>
            {outstanding.map((b) => (
              <tr key={b.id} className="border-b border-white/50 last:border-0">
                <td className="p-3 font-medium">{b.number}</td>
                <td className="p-3 text-slate-500">{b.dueDate}</td>
                <td className="p-3 text-right">₹{b.amount.toLocaleString()}</td>
                <td className="p-3 text-right text-slate-500">₹{b.paid.toLocaleString()}</td>
                <td className="p-3 text-right font-medium text-amber-700">
                  ₹{(b.amount - b.paid).toLocaleString()}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Section>

      <Section title="Purchase Orders" subtitle="Orders raised to you">
        {myPOs.length === 0 ? <Empty text="No purchase orders yet." /> : (
          <Table head={["PO No.", "Date", "Items", "Total", "Status"]}>
            {myPOs.map((p) => (
              <tr key={p.id} className="border-b border-white/50 last:border-0">
                <td className="p-3 font-medium">{p.number}</td>
                <td className="p-3 text-slate-500">{p.date}</td>
                <td className="p-3 text-slate-500">
                  {p.lines.map((l) => `${l.product} × ${l.qty}`).join(", ")}
                </td>
                <td className="p-3 text-right">₹{p.total.toLocaleString()}</td>
                <td className="p-3"><Pill text={p.status} /></td>
              </tr>
            ))}
          </Table>
        )}
      </Section>

      <Section title="My Bills" subtitle="Invoices you have issued">
        <Table head={["Bill", "Date", "Amount", "Received", "Status"]}>
          {myBills.map((b) => (
            <tr key={b.id} className="border-b border-white/50 last:border-0">
              <td className="p-3 font-medium">{b.number}</td>
              <td className="p-3 text-slate-500">{b.date}</td>
              <td className="p-3 text-right">₹{b.amount.toLocaleString()}</td>
              <td className="p-3 text-right text-slate-500">₹{b.paid.toLocaleString()}</td>
              <td className="p-3"><Pill text={b.status} /></td>
            </tr>
          ))}
        </Table>
      </Section>

      <Section title="Payment History" subtitle="Money received from Urban Furniture">
        {myPayments.length === 0 ? <Empty text="No payments received yet." /> : (
          <Table head={["Reference", "Date", "Against", "Method", "Amount"]}>
            {myPayments.map((p) => (
              <tr key={p.id} className="border-b border-white/50 last:border-0">
                <td className="p-3 font-medium">{p.number}</td>
                <td className="p-3 text-slate-500">{p.date}</td>
                <td className="p-3 text-slate-500">{p.against}</td>
                <td className="p-3">{p.method}</td>
                <td className="p-3 text-right text-emerald-700 font-medium">
                  ₹{p.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Section>
    </div>
  );
}