const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:8081/api"
    : (window.location.protocol === "https:"
        ? `${window.location.origin}/api`
        : `http://${window.location.hostname}:8081/api`);

const token = localStorage.getItem("expenseWiseToken");
const currentUser = JSON.parse(localStorage.getItem("expenseWiseUser") || "null");

if (!token) {
    window.location.replace("index.html");
}

let expenses = [];
let categoryPieChart = null;
let spendingLineChart = null;

const expenseForm = document.getElementById("expenseForm");
const expenseTable = document.getElementById("expenseTable");
const emptyMessage = document.getElementById("emptyMessage");
const totalAmount = document.getElementById("totalAmount");
const totalTransactions = document.getElementById("totalTransactions");
const monthlyAmount = document.getElementById("monthlyAmount");
const formTitle = document.getElementById("formTitle");
const saveButton = document.getElementById("saveButton");

const dateInput = document.getElementById("date");
dateInput.value = new Date().toISOString().split("T")[0];

// The current backend stores title and notes. The existing dashboard's
// Description field maps to title, and Payment is encoded in notes.
function fromApi(item) {
    const match = (item.notes || "").match(/^Payment:\s*([^|]*)(?:\s*\|\s*(.*))?$/);
    return {
        id: String(item.id),
        amount: Number(item.amount),
        category: item.category || "Other",
        date: item.date,
        payment: match ? match[1].trim() : "Cash",
        description: item.title || "",
        notes: match?.[2] || ""
    };
}

function toApi(expense) {
    return {
        title: (expense.description || expense.category || "Expense").trim(),
        amount: Number(expense.amount),
        category: expense.category,
        date: expense.date,
        notes: `Payment: ${expense.payment || "Cash"}${expense.notes ? " | " + expense.notes : ""}`
    };
}

async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            ...(options.headers || {})
        }
    });
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("expenseWiseToken");
        localStorage.removeItem("expenseWiseUser");
        window.location.replace("index.html");
        throw new Error("Your session expired. Please log in again.");
    }
    if (!response.ok) {
        let message = `Request failed (${response.status}).`;
        try {
            const body = await response.json();
            message = body.detail || body.message || body.error || message;
        } catch {}
        throw new Error(message);
    }
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

function setStatus(message, isError = false) {
    let status = document.getElementById("apiStatus");
    if (!status) {
        status = document.createElement("p");
        status.id = "apiStatus";
        status.setAttribute("role", "status");
        status.style.cssText = "margin:10px 0;color:#0a8a4a;font-size:14px;";
        document.querySelector(".page-heading")?.appendChild(status);
    }
    status.style.color = isError ? "#e53935" : "#0a8a4a";
    status.textContent = message;
}

function logout() {
    localStorage.removeItem("expenseWiseToken");
    localStorage.removeItem("expenseWiseUser");
    window.location.href = "index.html";
}

function setupUserControls() {
    const nav = document.querySelector(".navbar nav");
    if (!nav) return;
    const userLabel = document.createElement("span");
    userLabel.textContent = currentUser?.name ? `Hi, ${currentUser.name}` : "";
    userLabel.style.cssText = "padding:8px 12px;font-weight:600;";
    nav.appendChild(userLabel);
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Log out";
    button.className = "primary-btn";
    button.style.cssText = "padding:8px 14px;margin-left:8px;";
    button.addEventListener("click", logout);
    nav.appendChild(button);
}

expenseForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = document.getElementById("expenseId").value;
    const amount = Number(document.getElementById("amount").value);
    const category = document.getElementById("category").value;
    const date = dateInput.value;
    const payment = document.getElementById("payment").value;
    const description = document.getElementById("description").value.trim();

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }
    if (!description) {
        alert("Please enter a description.");
        return;
    }

    const payload = toApi({ amount, category, date, payment, description });
    saveButton.disabled = true;
    try {
        const result = await apiRequest(id ? `/expenses/${encodeURIComponent(id)}` : "/expenses", {
            method: id ? "PUT" : "POST",
            body: JSON.stringify(payload)
        });
        const mapped = fromApi(result);
        if (id) {
            expenses = expenses.map(item => item.id === String(id) ? mapped : item);
        } else {
            expenses.unshift(mapped);
        }
        resetForm();
        renderExpenses();
        createPieChart();
        createLineChart();
        setStatus(id ? "Expense updated." : "Expense added.");
    } catch (error) {
        setStatus(error.message, true);
    } finally {
        saveButton.disabled = false;
    }
});

async function loadExpenses() {
    try {
        const data = await apiRequest("/expenses", { method: "GET" });
        expenses = (data || []).map(fromApi);
        renderExpenses();
        createPieChart();
        createLineChart();
    } catch (error) {
        if (localStorage.getItem("expenseWiseToken")) setStatus(error.message, true);
    }
}

