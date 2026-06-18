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
let sessionUser = null;
let tasks = [];
let taskSearchQuery = "";
let taskStatusFilter = "all";
let taskPriorityFilter = "all";

/* === AUTH === */
const DEMO_USERS = [
  { email: "admin@saleshub.com", password: "admin123", name: "Super Admin", role: "super_admin", avatar: "SA" }
];

function getSession() {
  // Try PB first
  if (typeof pbIsAuth === 'function' && pbIsAuth()) {
    const u = pbGetUser();
    return u ? { name: u.name, email: u.email, role: u.role, avatar: (u.name||'?')[0] } : null;
  }
  const raw = sessionStorage.getItem("sh_sess");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}
function isAuth() { return getSession() !== null; }
async function loginUser(email, pw) {
  // Try PocketBase first (always, even if dataSource not yet set)
  if (typeof pbLogin === 'function') {
    try {
      const record = await PB.login(email, pw);
      dataSource = "pb";
      const s = { name: record.name, email: record.email, role: record.role, avatar: (record.name||'?')[0] };
      sessionUser = s;
      return s;
    } catch (e) {
      // PB failed, fall through to demo users
    }
  }
  // Fallback to demo users
  const u = DEMO_USERS.find(x => x.email === email);
  if (!u || u.password !== pw) throw new Error("Invalid email or password");
  const s = { name: u.name, email: u.email, role: u.role, avatar: u.avatar };
  sessionStorage.setItem("sh_sess", JSON.stringify(s));
  sessionUser = s;
  return s;
}
function logoutUser() {
  sessionStorage.removeItem("sh_sess");
  sessionUser = null;
  if (typeof pbLogout === 'function') pbLogout();
  location.reload();
}

/* === DATA LAYER === */
function loadData() {
  loadDataLocal();
}

function saveData() {
  saveDataLocal();
}

function addActivity(type, customerName, description, customerId) {
  const activity = {
    id: "act_" + Date.now(),
    type: type,
    customerName: customerName,
    description: description,
    timestamp: new Date().toISOString()
  };
  activityLog.unshift(activity);
  saveData();
  // Create a notification for this activity
  createNotif(description || (customerName + " — " + type));
  // Async sync to PocketBase (fire-and-forget)
  if (dataSource === "pb") {
    PB.addActivity(type, customerName, description, customerId || null).catch(function(e) {
      console.error("PB addActivity sync failed:", e && e.message ? e.message : e);
    });
  }
}

function createNotif(message) {
  notifications.unshift({
    id: Date.now(),
    message: message,
    isRead: false,
    timestamp: new Date().toISOString()
  });
  saveNotifications();
  updateNotifBadge();
}

/* === MODAL === */
function generateId(prefix) {
  return prefix + "_" + Date.now();
}

