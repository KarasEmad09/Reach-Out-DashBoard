/* === STATE === */
let customers = [];
let activityLog = [];
let settings = {};
let currentRoute = "";
let chartInstance = null;
let currentSearchQuery = "";
let sortColumn = "fullName";
let sortDir = "asc";
let currentTableConfig = { filterFn: null, title: "All Customers", extraColumns: [] };

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
  applyTheme();
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

/* === MODAL === */
function generateId(prefix) {
  return prefix + "_" + Date.now();
}

function showCustomerModal(customer = null) {
  const isEdit = customer !== null;
  const title = isEdit ? "Edit Customer" : "Add Customer";
  const submitText = isEdit ? "Update Customer" : "Save Customer";
  const sourceOptions = SOURCES.map(s => `<option value="${s}" ${isEdit && customer.source === s ? "selected" : ""}>${s}</option>`).join('');
  const statusOptions = STATUSES.map(s => `<option value="${s.key}" ${isEdit && customer.status === s.key ? "selected" : ""}>${s.key}</option>`).join('');

  const html = `
    <div class="modal-backdrop">
      <div class="modal-panel">
        <div class="modal-header">
          <h2 class="modal-title">${title}</h2>
          <button class="modal-close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input type="text" id="modal-name" class="form-input" placeholder="Enter full name" value="${isEdit ? customer.fullName : ""}">
            <span id="modal-name-error" class="form-error">Name is required</span>
          </div>
          <div class="form-group">
            <label class="form-label">Phone *</label>
            <input type="text" id="modal-phone" class="form-input" placeholder="+20 1XX XXX XXXX" value="${isEdit ? customer.phone : ""}">
            <span id="modal-phone-error" class="form-error">Phone is required</span>
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" id="modal-email" class="form-input" placeholder="email@example.com" value="${isEdit && customer.email ? customer.email : ""}">
          </div>
          <div class="form-group">
            <label class="form-label">Company</label>
            <input type="text" id="modal-company" class="form-input" placeholder="Company name" value="${isEdit && customer.company ? customer.company : ""}">
          </div>
          <div class="form-row">
            <div class="form-group form-group-half">
              <label class="form-label">Source</label>
              <select id="modal-source" class="form-select">${sourceOptions}</select>
            </div>
            <div class="form-group form-group-half">
              <label class="form-label">Status</label>
              <select id="modal-status" class="form-select">${statusOptions}</select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group form-group-half">
              <label class="form-label">Last Contact Date</label>
              <input type="date" id="modal-last-contact" class="form-input" value="${isEdit && customer.lastContactDate ? customer.lastContactDate : ""}">
            </div>
            <div class="form-group form-group-half">
              <label class="form-label">Next Follow Up Date</label>
              <input type="date" id="modal-next-followup" class="form-input" value="${isEdit && customer.nextFollowUpDate ? customer.nextFollowUpDate : ""}">
            </div>
          </div>
          <div class="form-group" id="modal-notes-group" ${isEdit ? 'style="display:none"' : ""}>
            <label class="form-label">Notes</label>
            <textarea id="modal-notes" class="form-textarea" rows="3" placeholder="Add initial note...">${!isEdit ? "" : ""}</textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary modal-cancel">Cancel</button>
          <button class="btn-primary modal-submit">${submitText}</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal-overlay').innerHTML = html;
  document.body.classList.add('modal-open');

  // Event listeners
  document.querySelector('.modal-close-btn').addEventListener('click', closeModal);
  document.querySelector('.modal-cancel').addEventListener('click', closeModal);
  document.querySelector('.modal-backdrop').addEventListener('click', (e) => {
    if (e.target === document.querySelector('.modal-backdrop')) {
      closeModal();
    }
  });
  document.querySelector('.modal-panel').addEventListener('click', (e) => {
    e.stopPropagation();
  });
  document.addEventListener('keydown', handleEscapeKey);
  document.querySelector('.modal-submit').addEventListener('click', () => {
    handleModalSubmit(customer);
  });
}

function handleEscapeKey(e) {
  if (e.key === 'Escape') {
    closeModal();
  }
}

function closeModal() {
  document.getElementById('modal-overlay').innerHTML = '';
  document.body.classList.remove('modal-open');
  document.removeEventListener('keydown', handleEscapeKey);
}

function handleModalSubmit(existingCustomer) {
  const name = document.getElementById('modal-name').value.trim();
  const phone = document.getElementById('modal-phone').value.trim();
  const email = document.getElementById('modal-email').value.trim();
  const company = document.getElementById('modal-company').value.trim();
  const source = document.getElementById('modal-source').value;
  const status = document.getElementById('modal-status').value;
  const lastContact = document.getElementById('modal-last-contact').value;
  const nextFollowUp = document.getElementById('modal-next-followup').value;
  const notesText = document.getElementById('modal-notes').value.trim();

  // Validate
  const nameError = document.getElementById('modal-name-error');
  const phoneError = document.getElementById('modal-phone-error');
  nameError.classList.remove('visible');
  phoneError.classList.remove('visible');

  let hasError = false;
  if (!name) {
    nameError.classList.add('visible');
    hasError = true;
  }
  if (!phone) {
    phoneError.classList.add('visible');
    hasError = true;
  }
  if (hasError) return;

  if (existingCustomer) {
    // Edit mode
    existingCustomer.fullName = name;
    existingCustomer.phone = phone;
    existingCustomer.email = email;
    existingCustomer.company = company;
    existingCustomer.source = source;
    existingCustomer.status = status;
    existingCustomer.lastContactDate = lastContact || new Date().toISOString().split('T')[0];
    existingCustomer.nextFollowUpDate = nextFollowUp || null;
    addActivity("status_change", name, "profile updated");
  } else {
    // Add mode
    const newCustomer = {
      id: generateId("cust"),
      fullName: name,
      phone: phone,
      email: email,
      company: company,
      source: source,
      status: status,
      notes: [],
      dealValue: null,
      productPurchased: null,
      lostReason: null,
      lastContactDate: lastContact || new Date().toISOString().split('T')[0],
      nextFollowUpDate: nextFollowUp || null,
      createdAt: new Date().toISOString()
    };
    if (notesText) {
      newCustomer.notes.push({
        id: generateId("note"),
        text: notesText,
        createdAt: new Date().toISOString()
      });
    }
    customers.push(newCustomer);
    addActivity("new_customer", name, "added as new lead");
  }

  saveData();
  closeModal();
  router();
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
      currentSearchQuery = "";
      notesSearchQuery = "";
      closeMobileSidebar();
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
    <button class="hamburger-btn" onclick="toggleMobileSidebar()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
    <h1 id="page-title" class="topbar-title">Dashboard</h1>
    <div class="topbar-right">
      <div class="topbar-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="global-search" placeholder="Search customers...">
      </div>
      <button id="notif-bell" class="topbar-icon-btn" onclick="toggleNotifDropdown()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <span class="notif-badge">${activityLog.length}</span>
      </button>
      <div class="user-avatar">AD</div>
    </div>
  `;
}

function toggleMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('sidebar--open');
  overlay.classList.toggle('overlay--visible');
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.remove('sidebar--open');
  overlay.classList.remove('overlay--visible');
}

/* === HELPERS === */
function formatTimeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return minutes + " minutes ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + " hours ago";
  return Math.floor(hours / 24) + " days ago";
}

function renderStatusBadge(status) {
  const s = STATUSES.find(s => s.key === status);
  if (!s) return `<span class="status-badge">${status}</span>`;
  return `<span class="status-badge" style="color:${s.color};background:${s.bg}">${s.key}</span>`;
}

function renderAvatarCircle(name) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return `<span class="avatar-circle">${initials}</span>`;
}

function deleteCustomer(id) {
  if (!confirm("Delete this customer? This cannot be undone.")) return;
  const customer = customers.find(c => c.id === id);
  customers = customers.filter(c => c.id !== id);
  if (customer) addActivity("status_change", customer.fullName, "was deleted");
  saveData();
  router();
}

/* === ROW MENU === */
function showRowMenu(event, customerId) {
  event.stopPropagation();
  closeAllMenus();
  const customer = customers.find(c => c.id === customerId);
  if (!customer) return;
  const rect = event.target.getBoundingClientRect();
  const menu = document.createElement('div');
  menu.className = 'row-menu';
  menu.innerHTML = `
    <div class="row-menu-item" onclick="closeAllMenus(); window.location.hash='#customer/${customerId}'">View</div>
    <div class="row-menu-item" onclick="closeAllMenus(); showCustomerModal(customers.find(c => c.id === '${customerId}'))">Edit</div>
    <div class="row-menu-item row-menu-item--danger" onclick="closeAllMenus(); deleteCustomer('${customerId}')">Delete</div>
  `;
  document.body.appendChild(menu);
  const menuRect = menu.getBoundingClientRect();
  let top = rect.bottom + 4;
  let left = rect.left - 80;
  if (top + menuRect.height > window.innerHeight) {
    top = rect.top - menuRect.height - 4;
  }
  if (left + menuRect.width > window.innerWidth) {
    left = window.innerWidth - menuRect.width - 8;
  }
  if (left < 8) left = 8;
  menu.style.top = top + 'px';
  menu.style.left = left + 'px';
  setTimeout(() => {
    document.addEventListener('click', function handler() {
      closeAllMenus();
      document.removeEventListener('click', handler);
    });
  }, 0);
}

