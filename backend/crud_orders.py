from datetime import datetime
from bson import ObjectId
from db import get_db

def create_order(user_id):
    db = get_db()
    cart = db.carts.find_one({"user_id": user_id})

    if not cart or not cart.get("items"):
        return None

    order = {
        "user_id": user_id,
        "items": [
            {
                "product_id": str(i["product_id"]),
                "qty": i["qty"],
                "size": i.get("size", "M")
            } for i in cart["items"]
        ],
        "status": "pending",
        "created_at": datetime.now()
    }

    result = db.orders.insert_one(order)

    # Nach Bestellung: Warenkorb leeren
    db.carts.update_one({"user_id": user_id}, {"$set": {"items": []}})

    return {"id": str(result.inserted_id)}
