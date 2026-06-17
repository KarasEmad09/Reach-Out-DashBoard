/* === Hybrid Data Layer ===
   Bridges PocketBase API with existing localStorage fallback.
   Provides same API as current loadData/saveData/addActivity pattern.
   Load order: PocketBase CDN → pb-client.js → data-layer.js → app.js
*/

let dataSource = "local"; // "local" | "pb"
let pbCustomersCache = [];
let pbActivityCache = [];
let pbTasksCache = [];
let pbNotesCacheAll = [];

/* ── Boot: Determine data source ── */
async function bootDataLayer() {
  // Try to init PocketBase
  if (typeof PocketBase !== 'undefined' && typeof initPB === 'function') {
    const ok = initPB();
    if (ok && pb.authStore.isValid) {
      dataSource = "pb";
      console.log("[DataLayer] Using PocketBase backend");
      return true;
    }
  }
  console.log("[DataLayer] Using localStorage fallback");
  return false;
}

/* ── Sync all data from PocketBase ── */
async function syncFromPB() {
  if (dataSource !== "pb") return;
  try {
    const [custResult, actResult, taskResult] = await Promise.all([
      PB.getCustomers("", "-created", 1, 1000),
      PB.getActivity(100),
      PB.getTasks("", "-created", 1, 1000),
    ]);
    pbCustomersCache = custResult;
    pbActivityCache = actResult;
    pbTasksCache = taskResult;
  } catch (e) {
    console.error("[DataLayer] Sync failed:", e?.message || e);
  }
}

/* ── loadData() replacement ── */
function loadDataLocal() {
  const storedCustomers = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
  const storedActivity = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
  const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);

  if (storedCustomers) {
    customers = JSON.parse(storedCustomers);
    customers.forEach(c => { if (!c.lifecycle) setLifecycle(c); });
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

/* ── saveData() replacement ── */
function saveDataLocal() {
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(activityLog));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  localStorage.setItem("saleshub_tasks", JSON.stringify(tasks));
}

