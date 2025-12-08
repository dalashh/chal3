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
