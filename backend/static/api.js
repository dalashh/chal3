async function apiGetProducts() {
    const res = await fetch("/api/products");
    return res.json();
}

async function apiAddProduct(body) {
    await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
}

async function apiDeleteProduct(id) {
    await fetch(`/api/products/${id}`, {
        method: "DELETE"
    });
}

async function loadAdminProducts() {
    try {
        const products = await apiGetProducts();
        const list = document.getElementById("admin-product-list");
        
        list.innerHTML = products.map(product => `
            <li>
                <div class="product-info">
                    <h4>${product.name}</h4>
                    <p>Preis: ${product.base_price}€ | Farbe: ${product.color || '–'}</p>
                    <p>Varianten: ${product.variants?.map(v => v.size).join(', ') || '–'}</p>
                    ${product.description ? `<p>${product.description}</p>` : ''}
                </div>
                <div class="admin-actions">
                    <button class="edit-btn" onclick="editProduct('${product._id.$oid || product.id}')">
                        Bearbeiten
                    </button>
                    <button class="delete-btn" onclick="deleteProduct('${product._id.$oid || product.id}')">
                        Löschen
                    </button>
                </div>
            </li>
        `).join("");
    } catch (error) {
        console.error("Fehler beim Laden der Produkte:", error);
    }
}

async function addProduct() {
    const product = {
        name: document.getElementById("name").value,
        description: document.getElementById("description").value,
        base_price: parseFloat(document.getElementById("price").value),
        image: document.getElementById("image").value,
        color: document.getElementById("color").value,
        variants: [], // Varianten später separat hinzufügen
        active: true
    };

    try {
        await apiCreateProduct(product);
        loadAdminProducts(); // Liste neu laden
        // Formular zurücksetzen
        document.querySelectorAll(".admin-form input").forEach(input => input.value = "");
    } catch (error) {
        alert("Fehler beim Hinzufügen: " + error.message);
    }
}

async function deleteProduct(id) {
    if (!confirm("Produkt wirklich löschen?")) return;
    
    try {
        await apiDeleteProduct(id);
        loadAdminProducts(); // Liste neu laden
    } catch (error) {
        alert("Fehler beim Löschen: " + error.message);
    }
}

async function editProduct(id) {
    // Einfache Edit-Modal oder Redirect zu Edit-Seite
    const product = await apiGetProduct(id);
    alert("Edit-Funktion: " + JSON.stringify(product, null, 2));
    // TODO: Vollständige Edit-Modal implementieren
}

// Zu deinen bestehenden API-Funktionen hinzufügen:
async function apiCreateProduct(product) {
    const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
    });
    if (!response.ok) throw new Error('Fehler beim Erstellen');
}

async function apiDeleteProduct(id) {
    const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Fehler beim Löschen');
}

async function apiGetProduct(id) {
    const response = await fetch(`/api/products/${id}`);
    if (!response.ok) throw new Error('Produkt nicht gefunden');
    return response.json();
}