function setLifecycle(customer) {
  customer.lifecycle = (typeof LIFECYCLE_MAP !== 'undefined' && LIFECYCLE_MAP[customer.status]) || "lead";
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
            <span id="modal-name-number-error" class="form-error">Name must not contain numbers</span>
            <span id="modal-name-duplicate-error" class="form-error">A customer with this name already exists</span>
          </div>
          <div class="form-group">
            <label class="form-label">Phone (digits only) *</label>
            <input type="text" id="modal-phone" class="form-input" placeholder="e.g. 201234567890" value="${isEdit ? customer.phone : ""}">
            <span id="modal-phone-error" class="form-error">Phone or Email is required</span>
            <span id="modal-phone-digit-error" class="form-error">Phone must be digits only</span>
          </div>
          <div class="form-group">
            <label class="form-label">Email *</label>
            <input type="email" id="modal-email" class="form-input" placeholder="email@example.com" value="${isEdit && customer.email ? customer.email : ""}">
            <span id="modal-email-error" class="form-error">Email or Phone is required</span>
            <span id="modal-email-format-error" class="form-error">Enter a valid email address</span>
          </div>
          <div class="form-group">
            <label class="form-label">Company</label>
            <input type="text" id="modal-company" class="form-input" placeholder="Company name (optional)" value="${isEdit && customer.company ? customer.company : ""}">
          </div>
          <div class="form-row">
            <div class="form-group form-group-half">
              <label class="form-label">Source *</label>
              <select id="modal-source" class="form-select">${sourceOptions}</select>
              <span id="modal-source-error" class="form-error">Source is required</span>
            </div>
            <div class="form-group form-group-half">
              <label class="form-label">Status *</label>
              <select id="modal-status" class="form-select">${statusOptions}</select>
              <span id="modal-status-error" class="form-error">Status is required</span>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group form-group-half">
              <label class="form-label">Last Contact Date *</label>
              <input type="date" id="modal-last-contact" class="form-input" value="${isEdit && customer.lastContactDate ? customer.lastContactDate : ""}">
              <span id="modal-last-contact-error" class="form-error">Last Contact Date is required</span>
            </div>
            <div class="form-group form-group-half">
              <label class="form-label">Next Follow Up Date *</label>
              <input type="date" id="modal-next-followup" class="form-input" value="${isEdit && customer.nextFollowUpDate ? customer.nextFollowUpDate : ""}">
              <span id="modal-next-followup-error" class="form-error">Next Follow Up is required</span>
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
  const nameNumberError = document.getElementById('modal-name-number-error');
  const nameDuplicateError = document.getElementById('modal-name-duplicate-error');
  const phoneError = document.getElementById('modal-phone-error');
  const phoneDigitError = document.getElementById('modal-phone-digit-error');
  const emailError = document.getElementById('modal-email-error');
  const emailFormatError = document.getElementById('modal-email-format-error');
  const statusError = document.getElementById('modal-status-error');
  const sourceError = document.getElementById('modal-source-error');
  const lastContactError = document.getElementById('modal-last-contact-error');
  const nextFollowupError = document.getElementById('modal-next-followup-error');
  nameError.classList.remove('visible');
  nameNumberError.classList.remove('visible');
  nameDuplicateError.classList.remove('visible');
  phoneError.classList.remove('visible');
  phoneDigitError.classList.remove('visible');
  emailError.classList.remove('visible');
  emailFormatError.classList.remove('visible');
  statusError.classList.remove('visible');
  sourceError.classList.remove('visible');
  lastContactError.classList.remove('visible');
  nextFollowupError.classList.remove('visible');

  let hasError = false;

  if (!name) {
    nameError.classList.add('visible');
    hasError = true;
  } else if (/\d/.test(name)) {
    nameNumberError.classList.add('visible');
    hasError = true;
  } else if (!existingCustomer && customers.some(c => c.fullName.toLowerCase() === name.toLowerCase())) {
    nameDuplicateError.classList.add('visible');
    hasError = true;
  }

  if (!phone && !email) {
    phoneError.classList.add('visible');
    emailError.classList.add('visible');
    hasError = true;
  }
  if (phone && !/^\d+$/.test(phone)) {
    phoneDigitError.classList.add('visible');
    hasError = true;
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailFormatError.classList.add('visible');
    hasError = true;
  }

  if (!status) {
    statusError.classList.add('visible');
    hasError = true;
  }
  if (!source) {
    sourceError.classList.add('visible');
    hasError = true;
  }

  if (!lastContact) {
    lastContactError.classList.add('visible');
    hasError = true;
  }
  if (!nextFollowUp) {
    nextFollowupError.classList.add('visible');
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
    setLifecycle(existingCustomer);
    existingCustomer.lastContactDate = lastContact || new Date().toISOString().split('T')[0];
    existingCustomer.nextFollowUpDate = nextFollowUp || null;
    addActivity("status_change", name, name + " profile updated");
    showToast("Customer updated", "success");
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
      lifecycle: (typeof LIFECYCLE_MAP !== 'undefined' && LIFECYCLE_MAP[status]) || "lead",
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
    addActivity("new_customer", name, "New customer " + name + " added");
    showToast("Customer created", "success");
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
        <ul class="submenu">
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
        <ul class="submenu">
          <li class="nav-item nav-child" data-route="#deals-won"><span>Won Deals</span></li>
          <li class="nav-item nav-child" data-route="#deals-lost"><span>Lost Deals</span></li>
          <li class="nav-item nav-child" data-route="#deals-values"><span>Deal Values</span></li>
        </ul>
      </li>
      <li class="sidebar-divider"></li>
      <li class="nav-item" data-route="#notes">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        <span>Notes & Questions</span>
      </li>
      <li class="sidebar-divider"></li>
      <li class="nav-item" data-route="#tasks">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        <span>Tasks</span>
      </li>
      <li class="nav-item" data-route="#reports">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        <span>Reports</span>
      </li>
    </ul>
    <div class="sidebar-collapse-btn" onclick="toggleSidebar()">
      <svg class="collapse-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
    </div>
    <div class="logout-link" onclick="logoutUser()">Sign Out</div>
  `;

  // Attach nav item click handlers
  sidebar.querySelectorAll('.nav-item[data-route]').forEach(item => {
    item.addEventListener('click', () => {
      currentSearchQuery = "";
      notesSearchQuery = "";
      taskSearchQuery = "";
      taskStatusFilter = "all";
      taskPriorityFilter = "all";
      window.location.hash = item.getAttribute('data-route');
    });
  });

  // Attach submenu toggle handlers
  sidebar.querySelectorAll('.nav-parent-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const app = document.getElementById('app');
      const parent = trigger.closest('.nav-parent');
      const submenu = parent.querySelector('.submenu');
      if (app.classList.contains('sidebar-collapsed')) {
        app.classList.remove('sidebar-collapsed');
      }
      submenu.classList.toggle('submenu--open');
    });
  });
}

function toggleSidebar() {
  const app = document.getElementById('app');
  const willCollapse = !app.classList.contains('sidebar-collapsed');
  if (willCollapse) {
    document.querySelectorAll('.submenu--open').forEach(s => s.classList.remove('submenu--open'));
  }
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
  const s = getSession() || { avatar: "?" };
  const topbar = document.getElementById('topbar');
  topbar.innerHTML = `
    <h1 id="page-title" class="topbar-title" aria-live="polite">Dashboard</h1>
    <div class="topbar-right">
      <div class="topbar-search" role="search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="global-search" placeholder="Search customers..." aria-label="Search customers">
      </div>
      <button id="notif-bell" class="topbar-icon-btn" onclick="toggleNotifDropdown()" title="Notifications">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <span class="notif-badge" style="display:none" id="notif-count"></span>
      </button>
      <button id="theme-toggle" onclick="toggleTheme()" title="Toggle theme">
        <span class="theme-toggle-orb">
          <svg class="theme-toggle-sun" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
          <svg class="theme-toggle-moon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </span>
      </button>
      <div class="user-avatar" onclick="logoutUser()" title="Sign out">${s.avatar}</div>
    </div>
  `;
  updateNotifBadge();
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

function getStatusRoute(status) {
  const m = {
    "New Lead": "#customers-new-leads",
    "Interested Customer": "#customers-interested",
    "Hot Lead": "#customers-hot-leads",
    "Follow Up": "#customers-follow-ups",
    "Won Deal": "#deals-won",
    "Lost Deal": "#deals-lost"
  };
  return m[status] || "#customers-all";
}

function deleteCustomer(id) {
  if (!confirm("Delete this customer? This cannot be undone.")) return;
  const customer = customers.find(c => c.id === id);
  customers = customers.filter(c => c.id !== id);
  if (customer) addActivity("status_change", customer.fullName, customer.fullName + " was deleted");
  saveData();
  showToast("Customer deleted", "success");
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
        <div class="stat-card stat-card--clickable" onclick="window.location.hash='#customers-all'"><div class="stat-card__left"><p class="stat-card__label">Total Customers</p><h2 class="stat-card__value">${total}</h2><p class="stat-card__trend trend-up">+${newLeads} new this month</p></div><div class="stat-card__icon-wrap" style="background:${iconBgColors.total}">${statIcons.total}</div></div>
        <div class="stat-card stat-card--clickable" onclick="window.location.hash='#customers-new-leads'"><div class="stat-card__left"><p class="stat-card__label">New Leads</p><h2 class="stat-card__value">${newLeads}</h2><p class="stat-card__trend trend-up">Active leads</p></div><div class="stat-card__icon-wrap" style="background:${iconBgColors.new}">${statIcons.new}</div></div>
        <div class="stat-card stat-card--clickable" onclick="window.location.hash='#customers-interested'"><div class="stat-card__left"><p class="stat-card__label">Interested</p><h2 class="stat-card__value">${interested}</h2><p class="stat-card__trend trend-up">In pipeline</p></div><div class="stat-card__icon-wrap" style="background:${iconBgColors.interested}">${statIcons.interested}</div></div>
        <div class="stat-card stat-card--clickable" onclick="window.location.hash='#customers-hot-leads'"><div class="stat-card__left"><p class="stat-card__label">Hot Leads</p><h2 class="stat-card__value">${hotLeads}</h2><p class="stat-card__trend trend-up">Ready to close</p></div><div class="stat-card__icon-wrap" style="background:${iconBgColors.hot}">${statIcons.hot}</div></div>
        <div class="stat-card stat-card--clickable" onclick="window.location.hash='#customers-follow-ups'"><div class="stat-card__left"><p class="stat-card__label">Follow Ups</p><h2 class="stat-card__value">${followUps}</h2><p class="stat-card__trend trend-up">Pending</p></div><div class="stat-card__icon-wrap" style="background:${iconBgColors.followup}">${statIcons.followup}</div></div>
        <div class="stat-card stat-card--clickable" onclick="window.location.hash='#deals-won'"><div class="stat-card__left"><p class="stat-card__label">Won Deals</p><h2 class="stat-card__value">${wonDeals}</h2><p class="stat-card__trend trend-up">Closed won</p></div><div class="stat-card__icon-wrap" style="background:${iconBgColors.won}">${statIcons.won}</div></div>
        <div class="stat-card stat-card--clickable" onclick="window.location.hash='#deals-lost'"><div class="stat-card__left"><p class="stat-card__label">Lost Deals</p><h2 class="stat-card__value">${lostDeals}</h2><p class="stat-card__trend trend-down">Closed lost</p></div><div class="stat-card__icon-wrap" style="background:${iconBgColors.lost}">${statIcons.lost}</div></div>
        <div class="stat-card stat-card--clickable" onclick="window.location.hash='#deals-values'"><div class="stat-card__left"><p class="stat-card__label">Deals Value</p><h2 class="stat-card__value">$${dealsValue.toLocaleString()}</h2><p class="stat-card__trend trend-up">Total revenue</p></div><div class="stat-card__icon-wrap" style="background:${iconBgColors.value}">${statIcons.value}</div></div>
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
                  <td onclick="event.stopPropagation()"><a href="#" onclick="event.preventDefault();window.location.hash=getStatusRoute('${c.status}')" style="text-decoration:none">${renderStatusBadge(c.status)}</a></td>
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

/* === DEAL VALUES PAGE === */
function renderDealValues() {
  const wonCustomers = customers.filter(c => c.status === "Won Deal" && c.dealValue);
  const totalValue = wonCustomers.reduce((sum, c) => sum + (c.dealValue || 0), 0);
  const avgValue = wonCustomers.length > 0 ? Math.round(totalValue / wonCustomers.length) : 0;
  const maxValue = wonCustomers.length > 0 ? Math.max(...wonCustomers.map(c => c.dealValue || 0)) : 0;
  const minValue = wonCustomers.length > 0 ? Math.min(...wonCustomers.map(c => c.dealValue || 0)) : 0;
  const maxBar = maxValue > 0 ? maxValue : 1;

  const rows = wonCustomers.length > 0 ? wonCustomers.map(c => {
    const pct = Math.round(((c.dealValue || 0) / maxBar) * 100);
    return `<tr onclick="window.location.hash='#customer/${c.id}'" style="cursor:pointer">
      <td><div class="td-with-avatar">${renderAvatarCircle(c.fullName)}<span>${c.fullName}</span></div></td>
      <td>${c.company || '—'}</td>
      <td>${c.productPurchased || '—'}</td>
      <td><div class="dv-bar-wrap"><div class="dv-bar" style="width:${pct}%"></div></div></td>
      <td><strong style="color:var(--color-trend-up)">$${(c.dealValue || 0).toLocaleString()}</strong></td>
    </tr>`;
  }).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--color-text-muted);padding:32px">No won deals with values yet.</td></tr>';

  document.getElementById('content').innerHTML = `
    <div class="dv-hero">
      <div class="dv-hero__label">Total Revenue from Won Deals</div>
      <div class="dv-hero__value">$${totalValue.toLocaleString()}</div>
      <div class="dv-hero__sub">${wonCustomers.length} deal${wonCustomers.length !== 1 ? 's' : ''} closed</div>
    </div>
    <div class="dv-stats">
      <div class="dv-stat"><span class="dv-stat__label">Average Deal</span><span class="dv-stat__num">$${avgValue.toLocaleString()}</span></div>
      <div class="dv-stat"><span class="dv-stat__label">Largest Deal</span><span class="dv-stat__num">$${maxValue.toLocaleString()}</span></div>
      <div class="dv-stat"><span class="dv-stat__label">Smallest Deal</span><span class="dv-stat__num">$${minValue.toLocaleString()}</span></div>
      <div class="dv-stat"><span class="dv-stat__label">Total Deals</span><span class="dv-stat__num">${wonCustomers.length}</span></div>
    </div>
    <div class="table-card">
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Customer</th><th>Company</th><th>Product</th><th>Share</th><th>Deal Value</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
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
  setLifecycle(customer);
  addActivity("status_change", customer.fullName, customer.fullName + " moved from " + oldStatus + " to " + newStatus);
  saveData();
  showToast("Status updated", "success");
  renderCustomerDetail(customerId);
}

function addNote(customerId) {
  const text = document.getElementById('note-input').value.trim();
  if (!text) return;
  const customer = customers.find(c => c.id === customerId);
  if (!customer) return;
  if (!customer.notes) customer.notes = [];
  customer.notes.unshift({ id: generateId("note"), text, createdAt: new Date().toISOString() });
  addActivity("note_added", customer.fullName, "A note was added to " + customer.fullName);
  saveData();
  showToast("Note added", "success");
  renderCustomerDetail(customerId);
}

function deleteNote(customerId, noteId) {
  const customer = customers.find(c => c.id === customerId);
  if (!customer) return;
  customer.notes = (customer.notes || []).filter(n => String(n.id) !== String(noteId));
  saveData();
  showToast("Note deleted", "success");
  renderCustomerDetail(customerId);
}

/* === NOTES PAGE === */
let notesSearchQuery = "";
let notesTypeFilter = "all";

function getFilteredNotes() {
  const allNotes = [];
  customers.forEach(customer => {
    (customer.notes || []).forEach(note => {
      allNotes.push({ ...note, customerName: customer.fullName, customerId: customer.id, type: note.type || 'note' });
    });
  });
  allNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return allNotes.filter(n =>
    (n.customerName.toLowerCase().includes(notesSearchQuery) ||
    n.text.toLowerCase().includes(notesSearchQuery)) &&
    (notesTypeFilter === 'all' || n.type === notesTypeFilter)
  );
}

function buildNotesFeedHtml(filtered) {
  if (filtered.length === 0) return '<div class="empty-state"><p>No notes or questions found.</p></div>';
  return filtered.map(note => {
    const isQuestion = note.type === 'question';
    const badge = isQuestion
      ? '<span class="nq-badge nq-badge--q">❓ Question</span>'
      : '<span class="nq-badge nq-badge--n">📝 Note</span>';
    return `
    <div class="note-feed-item">
      ${renderAvatarCircle(note.customerName)}
      <div class="note-feed-body">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <p class="note-feed-customer">
            <a href="#" onclick="event.preventDefault(); window.location.hash='#customer/${note.customerId}'">${note.customerName}</a>
          </p>
          ${badge}
        </div>
        <p class="note-feed-text">${note.text}</p>
        <p class="note-feed-date">${formatTimeAgo(note.createdAt)}</p>
      </div>
    </div>
  `}).join('');
}

function updateNotesFeed() {
  const filtered = getFilteredNotes();
  const countEl = document.querySelector('.page-count');
  const feedEl = document.querySelector('.notes-feed');
  if (countEl) countEl.textContent = `(${filtered.length})`;
  if (feedEl) feedEl.innerHTML = buildNotesFeedHtml(filtered);
}

function renderNotes() {
  notesSearchQuery = ""; notesTypeFilter = "all";
  const filtered = getFilteredNotes();
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Notes & Questions</h2>
        <span class="page-count">(${filtered.length})</span>
      </div>
      <div class="page-header-right">
        <button class="btn-primary btn-sm" onclick="showNoteQuestionModal('note')" style="width:auto">+ Add Note</button>
        <button class="btn-primary btn-sm" onclick="showNoteQuestionModal('question')" style="width:auto">+ Add Question</button>
      </div>
    </div>
    <div style="display:flex;gap:12px;margin-bottom:16px;align-items:center">
      <div class="page-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="notes-search" placeholder="Search notes or customers..." value="">
      </div>
      <select id="notes-type-filter" class="form-select" style="width:auto">
        <option value="all">All</option>
        <option value="note">Notes only</option>
        <option value="question">Questions only</option>
      </select>
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
  const typeFilter = document.getElementById('notes-type-filter');
  if (typeFilter) {
    typeFilter.addEventListener('change', (e) => {
      notesTypeFilter = e.target.value;
      updateNotesFeed();
    });
  }
}

function showNoteQuestionModal(type) {
  const isQuestion = type === 'question';
  const title = isQuestion ? 'Add Question' : 'Add Note';
  const placeholder = isQuestion ? 'Type your question...' : 'Type your note...';
  const selectedCustId = window.location.hash.startsWith('#customer/') ? window.location.hash.replace('#customer/', '') : '';
  const custOpts = customers.map(c => `<option value="${c.id}"${selectedCustId===c.id?' selected':''}>${c.fullName}</option>`).join('');

  const html = `<div class="modal-backdrop"><div class="modal-panel"><div class="modal-header"><h2 class="modal-title">${title}</h2><button class="modal-close-btn">&times;</button></div><div class="modal-body">
    <div class="form-group"><label class="form-label">Customer</label><select id="nq-customer" class="form-select"><option value="">Select customer...</option>${custOpts}</select></div>
    <div class="form-group"><label class="form-label">${isQuestion?'Question':'Note'}</label><textarea id="nq-text" class="form-textarea" rows="4" placeholder="${placeholder}"></textarea></div>
  </div><div class="modal-footer"><button class="btn-secondary modal-cancel">Cancel</button><button class="btn-primary btn-sm modal-submit" style="width:auto">Save</button></div></div></div>`;
  const modal = document.getElementById('modal-overlay');
  modal.innerHTML = html;
  document.body.classList.add('modal-open');
  modal.querySelector('.modal-close-btn').addEventListener('click', closeModal);
  modal.querySelector('.modal-cancel').addEventListener('click', closeModal);
  modal.querySelector('.modal-backdrop').addEventListener('click', e => { if (e.target.classList.contains('modal-backdrop')) closeModal(); });
  document.addEventListener('keydown', handleEscapeKey);
  modal.querySelector('.modal-submit').addEventListener('click', () => {
    const custId = document.getElementById('nq-customer').value;
    const text = document.getElementById('nq-text').value.trim();
    if (!custId) { showToast('Select a customer', 'error'); return; }
    if (!text) { showToast('Text is required', 'error'); return; }
    const customer = customers.find(c => c.id === custId);
    if (!customer) { showToast('Customer not found', 'error'); return; }
    if (!customer.notes) customer.notes = [];
    customer.notes.unshift({ id: Date.now(), text, type, createdAt: new Date().toISOString() });
    addActivity(type + '_added', customer.fullName, "A " + type + " was added to " + customer.fullName);
    saveData();
    closeModal();
    renderNotes();
    showToast(isQuestion ? 'Question added' : 'Note added', 'success');
  });
}

/* === THEME === */
function toggleTheme() {
  setTheme(settings.theme === 'dark' ? 'light' : 'dark');
}
function setTheme(theme) {
  settings.theme = theme;
  saveData();
  applyTheme();
  // Sync theme to PB
  if (dataSource === "pb") {
    saveSettingPB('theme', theme).catch(function(){});
  }
}

function applyTheme() {
  document.body.classList.toggle('dark-mode', settings.theme === 'dark');
}

/* === NOTIFICATION DROPDOWN === */
let notifications = [];

function loadNotifications() {
  const stored = localStorage.getItem("saleshub_notifs");
  if (stored) { notifications = JSON.parse(stored); }
  else {
    notifications = [
      { id: 1, message: "New customer Mohamed Salah added", isRead: false, timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: 2, message: "Task 'Send proposal to Sara Adel' is due soon", isRead: false, timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: 3, message: "Amr Farouk moved to Hot Lead", isRead: true, timestamp: new Date(Date.now() - 86400000).toISOString() }
    ];
  }
}
function saveNotifications() {
  localStorage.setItem("saleshub_notifs", JSON.stringify(notifications));
}

function updateNotifBadge() {
  const badge = document.getElementById('notif-count');
  if (!badge) return;
  const unread = notifications.filter(n => !n.isRead).length;
  if (unread > 0) { badge.style.display = ''; badge.textContent = unread > 99 ? '99+' : unread; }
  else { badge.style.display = 'none'; }
}

function toggleNotifDropdown() {
  const existing = document.getElementById('notif-dropdown');
  if (existing) { existing.remove(); return; }

  const sorted = [...notifications].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  let html = '<div id="notif-dropdown" class="notif-dropdown">';
  html += '<h4>Notifications <button class="btn-primary btn-sm" style="width:auto;font-size:11px;padding:4px 10px" onclick="event.stopPropagation();markAllNotifsRead()">Mark All as Read</button></h4>';
  if (sorted.length) {
    sorted.forEach(n => {
      html += '<div class="notif-item' + (n.isRead ? '' : ' notif-item--unread') + '"><input type="checkbox" class="notif-check"' + (n.isRead ? ' checked' : '') + ' onclick="event.stopPropagation();toggleNotifRead(' + n.id + ', this.checked)" title="Mark as read"><div class="notif-body"><strong>' + n.message + '</strong><span class="notif-time">' + formatTimeAgo(n.timestamp) + '</span></div><button class="notif-dismiss" onclick="event.stopPropagation();dismissNotif(' + n.id + ')" title="Dismiss">&times;</button></div>';
    });
  } else {
    html += '<div class="notif-empty">No notifications.</div>';
  }
  html += '</div>';
  document.body.insertAdjacentHTML('beforeend', html);

  const bell = document.getElementById('notif-bell');
  const rect = bell.getBoundingClientRect();
  const dd = document.getElementById('notif-dropdown');
  dd.style.top = (rect.bottom + 8) + 'px';
  dd.style.right = (window.innerWidth - rect.right) + 'px';

  setTimeout(() => {
    document.addEventListener('click', function handler(e) {
      if (!dd.contains(e.target) && e.target.id !== 'notif-bell' && !e.target.closest('#notif-bell')) {
        dd.remove(); document.removeEventListener('click', handler);
      }
    });
  }, 0);
}

function dismissNotif(id) {
  notifications = notifications.filter(n => n.id !== id);
  saveNotifications();
  const dd = document.getElementById('notif-dropdown');
  if (dd) { const pos = { top: dd.style.top, right: dd.style.right }; dd.remove(); toggleNotifDropdown(); }
  updateNotifBadge();
}

function toggleNotifRead(id, isRead) {
  const n = notifications.find(x => x.id === id);
  if (n) { n.isRead = isRead; saveNotifications(); updateNotifBadge(); }
}

function markAllNotifsRead() {
  notifications.forEach(n => { n.isRead = true; });
  saveNotifications();
  const dd = document.getElementById('notif-dropdown');
  if (dd) { dd.remove(); toggleNotifDropdown(); }
  updateNotifBadge();
}

/* === TOAST === */
function showToast(msg, type) {
  let c = document.querySelector('.toast-container');
  if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = 'toast toast--' + (type || 'info');
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.remove(); if (!c.children.length) c.remove(); }, 3000);
}

