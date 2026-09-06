from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class UserRole(str, Enum):
    admin = "admin"
    invoicing_user = "invoicing_user"
    contact = "contact"


class UserRegister(BaseModel):
    name: str
    email: str
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.invoicing_user
    contact_id: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole
    contact_id: Optional[str] = None
    is_active: bool = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    name: str
    email: str

class ContactSignup(BaseModel):
    """
    Public self-registration for customers and vendors only.
    Creates a Contact record AND the login linked to it, in one step.
    Staff accounts are never created this way.
    """
    name: str
    email: str
    password: str = Field(..., min_length=6)
    contact_type: str = Field(..., pattern="^(customer|vendor)$")
    mobile: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None