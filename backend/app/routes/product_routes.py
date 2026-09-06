from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from bson import ObjectId
from bson.errors import InvalidId

from app.database import products_collection
from app.models.product import ProductCreate, ProductUpdate, ProductOut

router = APIRouter(prefix="/products", tags=["Products"])


def product_helper(doc) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "type": doc["type"],
        "sales_price": doc["sales_price"],
        "cost_price": doc["cost_price"],
        "category": doc.get("category"),
        "is_archived": doc.get("is_archived", False),
    }


@router.post("", response_model=ProductOut)
async def create_product(product: ProductCreate):
    doc = product.model_dump()
    doc["is_archived"] = False
    doc["created_at"] = datetime.now(timezone.utc)

    result = await products_collection.insert_one(doc)
    created = await products_collection.find_one({"_id": result.inserted_id})
    return product_helper(created)


@router.get("", response_model=list[ProductOut])
async def list_products(
    type: str | None = None,
    category: str | None = None,
    include_archived: bool = False,
):
    query = {}
    if type:
        query["type"] = type
    if category:
        query["category"] = category
    if not include_archived:
        query["is_archived"] = {"$ne": True}

    products = []
    async for doc in products_collection.find(query):
        products.append(product_helper(doc))
    return products


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: str):
    try:
        obj_id = ObjectId(product_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Product not found")

    doc = await products_collection.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return product_helper(doc)


@router.put("/{product_id}", response_model=ProductOut)
async def update_product(product_id: str, product: ProductUpdate):
    try:
        obj_id = ObjectId(product_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = product.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    result = await products_collection.update_one({"_id": obj_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")

    updated = await products_collection.find_one({"_id": obj_id})
    return product_helper(updated)


@router.delete("/{product_id}")
async def archive_product(product_id: str):
    try:
        obj_id = ObjectId(product_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Product not found")

    result = await products_collection.update_one(
        {"_id": obj_id}, {"$set": {"is_archived": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")

    return {"message": "Product archived successfully"}