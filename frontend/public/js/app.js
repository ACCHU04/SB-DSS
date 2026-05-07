// js/app.js — Main App Controller

const PAGE_CONFIG = {
  dashboard:  { title: '📊 Dashboard',               render: renderDashboard },
  decision:   { title: '🧠 Decision Engine',          render: renderDecision },
  products:   { title: '📦 Product Master',           render: renderProducts },
  sales:      { title: '🧾 Record Sale',              render: renderSales },
  inventory:  { title: '🗃️ Inventory Tracker',        render: renderInventory },
  profit:     { title: '💰 Profit & Loss',            render: renderProfit },
  credits:    { title: '📒 Udhar (Credit) Tracker',   render: renderCredits },
  purchases:  { title: '🛒 Purchase / Stock-In',      render: renderPurchases },
  wastage:    { title: '🗑️ Wastage Log',              render: renderWastage },
  suppliers:  { title: '🚚 Supplier Tracker',         render: renderSuppliers },
  competitor: { title: '🏷️ Competitor Prices',        render: renderCompetitor },
  requests:   { title: '💬 Customer Requests',        render: renderRequests },
  seasonal:   { title: '🎉 Festival Planner',         render: renderSeasonal },
};

let currentPage = 'dashboard';
let appInitialized = false;

function setSidebarOpen(open) {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('mobile-nav-backdrop');
  const toggle = document.getElementById('mobile-nav-toggle');
  if (!sidebar || !backdrop || !toggle) return;

  sidebar.classList.toggle('open', open);
  backdrop.classList.toggle('open', open);
  document.body.classList.toggle('nav-open', open);
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function initializeMobileNav() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('mobile-nav-backdrop');
  const toggle = document.getElementById('mobile-nav-toggle');
  if (!sidebar || !backdrop || !toggle) return;

  toggle.addEventListener('click', () => {
    const nextState = !sidebar.classList.contains('open');
    setSidebarOpen(nextState);
  });

  backdrop.addEventListener('click', () => setSidebarOpen(false));

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) setSidebarOpen(false);
  });
}

function navigate(page) {
  if (!PAGE_CONFIG[page]) return;

  // Hide all sections
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Show selected
  document.getElementById(`page-${page}`).classList.add('active');
  const navItem = document.querySelector(`[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');

  // Update heading
  document.getElementById('page-heading').textContent = PAGE_CONFIG[page].title;
  currentPage = page;

  // Render page content
  PAGE_CONFIG[page].render();

  // Auto-close mobile nav after selecting a section.
  if (window.innerWidth <= 768) {
    setSidebarOpen(false);
  }
}

// ===== MODAL =====
function openModal(title, bodyHTML, buttons = []) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;

  const footer = document.getElementById('modal-footer');
  footer.innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
    ${buttons.map(b => `<button class="btn ${b.cls}" onclick="${b.action}">${b.label}</button>`).join('')}
  `;

  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal(event) {
  if (event && event.target !== document.getElementById('modal-overlay')) return;
  document.getElementById('modal-overlay').classList.remove('open');
  document.getElementById('modal-body').innerHTML = '';
  document.getElementById('modal-footer').innerHTML = '';
}

// ===== TOAST =====
let toastTimer = null;
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

// ===== INIT =====
function initializeMainApp() {
  if (appInitialized) return;
  appInitialized = true;

  initializeMobileNav();

  // Set today's date
  const now = new Date();
  document.getElementById('today-date').textContent = now.toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // Keyboard shortcut: Escape closes modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // Load dashboard on start
  navigate('dashboard');
}

function waitForAuthBootstrap(triesLeft = 30) {
  if (typeof window.initAuthUI === 'function') {
    window.initAuthUI(initializeMainApp);
    return;
  }

  if (triesLeft <= 0) {
    initializeMainApp();
    return;
  }

  setTimeout(() => waitForAuthBootstrap(triesLeft - 1), 100);
}

document.addEventListener('DOMContentLoaded', () => {
  waitForAuthBootstrap();
});
