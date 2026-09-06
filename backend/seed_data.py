import asyncio
import random
from datetime import datetime, timezone, timedelta
from app.database import contacts_collection, products_collection, accounts_collection, journals_collection, analytic_accounts_collection, budgets_collection, users_collection
from app.auth.security import hash_password
from app.services.sales_service import create_sales_order, convert_so_to_invoice, pay_customer_invoice
from app.services.purchase_service import create_purchase_order, convert_po_to_bill, pay_vendor_bill

async def seed_contacts():
    contacts = [
        {
            "name": "Neha Thakkar",
            "type": "customer",
            "email": "neha.thakkar@example.com",
            "mobile": "9855543210",
            "address": {"city": "Ahmedabad", "state": "Gujarat", "pincode": "380001"},
            "profile_image_url": None,
            "is_archived": False
        },
        {
            "name": "Nimesh Pathak",
            "type": "customer",
            "email": "nimesh.pathak@example.com",
            "mobile": "9876543211",
            "address": {"city": "Surat", "state": "Gujarat", "pincode": "395003"},
            "profile_image_url": None,
            "is_archived": False
        },
        {
            "name": "Azure Furniture",
            "type": "vendor",
            "email": "contact@azurefurniture.com",
            "mobile": "9876543212",
            "address": {"city": "Vadodara", "state": "Gujarat", "pincode": "390001"},
            "profile_image_url": None,
            "is_archived": False
        },
        {
            "name": "Priya Mehta",
            "type": "customer",
            "email": "priya.mehta@example.com",
            "mobile": "9876543213",
            "address": {"city": "Gandhinagar", "state": "Gujarat", "pincode": "382001"},
            "profile_image_url": None,
            "is_archived": False
        },
        {
            "name": "Kiran Woodworks",
            "type": "vendor",
            "email": "info@kiranwoodworks.com",
            "mobile": "9876543214",
            "address": {"city": "Rajkot", "state": "Gujarat", "pincode": "360001"},
            "profile_image_url": None,
            "is_archived": False
        },
        {
            "name": "Sanjay Furniture Traders",
            "type": "both",
            "email": "sanjay.traders@example.com",
            "mobile": "9876543215",
            "address": {"city": "Ahmedabad", "state": "Gujarat", "pincode": "380015"},
            "profile_image_url": None,
            "is_archived": False
        },
        {
            "name": "Meera Desai",
            "type": "customer",
            "email": "meera.desai@example.com",
            "mobile": "9876543216",
            "address": {"city": "Vadodara", "state": "Gujarat", "pincode": "390007"},
            "profile_image_url": None,
            "is_archived": False
        }
    ]

    result = await contacts_collection.insert_many(contacts)
    print(f"Inserted {len(result.inserted_ids)} contacts")

async def seed_products():
    products = [
        {
            "name": "Wooden Dining Table",
            "type": "goods",
            "sales_price": 15000.00,
            "cost_price": 9000.00,
            "category": "Furniture"
        },
        {
            "name": "Office Chair",
            "type": "goods",
            "sales_price": 4500.00,
            "cost_price": 2500.00,
            "category": "Furniture"
        },
        {
            "name": "Wooden Bed Frame - Queen",
            "type": "goods",
            "sales_price": 22000.00,
            "cost_price": 14000.00,
            "category": "Furniture"
        },
        {
            "name": "Bookshelf - 5 Tier",
            "type": "goods",
            "sales_price": 6800.00,
            "cost_price": 4200.00,
            "category": "Furniture"
        },
        {
            "name": "Sofa Set - 3 Seater",
            "type": "goods",
            "sales_price": 32000.00,
            "cost_price": 21000.00,
            "category": "Furniture"
        },
        {
            "name": "Home Delivery Service",
            "type": "service",
            "sales_price": 800.00,
            "cost_price": 300.00,
            "category": "Logistics"
        },
        {
            "name": "Furniture Assembly Service",
            "type": "service",
            "sales_price": 1200.00,
            "cost_price": 500.00,
            "category": "Labor"
        },
        {
            "name": "Dining Set Combo (Table + 4 Chairs)",
            "type": "combo",
            "sales_price": 28000.00,
            "cost_price": 18000.00,
            "category": "Furniture"
        }
    ]

    result = await products_collection.insert_many(products)
    print(f"Inserted {len(result.inserted_ids)} products")

