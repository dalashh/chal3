from bson import ObjectId
from db import get_db

# ---------------------------------------
# CART BASIS
# ---------------------------------------

def get_cart(user_id):
    db = get_db()
    cart = db.carts.find_one({"user_id": user_id})
    if not cart:
        return {"user_id": user_id, "items": []}

    # Normalize ObjectIds
    for i in cart.get("items", []):
        i["product_id"] = str(i["product_id"])

    return cart


# ---------------------------------------
# CART MIT PREISEN (für Frontend!)
# ---------------------------------------

def get_cart_with_prices(user_id):
    db = get_db()

    cart = get_cart(user_id)
    if not cart["items"]:
        return {
            "items": [],
            "total": 0.0
        }

    enriched = []
    total = 0.0

    for item in cart["items"]:
        product = db.products.find_one({"_id": ObjectId(item["product_id"])})

        if not product:
            continue

        price = float(product.get("price", 0))
        subtotal = price * item["qty"]
        total += subtotal

        enriched.append({
            "product_id": str(product["_id"]),
            "name": product["name"],
            "size": item.get("size", "M"),
            "qty": item["qty"],
            "base_price": price,
            "subtotal": subtotal
        })

    return {
        "items": enriched,
        "total": round(total, 2)
    }


# ---------------------------------------
# ADD TO CART
# ---------------------------------------

def add_to_cart(user_id, product_id, quantity=1, size="M"):
    db = get_db()

    # prüfen ob Produkt schon im Warenkorb existiert
    existing = db.carts.find_one({
        "user_id": user_id,
        "items.product_id": ObjectId(product_id),
        "items.size": size
    })

    if existing:
        db.carts.update_one(
            {
                "user_id": user_id,
                "items.product_id": ObjectId(product_id),
                "items.size": size
            },
            {"$set": {"items.$.qty": quantity}}
        )
    else:
        db.carts.update_one(
            {"user_id": user_id},
            {"$push": {"items": {
                "product_id": ObjectId(product_id),
                "qty": quantity,
                "size": size
            }}},
            upsert=True
        )
