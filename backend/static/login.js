const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

signUpButton.addEventListener('click', () => {
	container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', () => {
	container.classList.remove("right-panel-active");
});

document.addEventListener("DOMContentLoaded", () => {
    const signInForm = document.querySelector(".sign-in-container form");
    const signUpForm = document.querySelector(".sign-up-container form");
    const signInButton = document.getElementById("signIn"); // Overlay button
    const logButton = document.querySelector("#loginButton"); // Header/Login-Button

    // Prüfen ob User eingeloggt (LocalStorage)
    let currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (currentUser) {
        logButton.textContent = "Log out";
    } else {
        logButton.textContent = "Login";
    }

    // --- Log out Funktion ---
    logButton.addEventListener("click", () => {
        if (currentUser) {
            localStorage.removeItem("currentUser");
            currentUser = null;
            alert("You have been logged out.");
            logButton.textContent = "Login";
            window.location.href = "/login"; // optional: zurück zur Login-Seite
        } else {
            window.location.href = "/login";
        }
    });

    // --- Sign In ---
    signInForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = signInForm.querySelector('input[type="email"]').value;
        const password = signInForm.querySelector('input[type="password"]').value;

        if (!email || !password) {
            alert("Please fill in both email and password.");
            return;
        }

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.success) {
                alert("Login successful! Welcome " + data.user.first_name);
                window.location.href = "/";
            } else {
                alert(data.message || "Login failed. Check your credentials.");
            }
        } catch (err) {
            console.error("Error during login:", err);
            alert("An error occurred. Please try again later.");
        }
    });

    // --- Sign Up ---
    signUpForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = signUpForm.querySelector('input[placeholder="Name"]').value;
    const email = signUpForm.querySelector('input[type="email"]').value;
    const password = signUpForm.querySelector('input[type="password"]').value;

    if (!name || !email || !password) {
        alert("Please fill in all fields.");
        return;
    }

    // Name aufteilen in first_name / last_name
    const nameParts = name.trim().split(" ");
    const first_name = nameParts[0];
    const last_name = nameParts.slice(1).join(" ") || "";

    try {
        const response = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ first_name, last_name, email, password }),
        });

        const data = await response.json();

        if (response.status === 201) {
            alert("Registration successful! Please log in.");
            document.getElementById("signIn").click(); // Overlay zurück zu Login
        } else {
            alert(data.message || "Registration failed. Try again.");
        }
    } catch (err) {
        console.error("Error during registration:", err);
        alert("An error occurred. Please try again later.");
    }
});

});
