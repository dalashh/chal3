// =============================
// cart.js - vollständige, robuste Version
// =============================

// ---------- Konfiguration ----------
const CART_STORAGE_KEY = "cart";      // localStorage key
const USER_ID_KEY = "user_id";        // localStorage key für eingeloggten user
const API_BASE = "";                  // leer = gleiche Domain, oder setzen z.B. "https://shop.triplewrld.com"

// ---------- State ----------
let cart = [];                        // lokale Repräsentation des Warenkorbs (Gast oder eingeloggt)
let userId = localStorage.getItem(USER_ID_KEY);

// ---------- Hilfsfunktionen ----------
function isLoggedIn() {
  userId = localStorage.getItem(USER_ID_KEY); // immer aktuell lesen
  return !!userId;
}

function loadLocalCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    cart = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to parse local cart:", e);
    cart = [];
  }
}

function saveLocalCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (e) {
    console.error("Failed to save local cart:", e);
  }
}

function clearLocalCart() {
  cart = [];
  saveLocalCart();
}

function updateCartCount() {
  const el = document.getElementById("cart-count");
  if (!el) return;
  const totalCount = cart.reduce((s, i) => s + (i.qty || 0), 0);
  el.textContent = totalCount;
}

// Helper: finde Item im local cart
function findLocalItemIndex(product_id, size) {
  return cart.findIndex(i => i.product_id === product_id && (i.size || "M") === (size || "M"));
}

// ---------- Backend Kommunikation ----------
async function postJson(url, body) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      // Versuche JSON für bessere Fehlermeldung, sonst text
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return await res.json().catch(() => ({})); // manche POSTs liefern kein JSON zurück
  } catch (err) {
    console.error("postJson error:", err);
    throw err;
  }
}

async function getJson(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return await res.json();
  } catch (err) {
    console.error("getJson error:", err);
    throw err;
  }
}

// Sync eines einzelnen Items zum Backend (setzt qty für das Item)
async function syncItemToBackend(product_id, qty, size = "M") {
  if (!isLoggedIn()) return; // niemandem was schicken wenn Gast
  const url = `${API_BASE}/api/cart/${userId}`;
  try {
    await postJson(url, { product_id: product_id, qty: qty, size: size });
  } catch (err) {
    console.error("Failed to sync item to backend:", err);
  }
}

// Merge local cart to backend after login: sendet alle local items to backend (one-by-one)
async function mergeLocalCartToBackend() {
  if (!isLoggedIn()) return;
  if (!cart || cart.length === 0) return;

  // Senden: wir setzen für jedes Produkt die gesamt-Menge wie in local cart
  for (const it of cart) {
    try {
      await syncItemToBackend(it.product_id, it.qty, it.size || "M");
    } catch (e) {
      // Fehler bereits geloggt; weiter versuchen
    }
  }

  // Nach erfolgreichem sync: leere lokalen cart (Backend ist jetzt Quelle der Wahrheit)
  clearLocalCart();
}

// ---------- Cart-Operationen (lokal) ----------
function addToLocalCartObj(item) {
  // item = { product_id, qty, size, name? }
  const idx = findLocalItemIndex(item.product_id, item.size);
  if (idx >= 0) {
    cart[idx].qty = (cart[idx].qty || 0) + (item.qty || 1);
  } else {
    cart.push({
      product_id: item.product_id,
      qty: item.qty || 1,
      size: item.size || "M",
      name: item.name || null,
      price: item.price || null // falls Produktinfo lokal vorhanden (optional)
    });
  }
  saveLocalCart();
  updateCartCount();
}

// public function for UI to call
async function addToCart(product) {
    if (!product.product_id) {
  console.error("Missing product_id in addToCart()", product);
  alert("Produkt-ID fehlt – bitte Entwickler informieren.");
  return;
    }
  // product can be { product_id, size, qty=1, name?, price? }
  addToLocalCartObj(product);

  if (isLoggedIn()) {
    // sync new qty to backend (backend hält qty, nicht client)
    const idx = findLocalItemIndex(product.product_id, product.size);
    const qty = cart[idx] ? cart[idx].qty : product.qty || 1;
    await syncItemToBackend(product.product_id, qty, product.size || "M");
    // reload display from backend to get prices/totals authoritative
    await loadCart();
  } else {
    // guest: update UI from local
    renderCart();
  }
}

// Change quantity (from UI)
async function changeQuantity(product_id, size, delta) {
  const idx = findLocalItemIndex(product_id, size);
  if (idx < 0) return;
  const newQty = (cart[idx].qty || 0) + delta;
  if (newQty <= 0) {
    // remove
    cart.splice(idx, 1);
  } else {
    cart[idx].qty = newQty;
  }
  saveLocalCart();
  updateCartCount();

  if (isLoggedIn()) {
    // push change to backend (if item removed -> qty 0)
    const qtyForServer = newQty <= 0 ? 0 : newQty;
    await syncItemToBackend(product_id, qtyForServer, size);
    await loadCart(); // refresh authoritative data
  } else {
    renderCart();
  }
}

