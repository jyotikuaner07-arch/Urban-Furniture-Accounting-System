from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import contact_routes

app = FastAPI(title="Urban Furniture Accounting API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(contact_routes.router)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "urban-furniture-accounting"}
