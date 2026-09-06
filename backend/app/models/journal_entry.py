from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


class SourceType(str, Enum):
    manual = "manual"
    vendor_bill = "vendor_bill"
    customer_invoice = "customer_invoice"
    payment = "payment"


class JournalEntryLine(BaseModel):
    account_id: str
    debit: float = 0.0
    credit: float = 0.0
    description: Optional[str] = None


class JournalEntryCreate(BaseModel):
    journal_id: str
    date: datetime
    reference: Optional[str] = None
    lines: List[JournalEntryLine] = Field(..., min_length=2)
    analytic_account_id: Optional[str] = None


class JournalEntryLineOut(BaseModel):
    account_id: str
    account_name: Optional[str] = None
    debit: float
    credit: float
    descripton: Optional[str] = None


class JournalEntryOut(BaseModel):
    id: str
    journal_id: str
    journal_name: Optional[str] = None
    date: datetime
    reference: Optional[str] = None
    source_type: SourceType
    source_id: Optional[str] = None
    analytic_account_id: Optional[str] = None
    lines: List[JournalEntryLineOut]
    total_debit: float
    total_credit: float