/* === PocketBase Client — SalesHub CRM Data Layer v2.0 ===
   Replaces localStorage with PocketBase backend.
   Load order: PocketBase SDK → pb-client.js → app.js
   Dependencies: pocketbase@0.21.x (CDN)
*/

const PB_URL = (() => {
  try { return localStorage.getItem("saleshub_pb_url") || "http://localhost:8090"; }
  catch (e) { return "http://localhost:8090"; }
})();

let pb = null;
let pbReady = false;
let pbInitError = null;

/* ── Initialization ── */
function initPB() {
  if (typeof PocketBase === 'undefined') {
    pbInitError = "PocketBase SDK not loaded. Check CDN script tag.";
    console.error(pbInitError);
    return false;
  }
  pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);

  // Restore session from localStorage
  const saved = localStorage.getItem("saleshub_pb_auth");
  if (saved) {
    try {
      const data = JSON.parse(saved);
      pb.authStore.save(data.token, data.model);
    } catch (e) {
      localStorage.removeItem("saleshub_pb_auth");
    }
  }

  pb.authStore.onChange(() => {
    const token = pb.authStore.token;
    const model = pb.authStore.model;
    if (token && model) {
      localStorage.setItem("saleshub_pb_auth", JSON.stringify({ token, model }));
    } else {
      localStorage.removeItem("saleshub_pb_auth");
    }
  });

  pbReady = true;
  console.log("[PB] Connected to", PB_URL);
  return true;
}

/* ── Auth ── */
async function pbLogin(email, password) {
  if (!pbReady) throw new Error("PocketBase not initialized");
  try {
    const authData = await pb.collection('users').authWithPassword(email, password);
    return authData.record;
  } catch (e) {
    const msg = e?.response?.message || e?.message || "Login failed";
    throw new Error(msg);
  }
}

function pbLogout() {
  if (!pbReady) return;
  pb.authStore.clear();
  localStorage.removeItem("saleshub_pb_auth");
}

function pbGetUser() {
  if (!pbReady || !pb.authStore.isValid) return null;
  return pb.authStore.model;
}

function pbIsAuth() {
  return pbReady && pb.authStore.isValid;
}

function pbIsAdmin() {
  return pbIsAuth() && (pbGetUser().role === 'super_admin' || pbGetUser().role === 'admin');
}

function pbHasPermission(perm) {
  const user = pbGetUser();
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  // Check user-level permissions array if present
  return user.permissions?.includes(perm) || false;
}

/* ── Customers CRUD ── */
async function pbGetCustomers(filter = "", sort = "-created", page = 1, perPage = 500) {
  if (!pbReady) return [];
  try {
    const records = await pb.collection('customers').getList(page, perPage, {
      filter: filter || undefined,
      sort: sort,
      expand: 'assigned_to',
    });
    return records.items.map(recordToCustomer);
  } catch (e) {
    console.error("pbGetCustomers:", e?.message || e);
    return [];
  }
}

async function pbGetCustomer(id) {
  if (!pbReady) return null;
  try {
    const record = await pb.collection('customers').getOne(id, { expand: 'assigned_to' });
    return recordToCustomer(record);
  } catch (e) {
    return null;
  }
}

async function pbCreateCustomer(data) {
  if (!pbReady) throw new Error("PocketBase not initialized");
  const payload = {
    full_name: data.fullName,
    phone: data.phone,
    email: data.email || "",
    company: data.company || "",
    source: data.source || "",
    status: data.status,
    lifecycle: data.lifecycle || LIFECYCLE_MAP?.[data.status] || "lead",
    assigned_to: data.assignedTo || null,
    deal_value: data.dealValue || null,
    product: data.productPurchased || "",
    lost_reason: data.lostReason || "",
    last_contact_date: data.lastContactDate || "",
    next_followup: data.nextFollowUpDate || "",
  };
  const record = await pb.collection('customers').create(payload);
  return recordToCustomer(record);
}

async function pbUpdateCustomer(id, data) {
  if (!pbReady) throw new Error("PocketBase not initialized");
  const payload = {
    full_name: data.fullName,
    phone: data.phone,
    email: data.email || "",
    company: data.company || "",
    source: data.source || "",
    status: data.status,
    lifecycle: data.lifecycle || LIFECYCLE_MAP?.[data.status] || "lead",
    assigned_to: data.assignedTo || null,
    deal_value: data.dealValue ?? null,
    product: data.productPurchased || "",
    lost_reason: data.lostReason || "",
    last_contact_date: data.lastContactDate || "",
    next_followup: data.nextFollowUpDate || "",
  };
  const record = await pb.collection('customers').update(id, payload);
  return recordToCustomer(record);
}

async function pbDeleteCustomer(id) {
  if (!pbReady) return false;
  try {
    await pb.collection('customers').delete(id);
    return true;
  } catch (e) {
    console.error("pbDeleteCustomer:", e?.message || e);
    return false;
  }
}

