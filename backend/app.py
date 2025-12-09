from flask import Flask, jsonify, request, render_template, session
from flask_cors import CORS

from crud_products import *
from crud_users import *
from crud_carts import *
from crud_orders import *

import bcrypt

app = Flask(__name__)
app.secret_key = "eiereier69"
CORS(app)

# ========================
# PRODUCTS
# ========================

@app.get("/api/products")
def api_products():
    return jsonify(get_all_products())

@app.post("/api/products")
def api_create_product():
    return jsonify(create_product(request.json)), 201


# ========================
# USERS
# ========================

@app.get("/api/users")
def api_users():
    return jsonify(get_all_users())

@app.post("/api/users")
def api_create_user():
    try:
        user = create_user(request.json, request.remote_addr)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    if "password" in user:
        del user["password"]
    return jsonify(user), 201


# ========================
# CART
# ========================

@app.post("/api/cart/<user_id>")
def api_add_cart(user_id):
    if not user_id:
        return {"error": "not logged in"}, 401

    data = request.json

    try:
        add_to_cart(
            user_id,
            data["product_id"],
            data.get("qty", 1),
            data.get("size", "M")
        )
        return {"message": "added"}
    except Exception as e:
        print("CART ERROR:", e)
        return {"error": "failed"}, 500


@app.get("/api/cart/<user_id>")
def api_get_cart(user_id):
    try:
        cart = get_cart(user_id)
        return jsonify({
            "items": cart.get("items", []),
            "total": cart.get("total", 0)
        })
    except Exception as e:
        print("GET CART ERROR:", e)
        return jsonify({"items": [], "total": 0})


# ========================
# ORDERS
# ========================

@app.post("/api/orders/<user_id>")
def api_order(user_id):
    order = create_order(user_id)
    if not order:
        return {"error": "cart empty"}, 400
    return jsonify(order)


# ========================
# AUTH / LOGIN
# ========================

@app.post("/api/login")
def api_login():
    data = request.json

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"success": False, "message": "Email and password are required."}), 400

    user = verify_login(email, password)

    if not user:
        return jsonify({"success": False, "message": "Invalid email or password."}), 401

    # Session setzen (optional, aber hilfreich)
    session["user_id"] = user.get("id")
    session["username"] = user.get("username")

    # Passwort aus Response entfernen
    if "password" in user:
        del user["password"]

    return jsonify({
        "success": True,
        "user": user
    }), 200


# ========================
# PAGES
# ========================

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/admin")
def admin():
    return render_template("admin.html")

@app.route("/login")
def login():
    return render_template("login.html")


# ========================
# RUN
# ========================

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
