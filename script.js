const API_URL = localStorage.getItem("pcultra_api_url") || "https://pc-ultra-manager-server.onrender.com";

let token = localStorage.getItem("pcultra_theme_token") || "";
let currentOrderId = null;
let currentThemes = [];
let currentCategory = "todos";
let selectedTheme = null;

const $ = (id) => document.getElementById(id);
const $$ = (query, root = document) => Array.from(root.querySelectorAll(query));

const THEME_VISUALS = {
  windows_11_pro_glass: {
    features: [
      "Interface com vidro translúcido e blur premium",
      "Bordas suaves inspiradas no Windows 11 Pro",
      "Sombras profundas e painel técnico limpo",
      "Animações de entrada e hover suaves",
      "Combina com uso profissional e gamer"
    ],
    chips: ["Glass", "Windows", "Produtivo"],
    palette: ["#0078D4", "#7DD3FC", "#F7FAFF", "#101827"],
    specs: {
      "Estilo": "Windows 11 Pro",
      "Animação": "Suave / Profissional",
      "Foco": "Clareza e produtividade",
      "Visual": "Vidro translúcido"
    }
  },
  cinema_dark_luxury: {
    features: [
      "Atmosfera dark cinematográfica",
      "Aura dourada premium e elegante",
      "Contraste forte sem excesso de cor",
      "Cards com profundidade e sensação de luxo",
      "Ideal para deixar o app com presença de marca grande"
    ],
    chips: ["Cinema", "Luxo", "Dark"],
    palette: ["#B99A5B", "#F7DFA4", "#0B0D12", "#1B2233"],
    specs: {
      "Estilo": "Cinema Premium",
      "Animação": "Entrada dramática",
      "Foco": "Luxo e imersão",
      "Visual": "Dark com dourado"
    }
  },
  liquid_glass_pro: {
    features: [
      "Efeito liquid glass moderno",
      "Camadas com refração leve e transparência controlada",
      "Microinterações fluidas nos botões",
      "Visual limpo com brilho frio e tecnológico",
      "Perfeito para aparência Apple-like premium"
    ],
    chips: ["Liquid", "Apple-like", "Glass"],
    palette: ["#7DD3FC", "#B7F7FF", "#121C2F", "#EAFBFF"],
    specs: {
      "Estilo": "Liquid Glass",
      "Animação": "Fluida / Leve",
      "Foco": "Modernidade",
      "Visual": "Transparência refinada"
    }
  },
  diamond_black_event: {
    features: [
      "Fundo preto cristal com profundidade de diamante",
      "Letras em branco gelo e contornos premium de alto contraste",
      "Brilhos frios, reflexos cortados e aparência de joia escura",
      "Tema especial de evento semanal por tempo limitado",
      "Ideal para testar compra rápida e liberação no app"
    ],
    chips: ["Evento", "Diamond", "Black"],
    palette: ["#030405", "#F8FAFC", "#CBD5E1", "#0A0D12"],
    specs: {
      "Estilo": "Black Crystal",
      "Evento": "Semanal / limitado",
      "Contraste": "Branco gelo",
      "Preço teste": "R$ 2,50"
    }
  },
  matrix_effect_subscription: {
    features: [
      "Chuva de códigos com atmosfera Matrix",
      "Brilho verde digital e fundo preto terminal",
      "Efeito visual hacker/cyber para o app",
      "Assinatura real: libera o tema por 30 dias",
      "Depois de 30 dias, precisa renovar com novo PIX",
      "Preço mensal simbólico para testar entrega e expiração"
    ],
    chips: ["Matrix", "Cyber", "Assinatura"],
    palette: ["#020705", "#00FF66", "#0B2A18", "#C8FFD8"],
    specs: {
      "Estilo": "Matrix Code",
      "Efeito": "Chuva digital",
      "Tipo": "Assinatura mensal",
      "Duração": "30 dias",
      "Preço mensal": "R$ 0,50"
    }
  }
};

const DEFAULT_VISUAL = {
  features: [
    "Tema exclusivo conectado ao servidor",
    "Liberação automática por conta",
    "Compatível com sincronização no app",
    "Visual premium com cores dedicadas"
  ],
  chips: ["Premium", "Servidor", "App"],
  palette: ["#7DD3FC", "#FFFFFF", "#0B1020", "#B99A5B"],
  specs: {
    "Estilo": "Premium",
    "Entrega": "Servidor",
    "Pagamento": "PIX",
    "Compatível": "App principal"
  }
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value) {
  if (typeof value === "string" && value.trim()) return value;
  const cents = Number(value || 0);
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function isSubscription(theme) {
  return theme?.is_subscription || theme?.access_type === "subscription" || String(theme?.category || "").toLowerCase().includes("assinatura");
}

function accessLabel(theme) {
  if (isSubscription(theme)) return `Assinatura mensal • ${theme.duration_label || "30 dias"}`;
  return theme.duration_label || "Compra vitalícia";
}

function visualFor(theme) {
  return THEME_VISUALS[theme?.id] || DEFAULT_VISUAL;
}

function setMessage(id, text, type = "") {
  const element = $(id);
  if (!element) return;
  element.textContent = text || "";
  element.style.color = type === "error" ? "var(--danger)" : type === "success" ? "var(--success)" : type === "warning" ? "var(--warning)" : "var(--muted)";
}

function toast(message, type = "") {
  const host = $("toastHost");
  const item = document.createElement("div");
  item.className = `toast ${type}`;
  item.textContent = message;
  host.appendChild(item);
  setTimeout(() => {
    item.style.opacity = "0";
    item.style.transform = "translateY(8px)";
    setTimeout(() => item.remove(), 260);
  }, 3600);
}

function progress(on) {
  const bar = $("progressBar");
  if (on) {
    bar.style.opacity = "1";
    bar.style.width = "18%";
    requestAnimationFrame(() => { bar.style.width = "72%"; });
  } else {
    bar.style.width = "100%";
    setTimeout(() => {
      bar.style.opacity = "0";
      bar.style.width = "0%";
    }, 280);
  }
}

async function apiRequest(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  progress(true);
  try {
    const response = await fetch(`${API_URL}${path}`, { ...options, headers });
    let data = {};
    try { data = await response.json(); } catch (_) { data = { detail: "Resposta inválida do servidor" }; }
    if (!response.ok) {
      const detail = data.detail || data.message || "Erro no servidor";
      throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
    }
    return data;
  } catch (error) {
    if (String(error.message || "").includes("Failed to fetch")) {
      throw new Error("Não foi possível conectar ao servidor. Confira CORS_ORIGINS no Render e se o servidor está online.");
    }
    throw error;
  } finally {
    progress(false);
  }
}

function setSessionStatus() {
  const username = localStorage.getItem("pcultra_theme_username");
  const online = Boolean(token && username);
  $("sessionStatus").textContent = online ? `Conectado: ${username}` : "Desconectado";
  $("logoutBtn").classList.toggle("hidden", !online);
  $("sessionPill").classList.toggle("online", online);
}

function renderSkeleton() {
  $("themesGrid").innerHTML = `<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>`;
}

function createMockPreview(theme, compact = true) {
  const accent = theme.accent_color || "#7dd3fc";
  const themeClass = `theme-${String(theme?.id || "default").replace(/[^a-z0-9_-]/gi, "_")}`;
  return `
    <div class="mock-app ${themeClass} ${compact ? "" : "modal-preview"}" style="--theme-accent:${escapeHtml(accent)}">
      <div class="mock-sidebar"><span></span><span></span><span></span><span></span></div>
      <div class="mock-main">
        <div class="mock-window-dots"><i></i><i></i><i></i></div>
        <div class="mock-title"></div>
        <div class="mock-grid"><span></span><span></span><span></span></div>
        <div class="mock-line wide"></div>
        <div class="mock-line"></div>
      </div>
    </div>`;
}

function renderCategoryChips(themes) {
  const categories = ["todos", ...new Set(themes.map(t => t.category || "premium"))];
  $("categoryChips").innerHTML = categories.map(cat => `
    <button class="chip ${cat === currentCategory ? "active" : ""}" data-category="${escapeHtml(cat)}">
      ${cat === "todos" ? "Todos" : escapeHtml(cat)}
    </button>
  `).join("");

  $$(".chip", $("categoryChips")).forEach(button => {
    button.addEventListener("click", () => {
      currentCategory = button.dataset.category || "todos";
      renderThemes(currentThemes);
    });
  });
}

function filteredThemes(themes) {
  const query = ($("searchInput")?.value || "").trim().toLowerCase();
  return themes.filter(theme => {
    const visual = visualFor(theme);
    const categoryOk = currentCategory === "todos" || (theme.category || "premium") === currentCategory;
    const haystack = [
      theme.id, theme.name, theme.description, theme.category,
      ...(visual.features || []), ...(visual.chips || [])
    ].join(" ").toLowerCase();
    const queryOk = !query || haystack.includes(query);
    return categoryOk && queryOk;
  });
}

function renderThemes(themes, ownedIds = null) {
  currentThemes = themes || [];
  const grid = $("themesGrid");
  const list = filteredThemes(currentThemes);
  $("metricThemes").textContent = String(currentThemes.length || 0);
  renderCategoryChips(currentThemes);

  if (!list.length) {
    grid.innerHTML = `<article class="theme-card"><h3>Nenhum tema encontrado</h3><p>Tente outra busca ou clique em Atualizar loja.</p></article>`;
    return;
  }

  grid.innerHTML = "";
  for (const theme of list) {
    const visual = visualFor(theme);
    const owned = Boolean(theme.owned || ownedIds?.has(theme.id));
    const subscription = isSubscription(theme);
    const expired = theme.owned_status === "expired";
    const canRenew = subscription && owned;
    const card = document.createElement("article");
    card.className = "theme-card";
    card.style.setProperty("--theme-accent", theme.accent_color || visual.palette?.[0] || "#7dd3fc");
    card.innerHTML = `
      <div class="theme-card-top">
        <span class="theme-category">${escapeHtml(theme.category || "premium")}</span>
        <span class="theme-price">${escapeHtml(theme.price_label || money(theme.price_cents))}</span>
      </div>
      <div class="theme-access ${subscription ? "subscription" : ""}">${escapeHtml(accessLabel(theme))}</div>
      <div class="theme-preview">${createMockPreview(theme, true)}</div>
      <h3>${escapeHtml(theme.name || theme.id)}</h3>
      <p>${escapeHtml(theme.description || "Tema exclusivo conectado ao app principal.")}</p>
      <div class="feature-pills">${(visual.chips || []).slice(0, 3).map(chip => `<span>${escapeHtml(chip)}</span>`).join("")}</div>
      ${owned ? `<span class="theme-owned">✓ ${subscription ? `Assinatura ativa${theme.expires_at ? ` até ${escapeHtml(formatDate(theme.expires_at))}` : ""}` : "Já liberado na sua conta"}</span>` : ""}
      ${expired ? `<span class="theme-expired">Assinatura expirada — renove para usar no app</span>` : ""}
      <div class="theme-actions">
        <button class="btn ghost" data-action="details">Ver detalhes</button>
        <button class="btn ${owned && !canRenew ? "ghost" : "primary"}" data-action="buy" ${owned && !canRenew ? "disabled" : ""}>${canRenew ? "Renovar assinatura" : owned ? "Comprado" : subscription ? "Assinar PIX" : "Comprar PIX"}</button>
      </div>
    `;
    card.querySelector('[data-action="details"]').addEventListener("click", () => openThemeModal(theme, owned));
    const buyButton = card.querySelector('[data-action="buy"]');
    if (!owned || canRenew) buyButton.addEventListener("click", () => openPurchaseModal(theme));
    grid.appendChild(card);
  }
}

async function loadStore() {
  renderSkeleton();
  try {
    let store = await apiRequest("/themes/store");
    let ownedIds = new Set();
    if (token) {
      try {
        const mine = await apiRequest("/themes/my");
        ownedIds = new Set(mine.owned_theme_ids || []);
        store = { themes: mine.store || store.themes || [] };
      } catch (error) {
        if (String(error.message).toLowerCase().includes("token")) logout(false);
      }
    }
    renderThemes(store.themes || [], ownedIds);
    rotateHeroPreview(store.themes || []);
  } catch (error) {
    $("themesGrid").innerHTML = `<article class="theme-card"><h3>Erro ao carregar loja</h3><p>${escapeHtml(error.message)}</p><button class="btn ghost" onclick="loadStore()">Tentar novamente</button></article>`;
    toast(error.message, "error");
  }
}

async function loadMyThemes() {
  if (!token) {
    setMessage("loginMessage", "Faça login para ver seus temas.", "error");
    toast("Faça login primeiro.", "error");
    location.hash = "#account";
    return;
  }
  try {
    const mine = await apiRequest("/themes/my");
    currentCategory = "todos";
    renderThemes(mine.store || mine.themes || [], new Set(mine.owned_theme_ids || []));
    toast("Temas da sua conta sincronizados.", "success");
  } catch (error) {
    toast(error.message, "error");
  }
}

async function login() {
  setMessage("loginMessage", "Entrando...");
  try {
    const username = $("username").value.trim();
    const password = $("password").value;
    if (!username || !password) throw new Error("Digite usuário e senha.");
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
    token = data.token;
    localStorage.setItem("pcultra_theme_token", token);
    localStorage.setItem("pcultra_theme_username", data.username || username);
    setSessionStatus();
    setMessage("loginMessage", "Login realizado. Loja sincronizada.", "success");
    toast("Conta conectada com sucesso.", "success");
    await loadStore();
  } catch (error) {
    setMessage("loginMessage", error.message, "error");
    toast(error.message, "error");
  }
}

async function register() {
  setMessage("loginMessage", "Criando conta...");
  try {
    const username = $("username").value.trim();
    const password = $("password").value;
    if (!username || !password) throw new Error("Digite usuário e senha para criar conta.");
    await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
    setMessage("loginMessage", "Conta criada. Entrando automaticamente...", "success");
    await login();
  } catch (error) {
    setMessage("loginMessage", error.message, "error");
    toast(error.message, "error");
  }
}

function openThemeModal(theme, owned = false) {
  selectedTheme = theme;
  const visual = visualFor(theme);
  $("modalCategory").textContent = theme.category || "premium";
  $("modalTitle").textContent = theme.name || theme.id;
  $("modalDescription").textContent = theme.description || "Tema exclusivo conectado ao app principal.";
  $("modalPrice").textContent = `${theme.price_label || money(theme.price_cents)} • ${accessLabel(theme)}`;
  $("modalPalette").innerHTML = (visual.palette || []).map(color => `<span style="background:${escapeHtml(color)}"></span>`).join("");
  $("modalFeatures").innerHTML = (visual.features || []).map(item => `<li>${escapeHtml(item)}</li>`).join("");
  $("modalPreview").outerHTML = `<div id="modalPreview" class="mock-app modal-preview" style="--theme-accent:${escapeHtml(theme.accent_color || visual.palette?.[0] || "#7dd3fc")}">${createMockPreview(theme, false).replace(/^<div class="mock-app[^>]*>|<\/div>$/g, "")}</div>`;
  $("modalSpecs").innerHTML = Object.entries(visual.specs || {}).map(([key, value]) => `<div><b>${escapeHtml(key)}</b><span>${escapeHtml(value)}</span></div>`).join("");
  const button = $("modalBuyBtn");
  const subscription = isSubscription(theme);
  button.textContent = owned && subscription ? "Renovar assinatura" : owned ? "Já comprado" : subscription ? "Assinar com PIX" : "Comprar com PIX";
  button.disabled = owned && !subscription;
  button.onclick = () => {
    closeThemeModal();
    if (!owned || subscription) openPurchaseModal(theme);
  };
  $("themeModal").classList.remove("hidden");
}

function closeThemeModal() {
  $("themeModal").classList.add("hidden");
}

function openPurchaseModal(theme) {
  if (!token) {
    setMessage("loginMessage", "Faça login antes de comprar.", "error");
    toast("Entre com sua conta antes de comprar.", "error");
    location.hash = "#account";
    return;
  }
  selectedTheme = theme;
  $("purchaseTitle").textContent = `Comprar ${theme.name || theme.id}`;
  $("purchaseSubtitle").textContent = isSubscription(theme)
    ? `${theme.price_label || money(theme.price_cents)} • Assinatura de ${theme.duration_label || "30 dias"}. Depois do pagamento aprovado, você recebe comprovante, tutorial e validade no e-mail.`
    : `${theme.price_label || money(theme.price_cents)} • O tema será liberado na sua conta após o pagamento e o comprovante chegará por e-mail.`;
  $("buyerName").value = localStorage.getItem("pcultra_theme_username") || $("username").value.trim() || "";
  $("buyerEmail").value = localStorage.getItem("pcultra_theme_email") || "";
  setMessage("purchaseMessage", "");
  $("purchaseModal").classList.remove("hidden");
}

function closePurchaseModal() {
  $("purchaseModal").classList.add("hidden");
}

function extractPix(payload) {
  return payload.payment_qr_code || payload.pix_copy_paste || payload.qr_code || payload.qr_code_text || payload?.order?.payment_qr_code || "";
}

function extractQrBase64(payload) {
  return payload.payment_qr_code_base64 || payload.pix_qr_code_base64 || payload.qr_code_base64 || payload?.order?.payment_qr_code_base64 || "";
}

function showPayment(payload) {
  currentOrderId = payload.order_id || payload?.order?.id || null;
  const theme = payload.theme || payload?.order || selectedTheme || {};
  $("payment").classList.remove("hidden");
  $("paymentThemeName").textContent = theme.name || theme.theme_name || "Pedido de tema";
  $("paymentStatus").textContent = payload.message || "Pedido criado. Pague o PIX para liberar o tema. Após aprovação, o comprovante e o tutorial chegam no e-mail informado.";
  $("paymentStatusBadge").textContent = "PIX gerado";

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
    $("qrFallback").textContent = pix ? "O QR Code não veio do servidor. Use o PIX Copia e Cola." : "O servidor não retornou QR Code/PIX.";
  }
  location.hash = "#payment";
}

