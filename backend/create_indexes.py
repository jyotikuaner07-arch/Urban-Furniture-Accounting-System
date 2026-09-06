import asyncio
from app.database import contacts_collection, products_collection, accounts_collection, journals_collection,analytic_accounts_collection, budgets_collection

async def create_contact_indexes():
    await contacts_collection.create_index("email", unique=True)
    print("Created unique index on contacts.email")

async def create_product_indexes():
    await products_collection.create_index("category")
    print("Created index on products.category")

async def create_account_indexes():
    await accounts_collection.create_index("account_name", unique=True)
    print("Created unique index on chart_of_accounts.account_name")

async def create_journal_indexes():
    await journals_collection.create_index("type")
    print("Created index on journals.type")

async def create_analytic_account_indexes():
    await analytic_accounts_collection.create_index("name", unique=True)
    print("Created unique index on analytic_accounts.name")

async def create_budget_indexes():
    await budgets_collection.create_index("analytic_account_id")
    print("Created index on budgets.analytic_account_id")

async def main():
    await create_contact_indexes()
    await create_product_indexes()
    await create_account_indexes()
    await create_journal_indexes()
    await create_analytic_account_indexes()
    await create_budget_indexes()

if __name__ == "__main__":
    asyncio.run(main())