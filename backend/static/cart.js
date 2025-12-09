// =============================
// CART INITIALISIERUNG
// =============================

let cart = JSON.parse(localStorage.getItem("cart") || "[]");

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartCount() {
    const c = document.getElementById("cart-count");
    if (!c) return;

    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    c.textContent = count;
}

document.addEventListener("DOMContentLoaded", updateCartCount);


// =============================
// ADD TO CART
// =============================

function addToCart(product) {
    // Produkt suchen
    const existing = cart.find(p => p.id === product.id);

    if (existing) {
        // Menge erhöhen
        existing.quantity += 1;
    } else {
        // Neues Produkt anlegen
        cart.push({
            id: product.id,
            name: product.name,
            size: product.size,
            price: product.base_price,
            quantity: 1
        });
    }

    saveCart();
    updateCartCount();
}


// =============================
// MENGE ÄNDERN (+/-)
// =============================

function changeQuantity(productId, delta) {
    const item = cart.find(p => p.id === productId);
    if (!item) return;

    item.quantity += delta;

    // Wenn Menge 0 → entfernen
    if (item.quantity <= 0) {
        cart = cart.filter(p => p.id !== productId);
    }

    saveCart();
    updateCartCount();
    renderCartPanel();
}


// =============================
// WARENKORB-PANEL
// =============================

function toggleCart() {
    const panel = document.getElementById("cart-panel");
    panel.classList.toggle("hidden");
    renderCartPanel();
}

function renderCartPanel() {
    const panel = document.getElementById("cart-panel");
    if (!panel) return;

    if (cart.length === 0) {
        panel.innerHTML = `
            <h3>Warenkorb</h3>
            <p>Dein Warenkorb ist leer.</p>
        `;
        return;
    }

    let html = `<h3>Warenkorb</h3>`;

    html += cart
        .map(item => `
        <div class="cart-row">
            <div class="cart-info">
                <strong>${item.name}</strong> (${item.size})<br>
                ${item.price} €
            </div>

            <div class="cart-controls">
                <button onclick="changeQuantity('${item.id}', -1)">–</button>
                <span>${item.quantity}</span>
                <button onclick="changeQuantity('${item.id}', 1)">+</button>
            </div>
        </div>
    `).join("");

    html += `
        <div class="cart-total">
            Gesamt: ${calculateTotal().toFixed(2)} €
        </div>
        <button onclick="checkout()" class="checkout-btn">Zur Kasse</button>
    `;

    panel.innerHTML = html;
}


// =============================
// GESAMTBETRAG
// =============================

function calculateTotal() {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}


// =============================
// CHECKOUT
// =============================

function checkout() {
    alert("Checkout noch nicht implementiert – Demo!");
}