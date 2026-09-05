import { useState } from "react";
import { Printer } from "lucide-react";
import GlassCard from "../components/GlassCard";
import { invoices, bills } from "../data/store";



export default function ReportsPage() {
  const [tab, setTab] = useState("balance");
  const year = 2026;

  // Derived figures from the transaction data.
  const totalIncome = invoices.reduce((s, i) => s + i.amount, 0);
  const totalExpense = bills.reduce((s, b) => s + b.amount, 0);
  const netIncome = totalIncome - totalExpense;

  const cashCollected = invoices.reduce((s, i) => s + i.paid, 0);
  const cashPaid = bills.reduce((s, b) => s + b.paid, 0);
  const debtors = invoices.reduce((s, i) => s + (i.amount - i.paid), 0);
  const creditors = bills.reduce((s, b) => s + (b.amount - b.paid), 0);

  const bankBalance = cashCollected - cashPaid;
  const totalAssets = bankBalance + debtors;
  const totalLiabilities = creditors + netIncome; // capital = retained earnings

  return (
    <div className="space-y-4 max-w-4xl">
      {/* toolbar — hidden when printing */}
      <div className="flex items-center gap-3 no-print">
        <button onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800">
          <Printer size={15} /> Print / Save as PDF
        </button>

        <div className="ml-auto flex border rounded-lg overflow-hidden text-sm">
          <button onClick={() => setTab("balance")}
            className={`px-3 py-1.5 ${tab === "balance" ? "bg-slate-900 text-white" : "bg-white"}`}>
            Balance Sheet
          </button>
          <button onClick={() => setTab("pl")}
            className={`px-3 py-1.5 ${tab === "pl" ? "bg-slate-900 text-white" : "bg-white"}`}>
            Profit & Loss
          </button>
        </div>
      </div>

      {/* print-area is what gets captured by the PDF */}
      <div className="print-area">
        <GlassCard className="p-6">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold">
              {tab === "balance" ? "Balance Sheet" : "Profit & Loss Report"}
            </h1>
            <p className="text-sm text-slate-500">Urban Furniture · Financial Year {year}</p>
          </div>

          {tab === "balance" ? (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h2 className="font-semibold border-b pb-2 mb-2">Assets</h2>
                <LineItem label="Bank" value={bankBalance} />
                <LineItem label="Cash" value={0} />
                <LineItem label="Debtors" value={debtors} />
                <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
                  <span>Total Assets</span>
                  <span>₹{totalAssets.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <h2 className="font-semibold border-b pb-2 mb-2">Liabilities & Capital</h2>
                <LineItem label="Creditors" value={creditors} />
                <LineItem label="Capital (Retained Earnings)" value={netIncome} />
                <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
                  <span>Total Liabilities</span>
                  <span>₹{totalLiabilities.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <SectionRow label="Income" value={totalIncome} bold />
              <LineItem label="Income from Sales" value={totalIncome} />

              <div className="h-4" />

              <SectionRow label="Expenses" value={totalExpense} bold />
              <LineItem label="Purchase Expense" value={totalExpense} />
              <LineItem label="Other Expense" value={0} />

              <div className="border-t mt-4 pt-3 flex justify-between text-base font-semibold">
                <span>Net Income</span>
                <span className={netIncome >= 0 ? "text-emerald-700" : "text-rose-700"}>
                  ₹{netIncome.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function LineItem({ label, value }) {
  return (
    <div className="flex justify-between py-1.5 text-sm border-b last:border-0">
      <span className="text-slate-600">{label}</span>
      <span>₹{value.toLocaleString()}</span>
    </div>
  );
}

function SectionRow({ label, value, bold }) {
  return (
    <div className={`flex justify-between py-2 border-b ${bold ? "font-semibold" : ""}`}>
      <span>{label}</span>
      <span>₹{value.toLocaleString()}</span>
    </div>
  );
}