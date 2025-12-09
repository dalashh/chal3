let cart = JSON.parse(localStorage.getItem("cart") || "[]");

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(product) {
    cart.push(product);
    saveCart();
    updateCartCount();
    alert("Zum Warenkorb hinzugefügt!");
}

function updateCartCount() {
    const c = document.getElementById("cart-count");
    if (c) c.textContent = cart.length;
}

function toggleCart() {
    const panel = document.getElementById("cart-panel");
    panel.classList.toggle("hidden");
    panel.innerHTML = "<h3>Warenkorb</h3>" +
        cart.map(c => `<p>${c.name} (${c.size}) – ${c.price}€</p>`).join("") +
        `<button onclick="checkout()">Zur Kasse</button>`;
}

function checkout() {
    alert("Checkout noch nicht implementiert – Demo!");
}

document.addEventListener("DOMContentLoaded", updateCartCount);
