from datetime import datetime, timezone
from typing import Optional, List

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException

from app.database import (
    journal_entries_collection,
    journals_collection,
    accounts_collection,
)


class UnbalancedEntryError(Exception):
    pass


def to_object_id(value: str, field_name: str) -> ObjectId:
    try:
        return ObjectId(value)
    except InvalidId:
        raise HTTPException(status_code=400, detail=f"{field_name} is not a valid id")


async def create_journal_entry(
    journal_id: str,
    date: datetime,
    lines: List[dict],
    source_type: str = "manual",
    source_id: Optional[str] = None,
    reference: Optional[str] = None,
    analytic_account_id: Optional[str] = None,
) -> dict:

    journal_oid = to_object_id(journal_id, "journal_id")
    journal = await journals_collection.find_one({"_id": journal_oid})
    if not journal:
        raise HTTPException(status_code=400, detail="Journal does not exist")

    if len(lines) < 2:
        raise HTTPException(
            status_code=400,
            detail="A journal entry needs at least two lines (double-entry)",
        )

    normalised_lines = []
    for index, line in enumerate(lines):
        account_oid = to_object_id(line["account_id"], f"lines[{index}].account_id")
        account = await accounts_collection.find_one({"_id": account_oid})
        if not account:
            raise HTTPException(
                status_code=400,
                detail=f"lines[{index}] refers to an account that does not exist",
            )

        debit = round(float(line.get("debit", 0) or 0), 2)
        credit = round(float(line.get("credit", 0) or 0), 2)

        if debit < 0 or credit < 0:
            raise HTTPException(
                status_code=400,
                detail=f"lines[{index}] cannot have negative debit or credit",
            )

        if debit > 0 and credit > 0:
            raise HTTPException(
                status_code=400,
                detail=f"lines[{index}] cannot have both a debit and a credit",
            )

        if debit == 0 and credit == 0:
            raise HTTPException(
                status_code=400,
                detail=f"lines[{index}] must have either a debit or a credit amount",
            )

        normalised_lines.append({
            "account_id": str(account_oid),
            "account_name": account["account_name"],
            "debit": debit,
            "credit": credit,
            "description": line.get("description"),
        })

    total_debit = round(sum(l["debit"] for l in normalised_lines), 2)
    total_credit = round(sum(l["credit"] for l in normalised_lines), 2)

    if total_debit != total_credit:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unbalanced journal entry: debits total {total_debit} "
                f"but credits total {total_credit}"
            ),
        )

    if total_debit == 0:
        raise HTTPException(
            status_code=400,
            detail="A journal entry cannot have a total of zero",
        )

    doc = {
        "journal_id": str(journal_oid),
        "journal_name": journal["name"],
        "date": date,
        "reference": reference,
        "source_type": source_type,
        "source_id": source_id,
        "analytic_account_id": analytic_account_id,
        "lines": normalised_lines,
        "total_debit": total_debit,
        "total_credit": total_credit,
        "created_at": datetime.now(timezone.utc),
    }

    result = await journal_entries_collection.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc