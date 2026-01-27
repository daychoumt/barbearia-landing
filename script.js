// ===== CONFIG =====
const WHATSAPP_NUMBER = "5511999999999"; // troque depois
const DEFAULT_MESSAGE =
  "Olá! Quero agendar um horário na barbearia. Pode me informar os horários disponíveis?";

// ===== STORAGE KEYS =====
const STORAGE_KEY = "wpp_metrics_v1";

// ===== HELPERS =====
function buildWhatsAppLink(number, message) {
  const clean = String(number || "").replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message || "")}`;
}

function nowString() {
  const d = new Date();
  // formato simples: DD/MM HH:MM
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${mi}`;
}

function loadMetrics() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { total: 0, byService: {}, lastClick: null };
    }
    const parsed = JSON.parse(raw);
    return {
      total: Number(parsed.total || 0),
      byService: parsed.byService || {},
      lastClick: parsed.lastClick || null,
    };
  } catch {
    return { total: 0, byService: {}, lastClick: null };
  }
}

function saveMetrics(metrics) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
}

function trackClick(serviceName) {
  const m = loadMetrics();
  m.total += 1;

  const key = (serviceName || "Geral").trim();
  m.byService[key] = (m.byService[key] || 0) + 1;

  m.lastClick = { service: key, at: nowString() };
  saveMetrics(m);
}

function getTopService(byService) {
  const entries = Object.entries(byService || {});
  if (!entries.length) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return { service: entries[0][0], count: entries[0][1] };
}

// ===== APPLY WHATSAPP LINKS + TRACKING =====
document.querySelectorAll("[data-whatsapp]").forEach((el) => {
  const service = el.getAttribute("data-service");

  let message = DEFAULT_MESSAGE;
  if (service) {
    message = `Olá! Quero agendar um ${service}. Quais horários estão disponíveis?`;
  }

  el.href = buildWhatsAppLink(WHATSAPP_NUMBER, message);
  el.target = "_blank";
  el.rel = "noopener noreferrer";

  // Tracking: conta clique no momento do click
  el.addEventListener("click", () => {
    trackClick(service || "Geral");
    // atualiza painel se estiver aberto
    renderMetricsIfAdmin();
  });
});

// ===== ANO AUTOMÁTICO =====
const anoEl = document.getElementById("ano");
if (anoEl) anoEl.textContent = new Date().getFullYear();

// ===== ADMIN MODE (mostrar painel com ?admin=1) =====
function isAdminMode() {
  const params = new URLSearchParams(window.location.search);
  return params.get("admin") === "1";
}

function renderMetricsIfAdmin() {
  const panel = document.getElementById("metrics");
  if (!panel) return;

  if (!isAdminMode()) {
    panel.hidden = true;
    return;
  }

  panel.hidden = false;

  const m = loadMetrics();
  const top = getTopService(m.byService);

  const totalEl = document.getElementById("m_total");
  const topEl = document.getElementById("m_top");
  const lastEl = document.getElementById("m_last");
  const servicesEl = document.getElementById("m_services");

  if (totalEl) totalEl.textContent = String(m.total);
  if (topEl) topEl.textContent = top ? `${top.service} (${top.count})` : "—";
  if (lastEl) lastEl.textContent = m.lastClick ? `${m.lastClick.service} • ${m.lastClick.at}` : "—";

  if (servicesEl) {
    const entries = Object.entries(m.byService || {}).sort((a, b) => b[1] - a[1]);
    servicesEl.innerHTML = entries.length
      ? entries
          .map(([name, count]) => {
            return `<div class="metrics__row"><span>${name}</span><strong>${count}</strong></div>`;
          })
          .join("")
      : `<div class="metrics__row"><span>—</span><strong>0</strong></div>`;
  }

  // Botões
  const resetBtn = document.getElementById("m_reset");
  if (resetBtn && !resetBtn.dataset.bound) {
    resetBtn.dataset.bound = "1";
    resetBtn.addEventListener("click", () => {
      if (!confirm("Zerar as métricas deste navegador?")) return;
      saveMetrics({ total: 0, byService: {}, lastClick: null });
      renderMetricsIfAdmin();
    });
  }

  const copyBtn = document.getElementById("m_copy");
  if (copyBtn && !copyBtn.dataset.bound) {
    copyBtn.dataset.bound = "1";
    copyBtn.addEventListener("click", async () => {
      const lines = [];
      lines.push(`Métricas WhatsApp`);
      lines.push(`Total: ${m.total}`);
      if (top) lines.push(`Top: ${top.service} (${top.count})`);
      if (m.lastClick) lines.push(`Último: ${m.lastClick.service} • ${m.lastClick.at}`);
      lines.push(`Por serviço:`);
      const entries = Object.entries(m.byService || {}).sort((a, b) => b[1] - a[1]);
      if (!entries.length) lines.push(`- (sem dados)`);
      else entries.forEach(([n, c]) => lines.push(`- ${n}: ${c}`));

      try {
        await navigator.clipboard.writeText(lines.join("\n"));
        copyBtn.textContent = "Copiado!";
        setTimeout(() => (copyBtn.textContent = "Copiar resumo"), 1200);
      } catch {
        alert("Não consegui copiar automaticamente. Seu navegador bloqueou a área de transferência.");
      }
    });
  }
}

// Render inicial
renderMetricsIfAdmin();
