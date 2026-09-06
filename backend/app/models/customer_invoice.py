from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

from app.models.vendor_bill import PaymentStatus


class InvoiceLine(BaseModel):
    product_id: str
    quantity: float
    unit_price: float
    tax_percent: float = 0.0


class InvoiceLineOut(BaseModel):
    product_id: str
    product_name: Optional[str] = None
    quantity: float
    unit_price: float
    tax_percent: float
    line_subtotal: float
    line_tax: float
    line_total: float


class CustomerInvoiceCreate(BaseModel):
    customer_id: str
    so_id: Optional[str] = None
    invoice_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    lines: List[InvoiceLine] = Field(..., min_length=1)
    notes: Optional[str] = None


class CustomerInvoiceOut(BaseModel):
    id: str
    invoice_number: str
    customer_id: str
    customer_name: Optional[str] = None
    so_id: Optional[str] = None
    invoice_date: datetime
    due_date: Optional[datetime] = None
    lines: List[InvoiceLineOut]
    subtotal: float
    tax_total: float
    total_amount: float
    amount_paid: float
    amount_due: float
    status: PaymentStatus
    journal_entry_id: Optional[str] = None
    notes: Optional[str] = None