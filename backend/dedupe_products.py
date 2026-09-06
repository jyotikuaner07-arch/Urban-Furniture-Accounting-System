import asyncio
from app.database import products_collection

async def main():
    seen = set()
    archived = 0

    async for p in products_collection.find({"is_archived": {"$ne": True}}).sort("_id", 1):
        name = p["name"]
        if name in seen:
            await products_collection.update_one(
                {"_id": p["_id"]}, {"$set": {"is_archived": True}}
            )
            archived += 1
        else:
            seen.add(name)

    print(f"Archived {archived} duplicates. {len(seen)} unique products remain.")

asyncio.run(main())