from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from bson import ObjectId
from bson.errors import InvalidId

from app.database import budgets_collection, analytic_accounts_collection
from app.models.budget import BudgetCreate, BudgetUpdate, BudgetOut

router = APIRouter(prefix="/budgets", tags=["Budgets"])


def _helper(doc, analytic_name=None) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "analytic_account_id": doc["analytic_account_id"],
        "analytic_account_name": analytic_name or doc.get("analytic_account_name"),
        "period_start": doc["period_start"],
        "period_end": doc["period_end"],
        "planned_amount": doc["planned_amount"],
        "responsible_person": doc.get("responsible_person"),
        "is_archived": doc.get("is_archived", False),
    }


async def _validate_analytic(analytic_id: str) -> dict:
    try:
        oid = ObjectId(analytic_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="analytic_account_id is not a valid id")
    account = await analytic_accounts_collection.find_one({"_id": oid})
    if not account:
        raise HTTPException(status_code=400, detail="analytic_account_id refers to an account that does not exist")
    return account


@router.post("", response_model=BudgetOut)
async def create_budget(budget: BudgetCreate):
    if budget.period_end <= budget.period_start:
        raise HTTPException(status_code=400, detail="period_end must be after period_start")

    analytic = await _validate_analytic(budget.analytic_account_id)

    doc = budget.model_dump()
    doc["analytic_account_name"] = analytic["name"]
    doc["is_archived"] = False
    doc["created_at"] = datetime.now(timezone.utc)

    result = await budgets_collection.insert_one(doc)
    return _helper(await budgets_collection.find_one({"_id": result.inserted_id}))


@router.get("", response_model=list[BudgetOut])
async def list_budgets(include_archived: bool = False):
    query = {} if include_archived else {"is_archived": {"$ne": True}}
    return [_helper(d) async for d in budgets_collection.find(query).sort("period_start", -1)]


@router.get("/{budget_id}", response_model=BudgetOut)
async def get_budget(budget_id: str):
    try:
        oid = ObjectId(budget_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Budget not found")
    doc = await budgets_collection.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Budget not found")
    return _helper(doc)


@router.put("/{budget_id}", response_model=BudgetOut)
async def update_budget(budget_id: str, budget: BudgetUpdate):
    try:
        oid = ObjectId(budget_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Budget not found")

    update_data = budget.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    if "analytic_account_id" in update_data and update_data["analytic_account_id"]:
        analytic = await _validate_analytic(update_data["analytic_account_id"])
        update_data["analytic_account_name"] = analytic["name"]

    result = await budgets_collection.update_one({"_id": oid}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Budget not found")
    return _helper(await budgets_collection.find_one({"_id": oid}))


@router.delete("/{budget_id}")
async def archive_budget(budget_id: str):
    try:
        oid = ObjectId(budget_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Budget not found")
    result = await budgets_collection.update_one({"_id": oid}, {"$set": {"is_archived": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Budget not found")
    return {"message": "Budget archived successfully"}