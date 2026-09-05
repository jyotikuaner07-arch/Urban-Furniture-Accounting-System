// All business data. Replaced by API calls when the backend is ready.

// ============================================================
// MASTER DATA
// ============================================================

export let contacts = [
  { id: "c1", name: "Nimesh Pathak",   type: "customer", email: "nimesh@example.com", mobile: "9090090909", city: "Ahmedabad", state: "Gujarat", pincode: "380001" },
  { id: "c2", name: "Azure Furniture", type: "vendor",   email: "azure@example.com",  mobile: "8080080808", city: "Surat",     state: "Gujarat", pincode: "395003" },
  { id: "c3", name: "Rahul Sharma",    type: "both",     email: "rahul@example.com",  mobile: "7070070707", city: "Mumbai",    state: "Maharashtra", pincode: "400001" },
];

export let products = [
  { id: "p1", name: "Office Chair",     type: "goods",   category: "Furniture", salesPrice: 5000,  cost: 3200 },
  { id: "p2", name: "Wooden Table",     type: "goods",   category: "Furniture", salesPrice: 12000, cost: 8000 },
  { id: "p3", name: "Sofa",             type: "goods",   category: "Furniture", salesPrice: 25000, cost: 17000 },
  { id: "p4", name: "Assembly Service", type: "service", category: "Services",  salesPrice: 1500,  cost: 600 },
];

// Chart of Accounts. `group` decides which report the account lands on.
export let accounts = [
  { id: "a1", name: "Cash A/c",             type: "Cash",          group: "Balance Sheet" },
  { id: "a2", name: "Bank A/c",             type: "Bank",          group: "Balance Sheet" },
  { id: "a3", name: "Debtors A/c",          type: "Asset",         group: "Balance Sheet" },
  { id: "a4", name: "Creditors A/c",        type: "Liability",     group: "Balance Sheet" },
  { id: "a5", name: "Capital A/c",          type: "Capital",       group: "Balance Sheet" },
  { id: "a6", name: "Sales Income A/c",     type: "Income",        group: "Profit & Loss" },
  { id: "a7", name: "Purchase Expense A/c", type: "Expense",       group: "Profit & Loss" },
  { id: "a8", name: "Other Expense A/c",    type: "Other Expense", group: "Profit & Loss" },
];

export let journals = [
  { id: "j1", name: "Sales",    type: "Sales",    defaultAccount: "Sales Income A/c" },
  { id: "j2", name: "Purchase", type: "Purchase", defaultAccount: "Purchase Expense A/c" },
  { id: "j3", name: "Bank",     type: "Bank",     defaultAccount: "Bank A/c" },
  { id: "j4", name: "Cash",     type: "Cash",     defaultAccount: "Cash A/c" },
];

// ============================================================
// TRANSACTIONS
// ============================================================

export let purchaseOrders = [
  { id: "po1", number: "P00001", vendorEmail: "azure@example.com", vendor: "Azure Furniture",
    date: "2026-08-25", status: "Billed",
    lines: [{ product: "Wooden Table", qty: 3, unitPrice: 8000 }],
    total: 24000, billNumber: "BILL/2026/0001" },
  { id: "po2", number: "P00002", vendorEmail: "azure@example.com", vendor: "Azure Furniture",
    date: "2026-09-04", status: "Confirmed",
    lines: [{ product: "Office Chair", qty: 5, unitPrice: 3000 }],
    total: 15000, billNumber: "BILL/2026/0002" },
];

export let bills = [
  { id: "b1", number: "BILL/2026/0001", vendorEmail: "azure@example.com", vendor: "Azure Furniture",
    date: "2026-08-26", dueDate: "2026-09-10", amount: 24000, paid: 24000, status: "Paid", poNumber: "P00001" },
  { id: "b2", number: "BILL/2026/0002", vendorEmail: "azure@example.com", vendor: "Azure Furniture",
    date: "2026-09-05", dueDate: "2026-09-20", amount: 15000, paid: 0, status: "Not Paid", poNumber: "P00002" },
];

export let salesOrders = [
  { id: "so1", number: "S00001", customerEmail: "nimesh@example.com", customer: "Nimesh Pathak",
    date: "2026-08-28", status: "Invoiced",
    lines: [{ product: "Office Chair", qty: 5, unitPrice: 5000 }],
    total: 25000, invoiceNumber: "INV/2026/0001" },
  { id: "so2", number: "S00002", customerEmail: "nimesh@example.com", customer: "Nimesh Pathak",
    date: "2026-09-03", status: "Invoiced",
    lines: [{ product: "Wooden Table", qty: 1, unitPrice: 12000 }],
    total: 12000, invoiceNumber: "INV/2026/0002" },
  { id: "so3", number: "S00003", customerEmail: "rahul@example.com", customer: "Rahul Sharma",
    date: "2026-09-04", status: "Confirmed",
    lines: [{ product: "Sofa", qty: 1, unitPrice: 8000 }],
    total: 8000, invoiceNumber: "INV/2026/0003" },
];

