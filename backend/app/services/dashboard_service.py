from datetime import datetime, timezone, timedelta

from app.database import (
    journal_entries_collection,
    customer_invoices_collection,
    vendor_bills_collection,
    contacts_collection,
    products_collection,
    accounts_collection,
)
from app.services.report_service import profit_and_loss


async def _sum_field(collection, field: str, query: dict) -> float:
    """Small aggregation helper: sums one numeric field across matching docs."""
    pipeline = [
        {"$match": query},
        {"$group": {"_id": None, "total": {"$sum": f"${field}"}}},
    ]
    async for row in collection.aggregate(pipeline):
        return round(float(row.get("total", 0) or 0), 2)
    return 0.0


async def summary() -> dict:
    """
    Headline numbers for the dashboard. Each is a live aggregation -
    nothing is cached or stored, so these can never disagree with the ledger.
    """
    receivables = await _sum_field(
        customer_invoices_collection, "amount_due", {"status": {"$ne": "paid"}}
    )
    payables = await _sum_field(
        vendor_bills_collection, "amount_due", {"status": {"$ne": "paid"}}
    )

    pl = await profit_and_loss()

    return {
        "generated_at": datetime.now(timezone.utc),
        "total_receivables": receivables,
        "total_payables": payables,
        "net_position": round(receivables - payables, 2),
        "total_income": pl["total_income"],
        "total_expenses": pl["total_expenses"],
        "net_profit": pl["net_profit"],
        "counts": {
            "contacts": await contacts_collection.count_documents({"is_archived": {"$ne": True}}),
            "products": await products_collection.count_documents({"is_archived": {"$ne": True}}),
            "accounts": await accounts_collection.count_documents({"is_archived": {"$ne": True}}),
            "journal_entries": await journal_entries_collection.count_documents({}),
            "unpaid_invoices": await customer_invoices_collection.count_documents({"status": {"$ne": "paid"}}),
            "unpaid_bills": await vendor_bills_collection.count_documents({"status": {"$ne": "paid"}}),
        },
    }


async def expense_breakdown() -> list:
    """
    Groups expense spend by account, for a pie/bar chart.
    Uses $unwind to flatten the nested `lines` array so each ledger line
    becomes its own document that can be grouped.
    """
    expense_ids = []
    async for acc in accounts_collection.find({"account_type": "expense"}):
        expense_ids.append(str(acc["_id"]))

    if not expense_ids:
        return []

    pipeline = [
        {"$unwind": "$lines"},
        {"$match": {"lines.account_id": {"$in": expense_ids}}},
        {"$group": {
            "_id": {"account_id": "$lines.account_id", "account_name": "$lines.account_name"},
            "total": {"$sum": {"$subtract": ["$lines.debit", "$lines.credit"]}},
        }},
        {"$sort": {"total": -1}},
    ]

    results = []
    async for row in journal_entries_collection.aggregate(pipeline):
        amount = round(float(row.get("total", 0) or 0), 2)
        if amount == 0:
            continue
        results.append({
            "account_id": row["_id"]["account_id"],
            "account_name": row["_id"]["account_name"],
            "amount": amount,
        })
    return results


async def top_products(limit: int = 5) -> list:
    """Best sellers by revenue, taken from customer invoice lines."""
    pipeline = [
        {"$unwind": "$lines"},
        {"$group": {
            "_id": {"product_id": "$lines.product_id", "product_name": "$lines.product_name"},
            "quantity_sold": {"$sum": "$lines.quantity"},
            "revenue": {"$sum": "$lines.line_subtotal"},
        }},
        {"$sort": {"revenue": -1}},
        {"$limit": limit},
    ]

    results = []
    async for row in customer_invoices_collection.aggregate(pipeline):
        results.append({
            "product_id": row["_id"]["product_id"],
            "product_name": row["_id"]["product_name"],
            "quantity_sold": round(float(row.get("quantity_sold", 0) or 0), 2),
            "revenue": round(float(row.get("revenue", 0) or 0), 2),
        })
    return results


async def cash_flow(days: int = 30) -> list:
    """
    Daily money in/out over the last N days, for a line chart.
    Money in  = debits to Cash/Bank.
    Money out = credits to Cash/Bank.
    """
    money_ids = []
    async for acc in accounts_collection.find({"account_name": {"$in": ["Cash", "Bank"]}}):
        money_ids.append(str(acc["_id"]))

    if not money_ids:
        return []

    since = datetime.now(timezone.utc) - timedelta(days=days)

    pipeline = [
        {"$match": {"date": {"$gte": since}}},
        {"$unwind": "$lines"},
        {"$match": {"lines.account_id": {"$in": money_ids}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$date"}},
            "money_in": {"$sum": "$lines.debit"},
            "money_out": {"$sum": "$lines.credit"},
        }},
        {"$sort": {"_id": 1}},
    ]

    results = []
    async for row in journal_entries_collection.aggregate(pipeline):
        money_in = round(float(row.get("money_in", 0) or 0), 2)
        money_out = round(float(row.get("money_out", 0) or 0), 2)
        results.append({
            "date": row["_id"],
            "money_in": money_in,
            "money_out": money_out,
            "net": round(money_in - money_out, 2),
        })
    return results