async def seed_bulk_contacts(count=50):
    first_names = ["Rahul", "Priya", "Amit", "Neha", "Vikram", "Pooja", "Sanjay", "Kavita",
                    "Arjun", "Divya", "Rohan", "Anjali", "Manoj", "Sneha", "Karan", "Ritu",
                    "Deepak", "Meera", "Suresh", "Anita"]
    last_names = ["Sharma", "Patel", "Mehta", "Desai", "Shah", "Joshi", "Trivedi", "Pandya",
                  "Rao", "Iyer", "Nair", "Kapoor", "Malhotra", "Chauhan", "Vyas"]
    business_names = ["Furniture Works", "Woodcraft Co", "Timber Traders", "Interiors Hub",
                       "Home Decor Studio", "Furnishing Solutions", "Wood & Design",
                       "Craft Furniture", "Living Spaces", "Modern Woodworks"]
    cities_states = [
        ("Ahmedabad", "Gujarat", "380001"), ("Surat", "Gujarat", "395003"),
        ("Vadodara", "Gujarat", "390001"), ("Rajkot", "Gujarat", "360001"),
        ("Gandhinagar", "Gujarat", "382001"), ("Mumbai", "Maharashtra", "400001"),
        ("Pune", "Maharashtra", "411001"), ("Delhi", "Delhi", "110001"),
        ("Bangalore", "Karnataka", "560001"), ("Jaipur", "Rajasthan", "302001"),
    ]
    types = ["vendor", "customer", "both"]

    contacts = []
    for i in range(count):
        is_business = random.random() < 0.3  # 30% chance of a business-name contact
        if is_business:
            name = f"{random.choice(business_names)} {i+1}"
        else:
            name = f"{random.choice(first_names)} {random.choice(last_names)}"

        city, state, pincode = random.choice(cities_states)
        contact_type = random.choice(types)

        email = f"contact{i+1}.{random.randint(1000,9999)}@example.com"
        mobile = f"9{random.randint(100000000, 999999999)}"

        contacts.append({
            "name": name,
            "type": contact_type,
            "email": email,
            "mobile": mobile,
            "address": {"city": city, "state": state, "pincode": pincode},
            "profile_image_url": None,
            "is_archived": False
        })

    result = await contacts_collection.insert_many(contacts)
    print(f"Inserted {len(result.inserted_ids)} bulk contacts")

async def seed_bulk_analytic_accounts(count=15):
    business_lines = [
        "Retail Showroom - Ahmedabad", "Retail Showroom - Surat", "Online Orders - Website",
        "Online Orders - Marketplace",  "Custom Furniture Division",
        "Corporate Bulk Orders", "Export Division", "Delivery & Logistics",
        "After-Sales Service", "Marketing & Advertising", "Warehouse Operations",
        "R&D - New Designs", "Interior Design Consultancy", "Franchise Operations",
        "Raw Material Sourcing", "Staff Training Division", "Quality Control"
    ]
    types = ["income", "expenses"]

    analytic_accounts = []
    used_names = set()

    for i in range(count):
        name = business_lines[i % len(business_lines)]
        if name in used_names:
            name = f"{name} {i+1}"
        used_names.add(name)

        analytic_type = random.choice(types)

        analytic_accounts.append({
            "name": name,
            "type": analytic_type,
            "description": f"Auto-generated analytic account for {name}"
        })

    result = await analytic_accounts_collection.insert_many(analytic_accounts)
    print(f"Inserted {len(result.inserted_ids)} bulk analytic accounts")

async def seed_bulk_budgets(count=15):
    all_analytic_accounts = await analytic_accounts_collection.find().to_list(None)

    if not all_analytic_accounts:
        print("No analytic accounts found — skipping bulk budgets")
        return

    budget_names = ["Revenue Target", "Cost Control Budget", "Quarterly Plan",
                     "Annual Forecast", "Expansion Budget", "Operational Budget"]
    quarters = [
        (datetime(2026, 1, 1), datetime(2026, 3, 31)),
        (datetime(2026, 4, 1), datetime(2026, 6, 30)),
        (datetime(2026, 7, 1), datetime(2026, 9, 30)),
        (datetime(2026, 10, 1), datetime(2026, 12, 31)),
    ]
    people = ["Vigneshwari", "Rahul Sharma", "Priya Mehta", "Amit Patel"]

    budgets = []
    for i in range(count):
        analytic_account = random.choice(all_analytic_accounts)
        period_start, period_end = random.choice(quarters)

        budgets.append({
            "name": f"{random.choice(budget_names)} - {analytic_account['name']}",
            "analytic_account_id": str(analytic_account["_id"]),
            "period_start": period_start,
            "period_end": period_end,
            "planned_amount": round(random.uniform(50000, 800000), 2),
            "responsible_person": random.choice(people)
        })

    result = await budgets_collection.insert_many(budgets)
    print(f"Inserted {len(result.inserted_ids)} bulk budgets")

       