/* ── Notes CRUD ── */
async function pbGetNotes(customerId) {
  if (!pbReady) return [];
  try {
    const records = await pb.collection('notes').getList(1, 500, {
      filter: customerId ? `customer_id="${customerId}"` : "",
      sort: "-created",
    });
    return records.items.map(recordToNote);
  } catch (e) {
    return [];
  }
}

async function pbCreateNote(customerId, text, type = "note") {
  if (!pbReady) throw new Error("PocketBase not initialized");
  const user = pbGetUser();
  const payload = {
    customer_id: customerId,
    author_id: user.id,
    text: text,
    type: type,
  };
  const record = await pb.collection('notes').create(payload);
  return recordToNote(record);
}

async function pbDeleteNote(id) {
  if (!pbReady) return false;
  try {
    await pb.collection('notes').delete(id);
    return true;
  } catch (e) {
    return false;
  }
}

/* ── Tasks CRUD ── */
async function pbGetTasks(filter = "", sort = "-created", page = 1, perPage = 500) {
  if (!pbReady) return [];
  try {
    const records = await pb.collection('tasks').getList(page, perPage, {
      filter: filter || undefined,
      sort: sort,
      expand: 'assigned_to,customer_id',
    });
    return records.items.map(recordToTask);
  } catch (e) {
    return [];
  }
}

async function pbCreateTask(data) {
  if (!pbReady) throw new Error("PocketBase not initialized");
  const user = pbGetUser();
  const payload = {
    title: data.title,
    description: data.description || "",
    customer_id: data.customerId || null,
    assigned_to: data.assignedTo || null,
    created_by: user.id,
    status: data.status || "todo",
    priority: data.priority || "medium",
    due_date: data.dueDate || null,
  };
  const record = await pb.collection('tasks').create(payload);
  return recordToTask(record);
}

async function pbUpdateTask(id, data) {
  if (!pbReady) throw new Error("PocketBase not initialized");
  const payload = {
    title: data.title,
    description: data.description || "",
    customer_id: data.customerId || null,
    assigned_to: data.assignedTo || null,
    status: data.status,
    priority: data.priority,
    due_date: data.dueDate || null,
  };
  const record = await pb.collection('tasks').update(id, payload);
  return recordToTask(record);
}

async function pbDeleteTask(id) {
  if (!pbReady) return false;
  try {
    await pb.collection('tasks').delete(id);
    return true;
  } catch (e) {
    return false;
  }
}

/* ── Activity Log ── */
async function pbGetActivity(limit = 50) {
  if (!pbReady) return [];
  try {
    const records = await pb.collection('activity_log').getList(1, limit, {
      sort: "-created",
    });
    return records.items.map(recordToActivity);
  } catch (e) {
    return [];
  }
}

async function pbAddActivity(type, customerName, description, customerId = null) {
  if (!pbReady) return null;
  const user = pbGetUser();
  if (!user) return null;
  try {
    const payload = {
      type: type,
      user_id: user.id,
      customer_name: customerName,
      description: description,
      customer_id: customerId || null,
    };
    const record = await pb.collection('activity_log').create(payload);
    return recordToActivity(record);
  } catch (e) {
    console.error("pbAddActivity:", e?.message || e);
    return null;
  }
}

/* ── Notifications ── */
async function pbGetNotifications(limit = 50) {
  if (!pbReady) return [];
  const user = pbGetUser();
  if (!user) return [];
  try {
    const records = await pb.collection('notifications').getList(1, limit, {
      filter: `recipient_id="${user.id}"`,
      sort: "-created",
    });
    return records.items.map(r => ({
      id: r.id,
      type: r.type,
      message: r.message,
      isRead: r.is_read,
      createdAt: r.created,
    }));
  } catch (e) {
    return [];
  }
}

async function pbMarkNotificationRead(id, isRead = true) {
  if (!pbReady) return;
  try {
    await pb.collection('notifications').update(id, { is_read: isRead });
  } catch (e) { /* ignore */ }
}

async function pbMarkAllNotificationsRead() {
  if (!pbReady) return;
  const user = pbGetUser();
  if (!user) return;
  try {
    const records = await pb.collection('notifications').getFullList({
      filter: `recipient_id="${user.id}" && is_read=false`,
    });
    for (const r of records) {
      await pb.collection('notifications').update(r.id, { is_read: true });
    }
  } catch (e) { /* ignore */ }
}

/* ── Settings ── */
async function pbGetSettings() {
  if (!pbReady) return {};
  const user = pbGetUser();
  if (!user) return {};
  try {
    const records = await pb.collection('settings').getFullList({
      filter: `user_id="${user.id}"`,
    });
    const settings = {};
    records.forEach(r => { settings[r.key] = safeJsonParse(r.value); });
    return settings;
  } catch (e) {
    return {};
  }
}

