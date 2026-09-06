from enum import Enum
from typing import Optional
from pydantic import BaseModel


class ProductType(str, Enum):
    goods = "goods"
    service = "service"
    combo = "combo"


class ProductCreate(BaseModel):
    name: str
    type: ProductType
    sales_price: float
    cost_price: float
    category: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[ProductType] = None
    sales_price: Optional[float] = None
    cost_price: Optional[float] = None
    category: Optional[str] = None
    is_archived: Optional[bool] = None


class ProductOut(BaseModel):
    id: str
    name: str
    type: ProductType
    sales_price: float
    cost_price: float
    category: Optional[str] = None
    is_archived: bool = False