export let invoices = [
  { id: "i1", number: "INV/2026/0001", customerEmail: "nimesh@example.com", customer: "Nimesh Pathak",
    date: "2026-09-01", dueDate: "2026-09-15", amount: 25000, paid: 25000, status: "Paid", soNumber: "S00001" },
  { id: "i2", number: "INV/2026/0002", customerEmail: "nimesh@example.com", customer: "Nimesh Pathak",
    date: "2026-09-03", dueDate: "2026-09-18", amount: 12000, paid: 4000, status: "Partial", soNumber: "S00002" },
  { id: "i3", number: "INV/2026/0003", customerEmail: "rahul@example.com", customer: "Rahul Sharma",
    date: "2026-09-04", dueDate: "2026-09-19", amount: 8000, paid: 0, status: "Not Paid", soNumber: "S00003" },
];

export let payments = [
  { id: "pm1", number: "PAY/2026/0001", kind: "receive", partnerEmail: "nimesh@example.com", partner: "Nimesh Pathak",
    date: "2026-09-02", amount: 25000, method: "Bank", against: "INV/2026/0001" },
  { id: "pm2", number: "PAY/2026/0002", kind: "receive", partnerEmail: "nimesh@example.com", partner: "Nimesh Pathak",
    date: "2026-09-06", amount: 4000, method: "Cash", against: "INV/2026/0002" },
  { id: "pm3", number: "PAY/2026/0003", kind: "send", partnerEmail: "azure@example.com", partner: "Azure Furniture",
    date: "2026-08-30", amount: 24000, method: "Bank", against: "BILL/2026/0001" },
];

// Double-entry records. Every entry must balance: sum(debit) === sum(credit).
export let journalEntries = [
  { id: "je1", date: "2026-08-26", number: "BILL/2026/0001", partner: "Azure Furniture",
    journal: "Purchase", status: "Posted",
    items: [
      { account: "Purchase Expense A/c", debit: 24000, credit: 0 },
      { account: "Creditors A/c",        debit: 0,     credit: 24000 },
    ] },
  { id: "je2", date: "2026-09-01", number: "INV/2026/0001", partner: "Nimesh Pathak",
    journal: "Sales", status: "Posted",
    items: [
      { account: "Debtors A/c",      debit: 25000, credit: 0 },
      { account: "Sales Income A/c", debit: 0,     credit: 25000 },
    ] },
  { id: "je3", date: "2026-09-02", number: "PAY/2026/0001", partner: "Nimesh Pathak",
    journal: "Bank", status: "Posted",
    items: [
      { account: "Bank A/c",    debit: 25000, credit: 0 },
      { account: "Debtors A/c", debit: 0,     credit: 25000 },
    ] },
];

// ============================================================
// HELPERS
// ============================================================

const newId = () => Math.random().toString(36).slice(2, 9);

export const entryTotal = (entry) =>
  entry.items.reduce((s, it) => s + Number(it.debit || 0), 0);

export const nextPoNumber = () =>
  "P" + String(purchaseOrders.length + 1).padStart(5, "0");

export const nextSoNumber = () =>
  "S" + String(salesOrders.length + 1).padStart(5, "0");

// ============================================================
// MASTER DATA MUTATIONS — each returns { ok, record } or { ok:false, message }
// ============================================================

export function addContact(data) {
  if (contacts.some((c) => c.name.trim().toLowerCase() === data.name.trim().toLowerCase()))
    return { ok: false, message: `A contact named "${data.name}" already exists.` };

  if (data.email && contacts.some((c) => c.email?.toLowerCase() === data.email.toLowerCase()))
    return { ok: false, message: `Email "${data.email}" is already used by another contact.` };

  const record = { ...data, id: newId() };
  contacts.push(record);
  return { ok: true, record };
}

export function addProduct(data) {
  if (products.some((p) => p.name.trim().toLowerCase() === data.name.trim().toLowerCase()))
    return { ok: false, message: `A product named "${data.name}" already exists.` };

  const record = { ...data, id: newId() };
  products.push(record);
  return { ok: true, record };
}

