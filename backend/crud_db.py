from bson import ObjectId
from db import get_db

def _serialize_product(p: dict) -> dict:
    """Helper function: Mongo document -> JSON-friendly dict."""
    return {
        "id": str(p["_id"]),
        "name": p.get("name"),
        "size": p.get("size"),
        "price": p.get("price"),
    }

# ---------- READ ----------

def get_all_products() -> list[dict]:
    """Alle Produkte aus der Collection products holen."""
    db = get_db()
    items = list(db.products.find())
    return [_serialize_product(i) for i in items]

def get_product_by_id(product_id: str) -> dict | None:
    """Ein Produkt per ID holen (oder None)."""
    db = get_db()
    doc = db.products.find_one({"_id": ObjectId(product_id)})
    if not doc:
        return None
    return _serialize_product(doc)

# ---------- CREATE ----------

def create_product(data: dict) -> dict:
    """Neues Produkt anlegen und das gespeicherte Produkt zurückgeben."""
    db = get_db()

    new_product = {
        "name": data.get("name", "Unbenannt"),
        "size": data.get("size", "M"),
        "price": float(data.get("price", 19.99)),
    }

    result = db.products.insert_one(new_product)
    new_product["_id"] = result.inserted_id
    return _serialize_product(new_product)

# ---------- UPDATE ----------

def update_product(product_id: str, data: dict) -> dict | None:
    """
    Produkt per ID aktualisieren.
    Gibt das aktualisierte Produkt zurück oder None, wenn es nicht existiert.
    """
    db = get_db()

    update_fields = {}
    if "name" in data:
        update_fields["name"] = data["name"]
    if "size" in data:
        update_fields["size"] = data["size"]
    if "price" in data:
        update_fields["price"] = float(data["price"])

    if not update_fields:
        return get_product_by_id(product_id)

    result = db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": update_fields},
    )

    if result.matched_count == 0:
        return None

    return get_product_by_id(product_id)

# ---------- DELETE ----------

def delete_product(product_id: str) -> bool:
    """Produkt per ID löschen. Gibt True zurück, wenn eins gelöscht wurde."""
    db = get_db()
    result = db.products.delete_one({"_id": ObjectId(product_id)})
    return result.deleted_count == 1
