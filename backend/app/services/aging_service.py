from datetime import datetime, timezone
from typing import Optional

from app.database import customer_invoices_collection, vendor_bills_collection


BUCKETS = ["current", "1_30", "31_60", "61_90", "over_90"]


def _bucket_for(days_overdue: int) -> str:
    """Sorts an unpaid document into an ageing bucket by how late it is."""
    if days_overdue <= 0:
        return "current"
    if days_overdue <= 30:
        return "1_30"
    if days_overdue <= 60:
        return "31_60"
    if days_overdue <= 90:
        return "61_90"
    return "over_90"


async def aging_report(report_type: str = "receivable", as_of: Optional[datetime] = None) -> dict:
    """
    Receivable = money customers owe us (unpaid customer invoices).
    Payable    = money we owe vendors (unpaid vendor bills).

    Nothing new is stored - this reads existing documents and groups them
    by how overdue they are, which is what makes it cheap to build.
    """
    as_of = as_of or datetime.now(timezone.utc)

    if report_type == "payable":
        collection = vendor_bills_collection
        number_field, contact_field, date_field = "bill_number", "vendor_name", "bill_date"
        contact_id_field = "vendor_id"
    else:
        collection = customer_invoices_collection
        number_field, contact_field, date_field = "invoice_number", "customer_name", "invoice_date"
        contact_id_field = "customer_id"

    buckets = {b: {"count": 0, "amount": 0.0, "items": []} for b in BUCKETS}
    total_outstanding = 0.0

    query = {"status": {"$ne": "paid"}}

    async for doc in collection.find(query):
        amount_due = round(float(doc.get("amount_due", 0) or 0), 2)
        if amount_due <= 0:
            continue

        due_date = doc.get("due_date") or doc.get(date_field)
        if due_date and due_date.tzinfo is None:
            due_date = due_date.replace(tzinfo=timezone.utc)

        days_overdue = (as_of - due_date).days if due_date else 0
        bucket = _bucket_for(days_overdue)

        buckets[bucket]["count"] += 1
        buckets[bucket]["amount"] = round(buckets[bucket]["amount"] + amount_due, 2)
        buckets[bucket]["items"].append({
            "id": str(doc["_id"]),
            "number": doc.get(number_field),
            "contact_id": doc.get(contact_id_field),
            "contact_name": doc.get(contact_field),
            "due_date": due_date,
            "days_overdue": max(days_overdue, 0),
            "amount_due": amount_due,
            "status": doc.get("status"),
        })
        total_outstanding += amount_due

    return {
        "type": report_type,
        "as_of": as_of,
        "buckets": buckets,
        "total_outstanding": round(total_outstanding, 2),
        "total_overdue": round(
            sum(buckets[b]["amount"] for b in BUCKETS if b != "current"), 2
        ),
    }