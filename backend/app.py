from flask import Flask, jsonify, request, render_template
from flask_cors import CORS

from crud_products import *
from crud_users import *
from crud_carts import *
from crud_orders import *

app = Flask(__name__)
CORS(app)

@app.get("/api/products")
def api_products():
    return jsonify(get_all_products())

@app.post("/api/products")
def api_create_product():
    return jsonify(create_product(request.json)), 201


@app.get("/api/users")
def api_users():
    return jsonify(get_all_users())

@app.post("/api/users")
def api_create_user():
    return jsonify(create_user(request.json)), 201


@app.post("/api/cart/<user_id>")
def api_add_cart(user_id):
    data = request.json
    add_to_cart(user_id, data["product_id"], data.get("qty", 1))
    return {"message": "added"}


@app.post("/api/orders/<user_id>")
def api_order(user_id):
    order = create_order(user_id)
    if not order:
        return {"error": "cart empty"}, 400
    return order


@app.route("/")
def home():
    return render_template("index.html")

@app.route("/admin")
def admin():
    return render_template("admin.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