function renderExpenses() {
    const filteredExpenses = getFilteredExpenses();
    expenseTable.innerHTML = "";
    emptyMessage.style.display = filteredExpenses.length === 0 ? "block" : "none";

    filteredExpenses.forEach(expense => {
        const row = document.createElement("tr");
        const values = [
            formatDate(expense.date),
            expense.category,
            expense.description,
            expense.payment,
            `₹${Number(expense.amount).toFixed(2)}`
        ];
        values.forEach((value, index) => {
            const cell = document.createElement("td");
            if (index === 1) {
                const badge = document.createElement("span");
                badge.className = "category-badge";
                badge.textContent = value;
                cell.appendChild(badge);
            } else {
                cell.textContent = value;
            }
            if (index === 4) cell.className = "amount";
            row.appendChild(cell);
        });

        const actions = document.createElement("td");
        const edit = document.createElement("button");
        edit.className = "action-btn edit-btn";
        edit.textContent = "Edit";
        edit.addEventListener("click", () => editExpense(expense.id));
        const del = document.createElement("button");
        del.className = "action-btn delete-btn";
        del.textContent = "Delete";
        del.addEventListener("click", () => deleteExpense(expense.id));
        actions.append(edit, document.createTextNode(" "), del);
        row.appendChild(actions);
        expenseTable.appendChild(row);
    });
    updateSummary();
}

function createPieChart() {
    const totals = {};
    expenses.forEach(expense => totals[expense.category] = (totals[expense.category] || 0) + Number(expense.amount));
    const canvas = document.getElementById("categoryPieChart");
    if (!canvas || typeof Chart === "undefined") return;
    if (categoryPieChart) categoryPieChart.destroy();
    if (!Object.keys(totals).length) return;
    categoryPieChart = new Chart(canvas, {
        type: "pie",
        data: { labels: Object.keys(totals), datasets: [{ label: "Expenses", data: Object.values(totals), borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }
    });
}

function createLineChart() {
    const totals = {};
    expenses.forEach(expense => totals[expense.date] = (totals[expense.date] || 0) + Number(expense.amount));
    const dates = Object.keys(totals).sort();
    const canvas = document.getElementById("spendingLineChart");
    if (!canvas || typeof Chart === "undefined") return;
    if (spendingLineChart) spendingLineChart.destroy();
    if (!dates.length) return;
    spendingLineChart = new Chart(canvas, {
        type: "line",
        data: { labels: dates.map(formatDate), datasets: [{ label: "Daily Spending", data: dates.map(date => totals[date]), fill: true, tension: 0.3, borderWidth: 3, pointRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { callback: value => "₹" + value } } } }
    });
}

function editExpense(id) {
    const expense = expenses.find(item => item.id === String(id));
    if (!expense) return;
    document.getElementById("expenseId").value = expense.id;
    document.getElementById("amount").value = expense.amount;
    document.getElementById("category").value = expense.category;
    dateInput.value = expense.date;
    document.getElementById("payment").value = expense.payment;
    document.getElementById("description").value = expense.description;
    formTitle.textContent = "Edit Expense";
    saveButton.textContent = "Update Expense";
    document.getElementById("addExpense").scrollIntoView({ behavior: "smooth" });
}

async function deleteExpense(id) {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
        await apiRequest(`/expenses/${encodeURIComponent(id)}`, { method: "DELETE" });
        expenses = expenses.filter(item => item.id !== String(id));
        renderExpenses();
        createPieChart();
        createLineChart();
        setStatus("Expense deleted.");
    } catch (error) {
        setStatus(error.message, true);
    }
}

function resetForm() {
    expenseForm.reset();
    document.getElementById("expenseId").value = "";
    dateInput.value = new Date().toISOString().split("T")[0];
    formTitle.textContent = "Add Expense";
    saveButton.textContent = "Add Expense";
}

function openAddForm() {
    resetForm();
    document.getElementById("addExpense").scrollIntoView({ behavior: "smooth" });
}

function getFilteredExpenses() {
    const search = document.getElementById("searchInput").value.toLowerCase().trim();
    const category = document.getElementById("filterCategory").value;
    const payment = document.getElementById("filterPayment").value;
    const fromDate = document.getElementById("fromDate").value;
    const toDate = document.getElementById("toDate").value;
    return expenses.filter(expense => {
        const text = `${expense.description} ${expense.category}`.toLowerCase();
        return (!search || text.includes(search)) &&
            (category === "All" || expense.category === category) &&
            (payment === "All" || expense.payment === payment) &&
            (!fromDate || expense.date >= fromDate) &&
            (!toDate || expense.date <= toDate);
    });
}

function clearFilters() {
    document.getElementById("searchInput").value = "";
    document.getElementById("filterCategory").value = "All";
    document.getElementById("filterPayment").value = "All";
    document.getElementById("fromDate").value = "";
    document.getElementById("toDate").value = "";
    renderExpenses();
}

function updateSummary() {
    const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    totalAmount.textContent = "₹" + total.toFixed(2);
    totalTransactions.textContent = String(expenses.length);
    const now = new Date();
    const monthTotal = expenses.filter(expense => {
        const date = new Date(`${expense.date}T00:00:00`);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).reduce((sum, expense) => sum + Number(expense.amount), 0);
    monthlyAmount.textContent = "₹" + monthTotal.toFixed(2);
}

function formatDate(date) {
    if (!date) return "";
    const parts = date.split("-");
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : date;
}

document.getElementById("searchInput").addEventListener("input", renderExpenses);
document.getElementById("filterCategory").addEventListener("change", renderExpenses);
document.getElementById("filterPayment").addEventListener("change", renderExpenses);
document.getElementById("fromDate").addEventListener("change", renderExpenses);
document.getElementById("toDate").addEventListener("change", renderExpenses);

setupUserControls();
loadExpenses();