async def seed_bulk_products(count=100):
    product_words_a = ["Wooden", "Modern", "Classic", "Premium", "Compact", "Rustic",
                        "Elegant", "Minimalist", "Executive", "Deluxe"]
    product_words_b = ["Dining Table", "Office Chair", "Bed Frame", "Bookshelf", "Sofa",
                        "Coffee Table", "Wardrobe", "TV Unit", "Study Desk", "Recliner",
                        "Bar Stool", "Shoe Rack", "Cabinet", "Bench", "Nightstand"]
    services = ["Home Delivery", "Furniture Assembly", "Custom Polishing",
                "Interior Consultation", "Bulk Order Handling"]
    categories = ["Furniture", "Logistics", "Labor", "Consultation"]
    types = ["goods", "goods", "goods", "service", "combo"]  # weighted toward goods

    products = []
    for i in range(count):
        product_type = random.choice(types)

        if product_type == "service":
            name = f"{random.choice(services)} - Plan {i+1}"
            category = random.choice(["Logistics", "Labor", "Consultation"])
            cost_price = round(random.uniform(200, 1500), 2)
        else:
            name = f"{random.choice(product_words_a)} {random.choice(product_words_b)} #{i+1}"
            category = "Furniture"
            cost_price = round(random.uniform(1500, 25000), 2)

        sales_price = round(cost_price * random.uniform(1.3, 1.8), 2)  # markup 30-80%

        products.append({
            "name": name,
            "type": product_type,
            "sales_price": sales_price,
            "cost_price": cost_price,
            "category": category
        })

    result = await products_collection.insert_many(products)
    print(f"Inserted {len(result.inserted_ids)} bulk products")

async def seed_accounts():
    accounts = [
        {
            "account_name": "Cash",
            "account_type": "asset",
            "code": "1000"
        },
        {
            "account_name": "Bank",
            "account_type": "asset",
            "code": "1010"
        },
        {
            "account_name": "Debtors",
            "account_type": "asset",
            "code": "1100"
        },
        {
            "account_name": "Creditors",
            "account_type": "liability",
            "code": "2000"
        },
        {
            "account_name": "Sales Income",
            "account_type": "income",
            "code": "4000"
        },
        {
            "account_name": "Purchase Expense",
            "account_type": "expense",
            "code": "5000"
        }
    ]

    result = await accounts_collection.insert_many(accounts)
    print(f"Inserted {len(result.inserted_ids)} accounts")

async def seed_journals():
    cash_account = await accounts_collection.find_one({"account_name": "Cash"})
    bank_account = await accounts_collection.find_one({"account_name": "Bank"})
    sales_income_account = await accounts_collection.find_one({"account_name": "Sales Income"})
    purchase_expense_account = await accounts_collection.find_one({"account_name": "Purchase Expense"})
    debtors_account = await accounts_collection.find_one({"account_name": "Debtors"})
    creditors_account = await accounts_collection.find_one({"account_name": "Creditors"})

    journals = [
        {
            "name": "Sales Journal",
            "type": "sales",
            "default_debit_account_id": str(debtors_account["_id"]),
            "default_credit_account_id": str(sales_income_account["_id"])
        },
        {
            "name": "Purchase Journal",
            "type": "purchase",
            "default_debit_account_id": str(purchase_expense_account["_id"]),
            "default_credit_account_id": str(creditors_account["_id"])
        },
        {
            "name": "Bank Journal",
            "type": "bank",
            "default_debit_account_id": str(bank_account["_id"]),
            "default_credit_account_id": str(bank_account["_id"])
        },
        {
            "name": "Cash Journal",
            "type": "cash",
            "default_debit_account_id": str(cash_account["_id"]),
            "default_credit_account_id": str(cash_account["_id"])
        }
    ]

    result = await journals_collection.insert_many(journals)
    print(f"Inserted {len(result.inserted_ids)} journals")

async def seed_analytic_accounts():
    analytic_accounts = [
        {
            "name": "Retail Showroom",
            "type": "income",
            "description": "Sales generated through the physical retail showroom"
        },
        {
            "name": "Online Orders",
            "type": "income",
            "description": "Sales generated through the online store"
        },
        {
            "name": "Workshop & Production",
            "type": "expenses",
            "description": "Costs related to manufacturing and assembling furniture in-house"
        }
    ]

    result = await analytic_accounts_collection.insert_many(analytic_accounts)
    print(f"Inserted {len(result.inserted_ids)} analytic accounts")


async def seed_budgets():
    online_orders = await analytic_accounts_collection.find_one({"name": "Online Orders"})
    workshop = await analytic_accounts_collection.find_one({"name": "Workshop & Production"})

    budgets = [
        {
            "name": "Online Orders Revenue Target - Q1",
            "analytic_account_id": str(online_orders["_id"]),
            "period_start": datetime(2026, 1, 1),
            "period_end": datetime(2026, 3, 31),
            "planned_amount": 500000.00,
            "responsible_person": "Vigneshwari"
        },
        {
            "name": "Workshop Production Budget - Q1",
            "analytic_account_id": str(workshop["_id"]),
            "period_start": datetime(2026, 1, 1),
            "period_end": datetime(2026, 3, 31),
            "planned_amount": 150000.00,
            "responsible_person": "Vigneshwari"
        }
    ]

    result = await budgets_collection.insert_many(budgets)
    print(f"Inserted {len(result.inserted_ids)} budgets")

async def seed_users():
    users = [
        {
            "name": "Admin User",
            "email": "admin@urbanfurniture.com",
            "password_hash": hash_password("admin123"),
            "role": "admin",
            "contact_id": None,
            "is_active": True
        },
        {
            "name": "Invoicing Staff",
            "email": "staff@urbanfurniture.com",
            "password_hash": hash_password("staff123"),
            "role": "invoicing_user",
            "contact_id": None,
            "is_active": True
        }
    ]

    result = await users_collection.insert_many(users)
    print(f"Inserted {len(result.inserted_ids)} users")

async def seed_tax_payable_account():
    existing = await accounts_collection.find_one({"account_name": "Tax Payable"})
    if existing:
        print("Tax Payable account already exists — skipping")
        return

    await accounts_collection.insert_one({
        "account_name": "Tax Payable",
        "account_type": "liability",
        "code": "2010"
    })
    print("Created Tax Payable account")

async def seed_sales_data(order_count=50):
    customers = await contacts_collection.find({"type": {"$in": ["customer", "both"]}}).to_list(None)
    products = await products_collection.find().to_list(None)

    if not customers or not products:
        print("No customers or products found — skipping sales data")
        return

    tax_slabs = [0, 5, 12, 18]  # realistic GST-style rates
    methods = ["bank", "cash"]

    created_orders = []

    # --- Step 1: create sales orders ---
    for i in range(order_count):
        customer = random.choice(customers)
        num_lines = random.randint(1, 3)
        chosen_products = random.sample(products, min(num_lines, len(products)))

        lines = []
        for product in chosen_products:
            quantity = random.randint(1, 5)
            lines.append({
                "product_id": str(product["_id"]),
                "quantity": quantity,
                "unit_price": product["sales_price"],
                "tax_percent": random.choice(tax_slabs)
            })

        days_ago = random.randint(1, 180)
        order_date = datetime.now(timezone.utc) - timedelta(days=days_ago)

        try:
            so = await create_sales_order({
                "customer_id": str(customer["_id"]),
                "order_date": order_date,
                "lines": lines,
                "notes": "Bulk demo data"
            })
            created_orders.append(so)
        except Exception as e:
            print(f"Skipped order {i}: {e}")

    print(f"Created {len(created_orders)} sales orders")

    # --- Step 2: convert ~70% of orders to invoices ---
    to_invoice = random.sample(created_orders, k=int(len(created_orders) * 0.7))
    created_invoices = []

    for so in to_invoice:
        due_date = so["order_date"] + timedelta(days=30)
        try:
            invoice = await convert_so_to_invoice(so["id"], due_date=due_date)
            created_invoices.append(invoice)
        except Exception as e:
            print(f"Skipped conversion for {so['so_number']}: {e}")

    print(f"Converted {len(created_invoices)} orders to invoices")

    # --- Step 3: record payments on ~70% of invoices (mix full/partial) ---
    to_pay = random.sample(created_invoices, k=int(len(created_invoices) * 0.7))
    payment_count = 0

    for invoice in to_pay:
        is_full_payment = random.random() < 0.6  # 60% pay in full
        amount = invoice["total_amount"] if is_full_payment else round(invoice["total_amount"] * random.uniform(0.3, 0.7), 2)

        try:
            await pay_customer_invoice(invoice["id"], {
                "amount": amount,
                "method": random.choice(methods),
                "payment_date": invoice["invoice_date"] + timedelta(days=random.randint(1, 20)),
                "notes": "Bulk demo payment"
            })
            payment_count += 1
        except Exception as e:
            print(f"Skipped payment for {invoice['invoice_number']}: {e}")

    print(f"Recorded {payment_count} payments")


async def seed_purchase_data(order_count=50):
    vendors = await contacts_collection.find({"type": {"$in": ["vendor", "both"]}}).to_list(None)
    products = await products_collection.find().to_list(None)

    if not vendors or not products:
        print("No vendors or products found — skipping purchase data")
        return

    methods = ["bank", "cash"]
    created_orders = []

    # --- Step 1: create purchase orders ---
    for i in range(order_count):
        vendor = random.choice(vendors)
        num_lines = random.randint(1, 3)
        chosen_products = random.sample(products, min(num_lines, len(products)))

        lines = []
        for product in chosen_products:
            quantity = random.randint(1, 10)
            lines.append({
                "product_id": str(product["_id"]),
                "quantity": quantity,
                "unit_price": product["cost_price"]
            })

        days_ago = random.randint(1, 180)
        order_date = datetime.now(timezone.utc) - timedelta(days=days_ago)

        try:
            po = await create_purchase_order({
                "vendor_id": str(vendor["_id"]),
                "order_date": order_date,
                "lines": lines,
                "notes": "Bulk demo data"
            })
            created_orders.append(po)
        except Exception as e:
            print(f"Skipped order {i}: {e}")

    print(f"Created {len(created_orders)} purchase orders")

    # --- Step 2: convert ~70% of orders to bills ---
    to_bill = random.sample(created_orders, k=int(len(created_orders) * 0.7))
    created_bills = []

    for po in to_bill:
        due_date = po["order_date"] + timedelta(days=30)
        try:
            bill = await convert_po_to_bill(po["id"], due_date=due_date)
            created_bills.append(bill)
        except Exception as e:
            print(f"Skipped conversion for {po['po_number']}: {e}")

    print(f"Converted {len(created_bills)} orders to bills")

    # --- Step 3: record payments on ~70% of bills (mix full/partial) ---
    to_pay = random.sample(created_bills, k=int(len(created_bills) * 0.7))
    payment_count = 0

    for bill in to_pay:
        is_full_payment = random.random() < 0.6
        amount = bill["total_amount"] if is_full_payment else round(bill["total_amount"] * random.uniform(0.3, 0.7), 2)

        try:
            await pay_vendor_bill(bill["id"], {
                "amount": amount,
                "method": random.choice(methods),
                "payment_date": bill["bill_date"] + timedelta(days=random.randint(1, 20)),
                "notes": "Bulk demo payment"
            })
            payment_count += 1
        except Exception as e:
            print(f"Skipped payment for {bill['bill_number']}: {e}")

    print(f"Recorded {payment_count} payments")

async def main():
    # await seed_contacts()
    # await seed_products()
    # await seed_accounts()
    # await seed_journals()
    # await seed_analytic_accounts()
    # await seed_budgets()
    # await seed_bulk_contacts(50)  # Seed 50 random contacts
    # await seed_bulk_products(100)  # Seed 100 random products
    # await seed_bulk_analytic_accounts(15)  # Seed 15 random analytic accounts
    # await seed_bulk_budgets(15)  # Seed 15 random budgets
    # await seed_users()  # Seed default users
    # await seed_tax_payable_account()  # Ensure Tax Payable account exists
    # await seed_sales_data(50)  # Seed 50 sales orders with invoices and payments
    await seed_purchase_data(50)  # Seed 50 purchase orders with bills and payments

if __name__ == "__main__":
    asyncio.run(main())