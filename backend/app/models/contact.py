from enum import Enum
from typing import Optional
from pydantic import BaseModel


class ContactType(str, Enum):
    customer = "customer"
    vendor = "vendor"
    both = "both"


class Address(BaseModel):
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


class ContactCreate(BaseModel):
    name: str
    type: ContactType
    email: Optional[str] = None
    mobile: Optional[str] = None
    address: Optional[Address] = None
    profile_image_url: Optional[str] = None


class ContactUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[ContactType] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    address: Optional[Address] = None
    profile_image_url: Optional[str] = None
    is_archived: Optional[bool] = None


class ContactOut(BaseModel):
    id: str
    name: str
    type: ContactType
    email: Optional[str] = None
    mobile: Optional[str] = None
    address: Optional[Address] = None
    profile_image_url: Optional[str] = None
    is_archived: bool = False