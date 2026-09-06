from datetime import datetime
from fastapi import APIRouter, HTTPException, Body
from bson import ObjectId
from bson.errors import InvalidId

from app.database import purchase_orders_collection, vendor_bills_collection, payments_collection
from app.models.purchase import PurchaseOrderCreate, PurchaseOrderOut
from app.models.vendor_bill import VendorBillCreate, VendorBillOut
from app.models.payment import PaymentCreate, PaymentOut
from app.services import purchase_service

router = APIRouter(tags=["Purchases"])


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


@router.post("/purchase-orders", response_model=PurchaseOrderOut)
async def create_purchase_order(po: PurchaseOrderCreate):
    return await purchase_service.create_purchase_order(po.model_dump())


@router.get("/purchase-orders", response_model=list[PurchaseOrderOut])
async def list_purchase_orders(vendor_id: str | None = None, status: str | None = None):
    query = {}
    if vendor_id:
        query["vendor_id"] = vendor_id
    if status:
        query["status"] = status
    return [_with_id(d) async for d in purchase_orders_collection.find(query).sort("created_at", -1)]


@router.get("/purchase-orders/{po_id}", response_model=PurchaseOrderOut)
async def get_purchase_order(po_id: str):
    return await _get_or_404(purchase_orders_collection, po_id, "Purchase order")


@router.post("/purchase-orders/{po_id}/convert-to-bill", response_model=VendorBillOut)
async def convert_to_bill(po_id: str, due_date: datetime | None = Body(None, embed=True)):
    return await purchase_service.convert_po_to_bill(po_id, due_date)


@router.post("/vendor-bills", response_model=VendorBillOut)
async def create_vendor_bill(bill: VendorBillCreate):
    return await purchase_service.create_vendor_bill(bill.model_dump())


@router.get("/vendor-bills", response_model=list[VendorBillOut])
async def list_vendor_bills(vendor_id: str | None = None, status: str | None = None):
    query = {}
    if vendor_id:
        query["vendor_id"] = vendor_id
    if status:
        query["status"] = status
    return [_with_id(d) async for d in vendor_bills_collection.find(query).sort("created_at", -1)]


@router.get("/vendor-bills/{bill_id}", response_model=VendorBillOut)
async def get_vendor_bill(bill_id: str):
    return await _get_or_404(vendor_bills_collection, bill_id, "Vendor bill")


@router.post("/vendor-bills/{bill_id}/pay", response_model=PaymentOut)
async def pay_vendor_bill(bill_id: str, payment: PaymentCreate):
    return await purchase_service.pay_vendor_bill(bill_id, payment.model_dump())


@router.get("/payments", response_model=list[PaymentOut], tags=["Payments"])
async def list_payments(type: str | None = None, method: str | None = None):
    query = {}
    if type:
        query["type"] = type
    if method:
        query["method"] = method
    return [_with_id(d) async for d in payments_collection.find(query).sort("created_at", -1)]