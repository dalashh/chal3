from bson import ObjectId
from db import get_db

def get_cart(user_id):
    db = get_db()
    cart = db.carts.find_one({"user_id": user_id})
    if not cart:
        return {"user_id": user_id, "items": []}
    return cart

def add_to_cart(user_id, product_id, quantity=1):
    db = get_db()
    db.carts.update_one(
        {"user_id": user_id},
        {"$push": {"items": {"product_id": product_id, "qty": quantity}}},
        upsert=True
    )