/* === LOGIN === */
function showLogin(msg) {
  const overlay = document.createElement('div');
  overlay.className = 'login-overlay';
  overlay.innerHTML = `<div class="login-card">
    <div class="login-logo">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="2"><rect x="3" y="12" width="3" height="9" rx="1"/><rect x="10" y="7" width="3" height="14" rx="1"/><rect x="17" y="3" width="3" height="18" rx="1"/></svg>
      <span>SalesHub</span>
    </div>
    <h1>Welcome back</h1>
    <p class="login-subtitle">Sign in to your account</p>
    <div class="login-error${msg ? ' visible' : ''}" id="login-error">${msg || ''}</div>
    <div class="form-group">
      <label class="form-label">Email</label>
      <input type="email" class="form-input" id="login-email" placeholder="admin@saleshub.com" autocomplete="username">
    </div>
    <div class="form-group">
      <label class="form-label">Password</label>
      <input type="password" class="form-input" id="login-password" placeholder="Enter password" autocomplete="current-password">
    </div>
    <div class="form-error" id="login-field-error"></div>
    <button class="btn-primary" id="login-btn">Sign In</button>
  </div>`;
  document.body.appendChild(overlay);

  const emailEl = document.getElementById('login-email');
  const passEl = document.getElementById('login-password');
  const btn = document.getElementById('login-btn');
  const fe = document.getElementById('login-field-error');

  async function handle() {
    fe.textContent = ''; fe.classList.remove('visible');
    const em = emailEl.value.trim(), pw = passEl.value;
    if (!em) { fe.textContent = 'Email required'; fe.classList.add('visible'); return; }
    if (!pw) { fe.textContent = 'Password required'; fe.classList.add('visible'); return; }
    try {
      await loginUser(em, pw);
      // Reload data from PB if available
      if (dataSource === "pb") {
        await Promise.all([
          loadCustomersFromPB(),
          loadActivityFromPB(),
          loadTasksFromPB(),
          syncSettingsFromPB(),
        ]);
        // Safety: if PB returned empty, fall back to localStorage
        if (customers.length === 0) {
          loadDataLocal();
        }
      }
      overlay.remove();
      document.getElementById('app').style.display = 'flex';
      renderSidebar(); renderTopbar(); router();
    } catch (err) {
      fe.textContent = err.message; fe.classList.add('visible');
    }
  }
  btn.addEventListener('click', handle);
  passEl.addEventListener('keydown', e => { if (e.key === 'Enter') handle(); });
}

