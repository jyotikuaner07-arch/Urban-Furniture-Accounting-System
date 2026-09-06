from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from bson.errors import InvalidId

from app.database import journal_entries_collection
from app.models.journal_entry import JournalEntryCreate, JournalEntryOut
from app.services.journal_engine import create_journal_entry

router = APIRouter(prefix="/journal-entries", tags=["Journal Entries"])


def entry_helper(doc) -> dict:
    return {
        "id": str(doc["_id"]),
        "journal_id": doc["journal_id"],
        "journal_name": doc.get("journal_name"),
        "date": doc["date"],
        "reference": doc.get("reference"),
        "source_type": doc.get("source_type", "manual"),
        "source_id": doc.get("source_id"),
        "analytic_account_id": doc.get("analytic_account_id"),
        "lines": doc.get("lines", []),
        "total_debit": doc.get("total_debit", 0.0),
        "total_credit": doc.get("total_credit", 0.0),
    }


@router.post("", response_model=JournalEntryOut)
async def create_manual_entry(entry: JournalEntryCreate):
    created = await create_journal_entry(
        journal_id=entry.journal_id,
        date=entry.date,
        lines=[line.model_dump() for line in entry.lines],
        source_type="manual",
        source_id=None,
        reference=entry.reference,
        analytic_account_id=entry.analytic_account_id,
    )
    return created


@router.get("", response_model=list[JournalEntryOut])
async def list_journal_entries(
    journal_id: str | None = None,
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    source_type: str | None = None,
):
    query = {}
    if journal_id:
        query["journal_id"] = journal_id
    if source_type:
        query["source_type"] = source_type

    if start_date or end_date:
        date_filter = {}
        if start_date:
            date_filter["$gte"] = start_date
        if end_date:
            date_filter["$lte"] = end_date
        query["date"] = date_filter

    entries = []
    async for doc in journal_entries_collection.find(query).sort("date", -1):
        entries.append(entry_helper(doc))
    return entries


@router.get("/{entry_id}", response_model=JournalEntryOut)
async def get_journal_entry(entry_id: str):
    try:
        obj_id = ObjectId(entry_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    doc = await journal_entries_collection.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    return entry_helper(doc)