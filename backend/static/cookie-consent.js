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