/* === TASKS === */
function renderTasks() {
  const filtered = tasks.filter(t => {
    if (taskSearchQuery && t.title.toLowerCase().indexOf(taskSearchQuery) === -1 && (t.description || '').toLowerCase().indexOf(taskSearchQuery) === -1) return false;
    if (taskStatusFilter !== 'all' && t.status !== taskStatusFilter) return false;
    if (taskPriorityFilter !== 'all' && t.priority !== taskPriorityFilter) return false;
    return true;
  });
  const today = new Date().toISOString().split('T')[0];
  filtered.forEach(t => { t._over = t.dueDate && t.dueDate < today && t.status !== 'done'; });
  const stsOpts = ["todo","in_progress","done","overdue"].map(s => `<option value="${s}"${taskStatusFilter===s?' selected':''}>${s}</option>`).join('');
  const priOpts = [{key:"low",label:"Low"},{key:"medium",label:"Medium"},{key:"high",label:"High"},{key:"urgent",label:"Urgent"}].map(p => `<option value="${p.key}"${taskPriorityFilter===p.key?' selected':''}>${p.label}</option>`).join('');
  const priColors = { low: "#6B7280", medium: "#F59E0B", high: "#EF4444", urgent: "#DC2626" };
  const rows = filtered.length ? filtered.map(t => {
    const c = customers.find(x => x.id === t.customerId);
    const stsOpts = ["todo","in_progress","done","overdue"].map(s => `<div class="ied-opt${t.status===s?' ied-opt--sel':''}" onclick="event.stopPropagation();inlineEditTask(${t.id},'status','${s}')">${s}</div>`).join('');
    const priOpts = [{key:"low",label:"Low"},{key:"medium",label:"Medium"},{key:"high",label:"High"},{key:"urgent",label:"Urgent"}].map(p => `<div class="ied-opt${t.priority===p.key?' ied-opt--sel':''}" onclick="event.stopPropagation();inlineEditTask(${t.id},'priority','${p.key}')">${p.label}</div>`).join('');
    return `<tr class="${t._over?'task-overdue':''}" onclick="showTaskDetail(${t.id})"><td><strong>${t.title}</strong></td><td>${c?c.fullName:'—'}</td><td>${t.assigneeName||'—'}</td>
      <td class="ied-cell" onclick="event.stopPropagation()"><span class="ied-val"${t._over?' style="color:#EF4444;font-weight:600"':''}>${t._over?'Overdue':t.status}</span><div class="ied-drop">${stsOpts}</div></td>
      <td class="ied-cell" onclick="event.stopPropagation()"><span class="ied-val" style="color:${priColors[t.priority]||'#6B7280'};font-weight:600">${t.priority}</span><div class="ied-drop">${priOpts}</div></td>
      <td${t._over?' style="color:#EF4444;font-weight:600"':''}>${t.dueDate||'—'}</td>
      <td onclick="event.stopPropagation()"><div class="action-btns"><input type="checkbox" class="task-check"${t.status==='done'?' checked':''} onclick="event.stopPropagation();toggleTaskDone(${t.id},this.checked)" title="Mark done"><button class="btn-icon btn-edit" onclick="showTaskModal(tasks.find(x=>x.id===${t.id}))" title="Edit"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="btn-icon btn-delete" onclick="deleteTask(${t.id})" title="Delete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></div></td></tr>`;
  }).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--color-text-muted);padding:32px">No tasks found.</td></tr>';

  document.getElementById('content').innerHTML = `<div class="page-header"><h2>Tasks</h2><button class="btn-primary btn-sm" onclick="showTaskModal()" style="width:auto">+ Add Task</button></div>
    <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
      <div class="page-search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input type="text" id="ts" placeholder="Search tasks..." value="${taskSearchQuery}"></div>
      <select id="tss" class="form-select" style="width:auto"><option value="all">All Status</option>${stsOpts}</select>
      <select id="tsp" class="form-select" style="width:auto"><option value="all">All Priority</option>${priOpts}</select>
    </div>
    <div class="table-card"><div class="table-wrap"><table class="data-table"><thead><tr><th>Title</th><th>Customer</th><th>Assigned To</th><th>Status</th><th>Priority</th><th>Due Date</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;

  document.getElementById('ts').addEventListener('input', e => { taskSearchQuery = e.target.value.toLowerCase(); renderTasks(); });
  document.getElementById('tss').addEventListener('change', e => { taskStatusFilter = e.target.value; renderTasks(); });
  document.getElementById('tsp').addEventListener('change', e => { taskPriorityFilter = e.target.value; renderTasks(); });
}

function showTaskDetail(id) {
  const t = tasks.find(x => x.id === id); if (!t) return;
  const c = customers.find(x => x.id === t.customerId);
  document.getElementById('content').innerHTML = `<div class="detail-back-bar"><button class="btn-back" onclick="renderTasks()">&larr; Back</button><h2>${t.title}</h2></div>
    <div class="detail-columns"><div class="detail-left"><div class="detail-card"><div class="detail-card-header"><h3>Task Details</h3><button class="btn-primary btn-sm" onclick="showTaskModal(tasks.find(x=>x.id===${t.id}))" style="width:auto">Edit Task</button></div>
    <div class="detail-fields">
      <div class="detail-field"><span class="detail-label">Title</span><span class="detail-value"><strong>${t.title}</strong></span></div>
      <div class="detail-field"><span class="detail-label">Description</span><span class="detail-value">${t.description||'—'}</span></div>
      <div class="detail-field"><span class="detail-label">Customer</span><span class="detail-value">${c?c.fullName:'—'}</span></div>
      <div class="detail-field"><span class="detail-label">Assigned To</span><span class="detail-value">${t.assigneeName||'Unassigned'}</span></div>
      <div class="detail-field"><span class="detail-label">Status</span><span class="detail-value">${t.status}</span></div>
      <div class="detail-field"><span class="detail-label">Priority</span><span class="detail-value">${t.priority}</span></div>
      <div class="detail-field"><span class="detail-label">Due Date</span><span class="detail-value">${t.dueDate||'—'}</span></div>
    </div></div></div></div>`;
}

let editTask = null;
function showTaskModal(task) {
  editTask = task || null; const ie = !!task;
  const co = customers.map(c => `<option value="${c.id}"${ie&&task.customerId===c.id?' selected':''}>${c.fullName}</option>`).join('');
  const so = ["todo","in_progress","done","overdue"].map(s => `<option value="${s}"${ie&&task.status===s?' selected':''}>${s}</option>`).join('');
  const po = [{key:"low",label:"Low"},{key:"medium",label:"Medium"},{key:"high",label:"High"},{key:"urgent",label:"Urgent"}].map(p => `<option value="${p.key}"${ie&&task.priority===p.key?' selected':''}>${p.label}</option>`).join('');
  const uo = DEMO_USERS.map(u => `<option value="${u.email}"${ie&&task.assigneeName===u.name?' selected':''}>${u.name}</option>`).join('');
  const h = `<div class="modal-backdrop"><div class="modal-panel"><div class="modal-header"><h2 class="modal-title">${ie?'Edit Task':'Add Task'}</h2><button class="modal-close-btn">&times;</button></div><div class="modal-body"><div class="form-group"><label class="form-label">Title *</label><input type="text" id="t-title" class="form-input" placeholder="Task title" value="${ie?task.title:''}"></div><div class="form-group"><label class="form-label">Description</label><textarea id="t-desc" class="form-textarea" rows="2" placeholder="Task details">${ie?task.description||'':''}</textarea></div><div class="form-row"><div class="form-group"><label class="form-label">Customer</label><select id="t-cust" class="form-select"><option value="">None</option>${co}</select></div><div class="form-group"><label class="form-label">Assigned To</label><select id="t-assign" class="form-select"><option value="">Unassigned</option>${uo}</select></div></div><div class="form-row"><div class="form-group"><label class="form-label">Status</label><select id="t-sts" class="form-select">${so}</select></div><div class="form-group"><label class="form-label">Priority</label><select id="t-pri" class="form-select">${po}</select></div></div><div class="form-row"><div class="form-group"><label class="form-label">Due Date</label><input type="date" id="t-due" class="form-input" value="${ie?task.dueDate||'':''}"></div></div></div><div class="modal-footer"><button class="btn-secondary modal-cancel">Cancel</button><button class="btn-primary btn-sm modal-submit" style="width:auto">${ie?'Update':'Create'}</button></div></div></div>`;
  document.getElementById('modal-overlay').innerHTML = h;
  document.body.classList.add('modal-open');
  document.querySelector('.modal-close-btn').addEventListener('click', closeModal);
  document.querySelector('.modal-cancel').addEventListener('click', closeModal);
  document.querySelector('.modal-backdrop').addEventListener('click', e => { if (e.target.classList.contains('modal-backdrop')) closeModal(); });
  document.addEventListener('keydown', handleEscapeKey);
  document.querySelector('.modal-submit').addEventListener('click', handleTaskSubmit);
}

function handleTaskSubmit() {
  const title = document.getElementById('t-title').value.trim();
  if (!title) { showToast('Title required', 'error'); return; }
  const aVal = document.getElementById('t-assign').value;
  const aName = aVal ? aVal : '';
  const data = {
    title, description: document.getElementById('t-desc').value.trim(),
    customerId: document.getElementById('t-cust').value || null,
    assignedTo: aVal || null, assigneeName: aName,
    status: document.getElementById('t-sts').value,
    priority: document.getElementById('t-pri').value,
    dueDate: document.getElementById('t-due').value || null
  };
  if (editTask) {
    Object.assign(editTask, data);
    editTask.updatedAt = new Date().toISOString();
    addActivity("task_update", editTask.title || "Task", "Task \u201c" + (editTask.title || "Task") + "\u201d updated");
    saveData();
    showToast('Task updated', 'success');
  } else {
    const nt = Object.assign({ id: Date.now(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, data);
    tasks.push(nt);
    saveData();
    showToast('Task created', 'success');
  }
  closeModal(); renderTasks();
}

function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  tasks = tasks.filter(t => t.id !== id);
  saveData();
  showToast('Task deleted', 'success');
  renderTasks();
}

function toggleTaskDone(id, checked) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  t.status = checked ? 'done' : 'todo';
  t.updatedAt = new Date().toISOString();
  addActivity("status_change", t.title, checked ? "Task \u201c" + t.title + "\u201d marked done" : "Task \u201c" + t.title + "\u201d reopened");
  saveData();
  showToast(checked ? 'Task completed' : 'Task reopened', 'success');
  renderTasks();
}

let pendingInlineEdit = null;

function inlineEditTask(taskId, field, newValue) {
  const t = tasks.find(x => x.id === taskId);
  if (!t) return;
  pendingInlineEdit = { taskId, field, newValue };
  // Close dropdown, show confirm bar
  const drops = document.querySelectorAll('.ied-drop');
  drops.forEach(d => d.classList.remove('ied-drop--open'));
  // Remove any existing confirm bar
  const old = document.querySelector('.ied-confirm');
  if (old) old.remove();
  // Show confirm on the row
  const cell = document.querySelector(`tr[onclick*="showTaskDetail(${taskId})"] .ied-cell`);
  if (!cell) return;
  const confirm = document.createElement('div');
  confirm.className = 'ied-confirm';
  confirm.innerHTML = `<button class="ied-save" onclick="event.stopPropagation();confirmInlineEdit()">✓ Save</button><button class="ied-cancel" onclick="event.stopPropagation();cancelInlineEdit()">✗ Cancel</button>`;
  confirm.style.cssText = 'position:absolute;background:var(--color-surface);border:1px solid var(--color-accent);border-radius:8px;padding:6px 10px;z-index:100;display:flex;gap:8px;box-shadow:0 4px 12px rgba(0,0,0,.1)';
  cell.style.position = 'relative';
  cell.appendChild(confirm);
}

function confirmInlineEdit() {
  if (!pendingInlineEdit) return;
  const t = tasks.find(x => x.id === pendingInlineEdit.taskId);
  if (!t) return;
  if (pendingInlineEdit.field === 'status') {
    addActivity("status_change", t.title, "Task \u201c" + t.title + "\u201d status changed to " + pendingInlineEdit.newValue);
  }
  t[pendingInlineEdit.field] = pendingInlineEdit.newValue;
  t.updatedAt = new Date().toISOString();
  saveData();
  pendingInlineEdit = null;
  showToast('Updated', 'success');
  renderTasks();
}

function cancelInlineEdit() {
  pendingInlineEdit = null;
  const c = document.querySelector('.ied-confirm');
  if (c) c.remove();
}

/* === REPORTS === */
function renderReports() {
  const total = customers.length;
  const byStatus = STATUSES.map(s => ({ ...s, count: customers.filter(c => c.status === s.key).length }));
  const bySource = SOURCES.map(s => ({ name: s, count: customers.filter(c => c.source === s).length })).filter(s => s.count > 0).sort((a, b) => b.count - a.count);
  const wonCount = customers.filter(c => c.status === 'Won Deal').length;
  const lostCount = customers.filter(c => c.status === 'Lost Deal').length;
  const closedCount = wonCount + lostCount;
  const conversionRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0;
  const totalRevenue = customers.filter(c => c.status === 'Won Deal').reduce((s, c) => s + (c.dealValue || 0), 0);
  const taskTotal = tasks.length;
  const taskDone = tasks.filter(t => t.status === 'done').length;
  const taskOverdue = tasks.filter(t => { const td = new Date().toISOString().split('T')[0]; return t.dueDate && t.dueDate < td && t.status !== 'done'; }).length;
  const taskRate = taskTotal > 0 ? Math.round((taskDone / taskTotal) * 100) : 0;
  const maxSource = Math.max(...bySource.map(s => s.count), 1);

  const statusBars = byStatus.map(s => {
    const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
    return '<div class="rpt-row"><span class="rpt-label">' + s.key + '</span><div class="rpt-bar-wrap"><div class="rpt-bar" style="width:' + pct + '%;background:' + s.color + '"></div></div><span class="rpt-val">' + s.count + ' <small>' + pct + '%</small></span></div>';
  }).join('');

  const sourceBars = bySource.map(s => {
    const pct = Math.round((s.count / maxSource) * 100);
    return '<div class="rpt-row"><span class="rpt-label">' + s.name + '</span><div class="rpt-bar-wrap"><div class="rpt-bar" style="width:' + pct + '%;background:#3B82F6"></div></div><span class="rpt-val">' + s.count + '</span></div>';
  }).join('');

  document.getElementById('content').innerHTML =
    '<div class="page-header"><h2>Reports</h2></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px">' +
      '<div class="dashboard-panel"><div class="panel-header"><h3>Pipeline Overview</h3></div><div style="padding:20px">' + statusBars + '</div></div>' +
      '<div class="dashboard-panel"><div class="panel-header"><h3>Lead Sources</h3></div><div style="padding:20px">' + (sourceBars || '<p style="color:var(--color-text-muted);text-align:center;padding:20px">No data</p>') + '</div></div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px">' +
      '<div class="stat-card"><div class="stat-card__left"><p class="stat-card__label">Conversion Rate</p><h2 class="stat-card__value">' + conversionRate + '%</h2><p class="stat-card__trend">Won vs Lost</p></div></div>' +
      '<div class="stat-card"><div class="stat-card__left"><p class="stat-card__label">Total Revenue</p><h2 class="stat-card__value">$' + totalRevenue.toLocaleString() + '</h2><p class="stat-card__trend trend-up">Closed deals</p></div></div>' +
      '<div class="stat-card"><div class="stat-card__left"><p class="stat-card__label">Task Completion</p><h2 class="stat-card__value">' + taskRate + '%</h2><p class="stat-card__trend">' + taskDone + '/' + taskTotal + ' done</p></div></div>' +
      '<div class="stat-card"><div class="stat-card__left"><p class="stat-card__label">Overdue Tasks</p><h2 class="stat-card__value">' + taskOverdue + '</h2><p class="stat-card__trend trend-down">Needs attention</p></div></div>' +
    '</div>' +
    '<div class="dashboard-panel"><div class="panel-header"><h3>Sales Funnel</h3></div><div style="padding:20px"><canvas id="funnel-chart" style="max-height:280px"></canvas></div></div>';

  setTimeout(function() {
    var cv = document.getElementById('funnel-chart');
    if (cv) {
      var stages = ['New Lead', 'Interested Customer', 'Hot Lead', 'Follow Up', 'Won Deal', 'Lost Deal'];
      var counts = stages.map(function(s) { return customers.filter(function(c) { return c.status === s; }).length; });
      new Chart(cv.getContext('2d'), {
        type: 'bar',
        data: { labels: stages, datasets: [{ data: counts, backgroundColor: ['#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#10B981', '#6B7280'], borderRadius: 6 }] },
        options: { indexAxis: 'y', plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false }
      });
    }
  }, 50);
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
  "#deals-values": "Deal Values",
  "#notes": "Notes & Questions",
  "#tasks": "Tasks",
  "#reports": "Reports"
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
  "#deals-values": renderDealValues,
  "#notes": renderNotes,
  "#tasks": renderTasks,
  "#reports": renderReports
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
    if (titleEl) titleEl.textContent = "Customer Details";
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
window.addEventListener("DOMContentLoaded", async () => {
  await initDataLayer();
  loadNotifications();

  // Load tasks from localStorage (or use sample if none)
  const storedTasks = localStorage.getItem("saleshub_tasks");
  if (storedTasks) { tasks = JSON.parse(storedTasks); }
  else {
    tasks = [
      { id: 1, title: "Follow up with Mohamed Salah", description: "Call to discuss pricing", assignedTo: null, assigneeName: null, customerId: "cust_101", status: "todo", priority: "high", dueDate: "2024-06-08", createdAt: "2024-06-01T10:00:00Z", updatedAt: "2024-06-01T10:00:00Z" },
      { id: 2, title: "Send proposal to Sara Adel", description: "Prepare and email proposal", assignedTo: null, assigneeName: null, customerId: "cust_105", status: "in_progress", priority: "urgent", dueDate: "2024-06-05", createdAt: "2024-06-01T10:00:00Z", updatedAt: "2024-06-01T10:00:00Z" },
      { id: 3, title: "Demo call with Amr Farouk", description: "Schedule product demo", assignedTo: null, assigneeName: null, customerId: "cust_109", status: "todo", priority: "medium", dueDate: "2024-06-07", createdAt: "2024-06-01T10:00:00Z", updatedAt: "2024-06-01T10:00:00Z" },
      { id: 4, title: "Review competitor analysis", description: "Research pricing for lost deal", assignedTo: null, assigneeName: null, customerId: "cust_118", status: "todo", priority: "low", dueDate: "2024-06-10", createdAt: "2024-06-01T10:00:00Z", updatedAt: "2024-06-01T10:00:00Z" },
      { id: 5, title: "Onboarding for Nadia Youssef", description: "Start enterprise onboarding", assignedTo: null, assigneeName: null, customerId: "cust_115", status: "in_progress", priority: "medium", dueDate: "2024-06-06", createdAt: "2024-06-01T10:00:00Z", updatedAt: "2024-06-01T10:00:00Z" }
    ];
  }

  // Auth check
  if (!isAuth()) {
    document.getElementById('app').style.display = 'none';
    showLogin();
    return;
  }

  renderSidebar();
  renderTopbar();

  // Topbar search — customers only
  const globalSearch = document.getElementById('global-search');
  if (globalSearch) {
    globalSearch.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      const hash = window.location.hash || "#dashboard";
      if (q.length > 0) {
        currentSearchQuery = q.toLowerCase();
        if (!hash.startsWith("#customers-") && !hash.startsWith("#deals-")) {
          window.location.hash = "#customers-all";
        } else {
          updateCustomerTable();
        }
      } else {
        currentSearchQuery = "";
        if (hash.startsWith("#customers-") || hash.startsWith("#deals-")) {
          updateCustomerTable();
        }
      }
    });
  }

  router();
});
