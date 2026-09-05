from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client = AsyncIOMotorClient(settings.mongo_uri)
db = client[settings.db_name]

users_collection = db["users"]
contacts_collection = db["contacts"]
products_collection = db["products"]
accounts_collection = db["chart_of_accounts"]
journals_collection = db["journals"]
journal_entries_collection = db["journal_entries"]
purchase_orders_collection = db["purchase_orders"]
vendor_bills_collection = db["vendor_bills"]
sales_orders_collection = db["sales_orders"]
customer_invoices_collection = db["customer_invoices"]
payments_collection = db["payments"]
analytic_accounts_collection = db["analytic_accounts"]
budgets_collection = db["budgets"]