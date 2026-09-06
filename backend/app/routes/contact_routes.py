from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from bson import ObjectId
from bson.errors import InvalidId

from app.database import contacts_collection
from app.models.contact import ContactCreate, ContactUpdate, ContactOut

router = APIRouter(prefix="/contacts", tags=["Contacts"])


def contact_helper(doc) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "type": doc["type"],
        "email": doc.get("email"),
        "mobile": doc.get("mobile"),
        "address": doc.get("address"),
        "profile_image_url": doc.get("profile_image_url"),
        "is_archived": doc.get("is_archived", False),
    }


@router.post("", response_model=ContactOut)
async def create_contact(contact: ContactCreate):
    doc = contact.model_dump()
    doc["is_archived"] = False
    doc["created_at"] = datetime.now(timezone.utc)

    result = await contacts_collection.insert_one(doc)
    created = await contacts_collection.find_one({"_id": result.inserted_id})
    return contact_helper(created)


@router.get("", response_model=list[ContactOut])
async def list_contacts(type: str | None = None, include_archived: bool = False):
    query = {}
    if type:
        query["type"] = type
    if not include_archived:
        query["is_archived"] = {"$ne": True}

    contacts = []
    async for doc in contacts_collection.find(query):
        contacts.append(contact_helper(doc))
    return contacts


@router.get("/{contact_id}", response_model=ContactOut)
async def get_contact(contact_id: str):
    try:
        obj_id = ObjectId(contact_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Contact not found")

    doc = await contacts_collection.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact_helper(doc)


@router.put("/{contact_id}", response_model=ContactOut)
async def update_contact(contact_id: str, contact: ContactUpdate):
    try:
        obj_id = ObjectId(contact_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Contact not found")

    update_data = contact.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    result = await contacts_collection.update_one({"_id": obj_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")

    updated = await contacts_collection.find_one({"_id": obj_id})
    return contact_helper(updated)


@router.delete("/{contact_id}")
async def archive_contact(contact_id: str):
    try:
        obj_id = ObjectId(contact_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Contact not found")

    result = await contacts_collection.update_one(
        {"_id": obj_id}, {"$set": {"is_archived": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")

    return {"message": "Contact archived successfully"}