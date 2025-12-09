from bson import ObjectId
from datetime import datetime
from db import get_db
import bcrypt

def _serialize_user(u: dict) -> dict:
    return {
        "id": str(u["_id"]),
        "email": u.get("email"),
        "first_name": u.get("first_name"),
        "last_name": u.get("last_name"),
        "role": u.get("role", "customer"),
        "shipping_addresses": u.get("shipping_addresses", []),
        "billing_addresses": u.get("billing_addresses", []),
        "active": u.get("active", True)
    }

# ---------- CREATE ----------

def create_user(data: dict, ip: str = "0.0.0.0") -> dict:
    db = get_db()

    email = data.get("email")
    if not email:
        raise ValueError("Email is required")

    # NEU: prüfen, ob es die Email schon gibt
    existing = db.users.find_one({"email": email})
    if existing:
        # klare Fehlermeldung fürs Frontend
        raise ValueError("Email already in use")

    password = data.get("password", "")
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    user = {
        "email": data.get("email"),
        "password_hash": password_hash,
        "first_name": data.get("first_name"),
        "last_name": data.get("last_name"),
        "role": data.get("role", "customer"),

        "shipping_addresses": data.get("shipping_addresses", []),
        "billing_addresses": data.get("billing_addresses", []),

        "change_history": [
            {
                "action": "created",
                "timestamp": datetime.now(),
                "ip": ip
            }
        ],

        "active": True
    }

    result = db.users.insert_one(user)
    user["_id"] = result.inserted_id
    return _serialize_user(user)

# ---------- READ ----------

def get_all_users():
    db = get_db()
    users = list(db.users.find())
    return [_serialize_user(u) for u in users]

def get_user_by_id(user_id: str):
    db = get_db()
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return None
    return _serialize_user(user)

# ---------- UPDATE (Adresse hinzufügen z.B.) ----------

def add_shipping_address(user_id: str, address: dict, ip="0.0.0.0"):
    db = get_db()
    db.users.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$push": {"shipping_addresses": address},
            "$push": {"change_history": {
                "action": "address_updated",
                "timestamp": datetime.utcnow(),
                "ip": ip,
                "details": "shipping_addresses"
            }}
        }
    )


# ---------- AUTHENTICATION ----------
def verify_login(email: str, password: str):
    db = get_db()

    user = db.users.find_one({"email": email})
    if not user:
        return None

    if not bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
        return None

    return _serialize_user(user)