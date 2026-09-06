from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException

from app.database import users_collection, contacts_collection
from app.models.user import UserRegister, UserLogin, UserOut, TokenOut, ContactSignup
from app.auth.security import hash_password, verify_password, create_access_token
from app.auth.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _user_helper(doc) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "email": doc["email"],
        "role": doc["role"],
        "contact_id": doc.get("contact_id"),
        "is_active": doc.get("is_active", True),
    }


@router.post("/register", response_model=UserOut, dependencies=[Depends(require_admin)])
async def register(payload: UserRegister):
    """Staff account creation. Admin only - there is no public staff signup."""
    email = payload.email.strip().lower()

    existing = await users_collection.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    # A 'contact' user must be linked to a real contact record, since
    # that link is what restricts them to their own invoices.
    if payload.role == "contact":
        if not payload.contact_id:
            raise HTTPException(
                status_code=400,
                detail="contact_id is required when creating a contact user",
            )
        try:
            oid = ObjectId(payload.contact_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="contact_id is not a valid id")
        if not await contacts_collection.find_one({"_id": oid}):
            raise HTTPException(status_code=400, detail="contact_id refers to a contact that does not exist")

    doc = {
        "name": payload.name,
        "email": email,
        "password_hash": hash_password(payload.password),
        "role": payload.role.value,
        "contact_id": payload.contact_id,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
    }

    result = await users_collection.insert_one(doc)
    return _user_helper(await users_collection.find_one({"_id": result.inserted_id}))


@router.post("/signup", response_model=TokenOut)
async def signup(payload: ContactSignup):
    """
    Public signup, customers and vendors only.

    Creates the Contact master record and the login in one step, linked by
    contact_id. That link is the security boundary for everything the user
    can later see in /portal. Staff accounts cannot be created here.
    """
    email = payload.email.strip().lower()

    if await users_collection.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    contact_doc = {
        "name": payload.name,
        "type": payload.contact_type,
        "email": email,
        "mobile": payload.mobile,
        "address": {
            "city": payload.city,
            "state": payload.state,
            "pincode": payload.pincode,
        },
        "profile_image_url": None,
        "is_archived": False,
        "created_at": datetime.now(timezone.utc),
    }
    contact_result = await contacts_collection.insert_one(contact_doc)

    user_doc = {
        "name": payload.name,
        "email": email,
        "password_hash": hash_password(payload.password),
        "role": "contact",
        "contact_id": str(contact_result.inserted_id),
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
    }
    user_result = await users_collection.insert_one(user_doc)

    token = create_access_token({
        "sub": str(user_result.inserted_id),
        "role": "contact",
        "email": email,
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": "contact",
        "name": payload.name,
        "email": email,
    }


@router.post("/login", response_model=TokenOut)
async def login(payload: UserLogin):
    email = payload.email.strip().lower()
    user = await users_collection.find_one({"email": email})

    # Same message whether the email is unknown or the password is wrong,
    # so an attacker can't use the error to discover which emails exist.
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="This account has been deactivated")

    token = create_access_token({
        "sub": str(user["_id"]),
        "role": user["role"],
        "email": user["email"],
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user["role"],
        "name": user["name"],
        "email": user["email"],
    }


@router.get("/me", response_model=UserOut)
async def get_me(user: dict = Depends(get_current_user)):
    return _user_helper(user)


@router.get("/users", response_model=list[UserOut], dependencies=[Depends(require_admin)])
async def list_users():
    return [_user_helper(d) async for d in users_collection.find({})]