from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class PaymentType(str, Enum):
    customer_payment = "customer_payment"
    vendor_payment = "vendor_payment"


class PaymentMethod(str, Enum):
    cash = "cash"
    bank = "bank"


class PaymentCreate(BaseModel):
    amount: float = Field(..., gt=0)
    method: PaymentMethod
    payment_date: Optional[datetime] = None
    notes: Optional[str] = None


class PaymentOut(BaseModel):
    id: str
    payment_number: str
    type: PaymentType
    contact_id: str
    contact_name: Optional[str] = None
    against_id: str
    against_number: Optional[str] = None
    amount: float
    method: PaymentMethod
    payment_date: datetime
    journal_entry_id: Optional[str] = None
    notes: Optional[str] = None