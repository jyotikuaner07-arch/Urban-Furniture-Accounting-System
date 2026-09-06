from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


class PaymentStatus(str, Enum):
    unpaid = "unpaid"
    partially_paid = "partially_paid"
    paid = "paid"


class BillLine(BaseModel):
    product_id: str
    quantity: float
    unit_price: float


class BillLineOut(BaseModel):
    product_id: str
    product_name: Optional[str] = None
    quantity: float
    unit_price: float
    line_total: float


class VendorBillCreate(BaseModel):
    vendor_id: str
    po_id: Optional[str] = None
    bill_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    lines: List[BillLine] = Field(..., min_length=1)
    notes: Optional[str] = None


class VendorBillOut(BaseModel):
    id: str
    bill_number: str
    vendor_id: str
    vendor_name: Optional[str] = None
    po_id: Optional[str] = None
    bill_date: datetime
    due_date: Optional[datetime] = None
    lines: List[BillLineOut]
    total_amount: float
    amount_paid: float
    amount_due: float
    status: PaymentStatus
    journal_entry_id: Optional[str] = None
    notes: Optional[str] = None