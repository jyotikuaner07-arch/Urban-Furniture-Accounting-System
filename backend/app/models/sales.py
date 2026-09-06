from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


class SalesOrderStatus(str, Enum):
    draft = "draft"
    confirmed = "confirmed"
    invoiced = "invoiced"


class SalesOrderLine(BaseModel):
    product_id: str
    quantity: float
    unit_price: float
    tax_percent: float = 0.0


class SalesOrderLineOut(BaseModel):
    product_id: str
    product_name: Optional[str] = None
    quantity: float
    unit_price: float
    tax_percent: float
    line_subtotal: float
    line_tax: float
    line_total: float


class SalesOrderCreate(BaseModel):
    customer_id: str
    order_date: Optional[datetime] = None
    lines: List[SalesOrderLine] = Field(..., min_length=1)
    notes: Optional[str] = None


class SalesOrderOut(BaseModel):
    id: str
    so_number: str
    customer_id: str
    customer_name: Optional[str] = None
    order_date: datetime
    lines: List[SalesOrderLineOut]
    subtotal: float
    tax_total: float
    total_amount: float
    status: SalesOrderStatus
    invoice_id: Optional[str] = None
    notes: Optional[str] = None