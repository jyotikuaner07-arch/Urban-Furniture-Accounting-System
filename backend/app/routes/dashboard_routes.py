from fastapi import APIRouter, Query

from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
async def get_summary():
    return await dashboard_service.summary()


@router.get("/expense-breakdown")
async def get_expense_breakdown():
    return await dashboard_service.expense_breakdown()


@router.get("/top-products")
async def get_top_products(limit: int = Query(5, ge=1, le=20)):
    return await dashboard_service.top_products(limit)


@router.get("/cash-flow")
async def get_cash_flow(days: int = Query(30, ge=1, le=365)):
    return await dashboard_service.cash_flow(days)