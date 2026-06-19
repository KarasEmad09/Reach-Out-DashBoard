/* === API Client — talks to Node.js + SQLite backend === */
const API_BASE = '';

async function api(path, options = {}) {
  const url = API_BASE + path;
  const config = {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...options
  };
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }
  const res = await fetch(url, config);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
}

/* === AUTH === */
async function apiLogin(email, password) {
  const data = await api('/api/auth/login', {
    method: 'POST',
    body: { email, password }
  });
  sessionUser = data.user;
  sessionStorage.setItem('sh_sess', JSON.stringify(data.user));
  return data.user;
}

async function apiLogout() {
  try { await api('/api/auth/logout', { method: 'POST' }); } catch (e) {}
  sessionStorage.removeItem('sh_sess');
  sessionUser = null;
}

async function apiGetMe() {
  const data = await api('/api/auth/me');
  sessionUser = data.user;
  sessionStorage.setItem('sh_sess', JSON.stringify(data.user));
  return data.user;
}

/* === CUSTOMERS === */
async function apiGetCustomers(params = {}) {
  const q = new URLSearchParams();
  if (params.status) q.set('status', params.status);
  if (params.search) q.set('search', params.search);
  const qs = q.toString();
  return api('/api/customers' + (qs ? '?' + qs : ''));
}

async function apiGetCustomer(id) {
  return api('/api/customers/' + id);
}

async function apiCreateCustomer(data) {
  return api('/api/customers', { method: 'POST', body: data });
}

async function apiUpdateCustomer(id, data) {
  return api('/api/customers/' + id, { method: 'PUT', body: data });
}

async function apiDeleteCustomer(id) {
  return api('/api/customers/' + id, { method: 'DELETE' });
}

/* === DEALS === */
async function apiGetDeals(params = {}) {
  const q = new URLSearchParams();
  if (params.stage) q.set('stage', params.stage);
  const qs = q.toString();
  return api('/api/deals' + (qs ? '?' + qs : ''));
}

async function apiCreateDeal(data) {
  return api('/api/deals', { method: 'POST', body: data });
}

async function apiUpdateDeal(id, data) {
  return api('/api/deals/' + id, { method: 'PUT', body: data });
}

async function apiDeleteDeal(id) {
  return api('/api/deals/' + id, { method: 'DELETE' });
}

/* === TASKS === */
async function apiGetTasks(params = {}) {
  const q = new URLSearchParams();
  if (params.status) q.set('status', params.status);
  if (params.priority) q.set('priority', params.priority);
  if (params.search) q.set('search', params.search);
  const qs = q.toString();
  return api('/api/tasks' + (qs ? '?' + qs : ''));
}

async function apiGetTask(id) {
  return api('/api/tasks/' + id);
}

async function apiCreateTask(data) {
  return api('/api/tasks', { method: 'POST', body: data });
}

async function apiUpdateTask(id, data) {
  return api('/api/tasks/' + id, { method: 'PUT', body: data });
}

async function apiDeleteTask(id) {
  return api('/api/tasks/' + id, { method: 'DELETE' });
}

/* === NOTES === */
async function apiGetNotes(params = {}) {
  const q = new URLSearchParams();
  if (params.type) q.set('type', params.type);
  if (params.customer_id) q.set('customer_id', params.customer_id);
  const qs = q.toString();
  return api('/api/notes' + (qs ? '?' + qs : ''));
}

async function apiCreateNote(data) {
  return api('/api/notes', { method: 'POST', body: data });
}

async function apiDeleteNote(id) {
  return api('/api/notes/' + id, { method: 'DELETE' });
}

/* === NOTIFICATIONS === */
async function apiGetNotifications() {
  return api('/api/notifications');
}

async function apiMarkNotifRead(id) {
  return api('/api/notifications/' + id + '/read', { method: 'PUT' });
}

async function apiMarkAllNotifsRead() {
  return api('/api/notifications/read-all', { method: 'PUT' });
}

async function apiDismissNotif(id) {
  return api('/api/notifications/' + id, { method: 'DELETE' });
}

/* === SETTINGS === */
async function apiGetSettings() {
  return api('/api/settings');
}

async function apiSetSetting(key, value) {
  return api('/api/settings/' + key, { method: 'PUT', body: { value } });
}

/* === ACTIVITY === */
async function apiGetActivity(limit = 50) {
  return api('/api/activity?limit=' + limit);
}

/* === USERS === */
async function apiGetUsers() {
  return api('/api/users');
}
