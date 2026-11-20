const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:8081/api"
    : (window.location.protocol === "https:"
        ? `${window.location.origin}/api`
        : `http://${window.location.hostname}:8081/api`);

const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");
const closeButton = document.getElementById("closeButton");
const heading = document.querySelector(".form-panel h2");
const submitButton = loginForm.querySelector('button[type="submit"]');
const signupLink = document.querySelector(".signup-text a");
let registerMode = false;
let nameInput = null;

function showMessage(text, success = false) {
    message.style.color = success ? "#0a8a4a" : "#e53935";
    message.textContent = text;
}

function setMode(isRegister) {
    registerMode = isRegister;
    heading.textContent = isRegister ? "CREATE ACCOUNT" : "LOGIN";
    submitButton.textContent = isRegister ? "Sign Up" : "Log In";
    signupLink.textContent = isRegister ? "Log In" : "Sign Up";
    document.querySelector(".signup-text").firstChild.textContent =
        isRegister ? "Already have an account? " : "Don't have an account? ";
    if (isRegister && !nameInput) {
        const label = document.createElement("label");
        label.htmlFor = "name";
        label.id = "nameLabel";
        label.textContent = "Full name";
        nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.id = "name";
        nameInput.placeholder = "Enter your full name";
        nameInput.maxLength = 100;
        nameInput.required = true;
        const emailLabel = document.querySelector('label[for="email"]');
        emailLabel.parentNode.insertBefore(label, emailLabel);
        emailLabel.parentNode.insertBefore(nameInput, emailLabel);
    } else if (!isRegister && nameInput) {
        document.getElementById("nameLabel")?.remove();
        nameInput.remove();
        nameInput = null;
    }
    document.querySelector(".forgot").style.display = isRegister ? "none" : "";
    showMessage("");
}

togglePassword?.addEventListener("click", () => {
    const visible = passwordInput.type === "password";
    passwordInput.type = visible ? "text" : "password";
    togglePassword.textContent = visible ? "🙈" : "👁";
    togglePassword.setAttribute("aria-label", visible ? "Hide password" : "Show password");
});

signupLink?.addEventListener("click", (event) => {
    event.preventDefault();
    setMode(!registerMode);
});

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = passwordInput.value;
    const name = nameInput?.value.trim();

    if (!email || !password || (registerMode && !name)) {
        showMessage("Please complete all required fields.");
        return;
    }
    if (password.length < 8) {
        showMessage("Password must be at least 8 characters.");
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = registerMode ? "Creating account..." : "Logging in...";
    try {
        const response = await fetch(`${API_BASE}/auth/${registerMode ? "register" : "login"}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(registerMode ? { name, email, password } : { email, password })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || data.detail || (response.status === 409
                ? "An account with this email already exists."
                : "Unable to authenticate. Check your details and try again."));
        }
        localStorage.setItem("expenseWiseToken", data.token);
        localStorage.setItem("expenseWiseUser", JSON.stringify({
            userId: data.userId, name: data.name, email: data.email
        }));
        window.location.href = "dashboard.html";
    } catch (error) {
        showMessage(error.message || "Could not connect to ExpenseWise backend server.");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = registerMode ? "Sign Up" : "Log In";
    }
});

closeButton?.addEventListener("click", () => showMessage("You can close this page when you're finished."));