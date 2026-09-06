from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException

from app.database import contacts_collection, products_collection


def to_oid(value: str, field: str) -> ObjectId:
    try:
        return ObjectId(value)
    except InvalidId:
        raise HTTPException(status_code=400, detail=f"{field} is not a valid id")


async def validate_contact(contact_id: str, expected: str) -> dict:
    contact = await contacts_collection.find_one({"_id": to_oid(contact_id, f"{expected}_id")})
    if not contact:
        raise HTTPException(status_code=400, detail=f"{expected.capitalize()} does not exist")
    if contact.get("type") not in (expected, "both"):
        raise HTTPException(
            status_code=400,
            detail=f"Contact '{contact['name']}' is not a {expected}",
        )
    return contact


async def build_lines(raw_lines: list, with_tax: bool = False):
    built = []
    subtotal = 0.0
    tax_total = 0.0

    for index, line in enumerate(raw_lines):
        product = await products_collection.find_one(
            {"_id": to_oid(line["product_id"], f"lines[{index}].product_id")}
        )
        if not product:
            raise HTTPException(
                status_code=400,
                detail=f"lines[{index}] refers to a product that does not exist",
            )

        quantity = float(line["quantity"])
        unit_price = float(line["unit_price"])

        if quantity <= 0:
            raise HTTPException(status_code=400, detail=f"lines[{index}] quantity must be greater than zero")
        if unit_price < 0:
            raise HTTPException(status_code=400, detail=f"lines[{index}] unit price cannot be negative")

        line_subtotal = round(quantity * unit_price, 2)
        entry = {
            "product_id": str(product["_id"]),
            "product_name": product["name"],
            "quantity": quantity,
            "unit_price": unit_price,
        }

        if with_tax:
            tax_percent = float(line.get("tax_percent", 0) or 0)
            if tax_percent < 0:
                raise HTTPException(status_code=400, detail=f"lines[{index}] tax percent cannot be negative")
            line_tax = round(line_subtotal * tax_percent / 100, 2)
            entry.update({
                "tax_percent": tax_percent,
                "line_subtotal": line_subtotal,
                "line_tax": line_tax,
                "line_total": round(line_subtotal + line_tax, 2),
            })
            tax_total += line_tax
        else:
            entry["line_total"] = line_subtotal

        subtotal += line_subtotal
        built.append(entry)

    return built, round(subtotal, 2), round(tax_total, 2)