export function addAccount(data) {
  if (accounts.some((a) => a.name.trim().toLowerCase() === data.name.trim().toLowerCase()))
    return { ok: false, message: `An account named "${data.name}" already exists.` };

  const group = ["Income", "Expense", "Other Expense"].includes(data.type)
    ? "Profit & Loss"
    : "Balance Sheet";

  const record = { ...data, group, id: newId() };
  accounts.push(record);
  return { ok: true, record };
}

export function addJournal(data) {
  if (journals.some((j) => j.name.trim().toLowerCase() === data.name.trim().toLowerCase()))
    return { ok: false, message: `A journal named "${data.name}" already exists.` };

  const record = { ...data, id: newId() };
  journals.push(record);
  return { ok: true, record };
}

// ============================================================
// TRANSACTION MUTATIONS
// ============================================================

// Enforces the core accounting rule: debits must equal credits.
export function addJournalEntry(data) {
  const debit = data.items.reduce((s, i) => s + Number(i.debit || 0), 0);
  const credit = data.items.reduce((s, i) => s + Number(i.credit || 0), 0);

  if (debit === 0 && credit === 0)
    return { ok: false, message: "Enter at least one debit and one credit amount." };

  if (debit !== credit)
    return {
      ok: false,
      message: `Entry is not balanced. Debit ₹${debit.toLocaleString()} vs Credit ₹${credit.toLocaleString()}.`,
    };

  const record = { ...data, id: newId(), status: "Posted" };
  journalEntries.push(record);
  return { ok: true, record };
}

export function addPurchaseOrder(data) {
  if (purchaseOrders.some((p) => p.number === data.number))
    return { ok: false, message: `PO ${data.number} already exists.` };

  const record = { ...data, id: newId() };
  purchaseOrders.push(record);
  return { ok: true, record };
}

export function addSalesOrder(data) {
  if (salesOrders.some((s) => s.number === data.number))
    return { ok: false, message: `SO ${data.number} already exists.` };

  const record = { ...data, id: newId() };
  salesOrders.push(record);
  return { ok: true, record };
}

// ============================================================
// CONTACT PROVISIONING
// Gives a newly registered Contact user a master record plus starter
// transactions, so their portal dashboard isn't empty on first login.
// Must stay at the bottom — it depends on everything declared above.
// ============================================================

export function provisionContactData(user) {
  const email = user.email.toLowerCase();

  // Already provisioned — do nothing.
  if (contacts.some((c) => c.email?.toLowerCase() === email)) return;

  const isCustomer = user.contactType === "customer";

  contacts.push({
    id: newId(),
    name: user.name,
    type: isCustomer ? "customer" : "vendor",
    email: user.email,
    mobile: user.mobile || "",
    city: user.city || "",
    state: user.state || "",
    pincode: "",
  });

  // Dates relative to today, so the data always looks current.
  const today = new Date();
  const day = (offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };

  if (isCustomer) {
    const soNo1 = nextSoNumber();
    const invNo1 = "INV/2026/" + String(invoices.length + 1).padStart(4, "0");
    const invNo2 = "INV/2026/" + String(invoices.length + 2).padStart(4, "0");

    salesOrders.push({
      id: newId(), number: soNo1,
      customerEmail: user.email, customer: user.name,
      date: day(-12), status: "Invoiced",
      lines: [{ product: "Office Chair", qty: 4, unitPrice: 5000 }],
      total: 20000, invoiceNumber: invNo1,
    });

    const soNo2 = nextSoNumber();
    salesOrders.push({
      id: newId(), number: soNo2,
      customerEmail: user.email, customer: user.name,
      date: day(-4), status: "Invoiced",
      lines: [{ product: "Wooden Table", qty: 1, unitPrice: 12000 }],
      total: 12000, invoiceNumber: invNo2,
    });

    invoices.push({
      id: newId(), number: invNo1,
      customerEmail: user.email, customer: user.name,
      date: day(-11), dueDate: day(3),
      amount: 20000, paid: 20000, status: "Paid", soNumber: soNo1,
    });

    invoices.push({
      id: newId(), number: invNo2,
      customerEmail: user.email, customer: user.name,
      date: day(-3), dueDate: day(11),
      amount: 12000, paid: 5000, status: "Partial", soNumber: soNo2,
    });

    payments.push({
      id: newId(), number: "PAY/2026/" + String(payments.length + 1).padStart(4, "0"),
      kind: "receive", partnerEmail: user.email, partner: user.name,
      date: day(-10), amount: 20000, method: "Bank", against: invNo1,
    });

    payments.push({
      id: newId(), number: "PAY/2026/" + String(payments.length + 1).padStart(4, "0"),
      kind: "receive", partnerEmail: user.email, partner: user.name,
      date: day(-2), amount: 5000, method: "Cash", against: invNo2,
    });
  } else {
    const poNo1 = nextPoNumber();
    const billNo1 = "BILL/2026/" + String(bills.length + 1).padStart(4, "0");
    const billNo2 = "BILL/2026/" + String(bills.length + 2).padStart(4, "0");

    purchaseOrders.push({
      id: newId(), number: poNo1,
      vendorEmail: user.email, vendor: user.name,
      date: day(-14), status: "Billed",
      lines: [{ product: "Wooden Table", qty: 2, unitPrice: 8000 }],
      total: 16000, billNumber: billNo1,
    });

    const poNo2 = nextPoNumber();
    purchaseOrders.push({
      id: newId(), number: poNo2,
      vendorEmail: user.email, vendor: user.name,
      date: day(-3), status: "Confirmed",
      lines: [{ product: "Office Chair", qty: 6, unitPrice: 3200 }],
      total: 19200, billNumber: billNo2,
    });

    bills.push({
      id: newId(), number: billNo1,
      vendorEmail: user.email, vendor: user.name,
      date: day(-13), dueDate: day(1),
      amount: 16000, paid: 16000, status: "Paid", poNumber: poNo1,
    });

    bills.push({
      id: newId(), number: billNo2,
      vendorEmail: user.email, vendor: user.name,
      date: day(-2), dueDate: day(12),
      amount: 19200, paid: 0, status: "Not Paid", poNumber: poNo2,
    });

    payments.push({
      id: newId(), number: "PAY/2026/" + String(payments.length + 1).padStart(4, "0"),
      kind: "send", partnerEmail: user.email, partner: user.name,
      date: day(-12), amount: 16000, method: "Bank", against: billNo1,
    });
  }
}


export function placeCustomerOrder(user, cartLines) {
  if (!cartLines.length)
    return { ok: false, message: "Your cart is empty." };

  const today = new Date().toISOString().slice(0, 10);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);

  const lines = cartLines.map((l) => ({
    product: l.name,
    qty: Number(l.qty),
    unitPrice: Number(l.salesPrice),
  }));

  const total = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);

  const soNumber = nextSoNumber();
  const invNumber = "INV/2026/" + String(invoices.length + 1).padStart(4, "0");

  const order = {
    id: newId(),
    number: soNumber,
    customerEmail: user.email,
    customer: user.name,
    date: today,
    status: "Invoiced",
    lines,
    total,
    invoiceNumber: invNumber,
  };
  salesOrders.push(order);

  const invoice = {
    id: newId(),
    number: invNumber,
    customerEmail: user.email,
    customer: user.name,
    date: today,
    dueDate: dueDate.toISOString().slice(0, 10),
    amount: total,
    paid: 0,
    status: "Not Paid",
    soNumber,
  };
  invoices.push(invoice);

  // Double-entry: customer owes us (debit Debtors), we earned income (credit Sales).
  journalEntries.push({
    id: newId(),
    date: today,
    number: invNumber,
    partner: user.name,
    journal: "Sales",
    status: "Posted",
    items: [
      { account: "Debtors A/c",      debit: total, credit: 0 },
      { account: "Sales Income A/c", debit: 0,     credit: total },
    ],
  });

  return { ok: true, order, invoice };
}

// Records a payment against an invoice and posts the matching journal entry.
export function payInvoice(invoiceId, method = "Bank") {
  const inv = invoices.find((i) => i.id === invoiceId);
  if (!inv) return { ok: false, message: "Invoice not found." };

  const due = inv.amount - inv.paid;
  if (due <= 0) return { ok: false, message: "This invoice is already settled." };

  inv.paid = inv.amount;
  inv.status = "Paid";

  const today = new Date().toISOString().slice(0, 10);
  const payNumber = "PAY/2026/" + String(payments.length + 1).padStart(4, "0");

  payments.push({
    id: newId(),
    number: payNumber,
    kind: "receive",
    partnerEmail: inv.customerEmail,
    partner: inv.customer,
    date: today,
    amount: due,
    method,
    against: inv.number,
  });

  // Money in the bank (debit), customer no longer owes it (credit Debtors).
  journalEntries.push({
    id: newId(),
    date: today,
    number: payNumber,
    partner: inv.customer,
    journal: method,
    status: "Posted",
    items: [
      { account: `${method} A/c`, debit: due, credit: 0 },
      { account: "Debtors A/c",   debit: 0,   credit: due },
    ],
  });

  return { ok: true, invoice: inv };
}