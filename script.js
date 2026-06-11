const API_URL = localStorage.getItem("pcultra_api_url") || "https://pc-ultra-manager-server.onrender.com";

let token = localStorage.getItem("pcultra_theme_token") || "";
let currentOrderId = null;

const $ = (id) => document.getElementById(id);

function money(value) {
  if (typeof value === "string") return value;
  const cents = Number(value || 0);
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function setMessage(id, text, type = "") {
  const element = $(id);
  element.textContent = text || "";
  element.style.color = type === "error" ? "var(--danger)" : type === "success" ? "var(--success)" : "var(--muted)";
}

function setSessionStatus() {
  const username = localStorage.getItem("pcultra_theme_username");
  $("sessionStatus").textContent = token && username ? `Conectado: ${username}` : "Desconectado";
  $("logoutBtn").classList.toggle("hidden", !token);
}

async function apiRequest(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  let data = {};
  try { data = await response.json(); } catch (_) { data = { detail: "Resposta inválida do servidor" }; }
  if (!response.ok) throw new Error(data.detail || data.message || "Erro no servidor");
  return data;
}

async function login() {
  setMessage("loginMessage", "Entrando...");
  try {
    const username = $("username").value.trim();
    const password = $("password").value;
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    token = data.token;
    localStorage.setItem("pcultra_theme_token", token);
    localStorage.setItem("pcultra_theme_username", data.username || username);
    setSessionStatus();
    setMessage("loginMessage", "Login realizado. Loja sincronizada.", "success");
    await loadStore();
  } catch (error) {
    setMessage("loginMessage", error.message, "error");
  }
}

async function register() {
  setMessage("loginMessage", "Criando conta...");
  try {
    const username = $("username").value.trim();
    const password = $("password").value;
    await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setMessage("loginMessage", "Conta criada. Agora entrando...", "success");
    await login();
  } catch (error) {
    setMessage("loginMessage", error.message, "error");
  }
}

function renderThemes(themes, ownedIds = new Set()) {
  const grid = $("themesGrid");
  grid.innerHTML = "";
  if (!themes.length) {
    grid.innerHTML = `<div class="theme-card"><h3>Nenhum tema encontrado</h3><p>Verifique se o servidor está online e se /themes/store existe.</p></div>`;
    return;
  }

  for (const theme of themes) {
    const owned = Boolean(theme.owned || ownedIds.has(theme.id));
    const card = document.createElement("article");
    card.className = "theme-card";
    card.style.setProperty("--theme-accent", theme.accent_color || "#7dd3fc");
    card.innerHTML = `
      <span class="theme-category">${theme.category || "premium"}</span>
      <h3>${theme.name || theme.id}</h3>
      <div class="theme-price">${theme.price_label || money(theme.price_cents)}</div>
      <p>${theme.description || "Tema exclusivo conectado ao app principal."}</p>
      ${owned ? `<span class="theme-owned">Já liberado na sua conta</span>` : ""}
      <button class="${owned ? "ghost" : "primary"}" ${owned ? "disabled" : ""}>${owned ? "Comprado" : "Comprar com PIX"}</button>
    `;
    const button = card.querySelector("button");
    if (!owned) button.addEventListener("click", () => purchaseTheme(theme));
    grid.appendChild(card);
  }
}

async function loadStore() {
  try {
    let store = await apiRequest("/themes/store");
    let ownedIds = new Set();
    if (token) {
      try {
        const mine = await apiRequest("/themes/my");
        ownedIds = new Set(mine.owned_theme_ids || []);
        store = { themes: mine.store || store.themes || [] };
      } catch (_) {}
    }
    renderThemes(store.themes || [], ownedIds);
  } catch (error) {
    $("themesGrid").innerHTML = `<div class="theme-card"><h3>Erro ao carregar loja</h3><p>${error.message}</p></div>`;
  }
}

async function loadMyThemes() {
  if (!token) {
    setMessage("loginMessage", "Faça login para ver seus temas.", "error");
    location.hash = "#login";
    return;
  }
  try {
    const mine = await apiRequest("/themes/my");
    renderThemes(mine.store || mine.themes || [], new Set(mine.owned_theme_ids || []));
  } catch (error) {
    alert(error.message);
  }
}

function extractPix(payload) {
  return payload.payment_qr_code || payload.pix_copy_paste || payload.qr_code || payload.qr_code_text || "";
}

function extractQrBase64(payload) {
  return payload.payment_qr_code_base64 || payload.pix_qr_code_base64 || payload.qr_code_base64 || "";
}

function showPayment(payload) {
  currentOrderId = payload.order_id || payload?.order?.id || null;
  const theme = payload.theme || payload?.order || {};
  $("payment").classList.remove("hidden");
  $("paymentThemeName").textContent = theme.name || theme.theme_name || "Pedido de tema";
  $("paymentStatus").textContent = payload.message || "Pedido criado. Pague o PIX para liberar o tema.";

  const pix = extractPix(payload);
  $("pixCode").value = pix;
  $("copyPixBtn").disabled = !pix;

  const qr = extractQrBase64(payload);
  if (qr) {
    $("qrImage").src = qr.startsWith("data:image") ? qr : `data:image/png;base64,${qr}`;
    $("qrImage").classList.remove("hidden");
    $("qrFallback").classList.add("hidden");
  } else {
    $("qrImage").classList.add("hidden");
    $("qrFallback").classList.remove("hidden");
    $("qrFallback").textContent = pix ? "Use o PIX Copia e Cola ao lado." : "O servidor não retornou QR Code/PIX.";
  }
  location.hash = "#payment";
}

async function purchaseTheme(theme) {
  if (!token) {
    setMessage("loginMessage", "Faça login antes de comprar.", "error");
    location.hash = "#login";
    return;
  }
  const buyerName = localStorage.getItem("pcultra_theme_username") || $("username").value.trim() || "Cliente";
  const buyerEmail = prompt("Digite seu e-mail para o PIX Mercado Pago:", "") || "";
  try {
    setMessage("paymentMessage", "Criando PIX...");
    const order = await apiRequest("/themes/purchase", {
      method: "POST",
      body: JSON.stringify({ theme_id: theme.id, buyer_name: buyerName, buyer_email: buyerEmail }),
    });
    if (order.owned) {
      alert("Este tema já está liberado na sua conta.");
      await loadStore();
      return;
    }
    showPayment(order);
    setMessage("paymentMessage", "PIX criado com sucesso.", "success");
  } catch (error) {
    setMessage("paymentMessage", error.message, "error");
    alert(error.message);
  }
}

async function verifyPayment() {
  if (!currentOrderId) {
    setMessage("paymentMessage", "Nenhum pedido aberto.", "error");
    return;
  }
  try {
    setMessage("paymentMessage", "Verificando pagamento...");
    const result = await apiRequest(`/themes/orders/${currentOrderId}/payment-status`);
    const order = result.order || {};
    const status = order.status || result.mercadopago_status || "pending";
    if (status === "delivered") {
      setMessage("paymentMessage", "Pagamento aprovado. Tema liberado no app principal.", "success");
      await loadStore();
    } else {
      setMessage("paymentMessage", `Status atual: ${status}. Se já pagou, aguarde alguns segundos e tente de novo.`);
    }
  } catch (error) {
    setMessage("paymentMessage", error.message, "error");
  }
}

async function copyPix() {
  const pix = $("pixCode").value.trim();
  if (!pix) return;
  await navigator.clipboard.writeText(pix);
  setMessage("paymentMessage", "PIX Copia e Cola copiado.", "success");
}

function logout() {
  token = "";
  localStorage.removeItem("pcultra_theme_token");
  localStorage.removeItem("pcultra_theme_username");
  setSessionStatus();
  loadStore();
}

$("loginBtn").addEventListener("click", login);
$("registerBtn").addEventListener("click", register);
$("reloadStoreBtn").addEventListener("click", loadStore);
$("myThemesBtn").addEventListener("click", loadMyThemes);
$("copyPixBtn").addEventListener("click", copyPix);
$("verifyPaymentBtn").addEventListener("click", verifyPayment);
$("logoutBtn").addEventListener("click", logout);

setSessionStatus();
loadStore();
