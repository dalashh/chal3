from bson import ObjectId
from datetime import datetime
from db import get_db

def _serialize_product(p: dict) -> dict:
    """Mongo Dokument -> JSON-freundlich"""
    return {
        "id": str(p["_id"]),
        "name": p.get("name"),
        "description": p.get("description"),
        "base_price": p.get("base_price"),
        "variants": p.get("variants", []),
        "active": p.get("active", True),
        "created_at": p.get("created_at"),
        "color": p.get("color"),
        "image": p.get("image"),
    }

# ---------- READ ----------

def get_all_products() -> list[dict]:
    db = get_db()
    items = list(db.products.find({"active": True}).sort("name", 1))
    return [_serialize_product(i) for i in items]

def search_products(name: str) -> list[dict]:
    db = get_db()
    items = list(db.products.find({
        "name": {"$regex": name, "$options": "i"},
        "active": True
    }).sort("name", 1))
    return [_serialize_product(i) for i in items]

def get_product_by_id(product_id: str) -> dict | None:
    db = get_db()
    doc = db.products.find_one({"_id": ObjectId(product_id)})
    if not doc:
        return None
    return _serialize_product(doc)

# ---------- CREATE ----------

def create_product(data: dict) -> dict:
    db = get_db()

    new_product = {
        "name": data.get("name", "Unbenanntes Produkt"),
        "description": data.get("description", ""),
        "base_price": float(data.get("base_price", 0)),
        "variants": data.get("variants", []),  # [{"size":"M","stock":10}]
        "active": data.get("active", True),
        "created_at": datetime.now(),
        "color": data.get("color", "unbekannt"),
        "image": data.get("image"),
    }

    result = db.products.insert_one(new_product)
    new_product["_id"] = result.inserted_id
    return _serialize_product(new_product)

# ---------- UPDATE ----------

def update_product(product_id: str, data: dict) -> dict | None:
    db = get_db()

    update_fields = {}

    for field in [
        "name",
        "description",
        "base_price",
        "variants",
        "active",
        "color",
        "image"
    ]:
        if field in data:
            update_fields[field] = data[field]

    if not update_fields:
        return get_product_by_id(product_id)

    result = db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": update_fields}
    )

    if result.matched_count == 0:
        return None

    return get_product_by_id(product_id)

# ---------- DELETE ----------

def delete_product(product_id: str) -> bool:
    db = get_db()
    result = db.products.delete_one({"_id": ObjectId(product_id)})
    return result.deleted_count == 1
