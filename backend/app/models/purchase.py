from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


class PurchaseOrderStatus(str, Enum):
    draft = "draft"
    confirmed = "confirmed"
    billed = "billed"


class PurchaseOrderLine(BaseModel):
    product_id: str
    quantity: float
    unit_price: float


class PurchaseOrderLineOut(BaseModel):
    product_id: str
    product_name: Optional[str] = None
    quantity: float
    unit_price: float
    line_total: float


class PurchaseOrderCreate(BaseModel):
    vendor_id: str
    order_date: Optional[datetime] = None
    lines: List[PurchaseOrderLine] = Field(..., min_length=1)
    notes: Optional[str] = None


class PurchaseOrderOut(BaseModel):
    id: str
    po_number: str
    vendor_id: str
    vendor_name: Optional[str] = None
    order_date: datetime
    lines: List[PurchaseOrderLineOut]
    total_amount: float
    status: PurchaseOrderStatus
    bill_id: Optional[str] = None
    notes: Optional[str] = None