/* ── addActivity() replacement ── */
function addActivityLocal(type, customerName, description) {
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

/* ── PB-aware addActivity ── */
async function addActivityPB(type, customerName, description, customerId) {
  const result = await PB.addActivity(type, customerName, description, customerId);
  return result;
}

/* ── PB-aware read ── */
async function loadCustomersFromPB() {
  if (dataSource !== "pb") return customers;
  try {
    const result = await PB.getCustomers("", "-created", 1, 2000);
    // Merge notes into each customer
    for (const cust of result) {
      cust.notes = await loadNotesForCustomerPB(cust.id);
    }
    customers = result;
  } catch (e) {
    console.error("[DataLayer] Load customers from PB failed:", e?.message || e);
  }
  return customers;
}

async function loadNotesForCustomerPB(customerId) {
  try {
    const notes = await PB.getNotes(customerId);
    return notes.map(n => ({
      id: n.id,
      text: n.text,
      type: n.type || "note",
      customerName: n.customerName,
      createdAt: n.createdAt,
    }));
  } catch (e) {
    return [];
  }
}

async function loadActivityFromPB() {
  if (dataSource !== "pb") return activityLog;
  try {
    const result = await PB.getActivity(200);
    activityLog = result;
  } catch (e) {
    console.error("[DataLayer] Load activity from PB failed:", e?.message || e);
  }
  return activityLog;
}

async function loadTasksFromPB() {
  if (dataSource !== "pb") return tasks;
  try {
    const result = await PB.getTasks("", "-created", 1, 2000);
    tasks = result;
  } catch (e) {
    console.error("[DataLayer] Load tasks from PB failed:", e?.message || e);
  }
  return tasks;
}

async function loadSettingsFromPB() {
  if (dataSource !== "pb") return settings;
  try {
    const result = await PB.getSettings();
    if (Object.keys(result).length > 0) {
      settings = result;
    }
  } catch (e) {
    console.error("[DataLayer] Load settings from PB failed:", e?.message || e);
  }
  return settings;
}

/* ── PB-aware Settings Save ── */
async function saveSettingPB(key, value) {
  if (dataSource !== "pb") {
    settings[key] = value;
    saveDataLocal();
    return;
  }
  await PB.setSetting(key, value);
  settings[key] = value;
}

/* ── PB: sync settings to local for applyTheme etc. ── */
async function syncSettingsFromPB() {
  if (dataSource !== "pb") return;
  try {
    const pbSettings = await PB.getSettings();
    if (Object.keys(pbSettings).length > 0) {
      settings = { ...settings, ...pbSettings };
    }
    applyTheme();
  } catch (e) {
    console.error("[DataLayer] Sync settings failed:", e?.message || e);
  }
}

/* ── Unified init: called from DOMContentLoaded ── */
async function initDataLayer() {
  const isPB = await bootDataLayer();
  if (isPB) {
    await Promise.all([
      loadCustomersFromPB(),
      loadActivityFromPB(),
      loadTasksFromPB(),
      syncSettingsFromPB(),
    ]);
    // Safety: if PB returned no customers but localStorage has data, fall back
    if (customers.length === 0) {
      console.warn("[DataLayer] PB returned 0 customers. Checking localStorage fallback...");
      const stored = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (stored) {
        customers = JSON.parse(stored);
        customers.forEach(c => { if (!c.lifecycle) setLifecycle(c); });
        console.log("[DataLayer] Loaded " + customers.length + " customers from localStorage fallback.");
      }
      if (activityLog.length === 0) {
        const storedAct = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
        if (storedAct) { activityLog = JSON.parse(storedAct); }
      }
    }
    console.log("[DataLayer] Loaded from PB:", customers.length, "customers,", activityLog.length, "activities,", tasks.length, "tasks");
  } else {
    loadDataLocal();
    const storedTasks = localStorage.getItem("saleshub_tasks");
    if (storedTasks) { tasks = JSON.parse(storedTasks); }
  }
}

/* ── Override: Mutable helpers that auto-sync to PB ── */
async function createCustomerPB(data) {
  if (dataSource !== "pb") {
    customers.push(data);
    saveDataLocal();
    return data;
  }
  const created = await PB.createCustomer(data);
  customers.push(created);
  return created;
}

async function updateCustomerPB(id, data) {
  if (dataSource !== "pb") {
    const idx = customers.findIndex(c => c.id === id);
    if (idx >= 0) {
      customers[idx] = { ...customers[idx], ...data };
      saveDataLocal();
    }
    return customers[idx];
  }
  const updated = await PB.updateCustomer(id, data);
  const idx = customers.findIndex(c => c.id === id);
  if (idx >= 0) customers[idx] = updated;
  return updated;
}

async function deleteCustomerPB(id) {
  if (dataSource !== "pb") {
    const c = customers.find(c => c.id === id);
    customers = customers.filter(c => c.id !== id);
    saveDataLocal();
    return c;
  }
  const ok = await PB.deleteCustomer(id);
  if (ok) {
    const c = customers.find(c => c.id === id);
    customers = customers.filter(c => c.id !== id);
    return c;
  }
  return null;
}

async function createNotePB(customerId, text, type) {
  if (dataSource !== "pb") {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return null;
    if (!customer.notes) customer.notes = [];
    const note = { id: generateId("note"), text, type: type || "note", createdAt: new Date().toISOString() };
    customer.notes.unshift(note);
    saveDataLocal();
    return note;
  }
  return await PB.createNote(customerId, text, type);
}

async function deleteNotePB(customerId, noteId) {
  if (dataSource !== "pb") {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return false;
    customer.notes = (customer.notes || []).filter(n => n.id !== noteId);
    saveDataLocal();
    return true;
  }
  return await PB.deleteNote(noteId);
}

async function createTaskPB(data) {
  if (dataSource !== "pb") {
    const t = { id: Date.now(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...data };
    tasks.push(t);
    saveDataLocal();
    return t;
  }
  return await PB.createTask(data);
}

async function updateTaskPB(id, data) {
  if (dataSource !== "pb") {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx >= 0) {
      tasks[idx] = { ...tasks[idx], ...data, updatedAt: new Date().toISOString() };
      saveDataLocal();
    }
    return tasks[idx];
  }
  return await PB.updateTask(id, data);
}

async function deleteTaskPB(id) {
  if (dataSource !== "pb") {
    tasks = tasks.filter(t => t.id !== id);
    saveDataLocal();
    return true;
  }
  return await PB.deleteTask(id);
}