async function confirmPurchase() {
  if (!selectedTheme) return;
  const buyerName = $("buyerName").value.trim() || localStorage.getItem("pcultra_theme_username") || "Cliente";
  const buyerEmail = $("buyerEmail").value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
    setMessage("purchaseMessage", "Informe um e-mail válido para receber comprovante, tutorial e validade.", "error");
    toast("Informe um e-mail válido.", "error");
    return;
  }
  try {
    setMessage("purchaseMessage", "Criando QR Code PIX...");
    const order = await apiRequest("/themes/purchase", {
      method: "POST",
      body: JSON.stringify({ theme_id: selectedTheme.id, buyer_name: buyerName, buyer_email: buyerEmail })
    });
    if (buyerEmail) localStorage.setItem("pcultra_theme_email", buyerEmail);
    if (order.owned) {
      closePurchaseModal();
      toast("Este tema já está liberado na sua conta.", "success");
      await loadStore();
      return;
    }
    closePurchaseModal();
    showPayment(order);
    setMessage("paymentMessage", "PIX criado com sucesso.", "success");
    toast("QR Code PIX criado.", "success");
  } catch (error) {
    setMessage("purchaseMessage", error.message, "error");
    toast(error.message, "error");
  }
}

async function verifyPayment() {
  if (!currentOrderId) {
    setMessage("paymentMessage", "Nenhum pedido aberto.", "error");
    return;
  }
  try {
    setMessage("paymentMessage", "Verificando pagamento no servidor...");
    const result = await apiRequest(`/themes/orders/${currentOrderId}/payment-status`);
    const order = result.order || {};
    const status = order.status || result.mercadopago_status || "pending";
    if (status === "delivered") {
      $("paymentStatusBadge").textContent = "Tema liberado";
      const expires = order.access_expires_at ? ` Expira em ${formatDate(order.access_expires_at)}.` : "";
      setMessage("paymentMessage", `Pagamento aprovado. Tema liberado no app principal.${expires}`, "success");
      toast(`Tema liberado na sua conta.${expires}`, "success");
      await loadStore();
    } else {
      $("paymentStatusBadge").textContent = status;
      setMessage("paymentMessage", `Status atual: ${status}. Se já pagou, aguarde alguns segundos e tente de novo.`, "warning");
    }
  } catch (error) {
    setMessage("paymentMessage", error.message, "error");
    toast(error.message, "error");
  }
}

