document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("product-list")) loadProducts();
    if (document.getElementById("product-detail")) loadProductDetail();
});

async function loadProducts() {
    const list = document.getElementById("product-list");
    const data = await apiGetProducts();

    list.innerHTML = data.map(p => `
        <div class="card">
            <h3>${p.name}</h3>
            <p>Preis: ${p.base_price}€</p>
            <button onclick='addToCart(${JSON.stringify(p)})'>In den Warenkorb</button>
            <a class="link" href="/product?id=${p.id}">Details</a>
        </div>
    `).join("");
}

async function loadProductDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    const products = await apiGetProducts();
    const p = products.find(x => x.id === id);

    const detail = document.getElementById("product-detail");
    detail.innerHTML = `
        <h2>${p.name}</h2>
        <p>Größe: ${p.size}</p>
        <p>Preis: ${p.base_price}€</p>
        <button onclick='addToCart(${JSON.stringify(p)})'>In den Warenkorb</button>
    `;
}

// ADMIN
async function loadAdminProducts() {
    const list = document.getElementById("admin-product-list");
    const data = await apiGetProducts();

    list.innerHTML = data.map(p => `
        <li>
            ${p.name} (${p.size}) – ${p.price}€
            <button onclick="deleteProduct('${p.id}')">Löschen</button>
        </li>
    `).join("");
}

async function deleteProduct(id) {
    await apiDeleteProduct(id);
    loadAdminProducts();
}

async function addProduct() {
    const body = {
        name: document.getElementById("name").value,
        size: document.getElementById("size").value,
        price: parseFloat(document.getElementById("base_price").value)
    };

    await apiAddProduct(body);
    loadAdminProducts();
}
