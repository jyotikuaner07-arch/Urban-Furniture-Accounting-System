from datetime import datetime, timezone
from typing import Optional

from app.database import journal_entries_collection, accounts_collection


DEBIT_POSITIVE = ("asset", "expense")


async def _account_type_map() -> dict:
    types = {}
    async for acc in accounts_collection.find({}):
        types[str(acc["_id"])] = {
            "name": acc["account_name"],
            "type": acc["account_type"],
            "code": acc.get("code"),
        }
    return types


async def _balances(start: Optional[datetime] = None, end: Optional[datetime] = None) -> dict:
    """
    Walks every journal entry line in the period and accumulates
    debit/credit totals per account. This is the single source of truth
    for both reports - nothing is stored, everything is computed live.
    """
    query = {}
    if start or end:
        date_filter = {}
        if start:
            date_filter["$gte"] = start
        if end:
            date_filter["$lte"] = end
        query["date"] = date_filter

    totals = {}
    async for entry in journal_entries_collection.find(query):
        for line in entry.get("lines", []):
            acc_id = line["account_id"]
            if acc_id not in totals:
                totals[acc_id] = {"debit": 0.0, "credit": 0.0}
            totals[acc_id]["debit"] += float(line.get("debit", 0) or 0)
            totals[acc_id]["credit"] += float(line.get("credit", 0) or 0)

    return totals


def _net(acc_type: str, debit: float, credit: float) -> float:
    """
    Assets and expenses increase on the debit side.
    Liabilities, income and capital increase on the credit side.
    """
    if acc_type in DEBIT_POSITIVE:
        return round(debit - credit, 2)
    return round(credit - debit, 2)


async def balance_sheet(as_of: Optional[datetime] = None) -> dict:
    totals = await _balances(end=as_of)
    types = await _account_type_map()

    sections = {"asset": [], "liability": [], "capital": []}
    section_totals = {"asset": 0.0, "liability": 0.0, "capital": 0.0}

    for acc_id, amounts in totals.items():
        meta = types.get(acc_id)
        if not meta or meta["type"] not in sections:
            continue
        balance = _net(meta["type"], amounts["debit"], amounts["credit"])
        if balance == 0:
            continue
        sections[meta["type"]].append({
            "account_id": acc_id,
            "account_name": meta["name"],
            "code": meta["code"],
            "balance": balance,
        })
        section_totals[meta["type"]] += balance

    # Profit for the period flows into capital (retained earnings)
    pl = await profit_and_loss(end=as_of)
    net_profit = pl["net_profit"]

    total_assets = round(section_totals["asset"], 2)
    total_liabilities = round(section_totals["liability"], 2)
    total_capital = round(section_totals["capital"] + net_profit, 2)

    return {
        "as_of": as_of or datetime.now(timezone.utc),
        "assets": sorted(sections["asset"], key=lambda x: x["code"] or ""),
        "liabilities": sorted(sections["liability"], key=lambda x: x["code"] or ""),
        "capital": sorted(sections["capital"], key=lambda x: x["code"] or ""),
        "retained_earnings": net_profit,
        "total_assets": total_assets,
        "total_liabilities": total_liabilities,
        "total_capital": total_capital,
        "total_liabilities_and_capital": round(total_liabilities + total_capital, 2),
        "is_balanced": abs(total_assets - (total_liabilities + total_capital)) < 0.01,
    }


async def profit_and_loss(start: Optional[datetime] = None, end: Optional[datetime] = None) -> dict:
    totals = await _balances(start=start, end=end)
    types = await _account_type_map()

    income, expenses = [], []
    total_income = 0.0
    total_expense = 0.0

    for acc_id, amounts in totals.items():
        meta = types.get(acc_id)
        if not meta:
            continue
        if meta["type"] == "income":
            balance = _net("income", amounts["debit"], amounts["credit"])
            if balance:
                income.append({"account_id": acc_id, "account_name": meta["name"], "amount": balance})
                total_income += balance
        elif meta["type"] == "expense":
            balance = _net("expense", amounts["debit"], amounts["credit"])
            if balance:
                expenses.append({"account_id": acc_id, "account_name": meta["name"], "amount": balance})
                total_expense += balance

    return {
        "start_date": start,
        "end_date": end or datetime.now(timezone.utc),
        "income": income,
        "expenses": expenses,
        "total_income": round(total_income, 2),
        "total_expenses": round(total_expense, 2),
        "net_profit": round(total_income - total_expense, 2),
    }


async def budget_report(budget_id: Optional[str] = None) -> list:
    """
    Compares planned budget against what was actually spent.

    'Actual' comes from journal entries tagged with the budget's analytic
    account, inside the budget's period. Anything over 100% is flagged.
    """
    from bson import ObjectId
    from bson.errors import InvalidId
    from fastapi import HTTPException
    from app.database import budgets_collection, analytic_accounts_collection

    query = {"is_archived": {"$ne": True}}
    if budget_id:
        try:
            query["_id"] = ObjectId(budget_id)
        except InvalidId:
            raise HTTPException(status_code=404, detail="Budget not found")

    analytics = {}
    async for a in analytic_accounts_collection.find({}):
        analytics[str(a["_id"])] = a

    rows = []
    async for budget in budgets_collection.find(query):
        analytic_id = budget["analytic_account_id"]

        entry_query = {
            "analytic_account_id": analytic_id,
            "date": {"$gte": budget["period_start"], "$lte": budget["period_end"]},
        }

        actual = 0.0
        async for entry in journal_entries_collection.find(entry_query):
            for line in entry.get("lines", []):
                actual += float(line.get("debit", 0) or 0)

        actual = round(actual, 2)
        planned = round(float(budget["planned_amount"]), 2)
        variance = round(planned - actual, 2)
        used_percent = round((actual / planned * 100) if planned else 0, 2)

        rows.append({
            "budget_id": str(budget["_id"]),
            "name": budget["name"],
            "analytic_account_id": analytic_id,
            "analytic_account_name": analytics.get(analytic_id, {}).get("name"),
            "period_start": budget["period_start"],
            "period_end": budget["period_end"],
            "planned_amount": planned,
            "actual_amount": actual,
            "variance": variance,
            "used_percent": used_percent,
            "is_over_budget": actual > planned,
            "responsible_person": budget.get("responsible_person"),
        })

    return rows