async function pbSetSetting(key, value) {
  if (!pbReady) return;
  const user = pbGetUser();
  if (!user) return;
  try {
    // Upsert: check if exists first
    const existing = await pb.collection('settings').getList(1, 1, {
      filter: `user_id="${user.id}" && key="${key}"`,
    });
    if (existing.items.length > 0) {
      await pb.collection('settings').update(existing.items[0].id, {
        value: typeof value === 'string' ? value : JSON.stringify(value),
      });
    } else {
      await pb.collection('settings').create({
        user_id: user.id,
        key: key,
        value: typeof value === 'string' ? value : JSON.stringify(value),
      });
    }
  } catch (e) {
    console.error("pbSetSetting:", e?.message || e);
  }
}

/* ── Audit Log ── */
async function pbAddAudit(action, entityType, entityId, details = "") {
  if (!pbReady) return;
  const user = pbGetUser();
  if (!user) return;
  try {
    await pb.collection('audit_log').create({
      user_id: user.id,
      action: action,
      entity_type: entityType,
      entity_id: entityId || "",
      details: details,
      ip_address: "client",
    });
  } catch (e) {
    console.error("pbAddAudit:", e?.message || e);
  }
}

/* ── Sources ── */
async function pbGetSources() {
  if (!pbReady) return [];
  try {
    const records = await pb.collection('sources').getFullList({ sort: "order" });
    return records.map(r => r.name);
  } catch (e) {
    return SOURCES || []; // fallback to local constants
  }
}

/* ── Record Mappers: PocketBase → app format ── */
function recordToCustomer(r) {
  return {
    id: r.id,
    fullName: r.full_name,
    phone: r.phone,
    email: r.email || "",
    company: r.company || "",
    source: r.source || "",
    status: r.status,
    lifecycle: r.lifecycle,
    assignedTo: r.assigned_to || null,
    dealValue: r.deal_value ?? null,
    productPurchased: r.product || null,
    lostReason: r.lost_reason || null,
    lastContactDate: r.last_contact_date || null,
    nextFollowUpDate: r.next_followup || null,
    notes: [], // loaded separately via pbGetNotes()
    createdAt: r.created,
    updatedAt: r.updated,
    // local-only flags
    _isFromServer: true,
  };
}

function recordToNote(r) {
  return {
    id: r.id,
    customerId: r.customer_id || "",
    customerName: r.expand?.customer_id?.full_name || "",
    authorId: r.author_id || "",
    text: r.text,
    type: r.type || "note",
    createdAt: r.created,
  };
}

function recordToTask(r) {
  return {
    id: r.id,
    title: r.title,
    description: r.description || "",
    customerId: r.customer_id || null,
    customerName: r.expand?.customer_id?.full_name || "",
    assignedTo: r.assigned_to || null,
    assigneeName: r.expand?.assigned_to?.name || "",
    createdBy: r.created_by,
    status: r.status,
    priority: r.priority,
    dueDate: r.due_date || null,
    createdAt: r.created,
    updatedAt: r.updated,
  };
}

function recordToActivity(r) {
  return {
    id: r.id,
    type: r.type,
    customerName: r.customer_name || "",
    customerId: r.customer_id || null,
    userId: r.user_id || "",
    description: r.description,
    timestamp: r.created,
  };
}

function safeJsonParse(val) {
  if (!val) return val;
  try { return JSON.parse(val); } catch (e) { return val; }
}

/* ── Hybrid: Determine if PB is available ── */
function pbIsAvailable() {
  return pbReady && pb?.authStore?.isValid;
}

/* ── Expose for app.js use ── */
window.PB = {
  init: initPB,
  ready: () => pbReady,
  available: pbIsAvailable,
  error: () => pbInitError,
  // Auth
  login: pbLogin,
  logout: pbLogout,
  getUser: pbGetUser,
  isAuth: pbIsAuth,
  isAdmin: pbIsAdmin,
  hasPermission: pbHasPermission,
  // Customers
  getCustomers: pbGetCustomers,
  getCustomer: pbGetCustomer,
  createCustomer: pbCreateCustomer,
  updateCustomer: pbUpdateCustomer,
  deleteCustomer: pbDeleteCustomer,
  // Notes
  getNotes: pbGetNotes,
  createNote: pbCreateNote,
  deleteNote: pbDeleteNote,
  // Tasks
  getTasks: pbGetTasks,
  createTask: pbCreateTask,
  updateTask: pbUpdateTask,
  deleteTask: pbDeleteTask,
  // Activity
  getActivity: pbGetActivity,
  addActivity: pbAddActivity,
  // Notifications
  getNotifications: pbGetNotifications,
  markNotifRead: pbMarkNotificationRead,
  markAllNotifsRead: pbMarkAllNotificationsRead,
  // Settings
  getSettings: pbGetSettings,
  setSetting: pbSetSetting,
  // Audit
  addAudit: pbAddAudit,
  // Sources
  getSources: pbGetSources,
};
