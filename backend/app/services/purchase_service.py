from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException

from app.database import (
    purchase_orders_collection,
    vendor_bills_collection,
    payments_collection,
)
from app.services.journal_engine import create_journal_entry
from app.services.accounting_defaults import (
    get_account_by_name,
    get_journal_by_type,
    next_document_number,
)
from app.services.shared_txn import to_oid, validate_contact, build_lines


async def create_purchase_order(data: dict) -> dict:
    vendor = await validate_contact(data["vendor_id"], "vendor")
    lines, subtotal, _ = await build_lines(data["lines"], with_tax=False)

    doc = {
        "po_number": await next_document_number(purchase_orders_collection, "PO"),
        "vendor_id": str(vendor["_id"]),
        "vendor_name": vendor["name"],
        "order_date": data.get("order_date") or datetime.now(timezone.utc),
        "lines": lines,
        "total_amount": subtotal,
        "status": "confirmed",
        "bill_id": None,
        "notes": data.get("notes"),
        "created_at": datetime.now(timezone.utc),
    }

    result = await purchase_orders_collection.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


async def create_vendor_bill(data: dict, po_id: Optional[str] = None) -> dict:
    vendor = await validate_contact(data["vendor_id"], "vendor")
    lines, subtotal, _ = await build_lines(data["lines"], with_tax=False)

    purchase_expense = await get_account_by_name("Purchase Expense")
    creditors = await get_account_by_name("Creditors")
    journal = await get_journal_by_type("purchase")

    bill_number = await next_document_number(vendor_bills_collection, "BILL")
    bill_date = data.get("bill_date") or datetime.now(timezone.utc)

    entry = await create_journal_entry(
        journal_id=str(journal["_id"]),
        date=bill_date,
        reference=bill_number,
        source_type="vendor_bill",
        lines=[
            {"account_id": str(purchase_expense["_id"]), "debit": subtotal, "credit": 0},
            {"account_id": str(creditors["_id"]), "debit": 0, "credit": subtotal},
        ],
    )

    doc = {
        "bill_number": bill_number,
        "vendor_id": str(vendor["_id"]),
        "vendor_name": vendor["name"],
        "po_id": po_id,
        "bill_date": bill_date,
        "due_date": data.get("due_date"),
        "lines": lines,
        "total_amount": subtotal,
        "amount_paid": 0.0,
        "amount_due": subtotal,
        "status": "unpaid",
        "journal_entry_id": entry["id"],
        "notes": data.get("notes"),
        "created_at": datetime.now(timezone.utc),
    }

    result = await vendor_bills_collection.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


async def convert_po_to_bill(po_id: str, due_date=None) -> dict:
    po_oid = to_oid(po_id, "po_id")
    po = await purchase_orders_collection.find_one({"_id": po_oid})
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    if po["status"] == "billed":
        raise HTTPException(
            status_code=400,
            detail=f"Purchase order {po['po_number']} has already been billed",
        )

    bill = await create_vendor_bill(
        {
            "vendor_id": po["vendor_id"],
            "bill_date": datetime.now(timezone.utc),
            "due_date": due_date,
            "lines": [
                {"product_id": l["product_id"], "quantity": l["quantity"], "unit_price": l["unit_price"]}
                for l in po["lines"]
            ],
            "notes": f"Generated from {po['po_number']}",
        },
        po_id=po_id,
    )

    await purchase_orders_collection.update_one(
        {"_id": po_oid},
        {"$set": {"status": "billed", "bill_id": bill["id"]}},
    )
    return bill


async def pay_vendor_bill(bill_id: str, data: dict) -> dict:
    bill_oid = to_oid(bill_id, "bill_id")
    bill = await vendor_bills_collection.find_one({"_id": bill_oid})
    if not bill:
        raise HTTPException(status_code=404, detail="Vendor bill not found")

    amount = round(float(data["amount"]), 2)
    amount_due = round(bill["total_amount"] - bill["amount_paid"], 2)

    if amount_due <= 0:
        raise HTTPException(status_code=400, detail=f"Bill {bill['bill_number']} is already fully paid")
    if amount > amount_due:
        raise HTTPException(
            status_code=400,
            detail=f"Payment of {amount} exceeds the outstanding amount of {amount_due}",
        )

    method = data["method"]
    money_account = await get_account_by_name("Bank" if method == "bank" else "Cash")
    creditors = await get_account_by_name("Creditors")
    journal = await get_journal_by_type(method)

    payment_number = await next_document_number(payments_collection, "PAY")
    payment_date = data.get("payment_date") or datetime.now(timezone.utc)

    entry = await create_journal_entry(
        journal_id=str(journal["_id"]),
        date=payment_date,
        reference=payment_number,
        source_type="payment",
        source_id=bill_id,
        lines=[
            {"account_id": str(creditors["_id"]), "debit": amount, "credit": 0},
            {"account_id": str(money_account["_id"]), "debit": 0, "credit": amount},
        ],
    )

    new_paid = round(bill["amount_paid"] + amount, 2)
    new_due = round(bill["total_amount"] - new_paid, 2)
    new_status = "paid" if new_due <= 0 else "partially_paid"

    await vendor_bills_collection.update_one(
        {"_id": bill_oid},
        {"$set": {"amount_paid": new_paid, "amount_due": new_due, "status": new_status}},
    )

    doc = {
        "payment_number": payment_number,
        "type": "vendor_payment",
        "contact_id": bill["vendor_id"],
        "contact_name": bill.get("vendor_name"),
        "against_id": bill_id,
        "against_number": bill["bill_number"],
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