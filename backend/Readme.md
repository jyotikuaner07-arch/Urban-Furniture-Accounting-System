# Urban Furniture — Accounting System (Backend)

A double-entry accounting system for a furniture business, modelled on Odoo's accounting structure. Built with FastAPI and MongoDB.

## What it does

Every business action — recording a bill, issuing an invoice, taking a payment — automatically produces a balanced double-entry journal entry underneath. The user never types a debit or a credit.

Financial reports are **computed live** from those journal entries rather than stored, so they can never drift out of sync with the underlying transactions.

```
Master Data  →  Transactions  →  Journal Entries  →  Reports
(contacts,      (PO → Bill,       (double-entry,     (Balance Sheet,
 products,       SO → Invoice,     always balanced)   P&L, Budget,
 accounts,       Payments)                            Aging)
 journals)
```

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | FastAPI | Async, auto-generated OpenAPI docs, Pydantic validation built in |
| Driver | Motor 3.5.1 | Async MongoDB driver — a sync driver would block the event loop |
| Database | MongoDB | Insert-heavy, aggregation-heavy access pattern fits well |
| Validation | Pydantic v2 | Request/response schemas double as documentation |

## Setup

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # fill in MONGO_URI, DB_NAME, JWT_SECRET
uvicorn app.main:app --reload
```

Interactive API docs: **http://localhost:8000/docs**

## Architecture

Three layers, with a strict rule about what goes where:

```
app/
├── main.py                  # app entrypoint, mounts routers
├── config.py                # typed settings from .env
├── database.py              # Mongo connection + every collection in one place
├── models/                  # Pydantic schemas — data shape and validation only
├── routes/                  # HTTP layer — thin: parse, call a service, return
└── services/                # ALL business logic
    ├── journal_engine.py    # the double-entry engine (see below)
    ├── shared_txn.py        # contact/product/line validation shared by both flows
    ├── accounting_defaults.py
    ├── purchase_service.py  # PO → Bill → Payment
    ├── sales_service.py     # SO → Invoice → Payment
    ├── report_service.py    # Balance Sheet, P&L, Budget Report
    ├── aging_service.py     # receivables/payables ageing
    └── dashboard_service.py # aggregation pipelines for charts
```

**The rule:** if a route function exceeds ~15 lines, business logic has leaked in and belongs in a service. This means a change request maps directly to a layer — a new field is a model change, a new filter is a route change, a new rule is a service change.

## The journal engine

`services/journal_engine.py` is **the only code permitted to write to the ledger**. Every transaction path calls it.

It enforces:
- At least two lines per entry (money comes from somewhere, goes somewhere)
- Every referenced account exists
- No negative amounts; no line with both a debit and a credit; no empty lines
- **Total debits must equal total credits** — otherwise the entry is rejected with a 400

Because there is no alternative write path, the ledger cannot become unbalanced. The guarantee is structural, not a convention.

Journal entries are **immutable** — no PUT, no DELETE. Corrections are made by posting a reversing entry, preserving the audit trail.

### Example: what an invoice produces

A ₹25,000 sale with 18% tax generates one three-line entry:

```
Debit   Debtors        29,500     (customer owes the full amount)
Credit  Sales Income   25,000     (actual revenue)
Credit  Tax Payable     4,500     (owed to the government)
```

Debits 29,500 = Credits 29,500. Balanced.

## API overview

Base URL `http://localhost:8000`. No `/api` prefix.

| Area | Endpoints |
|---|---|
| Master data | `/contacts`, `/products`, `/accounts`, `/journals`, `/analytic-accounts`, `/budgets` |
| Ledger | `/journal-entries` (create manual, list with date filters) |
| Purchases | `/purchase-orders`, `/purchase-orders/{id}/convert-to-bill`, `/vendor-bills`, `/vendor-bills/{id}/pay` |
| Sales | `/sales-orders`, `/sales-orders/{id}/generate-invoice`, `/customer-invoices`, `/customer-invoices/{id}/pay` |
| Reports | `/reports/balance-sheet`, `/reports/profit-and-loss`, `/reports/budget-report`, `/reports/aging` |
| Dashboard | `/dashboard/summary`, `/dashboard/expense-breakdown`, `/dashboard/top-products`, `/dashboard/cash-flow` |

## Required master data

The transaction flows look up accounts **by name**, so these must exist before recording anything:

| Code | Name | Type |
|---|---|---|
| 1000 | Cash | asset |
| 1010 | Bank | asset |
| 1100 | Debtors | asset |
| 2000 | Creditors | liability |
| 2100 | Tax Payable | liability |
| 3000 | Owner's Capital | capital |
| 4000 | Sales Income | income |
| 5000 | Purchase Expense | expense |

Plus one journal of each type: `sales`, `purchase`, `bank`, `cash`.

## Design decisions

- **Soft delete everywhere.** Contacts and accounts archive rather than delete, because historical transactions reference them.
- **Server-side money math.** Line totals are computed on the server, never accepted from the client.
- **Denormalised account names** on ledger lines, so reports don't need a lookup per line. Historical entries keep the name the account had at the time — which is arguably correct for an audit record.
- **Entry before document.** `create_vendor_bill` writes the journal entry first; if the engine rejects it, no bill is created, avoiding orphan documents.
- **Status is derived, never client-set.** `unpaid`/`partially_paid`/`paid` follows from `amount_paid` vs `total_amount`.

## Known limitations

- **No multi-document transactions.** A crash between writing a journal entry and inserting its bill would leave an orphan entry. MongoDB supports transactions on replica sets; that's the correct fix.
- **Floats for currency.** Every amount is rounded to two decimals before summing to contain drift, but `Decimal` is the right type for money.
- **Duplicate-name checks have a race condition.** Two simultaneous requests could both pass. A unique index at the database layer is the real guarantee; the application check exists for the clear error message.
- **Document numbering** (`PO-0001`) uses a document count, which can collide under concurrent writes. A dedicated counters collection with an atomic `$inc` would fix it.

## Not yet built

- Authentication (`/auth/login`, JWT, role-based access for Admin / Invoicing User / Contact)
- Invoice/bill PDF generation