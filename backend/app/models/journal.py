from enum import Enum
from typing import Optional
from pydantic import BaseModel


class JournalType(str, Enum):
    sales = "sales"
    purchase = "purchase"
    bank = "bank"
    cash = "cash"


class JournalCreate(BaseModel):
    name: str
    type: JournalType
    default_debit_account_id: Optional[str] = None
    default_credit_account_id: Optional[str] = None


class JournalUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[JournalType] = None
    default_debit_account_id: Optional[str] = None
    default_credit_account_id: Optional[str] = None
    is_archived: Optional[bool] = None


class JournalOut(BaseModel):
    id: str
    name: str
    type: JournalType
    default_debit_account_id: Optional[str] = None
    default_credit_account_id: Optional[str] = None
    is_archived: bool = False