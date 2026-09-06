from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from bson import ObjectId
from bson.errors import InvalidId

from app.database import journals_collection, accounts_collection
from app.models.journal import JournalCreate, JournalUpdate, JournalOut

router = APIRouter(prefix="/journals", tags=["Journals"])


def journal_helper(doc) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "type": doc["type"],
        "default_debit_account_id": doc.get("default_debit_account_id"),
        "default_credit_account_id": doc.get("default_credit_account_id"),
        "is_archived": doc.get("is_archived", False),
    }


async def validate_account_exists(account_id: str | None, field_name: str):
    if account_id is None:
        return
    try:
        obj_id = ObjectId(account_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail=f"{field_name} is not a valid account id")

    account = await accounts_collection.find_one({"_id": obj_id})
    if not account:
        raise HTTPException(status_code=400, detail=f"{field_name} refers to an account that does not exist")


@router.post("", response_model=JournalOut)
async def create_journal(journal: JournalCreate):
    await validate_account_exists(journal.default_debit_account_id, "default_debit_account_id")
    await validate_account_exists(journal.default_credit_account_id, "default_credit_account_id")

    doc = journal.model_dump()
    doc["is_archived"] = False
    doc["created_at"] = datetime.now(timezone.utc)

    result = await journals_collection.insert_one(doc)
    created = await journals_collection.find_one({"_id": result.inserted_id})
    return journal_helper(created)


@router.get("", response_model=list[JournalOut])
async def list_journals(type: str | None = None, include_archived: bool = False):
    query = {}
    if type:
        query["type"] = type
    if not include_archived:
        query["is_archived"] = {"$ne": True}

    journals = []
    async for doc in journals_collection.find(query):
        journals.append(journal_helper(doc))
    return journals


@router.get("/{journal_id}", response_model=JournalOut)
async def get_journal(journal_id: str):
    try:
        obj_id = ObjectId(journal_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Journal not found")

    doc = await journals_collection.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Journal not found")
    return journal_helper(doc)


@router.put("/{journal_id}", response_model=JournalOut)
async def update_journal(journal_id: str, journal: JournalUpdate):
    try:
        obj_id = ObjectId(journal_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Journal not found")

    update_data = journal.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    if "default_debit_account_id" in update_data:
        await validate_account_exists(update_data["default_debit_account_id"], "default_debit_account_id")
    if "default_credit_account_id" in update_data:
        await validate_account_exists(update_data["default_credit_account_id"], "default_credit_account_id")

    result = await journals_collection.update_one({"_id": obj_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Journal not found")

    updated = await journals_collection.find_one({"_id": obj_id})
    return journal_helper(updated)


@router.delete("/{journal_id}")
async def archive_journal(journal_id: str):
    try:
        obj_id = ObjectId(journal_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Journal not found")

    result = await journals_collection.update_one(
        {"_id": obj_id}, {"$set": {"is_archived": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Journal not found")

    return {"message": "Journal archived successfully"}