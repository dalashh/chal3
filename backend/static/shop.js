document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("product-list")) loadProducts();
    if (document.getElementById("product-detail")) loadProductDetail();
});

const COOKIE_CONSENT_KEY = "cookie-consent";

  function showCookieBanner() {
    const banner = document.getElementById("cookie-banner");
    if (!banner) return;
    banner.classList.remove("hidden");

    const acceptBtn = document.getElementById("cookie-accept");
    const declineBtn = document.getElementById("cookie-decline");

    acceptBtn.addEventListener("click", () => {
      localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
      banner.classList.add("hidden");
      // Hier könnt ihr z.B. Tracking/Analytics initialisieren
    });

    declineBtn.addEventListener("click", () => {
      localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
      banner.classList.add("hidden");
      // Keine optionalen Cookies/Tracker laden
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // User war noch nie hier -> Banner anzeigen
      showCookieBanner();
    } else if (consent === "accepted") {
      // Hier könnt ihr direkt optionale Cookies/Tracker laden
    }
  });

async function loadProducts() {
  const list = document.getElementById("product-list");
  const data = await apiGetProducts();

  list.innerHTML = data
    .map(p => `
      <div class="card">
        ${p.image ? `<img class="product-image" src="${p.image}" alt="${p.name}">` : ""}
        <h3>${p.name}</h3>
        <p>${p.description || ""}</p>
        <p class="price-wrapper">
          <span class="original-price" data-base-price="${p.base_price}">
            ${p.base_price} €
          </span>
          <span class="discount-badge">-5%</span>
          <span class="discounted-price"></span>
        </p>
        <select id="size-select-${p.id}">
          ${Array.isArray(p.variants)
            ? p.variants
                .map(v => `<option value="${v.size}">${v.size}</option>`)
                .join("")
            : ""
          }
        </select>
        <button onclick="addToCart({
          product_id: '${p.id}',
          qty: 1,
          size: document.getElementById('size-select-${p.id}').value
        })">
          In den Warenkorb
        </button>
      </div>
    `)
    .join("");
        const discountRate = 0.05;
    document.querySelectorAll(".price-wrapper").forEach(wrapper => {
      const base = parseFloat(
        wrapper.querySelector(".original-price").dataset.basePrice
      );
      const discounted = (base * (1 - discountRate)).toFixed(2);
      wrapper.querySelector(".discounted-price").textContent = `${discounted} €`;
      });
}

// ADMIN
async function loadAdminProducts() {
    const list = document.getElementById("admin-product-list");
    const data = await apiGetProducts();

    list.innerHTML = data.map(p => `
        <li>
            ${p.name} (${p.size}) – ${p.base_price}€
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
