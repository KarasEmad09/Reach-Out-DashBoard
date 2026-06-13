/* === STATE === */
let customers = [];
let activityLog = [];
let settings = {};
let currentRoute = "";
let chartInstance = null;

/* === DATA LAYER === */
function loadData() {
  const storedCustomers = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
  const storedActivity = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
  const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);

  if (storedCustomers) {
    customers = JSON.parse(storedCustomers);
  } else {
    customers = JSON.parse(JSON.stringify(SAMPLE_CUSTOMERS));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }

  if (storedActivity) {
    activityLog = JSON.parse(storedActivity);
  } else {
    activityLog = JSON.parse(JSON.stringify(SAMPLE_ACTIVITY));
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(activityLog));
  }

  if (storedSettings) {
    settings = JSON.parse(storedSettings);
  } else {
    settings = { theme: "light" };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(activityLog));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

function addActivity(type, customerName, description) {
  const activity = {
    id: "act_" + Date.now(),
    type: type,
    customerName: customerName,
    description: description,
    timestamp: new Date().toISOString()
  };
  activityLog.unshift(activity);
  saveData();
}

/* === SIDEBAR === */
function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="12" width="4" height="9" rx="1" fill="#3B82F6"/>
        <rect x="10" y="7" width="4" height="14" rx="1" fill="#3B82F6"/>
        <rect x="17" y="3" width="4" height="18" rx="1" fill="#3B82F6"/>
      </svg>
      <span class="sidebar-logo-text">Sales<span class="sidebar-logo-highlight">Hub</span></span>
    </div>
    <div class="sidebar-divider"></div>
    <ul class="sidebar-nav">
      <li class="nav-item" data-route="#dashboard">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span>Dashboard</span>
      </li>
      <li class="nav-section-label">CUSTOMERS</li>
      <li class="nav-parent" data-submenu="customers">
        <div class="nav-item nav-parent-trigger">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span>Customers</span>
          <svg class="nav-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <ul class="submenu submenu--open">
          <li class="nav-item nav-child" data-route="#customers-all"><span>All Customers</span></li>
          <li class="nav-item nav-child" data-route="#customers-new-leads"><span>New Leads</span></li>
          <li class="nav-item nav-child" data-route="#customers-interested"><span>Interested Customers</span></li>
          <li class="nav-item nav-child" data-route="#customers-hot-leads"><span>Hot Leads</span></li>
          <li class="nav-item nav-child" data-route="#customers-follow-ups"><span>Follow Ups</span></li>
        </ul>
      </li>
      <li class="nav-section-label">DEALS</li>
      <li class="nav-parent" data-submenu="deals">
        <div class="nav-item nav-parent-trigger">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <span>Deals</span>
          <svg class="nav-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <ul class="submenu submenu--open">
          <li class="nav-item nav-child" data-route="#deals-won"><span>Won Deals</span></li>
          <li class="nav-item nav-child" data-route="#deals-lost"><span>Lost Deals</span></li>
        </ul>
      </li>
      <li class="sidebar-divider"></li>
      <li class="nav-item" data-route="#notes">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        <span>Notes & Questions</span>
      </li>
      <li class="nav-item" data-route="#settings">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        <span>Settings</span>
      </li>
    </ul>
    <div class="sidebar-collapse-btn" onclick="toggleSidebar()">
      <svg class="collapse-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
    </div>
  `;

  // Attach nav item click handlers
  sidebar.querySelectorAll('.nav-item[data-route]').forEach(item => {
    item.addEventListener('click', () => {
      window.location.hash = item.getAttribute('data-route');
    });
  });

  // Attach submenu toggle handlers
  sidebar.querySelectorAll('.nav-parent-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const parent = trigger.closest('.nav-parent');
      const submenu = parent.querySelector('.submenu');
      submenu.classList.toggle('submenu--open');
    });
  });
}

function toggleSidebar() {
  const app = document.getElementById('app');
  app.classList.toggle('sidebar-collapsed');
}

function updateSidebarActive(hash) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('nav-item--active');
  });
  const activeItem = document.querySelector('.nav-item[data-route="' + hash + '"]');
  if (activeItem) {
    activeItem.classList.add('nav-item--active');
  }
}

/* === TOPBAR === */
function renderTopbar() {
  const topbar = document.getElementById('topbar');
  topbar.innerHTML = `
    <h1 id="page-title" class="topbar-title">Dashboard</h1>
    <div class="topbar-right">
      <div class="topbar-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="global-search" placeholder="Search customers...">
      </div>
      <button id="notif-bell" class="topbar-icon-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <span class="notif-badge">${activityLog.length}</span>
      </button>
      <div class="user-avatar">AD</div>
    </div>
  `;
}

/* === ROUTER === */
const PAGE_NAMES = {
  "#dashboard": "Dashboard",
  "#customers-all": "All Customers",
  "#customers-new-leads": "New Leads",
  "#customers-interested": "Interested Customers",
  "#customers-hot-leads": "Hot Leads",
  "#customers-follow-ups": "Follow Ups",
  "#deals-won": "Won Deals",
  "#deals-lost": "Lost Deals",
  "#notes": "Notes & Questions",
  "#settings": "Settings"
};

const ROUTES = {
  "#dashboard": () => {},
  "#customers-all": () => {},
  "#customers-new-leads": () => {},
  "#customers-interested": () => {},
  "#customers-hot-leads": () => {},
  "#customers-follow-ups": () => {},
  "#deals-won": () => {},
  "#deals-lost": () => {},
  "#notes": () => {},
  "#settings": () => {}
};

function router() {
  const hash = window.location.hash || "#dashboard";
  currentRoute = hash;

  // Update page title
  const titleEl = document.getElementById('page-title');
  if (titleEl) {
    titleEl.textContent = PAGE_NAMES[hash] || "Dashboard";
  }

  // Update sidebar active state
  updateSidebarActive(hash);

  // Call route handler
  if (ROUTES[hash]) {
    ROUTES[hash]();
  } else if (hash.startsWith("#customer/")) {
    const id = hash.replace("#customer/", "");
    if (typeof renderCustomerDetail === "function") {
      renderCustomerDetail(id);
    }
  }
}

window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", () => {
  loadData();
  renderSidebar();
  renderTopbar();
  router();
});
