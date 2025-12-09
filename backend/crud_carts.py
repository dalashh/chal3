from db import get_db
from bson import ObjectId

db = get_db()


def add_to_cart(user_id, product_id, qty=1, size="M"):
    carts = db["carts"]
    products = db["products"]

    product = products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise Exception("Product not found")

    price = product.get("base_price") or product.get("price") or 0
    name = product.get("name", "Produkt")

    cart = carts.find_one({"user_id": user_id})

    if not cart:
        cart = {
            "user_id": user_id,
            "items": []
        }
        carts.insert_one(cart)

    # Check if item already exists (same product + size)
    existing_item = None
    for item in cart["items"]:
        if str(item["product_id"]) == str(product_id) and item.get("size") == size:
            existing_item = item
            break

    if existing_item:
        new_qty = int(existing_item["qty"]) + int(qty)
        carts.update_one(
        {"_id": cart["_id"], "items.product_id": ObjectId(product_id), "items.size": size},
        {"$set": {"items.$.qty": new_qty}}
    )

    else:
        carts.update_one(
            {"_id": cart["_id"]},
            {"$push": {"items": {
                "product_id": ObjectId(product_id),
                "qty": qty,
                "size": size
            }}}
        )


def get_cart(user_id):
    carts = db["carts"]
    products = db["products"]

    cart = carts.find_one({"user_id": user_id})
    if not cart:
        return {"items": [], "total": 0}

    full_items = []
    total = 0

    for item in cart["items"]:
        product = products.find_one({"_id": item["product_id"]})
        if not product:
            continue

        price = product.get("base_price") or product.get("price") or 0
        name = product.get("name", "Produkt")

        line_total = price * item["qty"]
        total += line_total

        full_items.append({
            "product_id": str(item["product_id"]),
            "name": name,
            "price": price,
            "qty": item["qty"],
            "size": item.get("size", "M"),
            "line_total": line_total
        })

    return {
        "items": full_items,
        "total": total
    }


def clear_cart(user_id):
    carts = db["carts"]
    carts.delete_one({"user_id": user_id})
