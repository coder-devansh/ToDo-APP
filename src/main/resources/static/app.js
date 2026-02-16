const authCard = document.getElementById("authCard");
const todoCard = document.getElementById("todoCard");
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const authMessage = document.getElementById("authMessage");
const todoMessage = document.getElementById("todoMessage");
const todoForm = document.getElementById("todoForm");
const todoList = document.getElementById("todoList");
const logoutBtn = document.getElementById("logoutBtn");
const welcomeText = document.getElementById("welcomeText");
const doneCount = document.getElementById("doneCount");
const openCount = document.getElementById("openCount");
const todoItemTemplate = document.getElementById("todoItemTemplate");
const filterButtons = document.querySelectorAll(".chip");
const passwordToggles = document.querySelectorAll(".toggle-pass");
const toastStack = document.getElementById("toastStack");

const state = {
    token: localStorage.getItem("todo_token") || "",
    identity: localStorage.getItem("todo_identity") || "",
    todos: [],
    filter: "all"
};

function setMessage(el, msg, type = "info") {
    el.textContent = msg || "";
    if (type === "error") {
        el.style.color = "#bb2f36";
    } else if (type === "ok") {
        el.style.color = "#1f8f52";
    } else {
        el.style.color = "#5f6778";
    }
}

function showToast(message, type = "ok") {
    if (!toastStack) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastStack.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(6px)";
        setTimeout(() => toast.remove(), 200);
    }, 2200);
}

function setSession(token, identity) {
    state.token = token;
    state.identity = identity;
    localStorage.setItem("todo_token", token);
    localStorage.setItem("todo_identity", identity);
}

function clearSession() {
    state.token = "";
    state.identity = "";
    state.todos = [];
    localStorage.removeItem("todo_token");
    localStorage.removeItem("todo_identity");
}

function decodeJwtSubject(token) {
    try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        return payload.sub || "";
    } catch {
        return "";
    }
}

const API_BASE = window.location.origin;
const ALLOWED_ORIGINS = new Set(["http://localhost:8080", "http://127.0.0.1:8080"]);

