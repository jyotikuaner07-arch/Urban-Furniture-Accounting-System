from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException

from app.database import (
    purchase_orders_collection,
    products_collection,
    customer_invoices_collection,
    vendor_bills_collection,
    payments_collection,
    contacts_collection,
)
from app.models.payment import PaymentCreate, PaymentOut
from app.auth.dependencies import get_current_user
from app.services import sales_service, purchase_service

router = APIRouter(prefix="/portal", tags=["Contact Portal"])


async def get_portal_contact(user: dict = Depends(get_current_user)) -> dict:
    """
    Resolves the logged-in user to the Contact record they're linked to.

    This is the security boundary for the whole portal: every query below
    filters on the contact_id resolved HERE, from the verified token -
    never from anything the client sends. A contact user cannot ask for
    someone else's data because they never get to name whose data it is.

    Staff (admin / invoicing_user) may also use the portal for support
    purposes only if they happen to be linked to a contact; otherwise
    the portal is not for them.
    """
    contact_id = user.get("contact_id")
    if not contact_id:
        raise HTTPException(
            status_code=403,
            detail="This account is not linked to a contact record",
        )

    try:
        oid = ObjectId(contact_id)
    except InvalidId:
        raise HTTPException(status_code=403, detail="Linked contact is invalid")

    contact = await contacts_collection.find_one({"_id": oid})
    if not contact:
        raise HTTPException(status_code=403, detail="Linked contact no longer exists")

    contact["id"] = str(contact["_id"])
    return contact


def _clean(doc) -> dict:
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    # The portal never exposes internal accounting references.
    doc.pop("journal_entry_id", None)
    return doc


@router.get("/me")
async def portal_me(contact: dict = Depends(get_portal_contact)):
    """Who the portal user is, and what they can see."""
    return {
        "contact_id": contact["id"],
        "name": contact["name"],
        "type": contact["type"],
        "email": contact.get("email"),
        "mobile": contact.get("mobile"),
        "can_view_invoices": contact["type"] in ("customer", "both"),
        "can_view_bills": contact["type"] in ("vendor", "both"),
    }


@router.get("/invoices")
async def my_invoices(status: str | None = None, contact: dict = Depends(get_portal_contact)):
    """Invoices issued TO this contact. Scoped by token, not by query param."""
    if contact["type"] not in ("customer", "both"):
        raise HTTPException(status_code=403, detail="This account is not a customer")

    query = {"customer_id": contact["id"]}
    if status:
        query["status"] = status

    return [
        _clean(d)
        async for d in customer_invoices_collection.find(query).sort("invoice_date", -1)
    ]


@router.get("/bills")
async def my_bills(status: str | None = None, contact: dict = Depends(get_portal_contact)):
    """Bills this contact has issued to us."""
    if contact["type"] not in ("vendor", "both"):
        raise HTTPException(status_code=403, detail="This account is not a vendor")

    query = {"vendor_id": contact["id"]}
    if status:
        query["status"] = status

    return [
        _clean(d)
        async for d in vendor_bills_collection.find(query).sort("bill_date", -1)
    ]


@router.get("/invoices/{invoice_id}")
async def my_invoice_detail(invoice_id: str, contact: dict = Depends(get_portal_contact)):
    try:
        oid = ObjectId(invoice_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Ownership is part of the query itself, so a wrong id and someone
    # else's id are indistinguishable to the caller - both are 404.
    doc = await customer_invoices_collection.find_one(
        {"_id": oid, "customer_id": contact["id"]}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return _clean(doc)


@router.post("/invoices/{invoice_id}/pay", response_model=PaymentOut)
async def pay_my_invoice(
    invoice_id: str,
    payment: PaymentCreate,
    contact: dict = Depends(get_portal_contact),
):
    """
    A contact paying their own invoice. Ownership is checked before the
    payment service runs, so all the existing rules (no overpayment,
    no paying a settled invoice, correct journal entry) still apply.
    """
    try:
        oid = ObjectId(invoice_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Invoice not found")

    doc = await customer_invoices_collection.find_one(
        {"_id": oid, "customer_id": contact["id"]}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Invoice not found")

    return await sales_service.pay_customer_invoice(invoice_id, payment.model_dump())


@router.get("/payments")
async def my_payments(contact: dict = Depends(get_portal_contact)):
    """Payment history for this contact, both directions."""
    return [
        _clean(d)
        async for d in payments_collection.find({"contact_id": contact["id"]}).sort(
            "payment_date", -1
        )
    ]


@router.get("/summary")
async def my_summary(contact: dict = Depends(get_portal_contact)):
    """Headline numbers for the portal landing screen."""
    is_customer = contact["type"] in ("customer", "both")
    is_vendor = contact["type"] in ("vendor", "both")

    owed_by_me = 0.0
    invoice_count = 0
    overdue_count = 0
    now = datetime.now(timezone.utc)

    if is_customer:
        async for d in customer_invoices_collection.find(
            {"customer_id": contact["id"], "status": {"$ne": "paid"}}
        ):
            owed_by_me += float(d.get("amount_due", 0) or 0)
            invoice_count += 1
            due = d.get("due_date")
            if due:
                if due.tzinfo is None:
                    due = due.replace(tzinfo=timezone.utc)
                if due < now:
                    overdue_count += 1

    owed_to_me = 0.0
    bill_count = 0
    if is_vendor:
        async for d in vendor_bills_collection.find(
            {"vendor_id": contact["id"], "status": {"$ne": "paid"}}
        ):
            owed_to_me += float(d.get("amount_due", 0) or 0)
            bill_count += 1

    return {
        "contact_name": contact["name"],
        "contact_type": contact["type"],
        "amount_i_owe": round(owed_by_me, 2),
        "open_invoices": invoice_count,
        "overdue_invoices": overdue_count,
        "amount_owed_to_me": round(owed_to_me, 2),
        "open_bills": bill_count,
    }

@router.get("/purchase-orders")
async def my_purchase_orders(contact: dict = Depends(get_portal_contact)):
    """Purchase orders raised TO this vendor. Read-only."""
    if contact["type"] not in ("vendor", "both"):
        raise HTTPException(status_code=403, detail="This account is not a vendor")

    return [
        _clean(d)
        async for d in purchase_orders_collection.find(
            {"vendor_id": contact["id"]}
        ).sort("order_date", -1)
    ]


@router.get("/products")
async def catalogue(category: str | None = None, contact: dict = Depends(get_portal_contact)):
    """
    Product catalogue for customers to browse. Sales price only -
    cost price is internal margin data and is never exposed here.
    """
    if contact["type"] not in ("customer", "both"):
        raise HTTPException(status_code=403, detail="This account is not a customer")

    query = {"is_archived": {"$ne": True}}
    if category:
        query["category"] = category

    return [
        {
            "id": str(d["_id"]),
            "name": d["name"],
            "type": d["type"],
            "category": d.get("category"),
            "sales_price": d["sales_price"],
        }
        async for d in products_collection.find(query)
    ]