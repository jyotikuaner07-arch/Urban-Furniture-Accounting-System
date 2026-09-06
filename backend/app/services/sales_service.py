from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException

from app.database import (
    sales_orders_collection,
    customer_invoices_collection,
    payments_collection,
)
from app.services.journal_engine import create_journal_entry
from app.services.accounting_defaults import (
    get_account_by_name,
    get_journal_by_type,
    next_document_number,
)
from app.services.shared_txn import to_oid, validate_contact, build_lines


async def create_sales_order(data: dict) -> dict:
    customer = await validate_contact(data["customer_id"], "customer")
    lines, subtotal, tax_total = await build_lines(data["lines"], with_tax=True)

    doc = {
        "so_number": await next_document_number(sales_orders_collection, "SO"),
        "customer_id": str(customer["_id"]),
        "customer_name": customer["name"],
        "order_date": data.get("order_date") or datetime.now(timezone.utc),
        "lines": lines,
        "subtotal": subtotal,
        "tax_total": tax_total,
        "total_amount": round(subtotal + tax_total, 2),
        "status": "confirmed",
        "invoice_id": None,
        "notes": data.get("notes"),
        "created_at": datetime.now(timezone.utc),
    }

    result = await sales_orders_collection.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


async def create_customer_invoice(data: dict, so_id: Optional[str] = None) -> dict:
    customer = await validate_contact(data["customer_id"], "customer")
    lines, subtotal, tax_total = await build_lines(data["lines"], with_tax=True)
    total = round(subtotal + tax_total, 2)

    debtors = await get_account_by_name("Debtors")
    sales_income = await get_account_by_name("Sales Income")
    journal = await get_journal_by_type("sales")

    entry_lines = [
        {"account_id": str(debtors["_id"]), "debit": total, "credit": 0},
        {"account_id": str(sales_income["_id"]), "debit": 0, "credit": subtotal},
    ]

    if tax_total > 0:
        tax_payable = await get_account_by_name("Tax Payable")
        entry_lines.append(
            {"account_id": str(tax_payable["_id"]), "debit": 0, "credit": tax_total}
        )

    invoice_number = await next_document_number(customer_invoices_collection, "INV")
    invoice_date = data.get("invoice_date") or datetime.now(timezone.utc)

    entry = await create_journal_entry(
        journal_id=str(journal["_id"]),
        date=invoice_date,
        reference=invoice_number,
        source_type="customer_invoice",
        lines=entry_lines,
    )

    doc = {
        "invoice_number": invoice_number,
        "customer_id": str(customer["_id"]),
        "customer_name": customer["name"],
        "so_id": so_id,
        "invoice_date": invoice_date,
        "due_date": data.get("due_date"),
        "lines": lines,
        "subtotal": subtotal,
        "tax_total": tax_total,
        "total_amount": total,
        "amount_paid": 0.0,
        "amount_due": total,
        "status": "unpaid",
        "journal_entry_id": entry["id"],
        "notes": data.get("notes"),
        "created_at": datetime.now(timezone.utc),
    }

    result = await customer_invoices_collection.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


async def convert_so_to_invoice(so_id: str, due_date=None) -> dict:
    so_oid = to_oid(so_id, "so_id")
    so = await sales_orders_collection.find_one({"_id": so_oid})
    if not so:
        raise HTTPException(status_code=404, detail="Sales order not found")

    if so["status"] == "invoiced":
        raise HTTPException(
            status_code=400,
            detail=f"Sales order {so['so_number']} has already been invoiced",
        )

    invoice = await create_customer_invoice(
        {
            "customer_id": so["customer_id"],
            "invoice_date": datetime.now(timezone.utc),
            "due_date": due_date,
            "lines": [
                {
                    "product_id": l["product_id"],
                    "quantity": l["quantity"],
                    "unit_price": l["unit_price"],
                    "tax_percent": l.get("tax_percent", 0),
                }
                for l in so["lines"]
            ],
            "notes": f"Generated from {so['so_number']}",
        },
        so_id=so_id,
    )

    await sales_orders_collection.update_one(
        {"_id": so_oid},
        {"$set": {"status": "invoiced", "invoice_id": invoice["id"]}},
    )
    return invoice


async def pay_customer_invoice(invoice_id: str, data: dict) -> dict:
    inv_oid = to_oid(invoice_id, "invoice_id")
    invoice = await customer_invoices_collection.find_one({"_id": inv_oid})
    if not invoice:
        raise HTTPException(status_code=404, detail="Customer invoice not found")

    amount = round(float(data["amount"]), 2)
    amount_due = round(invoice["total_amount"] - invoice["amount_paid"], 2)

    if amount_due <= 0:
        raise HTTPException(
            status_code=400, detail=f"Invoice {invoice['invoice_number']} is already fully paid"
        )
    if amount > amount_due:
        raise HTTPException(
            status_code=400,
            detail=f"Payment of {amount} exceeds the outstanding amount of {amount_due}",
        )

    method = data["method"]
    money_account = await get_account_by_name("Bank" if method == "bank" else "Cash")
    debtors = await get_account_by_name("Debtors")
    journal = await get_journal_by_type(method)

    payment_number = await next_document_number(payments_collection, "PAY")
    payment_date = data.get("payment_date") or datetime.now(timezone.utc)

    entry = await create_journal_entry(
        journal_id=str(journal["_id"]),
        date=payment_date,
        reference=payment_number,
        source_type="payment",
        source_id=invoice_id,
        lines=[
            {"account_id": str(money_account["_id"]), "debit": amount, "credit": 0},
            {"account_id": str(debtors["_id"]), "debit": 0, "credit": amount},
        ],
    )

    new_paid = round(invoice["amount_paid"] + amount, 2)
    new_due = round(invoice["total_amount"] - new_paid, 2)
    new_status = "paid" if new_due <= 0 else "partially_paid"

    await customer_invoices_collection.update_one(
        {"_id": inv_oid},
        {"$set": {"amount_paid": new_paid, "amount_due": new_due, "status": new_status}},
    )

    doc = {
        "payment_number": payment_number,
        "type": "customer_payment",
        "contact_id": invoice["customer_id"],
        "contact_name": invoice.get("customer_name"),
        "against_id": invoice_id,
        "against_number": invoice["invoice_number"],
        "amount": amount,
        "method": method,
        "payment_date": payment_date,
        "journal_entry_id": entry["id"],
        "notes": data.get("notes"),
        "created_at": datetime.now(timezone.utc),
    }

    result = await payments_collection.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc