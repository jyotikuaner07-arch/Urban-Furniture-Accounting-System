from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.auth.dependencies import require_staff
from app.routes import (
    auth_routes,
    contact_routes,
    product_routes,
    account_routes,
    journal_routes,
    journal_entry_routes,
    purchase_routes,
    sales_routes,
    analytic_routes,
    budget_routes,
    report_routes,
    dashboard_routes,
    portal_routes,
)

app = FastAPI(title="Urban Furniture Accounting API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Every business route requires a logged-in admin or invoicing_user.
# Applying the guard here rather than in each route file keeps the
# access-control policy readable in one place.
staff_only = [Depends(require_staff)]

app.include_router(auth_routes.router)  # public: login/register
app.include_router(contact_routes.router, dependencies=staff_only)
app.include_router(product_routes.router, dependencies=staff_only)
app.include_router(account_routes.router, dependencies=staff_only)
app.include_router(journal_routes.router, dependencies=staff_only)
app.include_router(journal_entry_routes.router, dependencies=staff_only)
app.include_router(purchase_routes.router, dependencies=staff_only)
app.include_router(sales_routes.router, dependencies=staff_only)
app.include_router(analytic_routes.router, dependencies=staff_only)
app.include_router(budget_routes.router, dependencies=staff_only)
app.include_router(report_routes.router, dependencies=staff_only)
app.include_router(dashboard_routes.router, dependencies=staff_only)

# The portal has its own guard (get_portal_contact) which scopes every
# query to the logged-in user's own contact record.
app.include_router(portal_routes.router)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "urban-furniture-accounting"}