// ---------- Load Cart for rendering (guest/local OR logged-in/backend) ----------
async function loadCart() {
  loadLocalCart();
  updateCartCount();

  if (!isLoggedIn()) {
    // Guest: render local cart
    renderCart();
    return;
  }

  // Logged in: before showing, if local cart still has items (user just logged in),
  // merge local -> backend then fetch authoritative cart
  if (cart.length > 0) {
    try {
      await mergeLocalCartToBackend();
    } catch (e) {
      console.error("mergeLocalCartToBackend failed", e);
    }
  }

  // Fetch cart from backend (with price calculation)
  try {
    const url = `${API_BASE}/api/cart/${userId}`;
    const data = await getJson(url);

    // Map server items to local representation for UI (also save locally if desired)
    cart = (data.items || []).map(i => ({
      product_id: i.product_id,
      qty: i.qty,
      size: i.size || "M",
      name: i.name || null,
      price: i.base_price || null,
      subtotal: i.subtotal || null
    }));

    saveLocalCart(); // optional: keep local mirror of server cart
    updateCartCount();
    renderCart(data.total);
  } catch (e) {
    console.error("Failed to load cart from backend:", e);
    // Fall back to local rendering
    renderCart();
  }
}

// ---------- Checkout ----------
async function checkout() {
  if (!isLoggedIn()) {
    alert("Bitte melde dich an oder registriere dich, um zur Kasse zu gehen.");
    return;
  }

  try {
    const url = `${API_BASE}/api/orders/${userId}`;
    const res = await fetch(url, { method: "POST" });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("Order failed:", res.status, txt);
      alert("Bestellung fehlgeschlagen.");
      return;
    }
    const json = await res.json().catch(() => ({}));
    alert("Bestellung erfolgreich: " + (json.id || ""));
    // clear local mirror and reload empty cart from backend
    clearLocalCart();
    await loadCart();
  } catch (err) {
    console.error("checkout error:", err);
    alert("Fehler beim Bestellen.");
  }
}

// ---------- Rendering UI ----------
function renderCart(total = null) {
  const panel = document.getElementById("cart-panel");
  const itemsContainer = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");

  if (!panel || !itemsContainer) return;

  // empty state
  if (!cart || cart.length === 0) {
    itemsContainer.innerHTML = "<p>Dein Warenkorb ist leer.</p>";
    if (totalEl) totalEl.textContent = "Gesamt: 0.00 €";
    return;
  }

  // build HTML
  itemsContainer.innerHTML = ""; // reset
  cart.forEach(item => {
    const row = document.createElement("div");
    row.className = "cart-row";

    const info = document.createElement("div");
    info.className = "cart-info";
    info.innerHTML = `<strong>${item.name || "Produkt"}</strong><br>Größe: ${item.size || "M"}`;

    const controls = document.createElement("div");
    controls.className = "cart-controls";

    const minus = document.createElement("button");
    minus.textContent = "–";
    minus.onclick = () => changeQuantity(item.product_id, item.size, -1);

    const qtySpan = document.createElement("span");
    qtySpan.textContent = String(item.qty);

    const plus = document.createElement("button");
    plus.textContent = "+";
    plus.onclick = () => changeQuantity(item.product_id, item.size, 1);

    controls.appendChild(minus);
    controls.appendChild(qtySpan);
    controls.appendChild(plus);

    const price = document.createElement("div");
    price.className = "cart-price";
    const priceText = item.price != null ? `${Number(item.price).toFixed(2)} €` : "";
    price.innerText = priceText;

    row.appendChild(info);
    row.appendChild(price);
    row.appendChild(controls);

    itemsContainer.appendChild(row);
  });

  // total
  const finalTotal = (total != null) ? total : cart.reduce((s, i) => s + ((i.price || 0) * (i.qty || 0)), 0);
  if (totalEl) totalEl.textContent = `Gesamt: ${Number(finalTotal).toFixed(2)} €`;
}

// ---------- Toggle Cart UI (optional) ----------
function toggleCart() {
  const panel = document.getElementById("cart-panel");
  if (!panel) return;
  panel.classList.toggle("hidden");
  // refresh cart view
  loadCart();
}

// ---------- Initialization ----------
document.addEventListener("DOMContentLoaded", () => {
  // load local mirror and update count
  loadLocalCart();
  updateCartCount();

  // attach checkout click if exists
  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) checkoutBtn.addEventListener("click", checkout);

  // load authoritative view (if logged-in will fetch server cart; guest -> local)
  loadCart();
});

// Expose functions for inline onclick usage if needed
window.addToCart = addToCart;
window.toggleCart = toggleCart;
window.changeQuantity = changeQuantity;
window.checkout = checkout;
