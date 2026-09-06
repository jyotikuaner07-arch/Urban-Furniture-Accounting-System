from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from bson import ObjectId
from bson.errors import InvalidId

from app.database import analytic_accounts_collection
from app.models.analytic import AnalyticAccountCreate, AnalyticAccountUpdate, AnalyticAccountOut

router = APIRouter(prefix="/analytic-accounts", tags=["Analytic Accounts"])


def _helper(doc) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "type": doc["type"],
        "description": doc.get("description"),
        "is_archived": doc.get("is_archived", False),
    }


@router.post("", response_model=AnalyticAccountOut)
async def create_analytic_account(account: AnalyticAccountCreate):
    existing = await analytic_accounts_collection.find_one(
        {"name": account.name, "is_archived": {"$ne": True}}
    )
    if existing:
        raise HTTPException(status_code=400, detail=f"An analytic account named '{account.name}' already exists")

    doc = account.model_dump()
    doc["is_archived"] = False
    doc["created_at"] = datetime.now(timezone.utc)

    result = await analytic_accounts_collection.insert_one(doc)
    return _helper(await analytic_accounts_collection.find_one({"_id": result.inserted_id}))


@router.get("", response_model=list[AnalyticAccountOut])
async def list_analytic_accounts(type: str | None = None, include_archived: bool = False):
    query = {}
    if type:
        query["type"] = type
    if not include_archived:
        query["is_archived"] = {"$ne": True}
    return [_helper(d) async for d in analytic_accounts_collection.find(query)]


@router.get("/{account_id}", response_model=AnalyticAccountOut)
async def get_analytic_account(account_id: str):
    try:
        oid = ObjectId(account_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Analytic account not found")
    doc = await analytic_accounts_collection.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Analytic account not found")
    return _helper(doc)


@router.put("/{account_id}", response_model=AnalyticAccountOut)
async def update_analytic_account(account_id: str, account: AnalyticAccountUpdate):
    try:
        oid = ObjectId(account_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Analytic account not found")

    update_data = account.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    result = await analytic_accounts_collection.update_one({"_id": oid}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Analytic account not found")
    return _helper(await analytic_accounts_collection.find_one({"_id": oid}))


@router.delete("/{account_id}")
async def archive_analytic_account(account_id: str):
    try:
        oid = ObjectId(account_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Analytic account not found")
    result = await analytic_accounts_collection.update_one({"_id": oid}, {"$set": {"is_archived": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Analytic account not found")
    return {"message": "Analytic account archived successfully"}