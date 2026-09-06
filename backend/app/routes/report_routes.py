from datetime import datetime
from fastapi import APIRouter, Query

from app.services import report_service, aging_service

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/balance-sheet")
async def get_balance_sheet(as_of_date: datetime | None = Query(None)):
    return await report_service.balance_sheet(as_of=as_of_date)


@router.get("/profit-and-loss")
async def get_profit_and_loss(
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
):
    return await report_service.profit_and_loss(start=start_date, end=end_date)


@router.get("/budget-report")
async def get_budget_report(budget_id: str | None = Query(None)):
    return await report_service.budget_report(budget_id)


@router.get("/aging")
async def get_aging_report(
    type: str = Query("receivable", pattern="^(receivable|payable)$"),
    as_of_date: datetime | None = Query(None),
):
    return await aging_service.aging_report(report_type=type, as_of=as_of_date)