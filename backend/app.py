from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId

# Flask Setup
app = Flask(__name__)
CORS(app)

# MongoDB Client (lokal; Docker)
client = MongoClient("mongodb://localhost:27017/")
db = client["tshirt_shop"]
products = db["products"]

# Helper — ObjectId -> string
def serialize_product(p):
    return {
        "id": str(p["_id"]),
        "name": p["name"],
        "size": p["size"],
        "price": p["price"]
    }

# ============= ROUTES ==============

@app.route("/")
def home():
    return render_template("index.html")

# ---- GET ALL PRODUCTS ----
@app.get("/api/products")
def get_products():
    items = list(products.find())
    return jsonify([serialize_product(i) for i in items])

# ---- ADD PRODUCT ----
@app.post("/api/products")
def add_product():
    data = request.json

    new_product = {
        "name": data.get("name", "Unbenannt"),
        "size": data.get("size", "M"),
        "price": float(data.get("price", 19.99))
    }

    result = products.insert_one(new_product)
    new_product["_id"] = result.inserted_id

    return jsonify(serialize_product(new_product)), 201

# ---- DELETE PRODUCT ----
@app.delete("/api/products/<id>")
def delete_product(id):
    products.delete_one({"_id": ObjectId(id)})
    return jsonify({"message": "Produkt gelöscht"})


# ===================================

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
