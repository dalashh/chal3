// login.js - clean, working version

document.addEventListener("DOMContentLoaded", () => {
  // ---------- Elements ----------
  const signUpButton = document.getElementById("signUp");
  const signInButton = document.getElementById("signIn");
  const container = document.getElementById("container");

  const signInForm = document.querySelector(".sign-in-container form");
  const signUpForm = document.querySelector(".sign-up-container form");
  const logButton = document.querySelector("#loginButton"); // optional (header button)

  // ---------- UI Switch ----------
  if (signUpButton && container) {
    signUpButton.addEventListener("click", () => {
      container.classList.add("right-panel-active");
    });
  }

  if (signInButton && container) {
    signInButton.addEventListener("click", () => {
      container.classList.remove("right-panel-active");
    });
  }

  // ---------- Login state ----------
  let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;

  if (logButton) {
    logButton.textContent = currentUser ? "Log out" : "Login";
  }

  // ---------- Logout ----------
  if (logButton) {
    logButton.addEventListener("click", () => {
      if (currentUser) {
        localStorage.removeItem("currentUser");
        localStorage.removeItem("user_id");
        localStorage.removeItem("username");

        currentUser = null;
        alert("You have been logged out.");
        logButton.textContent = "Login";
        window.location.href = "/login";
      } else {
        window.location.href = "/login";
      }
    });
  }

  // ---------- SIGN IN ----------
  if (signInForm) {
    signInForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = signInForm.querySelector('input[type="email"]')?.value?.trim();
      const password = signInForm.querySelector('input[type="password"]')?.value;

      if (!email || !password) {
        alert("Please fill in both email and password.");
        return;
      }

      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success && data.user) {
          const user = data.user;

          localStorage.setItem("user_id", user._id || user.id || user.user_id);
          localStorage.setItem("username", user.username || user.name || "");
          localStorage.setItem("currentUser", JSON.stringify(user));

          alert("Login successful! Welcome " + (user.username || ""));
          window.location.href = "/";
        } else {
          alert(data.message || "Login failed. Check your credentials.");
        }
      } catch (err) {
        console.error("Login error:", err);
        alert("An error occurred. Please try again later.");
      }
    });
  }

  // ---------- SIGN UP ----------
  if (signUpForm) {
    signUpForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = signUpForm.querySelector('input[placeholder="Name"]')?.value?.trim();
      const email = signUpForm.querySelector('input[type="email"]')?.value?.trim();
      const password = signUpForm.querySelector('input[type="password"]')?.value;

      if (!name || !email || !password) {
        alert("Please fill in all fields.");
        return;
      }

      const username = name;

      try {
        const response = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.status === 201) {
          alert("Registration successful! Please log in.");

          const overlaySignInBtn = document.getElementById("signIn");
          if (overlaySignInBtn) overlaySignInBtn.click();
        } else {
          alert(data.message || data.error || "Registration failed. Try again.");
        }
      } catch (err) {
        console.error("Registration error:", err);
        alert("An error occurred. Please try again later.");
      }
    });
  }
});
