from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from bson import ObjectId
from bson.errors import InvalidId

from app.database import accounts_collection
from app.models.account import AccountCreate, AccountUpdate, AccountOut

router = APIRouter(prefix="/accounts", tags=["Chart of Accounts"])


def account_helper(doc) -> dict:
    return {
        "id": str(doc["_id"]),
        "account_name": doc["account_name"],
        "account_type": doc["account_type"],
        "code": doc.get("code"),
        "is_archived": doc.get("is_archived", False),
    }


@router.post("", response_model=AccountOut)
async def create_account(account: AccountCreate):
    existing = await accounts_collection.find_one({
        "account_name": account.account_name,
        "is_archived": {"$ne": True},
    })
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"An account named '{account.account_name}' already exists",
        )

    doc = account.model_dump()
    doc["is_archived"] = False
    doc["created_at"] = datetime.now(timezone.utc)

    result = await accounts_collection.insert_one(doc)
    created = await accounts_collection.find_one({"_id": result.inserted_id})
    return account_helper(created)


@router.get("", response_model=list[AccountOut])
async def list_accounts(account_type: str | None = None, include_archived: bool = False):
    query = {}
    if account_type:
        query["account_type"] = account_type
    if not include_archived:
        query["is_archived"] = {"$ne": True}

    accounts = []
    async for doc in accounts_collection.find(query).sort("code", 1):
        accounts.append(account_helper(doc))
    return accounts


@router.get("/{account_id}", response_model=AccountOut)
async def get_account(account_id: str):
    try:
        obj_id = ObjectId(account_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Account not found")

    doc = await accounts_collection.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Account not found")
    return account_helper(doc)


@router.put("/{account_id}", response_model=AccountOut)
async def update_account(account_id: str, account: AccountUpdate):
    try:
        obj_id = ObjectId(account_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Account not found")

    update_data = account.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    result = await accounts_collection.update_one({"_id": obj_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")

    updated = await accounts_collection.find_one({"_id": obj_id})
    return account_helper(updated)


@router.delete("/{account_id}")
async def archive_account(account_id: str):
    try:
        obj_id = ObjectId(account_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Account not found")

    result = await accounts_collection.update_one(
        {"_id": obj_id}, {"$set": {"is_archived": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")

    return {"message": "Account archived successfully"}