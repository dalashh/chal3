from db import get_db
from bson import ObjectId


def _normalize_size(requested_size: str | None, product: dict) -> str:
    """Return a sensible size value.

    - If `requested_size` is falsy or the literal string "undefined", pick the first
      variant size from the product (if available) or fall back to "M".
    - Otherwise return requested_size as-is.
    """
    if not requested_size or requested_size == "undefined":
        variants = product.get("variants") or []
        if variants and isinstance(variants, list) and variants[0].get("size"):
            return variants[0].get("size")
        return "M"
    return requested_size


def add_to_cart(user_id, product_id, qty=1, size="M"):
    db = get_db()
    carts = db["carts"]
    products = db["products"]

    product = products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise Exception("Product not found")

    norm_size = _normalize_size(size, product)

    # ensure qty is an int
    try:
        qty = int(qty)
    except Exception:
        qty = 1

    cart = carts.find_one({"user_id": user_id})

    if not cart:
        # create cart and capture inserted id so later updates can address it
        new_cart = {"user_id": user_id, "items": []}
        res = carts.insert_one(new_cart)
        new_cart["_id"] = res.inserted_id
        cart = new_cart

    # Check if item already exists (same product + size)
    existing_item = None
    for item in cart.get("items", []):
        # item["product_id"] is stored as ObjectId in DB
        if str(item.get("product_id")) == str(product_id) and (item.get("size") or "M") == norm_size:
            existing_item = item
            break

    if existing_item:
        new_qty = int(existing_item.get("qty", 0)) + qty
        carts.update_one(
            {"_id": cart["_id"], "items.product_id": ObjectId(product_id), "items.size": norm_size},
            {"$set": {"items.$.qty": new_qty}}
        )
    else:
        carts.update_one(
            {"_id": cart["_id"]},
            {"$push": {"items": {"product_id": ObjectId(product_id), "qty": qty, "size": norm_size}}}
        )


def get_cart(user_id):
    db = get_db()
    carts = db["carts"]
    products = db["products"]

    cart = carts.find_one({"user_id": user_id})
    if not cart:
        return {"items": [], "total": 0}

    full_items = []
    total = 0

    for item in cart.get("items", []):
        product = products.find_one({"_id": item.get("product_id")})
        if not product:
            continue

        price = product.get("base_price") or product.get("price") or 0
        name = product.get("name", "Produkt")

        # normalize stored size (handle "undefined" or missing)
        stored_size = item.get("size")
        if not stored_size or stored_size == "undefined":
            stored_size = (product.get("variants") or [{}])[0].get("size", "M")

        qty = int(item.get("qty", 0))

        line_total = price * qty
        total += line_total

        full_items.append({
            "product_id": str(item.get("product_id")),
            "name": name,
            "price": price,
            "qty": qty,
            "size": stored_size,
            "line_total": line_total
        })

    return {"items": full_items, "total": total}


def clear_cart(user_id):
    db = get_db()
    carts = db["carts"]
    carts.delete_one({"user_id": user_id})
