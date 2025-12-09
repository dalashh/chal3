## Purpose
This file gives actionable, codebase-specific guidance for AI coding agents working in this repository (small Flask + MongoDB shop).

## Big Picture
- **Backend:** `backend/app.py` — single-process Flask app exposing REST endpoints under `/api/*` and rendering templates from `backend/templates`.
- **Data layer:** `backend/db.py` uses `pymongo`; it reads `MONGO_URI` from environment (`.env`) and selects database `tshirt_shop`.
- **Domain logic:** split into modules `backend/crud_products.py`, `backend/crud_users.py`, `backend/crud_carts.py`, `backend/crud_orders.py`. Each module exposes plain functions (e.g. `get_all_products()`, `create_user()`, `add_to_cart()`) and a `_serialize_*` helper to convert Mongo documents to JSON-friendly dicts.
- **Frontend integration:** static JS in `backend/static/` (notably `api.js`, `cart.js`) calls the `/api/*` endpoints directly; use these files as examples for expected request/response shapes.

## Important patterns & conventions (use these exactly)
- CRUD functions use `get_db()` from `backend/db.py` for DB access; do not create new Mongo clients in modules.
- Documents use Mongo `ObjectId` stored in `_id`; serialization helpers convert `_id` to string `id` (see `_serialize_product` in `crud_products.py`).
- Passwords: `create_user()` stores `password_hash` (bcrypt). `verify_login()` compares via `bcrypt.checkpw`. Never expect a `password` field in serialized user objects.
- Cart model: carts are stored in `carts` collection keyed by `user_id`; cart items reference product `_id` values. Frontend expects `product_id` as string in JSON.

## Key files to consult when making changes
- `backend/app.py` — route definitions and high-level HTTP behavior (status codes and error handling).
- `backend/crud_*.py` — business logic; follow existing function naming and serialization patterns.
- `backend/db.py` — environment dependency `MONGO_URI` and `get_db()` helper.
- `backend/static/api.js`, `backend/static/cart.js` — client expectations (HTTP method, URL, JSON shapes). Example: `POST /api/cart/<user_id>` expects `{ product_id, qty, size }`.

## Running & debugging locally (minimal reproducible steps)
1. cd into `backend`
2. Create venv and install: `python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt`
3. Create `.env` in `backend` (or export env var) with `MONGO_URI` pointing to a MongoDB instance.
4. Run the app: `python app.py` — server runs on `0.0.0.0:5000` (debug True).
5. Use `curl` or browser to hit endpoints. Example: `curl http://localhost:5000/api/products`

## Discovered mismatches and gotchas (explicitly observable)
- `backend/static/api.js` contains `apiDeleteProduct(id)` (DELETE `/api/products/<id>`) but `backend/app.py` does not implement a DELETE route for products — tests or feature work should either add a route or remove/align the client call.
- `backend/app.py` currently hardcodes `app.secret_key` — environment-based secret is expected in production; changes to session handling should keep this in mind.
- `crud_users.create_user()` uses the field name `password_hash` while some code in `app.py` attempts to delete `"password"` from responses; serialized users do not include a `password` key so this is a no-op.

## How to extend safely
- When adding new endpoints, mirror naming and serialization conventions used in `crud_*` modules. Add a `_serialize_*` helper that converts `_id` -> `id` and removes sensitive fields.
- Use `get_db()` for DB access. Reuse collection names: `products`, `users`, `carts`, `orders`.
- Follow HTTP behavior in `app.py`: return `jsonify(...)`, use appropriate status codes (201 for created, 400 for client errors, 401 for auth errors, 500 for server errors).

## Small examples (copy/paste friendly)
- Read products: `GET /api/products` -> calls `get_all_products()` in `crud_products.py` and returns JSON list.
- Create user (example request):
  - POST `/api/users` Content-Type: `application/json`
  - Body: `{ "email": "a@b.com", "password": "secret", "first_name": "A" }`

## When in doubt
- Check `backend/static/*.js` to see the exact JSON the frontend sends/expectes.
- Search for function names (e.g. `get_all_products`, `create_user`) to find the canonical implementation.

---
If any section is unclear or you'd like the file to prefer different wording/level of detail, tell me which parts to expand or trim and I'll iterate.
