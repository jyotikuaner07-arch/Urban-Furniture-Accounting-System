from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class BudgetCreate(BaseModel):
    name: str
    analytic_account_id: str
    period_start: datetime
    period_end: datetime
    planned_amount: float = Field(..., gt=0)
    responsible_person: Optional[str] = None


class BudgetUpdate(BaseModel):
    name: Optional[str] = None
    analytic_account_id: Optional[str] = None
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    planned_amount: Optional[float] = None
    responsible_person: Optional[str] = None
    is_archived: Optional[bool] = None


class BudgetOut(BaseModel):
    id: str
    name: str
    analytic_account_id: str
    analytic_account_name: Optional[str] = None
    period_start: datetime
    period_end: datetime
    planned_amount: float
    responsible_person: Optional[str] = None
    is_archived: bool = False