function closeAllMenus() {
  document.querySelectorAll('.row-menu').forEach(m => m.remove());
}

/* === DASHBOARD === */
function renderDashboard() {
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

  const total = customers.length;
  const newLeads = customers.filter(c => c.status === "New Lead").length;
  const interested = customers.filter(c => c.status === "Interested Customer").length;
  const hotLeads = customers.filter(c => c.status === "Hot Lead").length;
  const followUps = customers.filter(c => c.status === "Follow Up").length;
  const wonDeals = customers.filter(c => c.status === "Won Deal").length;
  const lostDeals = customers.filter(c => c.status === "Lost Deal").length;
  const dealsValue = customers.filter(c => c.status === "Won Deal").reduce((sum, c) => sum + (c.dealValue || 0), 0);

  const sourceCounts = SOURCES.map(s => customers.filter(c => c.source === s).length);
  const sourcePercentages = sourceCounts.map(c => total > 0 ? Math.round((c / total) * 100) : 0);
  const sourceColors = ['#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#10B981', '#6B7280', '#EC4899', '#14B8A6'];

  const recentActivity = activityLog.slice(0, 10);
  const upcomingFollowUps = customers.filter(c => c.nextFollowUpDate).sort((a, b) => new Date(a.nextFollowUpDate) - new Date(b.nextFollowUpDate));

  const statIcons = {
    total: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    new: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
    interested: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    hot: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
    followup: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    won: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
    lost: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    value: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>'
  };

  const iconBgColors = {
    total: '#EFF6FF', new: '#EFF6FF', interested: '#FFFBEB', hot: '#FEF2F2',
    followup: '#F5F3FF', won: '#ECFDF5', lost: '#F9FAFB', value: '#ECFDF5'
  };

  const activityTypeColors = {
    status_change: '#3B82F6', note_added: '#8B5CF6', follow_up: '#F59E0B', new_customer: '#10B981'
  };

  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="dashboard">
      <div class="stat-cards">
        <div class="stat-card"><div class="stat-card__left"><p class="stat-card__label">Total Customers</p><h2 class="stat-card__value">${total}</h2><p class="stat-card__trend trend-up">+${newLeads} new this month</p></div><div class="stat-card__icon-wrap" style="background:${iconBgColors.total}">${statIcons.total}</div></div>
        <div class="stat-card"><div class="stat-card__left"><p class="stat-card__label">New Leads</p><h2 class="stat-card__value">${newLeads}</h2><p class="stat-card__trend trend-up">Active leads</p></div><div class="stat-card__icon-wrap" style="background:${iconBgColors.new}">${statIcons.new}</div></div>
        <div class="stat-card"><div class="stat-card__left"><p class="stat-card__label">Interested</p><h2 class="stat-card__value">${interested}</h2><p class="stat-card__trend trend-up">In pipeline</p></div><div class="stat-card__icon-wrap" style="background:${iconBgColors.interested}">${statIcons.interested}</div></div>
        <div class="stat-card"><div class="stat-card__left"><p class="stat-card__label">Hot Leads</p><h2 class="stat-card__value">${hotLeads}</h2><p class="stat-card__trend trend-up">Ready to close</p></div><div class="stat-card__icon-wrap" style="background:${iconBgColors.hot}">${statIcons.hot}</div></div>
        <div class="stat-card"><div class="stat-card__left"><p class="stat-card__label">Follow Ups</p><h2 class="stat-card__value">${followUps}</h2><p class="stat-card__trend trend-up">Pending</p></div><div class="stat-card__icon-wrap" style="background:${iconBgColors.followup}">${statIcons.followup}</div></div>
        <div class="stat-card"><div class="stat-card__left"><p class="stat-card__label">Won Deals</p><h2 class="stat-card__value">${wonDeals}</h2><p class="stat-card__trend trend-up">Closed won</p></div><div class="stat-card__icon-wrap" style="background:${iconBgColors.won}">${statIcons.won}</div></div>
        <div class="stat-card"><div class="stat-card__left"><p class="stat-card__label">Lost Deals</p><h2 class="stat-card__value">${lostDeals}</h2><p class="stat-card__trend trend-up">Closed lost</p></div><div class="stat-card__icon-wrap" style="background:${iconBgColors.lost}">${statIcons.lost}</div></div>
        <div class="stat-card"><div class="stat-card__left"><p class="stat-card__label">Deals Value</p><h2 class="stat-card__value">$${dealsValue.toLocaleString()}</h2><p class="stat-card__trend trend-up">Total revenue</p></div><div class="stat-card__icon-wrap" style="background:${iconBgColors.value}">${statIcons.value}</div></div>
      </div>
      <div class="dashboard-grid">
        <div class="dashboard-panel activity-panel">
          <div class="panel-header"><h3>Recent Activity</h3><button class="btn-link" onclick="showActivityModal()">View All</button></div>
          <div class="activity-list">
            ${recentActivity.length > 0 ? recentActivity.map(a => `
              <div class="activity-item">
                <div class="activity-dot" style="background:${activityTypeColors[a.type] || '#94A3B8'}"></div>
                <div class="activity-content">
                  <p><strong>${a.customerName}</strong> ${a.description}</p>
                  <span class="activity-time">${formatTimeAgo(a.timestamp)}</span>
                </div>
              </div>
            `).join('') : '<p class="empty-text">No recent activity</p>'}
          </div>
        </div>
        <div class="dashboard-panel chart-panel">
          <div class="panel-header"><h3>Customers by Source</h3></div>
          <div class="chart-wrap"><canvas id="source-chart"></canvas></div>
          <div class="chart-legend">
            ${SOURCES.map((s, i) => `<div class="legend-item"><span class="legend-dot" style="background:${sourceColors[i]}"></span><span class="legend-label">${s}</span><span class="legend-value">${sourceCounts[i]}</span><span class="legend-pct">${sourcePercentages[i]}%</span></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="dashboard-panel followups-panel">
        <div class="panel-header"><h3>Upcoming Follow Ups</h3></div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>Customer</th><th>Phone</th><th>Status</th><th>Next Follow Up</th><th>Source</th><th>Actions</th></tr>
            </thead>
            <tbody>
              ${upcomingFollowUps.length > 0 ? upcomingFollowUps.map(c => `
                <tr onclick="window.location.hash='#customer/${c.id}'" style="cursor:pointer">
                  <td><div class="td-with-avatar">${renderAvatarCircle(c.fullName)}<span>${c.fullName}</span></div></td>
                  <td>${c.phone}</td>
                  <td>${renderStatusBadge(c.status)}</td>
                  <td>${c.nextFollowUpDate}</td>
                  <td>${c.source}</td>
                  <td onclick="event.stopPropagation()">
                    <div class="action-btns">
                      <button class="btn-icon btn-phone" onclick="window.open('tel:${c.phone}')" title="Call"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></button>
                      <button class="btn-icon btn-message" onclick="window.open('mailto:${c.email || ''}')" title="Message"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></button>
                      <button class="btn-icon btn-more" onclick="showRowMenu(event, '${c.id}')" title="More"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg></button>
                    </div>
                  </td>
                </tr>
              `).join('') : '<tr><td colspan="6" class="empty-text">No upcoming follow ups</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Render donut chart
  const canvas = document.getElementById('source-chart');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: SOURCES,
        datasets: [{ data: sourceCounts, backgroundColor: sourceColors, borderWidth: 0 }]
      },
      options: { cutout: '65%', plugins: { legend: { display: false } } }
    });
  }
}

function showActivityModal() {
  const html = `
    <div class="modal-backdrop">
      <div class="modal-panel modal-panel--wide">
        <div class="modal-header">
          <h2 class="modal-title">All Activity</h2>
          <button class="modal-close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="activity-list activity-list--modal">
            ${activityLog.map(a => `
              <div class="activity-item">
                <div class="activity-dot" style="background:${{status_change: '#3B82F6', note_added: '#8B5CF6', follow_up: '#F59E0B', new_customer: '#10B981'}[a.type] || '#94A3B8'}"></div>
                <div class="activity-content">
                  <p><strong>${a.customerName}</strong> ${a.description}</p>
                  <span class="activity-time">${formatTimeAgo(a.timestamp)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modal-overlay').innerHTML = html;
  document.body.classList.add('modal-open');
  document.querySelector('.modal-close-btn').addEventListener('click', closeModal);
  document.querySelector('.modal-backdrop').addEventListener('click', (e) => { if (e.target === document.querySelector('.modal-backdrop')) closeModal(); });
  document.querySelector('.modal-panel').addEventListener('click', (e) => { e.stopPropagation(); });
  document.addEventListener('keydown', handleEscapeKey);
}

/* === ALL CUSTOMERS PAGE === */
function sortCustomers(column) {
  if (sortColumn === column) {
    sortDir = sortDir === "asc" ? "desc" : "asc";
  } else {
    sortColumn = column;
    sortDir = "asc";
  }
  updateCustomerTable();
}

function getFilteredCustomers() {
  let filtered = customers.filter(c => {
    const matchesSearch = c.fullName.toLowerCase().includes(currentSearchQuery) ||
      c.phone.includes(currentSearchQuery) ||
      (c.email && c.email.toLowerCase().includes(currentSearchQuery));
    const matchesFilter = currentTableConfig.filterFn ? currentTableConfig.filterFn(c) : true;
    return matchesSearch && matchesFilter;
  });
  filtered.sort((a, b) => {
    const aVal = (a[sortColumn] || "").toString().toLowerCase();
    const bVal = (b[sortColumn] || "").toString().toLowerCase();
    return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });
  return filtered;
}

function buildTableRows(filtered) {
  const extraCols = currentTableConfig.extraColumns || [];
  const extraHeaders = extraCols.map(col => `<th>${col.label}</th>`).join('');
  if (filtered.length === 0) {
    return `
      <div class="empty-state">
        <p>No customers found.</p>
        <button onclick="document.getElementById('customer-search').value=''; currentSearchQuery=''; updateCustomerTable();">Clear Search</button>
      </div>
    `;
  }
  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th onclick="sortCustomers('fullName')">Name ${sortArrow('fullName')}</th>
            <th onclick="sortCustomers('phone')">Phone ${sortArrow('phone')}</th>
            <th onclick="sortCustomers('email')">Email ${sortArrow('email')}</th>
            <th onclick="sortCustomers('source')">Source ${sortArrow('source')}</th>
            <th onclick="sortCustomers('status')">Status ${sortArrow('status')}</th>
            <th onclick="sortCustomers('lastContactDate')">Last Contact ${sortArrow('lastContactDate')}</th>
            ${extraHeaders}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(c => `
            <tr onclick="window.location.hash='#customer/${c.id}'" style="cursor:pointer">
              <td><div class="td-with-avatar">${renderAvatarCircle(c.fullName)}<span>${c.fullName}</span></div></td>
              <td>${c.phone}</td>
              <td>${c.email || '—'}</td>
              <td>${c.source}</td>
              <td>${renderStatusBadge(c.status)}</td>
              <td>${c.lastContactDate || '—'}</td>
              ${extraCols.map(col => `<td>${col.render(c)}</td>`).join('')}
              <td onclick="event.stopPropagation()">
                <div class="action-btns">
                  <button class="btn-icon btn-edit" onclick="showCustomerModal(customers.find(cu => cu.id === '${c.id}'))" title="Edit"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                  <button class="btn-icon btn-delete" onclick="deleteCustomer('${c.id}')" title="Delete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function sortArrow(col) {
  if (sortColumn !== col) return '<span class="sort-arrow"></span>';
  return sortDir === "asc" ? '<span class="sort-arrow">↑</span>' : '<span class="sort-arrow">↓</span>';
}

function updateCustomerTable() {
  const filtered = getFilteredCustomers();
  const countEl = document.querySelector('.page-count');
  const tableCard = document.querySelector('.table-card');
  if (countEl) countEl.textContent = `(${filtered.length})`;
  if (tableCard) tableCard.innerHTML = buildTableRows(filtered);
}

function renderCustomerTable(config) {
  currentTableConfig = config;
  sortColumn = "fullName";
  sortDir = "asc";
  const filtered = getFilteredCustomers();
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>${config.title}</h2>
        <span class="page-count">(${filtered.length})</span>
      </div>
      <div class="page-header-right">
        <div class="page-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="customer-search" placeholder="Search customers..." value="${currentSearchQuery}">
        </div>
        <button class="btn-primary" onclick="showCustomerModal()">+ Add Customer</button>
      </div>
    </div>
    <div class="table-card">
      ${buildTableRows(filtered)}
    </div>
  `;

  const searchInput = document.getElementById('customer-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value.toLowerCase();
      updateCustomerTable();
    });
  }
}

function renderAllCustomers() {
  renderCustomerTable({ filterFn: null, title: "All Customers", extraColumns: [] });
}

/* === STATUS FILTER PAGES === */
function renderNewLeads() {
  renderCustomerTable({ filterFn: (c) => c.status === "New Lead", title: "New Leads", extraColumns: [] });
}

function renderInterested() {
  renderCustomerTable({ filterFn: (c) => c.status === "Interested Customer", title: "Interested Customers", extraColumns: [] });
}

function renderHotLeads() {
  renderCustomerTable({ filterFn: (c) => c.status === "Hot Lead", title: "Hot Leads", extraColumns: [] });
}

function renderFollowUps() {
  renderCustomerTable({ filterFn: (c) => c.status === "Follow Up", title: "Follow Ups", extraColumns: [] });
}

function renderWonDeals() {
  renderCustomerTable({
    filterFn: (c) => c.status === "Won Deal",
    title: "Won Deals",
    extraColumns: [
      { label: "Deal Value", render: (c) => c.dealValue ? `<strong>${c.dealValue}</strong>` : '—' },
      { label: "Product", render: (c) => c.product || '—' }
    ]
  });
}

function renderLostDeals() {
  renderCustomerTable({
    filterFn: (c) => c.status === "Lost Deal",
    title: "Lost Deals",
    extraColumns: [
      { label: "Lost Reason", render: (c) => c.lostReason || '—' }
    ]
  });
}

/* === CUSTOMER DETAIL PAGE === */
function renderCustomerDetail(id) {
  const customer = customers.find(c => c.id === id);
  if (!customer) {
    document.getElementById('content').innerHTML = `
      <div class="empty-state">
        <h2>Customer not found</h2>
        <button onclick="window.location.hash='#customers-all'">Back to All Customers</button>
      </div>`;
    return;
  }

  const statusObj = STATUSES.find(s => s.key === customer.status);
  const statusColor = statusObj ? statusObj.color : '#6B7280';
  const statusBg = statusObj ? statusObj.bg : '#F9FAFB';
  const statusOptions = STATUSES.map(s =>
    `<option value="${s.key}" ${customer.status === s.key ? 'selected' : ''}>${s.key}</option>`
  ).join('');

  const notes = (customer.notes || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const notesHtml = notes.length > 0 ? notes.map(note => `
    <div class="note-item">
      <p class="note-text">${note.text}</p>
      <div class="note-meta">
        <span>${formatTimeAgo(note.createdAt)}</span>
        <button class="note-delete-btn" onclick="deleteNote('${customer.id}', '${note.id}')" title="Delete note">&times;</button>
      </div>
    </div>
  `).join('') : '<p class="notes-empty">No notes yet.</p>';

  const wonDealFields = customer.status === "Won Deal" ? `
    <div class="detail-field">
      <span class="detail-label">Deal Value</span>
      <span class="detail-value">${customer.dealValue || '—'}</span>
    </div>
    <div class="detail-field">
      <span class="detail-label">Product Purchased</span>
      <span class="detail-value">${customer.productPurchased || '—'}</span>
    </div>
  ` : '';

  const lostDealFields = customer.status === "Lost Deal" ? `
    <div class="detail-field">
      <span class="detail-label">Lost Reason</span>
      <span class="detail-value">${customer.lostReason || '—'}</span>
    </div>
  ` : '';

  document.getElementById('content').innerHTML = `
    <div class="detail-page">
      <div class="detail-back-bar">
        <button onclick="history.back()" class="btn-back">&larr; Back</button>
        <h2>${customer.fullName}</h2>
      </div>
      <div class="detail-columns">
        <div class="detail-left">
          <div class="detail-card">
            <div class="detail-card-header">
              <h3>Customer Information</h3>
              <button class="btn-primary btn-sm" onclick="showCustomerModal(customers.find(c => c.id === '${customer.id}'))">Edit Customer</button>
            </div>
            <div class="detail-fields">
              <div class="detail-field">
                <span class="detail-label">Full Name</span>
                <span class="detail-value">${customer.fullName}</span>
              </div>
              <div class="detail-field">
                <span class="detail-label">Phone</span>
                <span class="detail-value">${customer.phone}</span>
              </div>
              <div class="detail-field">
                <span class="detail-label">Email</span>
                <span class="detail-value">${customer.email || '—'}</span>
              </div>
              <div class="detail-field">
                <span class="detail-label">Company</span>
                <span class="detail-value">${customer.company || '—'}</span>
              </div>
              <div class="detail-field">
                <span class="detail-label">Source</span>
                <span class="detail-value">${customer.source}</span>
              </div>
              <div class="detail-field">
                <span class="detail-label">Status</span>
                <span class="detail-value">
                  <span class="status-badge" style="color:${statusColor};background:${statusBg}">${customer.status}</span>
                </span>
              </div>
              <div class="detail-field">
                <span class="detail-label">Change Status</span>
                <span class="detail-value">
                  <select class="form-select" onchange="changeCustomerStatus('${customer.id}', this.value)">
                    ${statusOptions}
                  </select>
                </span>
              </div>
              <div class="detail-field">
                <span class="detail-label">Created Date</span>
                <span class="detail-value">${customer.createdDate || '—'}</span>
              </div>
              <div class="detail-field">
                <span class="detail-label">Last Contact</span>
                <span class="detail-value">${customer.lastContactDate || '—'}</span>
              </div>
              <div class="detail-field">
                <span class="detail-label">Next Follow Up</span>
                <span class="detail-value">${customer.nextFollowUpDate || '—'}</span>
              </div>
              ${wonDealFields}
              ${lostDealFields}
            </div>
          </div>
        </div>
        <div class="detail-right">
          <div class="detail-card notes-panel">
            <h3>Notes</h3>
            <div class="note-add">
              <textarea id="note-input" placeholder="Add a note..." rows="3"></textarea>
              <button class="btn-primary btn-sm" onclick="addNote('${customer.id}')">Add Note</button>
            </div>
            <div class="notes-list">
              ${notesHtml}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function changeCustomerStatus(customerId, newStatus) {
  const customer = customers.find(c => c.id === customerId);
  if (!customer) return;
  const oldStatus = customer.status;
  customer.status = newStatus;
  addActivity("status_change", customer.fullName, `moved from ${oldStatus} to ${newStatus}`);
  saveData();
  renderCustomerDetail(customerId);
}

function addNote(customerId) {
  const text = document.getElementById('note-input').value.trim();
  if (!text) return;
  const customer = customers.find(c => c.id === customerId);
  if (!customer) return;
  if (!customer.notes) customer.notes = [];
  customer.notes.unshift({ id: generateId("note"), text, createdAt: new Date().toISOString() });
  addActivity("note_added", customer.fullName, "added a note");
  saveData();
  renderCustomerDetail(customerId);
}

function deleteNote(customerId, noteId) {
  const customer = customers.find(c => c.id === customerId);
  if (!customer) return;
  customer.notes = (customer.notes || []).filter(n => n.id !== noteId);
  saveData();
  renderCustomerDetail(customerId);
}

/* === NOTES PAGE === */
let notesSearchQuery = "";

function getFilteredNotes() {
  const allNotes = [];
  customers.forEach(customer => {
    (customer.notes || []).forEach(note => {
      allNotes.push({ ...note, customerName: customer.fullName, customerId: customer.id });
    });
  });
  allNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return allNotes.filter(n =>
    n.customerName.toLowerCase().includes(notesSearchQuery) ||
    n.text.toLowerCase().includes(notesSearchQuery)
  );
}

function buildNotesFeedHtml(filtered) {
  if (filtered.length === 0) return '<div class="empty-state"><p>No notes found.</p></div>';
  return filtered.map(note => `
    <div class="note-feed-item">
      ${renderAvatarCircle(note.customerName)}
      <div class="note-feed-body">
        <p class="note-feed-customer">
          <a href="#" onclick="event.preventDefault(); window.location.hash='#customer/${note.customerId}'">${note.customerName}</a>
        </p>
        <p class="note-feed-text">${note.text}</p>
        <p class="note-feed-date">${formatTimeAgo(note.createdAt)}</p>
      </div>
    </div>
  `).join('');
}

function updateNotesFeed() {
  const filtered = getFilteredNotes();
  const countEl = document.querySelector('.page-count');
  const feedEl = document.querySelector('.notes-feed');
  if (countEl) countEl.textContent = `(${filtered.length})`;
  if (feedEl) feedEl.innerHTML = buildNotesFeedHtml(filtered);
}

function renderNotes() {
  notesSearchQuery = "";
  const filtered = getFilteredNotes();
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Notes & Questions</h2>
        <span class="page-count">(${filtered.length})</span>
      </div>
      <div class="page-header-right">
        <div class="page-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="notes-search" placeholder="Search notes or customers..." value="">
        </div>
      </div>
    </div>
    <div class="notes-feed">
      ${buildNotesFeedHtml(filtered)}
    </div>
  `;

  const searchInput = document.getElementById('notes-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      notesSearchQuery = e.target.value.toLowerCase();
      updateNotesFeed();
    });
  }
}

/* === SETTINGS PAGE === */
function renderSettings() {
  const currentTheme = settings.theme || "light";
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Settings</h2>
      </div>
    </div>
    <div class="settings-section">
      <h3>Appearance</h3>
      <p class="settings-desc">Choose your preferred theme for the dashboard.</p>
      <div class="theme-cards">
        <div class="theme-card ${currentTheme === 'light' ? 'theme-card--active' : ''}" onclick="setTheme('light')">
          <div class="theme-card-preview theme-card-preview--light">
            <div class="theme-preview-sidebar"></div>
            <div class="theme-preview-content">
              <div class="theme-preview-bar"></div>
              <div class="theme-preview-card"></div>
            </div>
          </div>
          <span class="theme-card-label">Light Mode</span>
        </div>
        <div class="theme-card ${currentTheme === 'dark' ? 'theme-card--active' : ''}" onclick="setTheme('dark')">
          <div class="theme-card-preview theme-card-preview--dark">
            <div class="theme-preview-sidebar"></div>
            <div class="theme-preview-content">
              <div class="theme-preview-bar"></div>
              <div class="theme-preview-card"></div>
            </div>
          </div>
          <span class="theme-card-label">Dark Mode</span>
        </div>
      </div>
    </div>
  `;
}

function setTheme(theme) {
  settings.theme = theme;
  saveData();
  applyTheme();
  renderSettings();
}

function applyTheme() {
  document.body.classList.toggle('dark-mode', settings.theme === 'dark');
}

/* === NOTIFICATION DROPDOWN === */
function toggleNotifDropdown() {
  const existing = document.getElementById('notif-dropdown');
  if (existing) { existing.remove(); return; }

  const last5 = activityLog.slice(0, 5);
  const html = `
    <div id="notif-dropdown" class="notif-dropdown">
      <h4>Recent Activity</h4>
      ${last5.length > 0 ? last5.map(a => `
        <div class="notif-item">
          <strong>${a.customerName}</strong> ${a.description}
          <span class="notif-time">${formatTimeAgo(a.timestamp)}</span>
        </div>
      `).join('') : '<p class="notif-empty">No recent activity.</p>'}
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  const bell = document.getElementById('notif-bell');
  const rect = bell.getBoundingClientRect();
  const dropdown = document.getElementById('notif-dropdown');
  dropdown.style.top = (rect.bottom + 8) + 'px';
  dropdown.style.right = (window.innerWidth - rect.right) + 'px';

  setTimeout(() => {
    document.addEventListener('click', function handler(e) {
      if (!dropdown.contains(e.target) && e.target.id !== 'notif-bell' && !e.target.closest('#notif-bell')) {
        dropdown.remove();
        document.removeEventListener('click', handler);
      }
    });
  }, 0);
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
  "#dashboard": renderDashboard,
  "#customers-all": renderAllCustomers,
  "#customers-new-leads": renderNewLeads,
  "#customers-interested": renderInterested,
  "#customers-hot-leads": renderHotLeads,
  "#customers-follow-ups": renderFollowUps,
  "#deals-won": renderWonDeals,
  "#deals-lost": renderLostDeals,
  "#notes": renderNotes,
  "#settings": renderSettings
};

function router() {
  const hash = window.location.hash || "#dashboard";

  // Handle dynamic customer detail route
  if (hash.startsWith("#customer/")) {
    const id = hash.replace("#customer/", "");
    // Destroy chart if leaving dashboard
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = "Customer Detail";
    updateSidebarActive("");
    renderCustomerDetail(id);
    return;
  }

  currentRoute = hash;

  // Destroy chart if leaving dashboard
  if (hash !== "#dashboard" && chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  // Update page title
  const titleEl = document.getElementById('page-title');
  if (titleEl) {
    titleEl.textContent = PAGE_NAMES[hash] || "Dashboard";
  }

  // Update sidebar active state
  updateSidebarActive(hash);

  // Call route handler or clear content
  if (ROUTES[hash]) {
    ROUTES[hash]();
  } else {
    document.getElementById('content').innerHTML = '';
  }
}

window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", () => {
  // Inject sidebar overlay for mobile
  const overlay = document.createElement('div');
  overlay.id = 'sidebar-overlay';
  overlay.className = 'sidebar-overlay';
  overlay.addEventListener('click', closeMobileSidebar);
  document.body.appendChild(overlay);

  loadData();
  renderSidebar();
  renderTopbar();

  // Topbar global search
  const globalSearch = document.getElementById('global-search');
  if (globalSearch) {
    globalSearch.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if (q.length > 0) {
        currentSearchQuery = q.toLowerCase();
        if (window.location.hash !== "#customers-all") {
          window.location.hash = "#customers-all";
        } else {
          updateCustomerTable();
        }
      } else {
        currentSearchQuery = "";
        if (window.location.hash === "#customers-all") {
          updateCustomerTable();
        }
      }
    });
  }

  router();
});
