from fastapi import HTTPException

from app.database import accounts_collection, journals_collection


async def get_account_by_name(name: str) -> dict:
    account = await accounts_collection.find_one({
        "account_name": name,
        "is_archived": {"$ne": True},
    })
    if not account:
        raise HTTPException(
            status_code=400,
            detail=f"Required account '{name}' does not exist. Create it in the Chart of Accounts first.",
        )
    return account


async def get_journal_by_type(journal_type: str) -> dict:
    journal = await journals_collection.find_one({
        "type": journal_type,
        "is_archived": {"$ne": True},
    })
    if not journal:
        raise HTTPException(
            status_code=400,
            detail=f"No '{journal_type}' journal found. Create one in Journals first.",
        )
    return journal


async def next_document_number(collection, prefix: str) -> str:
    count = await collection.count_documents({})
    return f"{prefix}-{count + 1:04d}"