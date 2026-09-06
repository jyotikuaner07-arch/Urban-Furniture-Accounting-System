from enum import Enum
from typing import Optional
from pydantic import BaseModel


class AccountType(str, Enum):
    asset = "asset"
    liability = "liability"
    income = "income"
    expense = "expense"
    capital = "capital"


class AccountCreate(BaseModel):
    account_name: str
    account_type: AccountType
    code: Optional[str] = None


class AccountUpdate(BaseModel):
    account_name: Optional[str] = None
    account_type: Optional[AccountType] = None
    code: Optional[str] = None
    is_archived: Optional[bool] = None


class AccountOut(BaseModel):
    id: str
    account_name: str
    account_type: AccountType
    code: Optional[str] = None
    is_archived: bool = False