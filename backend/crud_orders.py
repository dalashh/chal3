from datetime import datetime
from db import get_db

def create_order(user_id):
    db = get_db()
    cart = db.carts.find_one({"user_id": user_id})

    if not cart:
        return None

    order = {
        "user_id": user_id,
        "items": cart["items"],
        "status": "pending",
        "created_at": datetime.utcnow()
    }

    result = db.orders.insert_one(order)
    return {"id": str(result.inserted_id)}
