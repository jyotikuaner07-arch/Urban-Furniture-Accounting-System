from datetime import datetime
from fastapi import APIRouter, HTTPException, Body
from bson import ObjectId
from bson.errors import InvalidId

from app.database import sales_orders_collection, customer_invoices_collection
from app.models.sales import SalesOrderCreate, SalesOrderOut
from app.models.customer_invoice import CustomerInvoiceCreate, CustomerInvoiceOut
from app.models.payment import PaymentCreate, PaymentOut
from app.services import sales_service

router = APIRouter(tags=["Sales"])


def _with_id(doc) -> dict:
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc


async def _get_or_404(collection, doc_id: str, label: str) -> dict:
    try:
        oid = ObjectId(doc_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail=f"{label} not found")
    doc = await collection.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail=f"{label} not found")
    return _with_id(doc)


@router.post("/sales-orders", response_model=SalesOrderOut)
async def create_sales_order(so: SalesOrderCreate):
    return await sales_service.create_sales_order(so.model_dump())


@router.get("/sales-orders", response_model=list[SalesOrderOut])
async def list_sales_orders(customer_id: str | None = None, status: str | None = None):
    query = {}
    if customer_id:
        query["customer_id"] = customer_id
    if status:
        query["status"] = status
    return [_with_id(d) async for d in sales_orders_collection.find(query).sort("created_at", -1)]


@router.get("/sales-orders/{so_id}", response_model=SalesOrderOut)
async def get_sales_order(so_id: str):
    return await _get_or_404(sales_orders_collection, so_id, "Sales order")


@router.post("/sales-orders/{so_id}/generate-invoice", response_model=CustomerInvoiceOut)
async def generate_invoice(so_id: str, due_date: datetime | None = Body(None, embed=True)):
    return await sales_service.convert_so_to_invoice(so_id, due_date)


@router.post("/customer-invoices", response_model=CustomerInvoiceOut)
async def create_customer_invoice(invoice: CustomerInvoiceCreate):
    return await sales_service.create_customer_invoice(invoice.model_dump())


@router.get("/customer-invoices", response_model=list[CustomerInvoiceOut])
async def list_customer_invoices(customer_id: str | None = None, status: str | None = None):
    query = {}
    if customer_id:
        query["customer_id"] = customer_id
    if status:
        query["status"] = status
    return [_with_id(d) async for d in customer_invoices_collection.find(query).sort("created_at", -1)]


@router.get("/customer-invoices/{invoice_id}", response_model=CustomerInvoiceOut)
async def get_customer_invoice(invoice_id: str):
    return await _get_or_404(customer_invoices_collection, invoice_id, "Customer invoice")


@router.post("/customer-invoices/{invoice_id}/pay", response_model=PaymentOut)
async def pay_customer_invoice(invoice_id: str, payment: PaymentCreate):
    return await sales_service.pay_customer_invoice(invoice_id, payment.model_dump())