async function api(path, options = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (state.token) {
        headers.Authorization = `Bearer ${state.token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    let body = null;

    try {
        body = await response.json();
    } catch {
        body = null;
    }

    if (!response.ok) {
        const message = body?.message || body?.error || `Request failed (${response.status})`;
        throw new Error(message);
    }

    return body;
}

function switchAuthTab(tab) {
    const login = tab === "login";
    loginTab.classList.toggle("active", login);
    registerTab.classList.toggle("active", !login);
    loginForm.classList.toggle("active", login);
    registerForm.classList.toggle("active", !login);
    setMessage(authMessage, "");
}

function applyAuthView() {
    const loggedIn = !!state.token;
    authCard.classList.toggle("hidden", loggedIn);
    todoCard.classList.toggle("hidden", !loggedIn);
    welcomeText.textContent = state.identity ? `${state.identity}'s Tasks` : "Your Tasks";
}

function updateSummary() {
    const done = state.todos.filter(todo => todo.completed).length;
    doneCount.textContent = String(done);
    openCount.textContent = String(Math.max(0, state.todos.length - done));
}

function filteredTodos() {
    if (state.filter === "open") return state.todos.filter(todo => !todo.completed);
    if (state.filter === "done") return state.todos.filter(todo => todo.completed);
    return state.todos;
}

function renderTodos() {
    todoList.innerHTML = "";
    const todos = filteredTodos();
    if (!todos.length) {
        const li = document.createElement("li");
        li.className = "todo-item";
        li.innerHTML = "<p class='todo-desc'>No tasks in this view yet.</p>";
        todoList.appendChild(li);
        updateSummary();
        return;
    }

    todos.forEach(todo => {
        const node = todoItemTemplate.content.firstElementChild.cloneNode(true);
        node.classList.toggle("done", todo.completed);

        node.querySelector(".todo-title").textContent = todo.title;
        node.querySelector(".todo-desc").textContent = todo.description || "No description";

        const toggleBtn = node.querySelector(".toggle-btn");
        toggleBtn.textContent = todo.completed ? "Mark Open" : "Mark Done";
        toggleBtn.addEventListener("click", async () => {
            await updateTodo(todo, { completed: !todo.completed });
        });

        const deleteBtn = node.querySelector(".delete-btn");
        deleteBtn.addEventListener("click", async () => {
            await deleteTodo(todo.id);
        });

        todoList.appendChild(node);
    });

    updateSummary();
}

async function loadTodos() {
    try {
        state.todos = await api("/api/todos");
        renderTodos();
        setMessage(todoMessage, "");
    } catch (error) {
        if (String(error.message).includes("401")) {
            clearSession();
            applyAuthView();
            setMessage(authMessage, "Session expired. Please login again.", "error");
            return;
        }
        setMessage(todoMessage, error.message, "error");
    }
}

async function updateTodo(todo, patch) {
    try {
        const payload = {
            id: todo.id,
            title: patch.title ?? todo.title,
            description: patch.description ?? todo.description,
            completed: patch.completed ?? todo.completed
        };
        const updated = await api(`/api/todos/${todo.id}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });
        state.todos = state.todos.map(item => (item.id === updated.id ? updated : item));
        renderTodos();
        showToast("Task updated.", "ok");
    } catch (error) {
        setMessage(todoMessage, error.message, "error");
    }
}

async function deleteTodo(id) {
    try {
        await api(`/api/todos/${id}`, { method: "DELETE" });
        state.todos = state.todos.filter(todo => todo.id !== id);
        renderTodos();
        showToast("Task deleted.", "ok");
    } catch (error) {
        setMessage(todoMessage, error.message, "error");
    }
}

loginTab.addEventListener("click", () => switchAuthTab("login"));
registerTab.addEventListener("click", () => switchAuthTab("register"));

loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    const form = new FormData(loginForm);
    const payload = {
        usernameOrEmail: String(form.get("usernameOrEmail") || "").trim(),
        password: String(form.get("password") || "")
    };

    try {
        const data = await api("/login", {
            method: "POST",
            body: JSON.stringify(payload)
        });
        const identity = decodeJwtSubject(data.token) || payload.usernameOrEmail;
        setSession(data.token, identity);
        applyAuthView();
        await loadTodos();
        showToast("Logged in.", "ok");
    } catch (error) {
        setMessage(authMessage, error.message, "error");
    }
});

registerForm.addEventListener("submit", async event => {
    event.preventDefault();
    const form = new FormData(registerForm);
    const payload = {
        username: String(form.get("username") || "").trim(),
        email: String(form.get("email") || "").trim(),
        password: String(form.get("password") || "")
    };

    try {
        const data = await api("/register", {
            method: "POST",
            body: JSON.stringify(payload)
        });
        const identity = decodeJwtSubject(data.token) || payload.username;
        setSession(data.token, identity);
        applyAuthView();
        await loadTodos();
        setMessage(authMessage, "");
    } catch (error) {
        setMessage(authMessage, error.message, "error");
    }
});

todoForm.addEventListener("submit", async event => {
    event.preventDefault();
    const payload = {
        title: document.getElementById("todoTitle").value.trim(),
        description: document.getElementById("todoDescription").value.trim(),
        completed: false
    };

    if (!payload.title) {
        setMessage(todoMessage, "Title is required.", "error");
        return;
    }

    try {
        const created = await api("/api/todos", {
            method: "POST",
            body: JSON.stringify(payload)
        });
        state.todos.unshift(created);
        todoForm.reset();
        renderTodos();
        showToast("Task created.", "ok");
    } catch (error) {
        setMessage(todoMessage, error.message, "error");
    }
});

logoutBtn.addEventListener("click", () => {
    clearSession();
    applyAuthView();
    switchAuthTab("login");
    renderTodos();
    showToast("Logged out.", "ok");
    setMessage(authMessage, "");
});

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        filterButtons.forEach(item => item.classList.remove("active"));
        button.classList.add("active");
        state.filter = button.dataset.filter;
        renderTodos();
    });
});

passwordToggles.forEach(toggle => {
    toggle.addEventListener("click", () => {
        const inputId = toggle.dataset.target;
        const input = document.getElementById(inputId);
        if (!input) return;
        const isHidden = input.type === "password";
        input.type = isHidden ? "text" : "password";
        toggle.classList.toggle("is-visible", isHidden);
        toggle.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
    });
});

function init() {
    switchAuthTab("login");
    applyAuthView();
    renderTodos();
    if (!ALLOWED_ORIGINS.has(window.location.origin)) {
        setMessage(authMessage, "Open this app at http://localhost:8080 to sign in.", "error");
        loginForm.querySelectorAll("input, button").forEach(el => (el.disabled = true));
        registerForm.querySelectorAll("input, button").forEach(el => (el.disabled = true));
        return;
    }
    if (state.token) {
        if (!state.identity) {
            state.identity = decodeJwtSubject(state.token);
        }
        applyAuthView();
        loadTodos();
    }
}

init();
