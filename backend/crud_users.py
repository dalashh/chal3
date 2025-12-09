from bson import ObjectId
from db import get_db

def create_user(data):
    db = get_db()
    user = {
        "username": data.get("username"),
        "email": data.get("email")
    }
    result = db.users.insert_one(user)
    user["_id"] = result.inserted_id
    return {"id": str(user["_id"]), "username": user["username"], "email": user["email"]}

def get_all_users():
    db = get_db()
    users = list(db.users.find())
    return [{"id": str(u["_id"]), "username": u["username"], "email": u["email"]} for u in users]