async function copyPix() {
  const pix = $("pixCode").value.trim();
  if (!pix) return;
  try {
    await navigator.clipboard.writeText(pix);
    setMessage("paymentMessage", "PIX Copia e Cola copiado.", "success");
    toast("PIX copiado.", "success");
  } catch (_) {
    $("pixCode").select();
    document.execCommand("copy");
    setMessage("paymentMessage", "PIX Copia e Cola copiado.", "success");
  }
}

function logout(showToast = true) {
  token = "";
  localStorage.removeItem("pcultra_theme_token");
  localStorage.removeItem("pcultra_theme_username");
  setSessionStatus();
  if (showToast) toast("Você saiu da conta.");
  loadStore();
}

let heroTimer = null;
function rotateHeroPreview(themes) {
  if (!themes.length) return;
  clearInterval(heroTimer);
  let index = 0;
  const apply = () => {
    const theme = themes[index % themes.length];
    const visual = visualFor(theme);
    $("previewThemeName").textContent = theme.name || theme.id;
    $("previewPrice").textContent = theme.price_label || money(theme.price_cents);
    $("heroMock").style.setProperty("--theme-accent", theme.accent_color || visual.palette?.[0] || "#7dd3fc");
    index += 1;
  };
  apply();
  heroTimer = setInterval(apply, 3200);
}

function wireEvents() {
  $("loginBtn").addEventListener("click", login);
  $("registerBtn").addEventListener("click", register);
  $("reloadStoreBtn").addEventListener("click", loadStore);
  $("myThemesBtn").addEventListener("click", loadMyThemes);
  $("copyPixBtn").addEventListener("click", copyPix);
  $("verifyPaymentBtn").addEventListener("click", verifyPayment);
  $("logoutBtn").addEventListener("click", () => logout(true));
  $("confirmPurchaseBtn").addEventListener("click", confirmPurchase);
  $("searchInput").addEventListener("input", () => renderThemes(currentThemes));
  $$("[data-close-modal]").forEach(el => el.addEventListener("click", closeThemeModal));
  $$("[data-close-purchase]").forEach(el => el.addEventListener("click", closePurchaseModal));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeThemeModal();
      closePurchaseModal();
    }
    if (event.key === "Enter" && document.activeElement === $("password")) login();
  });
}

function revealOnScroll() {
  const items = $$('[data-reveal]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .12 });
  items.forEach(item => observer.observe(item));
}

wireEvents();
revealOnScroll();
setSessionStatus();
loadStore();
