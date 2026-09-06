from enum import Enum
from typing import Optional
from pydantic import BaseModel


class AnalyticType(str, Enum):
    income = "income"
    expenses = "expenses"


class AnalyticAccountCreate(BaseModel):
    name: str
    type: AnalyticType
    description: Optional[str] = None


class AnalyticAccountUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[AnalyticType] = None
    description: Optional[str] = None
    is_archived: Optional[bool] = None


class AnalyticAccountOut(BaseModel):
    id: str
    name: str
    type: AnalyticType
    description: Optional[str] = None
    is_archived: bool = False