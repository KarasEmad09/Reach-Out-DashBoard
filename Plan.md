# Plan.md — SalesHub CRM Dashboard
### Hardened AI Build Plan v2.0
> This file is fed to an AI at the start of every session alongside PROJECT_SOP.md.
> It is the source of truth for what to build, how to verify it, and what not to touch.

---

##  GLOBAL RULES — READ BEFORE EVERY SESSION

These rules apply to EVERY phase without exception. Never override them.

1. **Read Phase N fully before writing a single line of code.**
2. **Only touch the files listed under "FILES TO TOUCH" for the current phase.** All other files are read-only.
3. **Never use a framework.** No React, Vue, Angular, jQuery, Bootstrap, Tailwind, or any library except Chart.js (CDN only, loaded in Phase 1).
4. **Never add inline styles.** All styling goes in `style.css`. JavaScript only adds/removes CSS class names.
5. **Never hardcode data.** All counts, lists, and values must be calculated from the `customers` or `activityLog` arrays at render time.
6. **Save to localStorage after every data mutation.** Call `saveData()` immediately after any add, edit, delete, or status change.
7. **Destroy Chart.js instances before recreating them.** Store the chart in a variable, call `.destroy()` before `new Chart()`.
8. **Complete the Done When checklist manually** before marking any phase complete. Checking code exists is not the same as checking it works.

---

##  STUCK PROTOCOL

If any build item cannot be completed within the current phase:

1. **STOP immediately.** Do not skip the item. Do not move to the next phase.
2. Open `Progress.md` and write a Blockers entry with: the item that failed, what was tried, and the exact error or behavior.
3. Do not invent a workaround that contradicts the SOP.
4. Ask for guidance before continuing.

---

##  ROLLBACK RULE

If code written in Phase N breaks something that was working in Phase N-1:

1. Do NOT delete the working Phase N-1 code to solve the problem.
2. Identify only what the new code broke and fix the new code.
3. If unsure, restore the Phase N-1 version of the affected function and try again.

---

## PHASE ORDER — CRITICAL

The phases below are in a deliberate order. **Phase 3 (Modal) comes before Phase 4 and 5 intentionally** because both the Dashboard and All Customers pages need the modal to work. Do not reorder phases.

```
Phase 1 → Foundation
Phase 2 → Sidebar & Navigation
Phase 3 → Add/Edit Customer Modal        ← MUST come before Phase 4 and 5
Phase 4 → Dashboard Page
Phase 5 → All Customers Page
Phase 6 → Status Filter Pages
Phase 7 → Customer Detail Page
Phase 8 → Notes & Questions + Settings
Phase 9 → Polish & QA
```

---

---

## PHASE 1 — Foundation

### Session Start Prompt
> "Read PROJECT_SOP.md and Plan.md fully. We are starting Phase 1 — Foundation. Only create the four files listed. Do not write any page renderers. Do not use any framework."

### Files to Create
- `index.html` — created fresh
- `style.css` — created fresh
- `data.js` — created fresh
- `app.js` — created fresh

### Do NOT Touch
- Nothing exists yet. Do not create any other files.

### Do NOT (Constraints)
- Do NOT write any page renderer functions (no `renderDashboard`, no `renderCustomers`, etc.)
- Do NOT add Chart.js chart code yet — only load it via CDN `<script>` tag in `index.html`
- Do NOT add animations or transitions yet
- Do NOT use any framework or library
- Do NOT put CSS inside `index.html` — all CSS goes in `style.css`
- Do NOT put JavaScript inside `index.html` — all JS goes in `data.js` and `app.js`

### Cross-Phase Dependency Note
Chart.js CDN **must** be added here in `index.html` even though it is not used until Phase 4. Forgetting it now means a broken import later. Add this line to `<head>`:
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

### Build Tasks

#### index.html
Create a valid HTML5 document with this exact `<head>` order:
1. `<meta charset="UTF-8">`
2. `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
3. `<title>SalesHub CRM</title>`
4. Google Fonts link: `Inter` weights 400, 500, 600, 700
5. Chart.js CDN script tag
6. `<link rel="stylesheet" href="style.css">`

Body structure (exact IDs required — the router depends on them):
```html
<body>
  <div id="app">
    <nav id="sidebar"></nav>
    <div id="main-wrapper">
      <header id="topbar"></header>
      <main id="content"></main>
    </div>
  </div>
  <div id="modal-overlay"></div>
  <script src="data.js"></script>
  <script src="app.js"></script>
</body>
```

#### style.css
Write in this exact order (use section comment headers):
```css
/* === 1. CSS CUSTOM PROPERTIES === */
:root { /* all tokens from SOP Section 3.1 */ }
body.dark-mode { /* placeholder — leave empty, filled in Phase 8 */ }

/* === 2. BASE RESET === */
/* box-sizing, margin/padding reset, font-family */

/* === 3. LAYOUT === */
/* #app, #sidebar, #main-wrapper, #topbar, #content */

/* === 4. SIDEBAR === */
/* placeholder comment only — sidebar styles added in Phase 2 */

/* === 5. TOPBAR === */
/* placeholder comment only — topbar styles added in Phase 2 */

/* === 6. COMPONENTS === */
/* placeholder comment only — components added per phase */
```

Sidebar layout rules (write these now):
```css
#app { display: flex; height: 100vh; overflow: hidden; }
#sidebar { width: 240px; min-width: 240px; height: 100vh; position: fixed; left: 0; top: 0; background: var(--color-sidebar-bg); overflow-y: auto; transition: width 0.3s ease; }
#main-wrapper { margin-left: 240px; flex: 1; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
#topbar { height: 64px; min-height: 64px; background: var(--color-surface); border-bottom: 1px solid var(--color-border); display: flex; align-items: center; padding: 0 24px; }
#content { flex: 1; overflow-y: auto; padding: 24px; background: var(--color-bg); }
```

Sidebar collapsed state (write now, used in Phase 2):
```css
#app.sidebar-collapsed #sidebar { width: 64px; }
#app.sidebar-collapsed #main-wrapper { margin-left: 64px; }
```

#### data.js
Write in this exact order:

```javascript
/* === CONSTANTS === */
const SOURCES = [ ... ]; // 8 sources from SOP Section 4.2
const STATUSES = [ ... ]; // 6 statuses from SOP Section 4.3 (with color and bg)
const STORAGE_KEYS = { CUSTOMERS: "saleshub_customers", ACTIVITY: "saleshub_activity", SETTINGS: "saleshub_settings" };

/* === SAMPLE DATA === */
const SAMPLE_CUSTOMERS = [ ... ]; // 20 customers — see spec below
const SAMPLE_ACTIVITY = [ ... ];  // 15 activity entries — see spec below

/* === DATA INIT === */
// If localStorage has no customers, write SAMPLE_CUSTOMERS to it
// If localStorage has no activity, write SAMPLE_ACTIVITY to it
```

Sample customers spec:
- 20 total with realistic Arabic/Egyptian names
- Phone numbers in `+20 1XX XXX XXXX` format
- Spread: 4 New Lead, 4 Interested Customer, 3 Hot Lead, 3 Follow Up, 3 Won Deal, 3 Lost Deal
- Sources spread across all 8 options
- Dates in May–June 2024 range
- Won Deal customers must have `dealValue` (number) and `productPurchased` (string)
- Lost Deal customers must have `lostReason` (string)
- Each customer has at least 1 note in their `notes` array

Sample activity spec:
- 15 entries covering the last 3 days
- Mix of types: `status_change`, `note_added`, `follow_up`, `new_customer`
- Timestamps in ISO 8601 format descending (newest first)

#### app.js
Write in this exact order:

```javascript
/* === STATE === */
let customers = [];
let activityLog = [];
let settings = {};
let currentRoute = "";
let chartInstance = null; // Chart.js instance — stored globally to allow destroy()

/* === DATA LAYER === */
function loadData() { /* read from localStorage, fall back to SAMPLE data */ }
function saveData() { /* write customers + activityLog + settings to localStorage */ }
function addActivity(type, customerName, description) { /* prepend to activityLog, save */ }

/* === ROUTER === */
const ROUTES = {
  "#dashboard": () => {},           // empty for now
  "#customers-all": () => {},
  "#customers-new-leads": () => {},
  "#customers-interested": () => {},
  "#customers-hot-leads": () => {},
  "#customers-follow-ups": () => {},
  "#deals-won": () => {},
  "#deals-lost": () => {},
  "#notes": () => {},
  "#settings": () => {}
  // #customer/:id handled separately
};

function router() {
  const hash = window.location.hash || "#dashboard";
  currentRoute = hash;
  // match hash to ROUTES, call the function
  // if hash starts with "#customer/", extract ID and call renderCustomerDetail(id)
  // update sidebar active state
}

window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", () => { loadData(); router(); });
```

### Done When — Phase 1
Every item below must pass before moving to Phase 2:

- [ ] Open `index.html` in a browser — page loads with no blank error screen
- [ ] Open browser DevTools Console — **zero errors** shown
- [ ] The left side of the page shows a dark navy area (sidebar background color visible)
- [ ] The right side shows the lighter page background color
- [ ] Run in console: `typeof customers` → returns `"object"` (array loaded)
- [ ] Run in console: `customers.length` → returns `20`
- [ ] Run in console: `typeof saveData` → returns `"function"`
- [ ] Run in console: `window.location.hash = "#dashboard"` → no error thrown
- [ ] Open Application tab in DevTools → LocalStorage → entries for `saleshub_customers` and `saleshub_activity` exist

---

---

## PHASE 2 — Sidebar & Navigation

### Session Start Prompt
> "Read PROJECT_SOP.md and Plan.md fully. Phase 1 is complete. We are now on Phase 2 — Sidebar & Navigation. Only touch app.js and style.css. Do not render any page content inside #content yet."

### Files to Touch
- `app.js` — add sidebar + topbar render functions
- `style.css` — add sidebar + topbar styles

### Do NOT Touch
- `index.html` — structure is complete, do not modify
- `data.js` — data layer is complete, do not modify

### Do NOT (Constraints)
- Do NOT render any page content inside `#content` yet
- Do NOT add modal logic
- Do NOT add Chart.js usage
- Do NOT add page-specific CSS yet — only sidebar and topbar styles
- Do NOT use image files for icons — use inline SVG strings or Unicode symbols

### Build Tasks

#### renderSidebar() in app.js
Function signature: `function renderSidebar()`
Called once on DOMContentLoaded. Renders into `document.getElementById('sidebar')`.

Required sidebar HTML structure:
```
[Logo area]     → div.sidebar-logo → bar chart SVG + "Sales" span + "Hub" span (blue)
[Divider]
[Nav Item]      → Dashboard        → house icon
[Section Label] → CUSTOMERS
[Nav Parent]    → Customers ▾      → collapsible, starts open
[Nav Child]     →   All Customers
[Nav Child]     →   New Leads
[Nav Child]     →   Interested Customers
[Nav Child]     →   Hot Leads
[Nav Child]     →   Follow Ups
[Section Label] → DEALS
[Nav Parent]    → Deals ▾          → collapsible, starts open
[Nav Child]     →   Won Deals
[Nav Child]     →   Lost Deals
[Divider]
[Nav Item]      → Notes & Questions → note icon
[Nav Item]      → Settings          → gear icon
[Collapse btn]  → div.sidebar-collapse-btn → ◄ icon
```

Each nav item must have:
- `data-route="#hash-value"` attribute for the router to use
- CSS class `nav-item` (children get `nav-child`)
- Active state CSS class `nav-item--active` applied by `updateSidebarActive()`

Collapse behavior:
- Clicking a parent nav item (Customers, Deals) toggles CSS class `submenu--open` on its `<ul>` child
- Clicking the collapse button toggles class `sidebar-collapsed` on `#app`
- When collapsed: show icons only (hide all text via CSS, not JS)
- When expanded: show icons + text

#### updateSidebarActive() in app.js
Function signature: `function updateSidebarActive(hash)`
Called by `router()` every time the route changes.
Removes `nav-item--active` from all nav items, then adds it to the item whose `data-route` matches the current hash.

#### renderTopbar() in app.js
Function signature: `function renderTopbar()`
Called once on DOMContentLoaded. Renders into `document.getElementById('topbar')`.

Required topbar elements (left to right):
```
[Page Title]    → h1#page-title "Dashboard" (updated by router on each navigate)
[Search Input]  → input#global-search placeholder="Search customers..."
[Bell Icon]     → button#notif-bell with badge showing count of unread (use activityLog.length for now)
[Avatar]        → div.user-avatar showing initials "AD" (placeholder)
```

#### router() update in app.js
Update the existing router function to:
1. Match the hash to a route
2. Call `updateSidebarActive(hash)`
3. Update `document.getElementById('page-title').textContent` to the page name
4. Log the route to console for debugging (remove in Phase 9)

#### style.css additions
Add styles for:
- `.sidebar-logo` (padding, flex, align-center)
- `.nav-item`, `.nav-child`, `.nav-item--active`
- `.nav-section-label` (uppercase, small, muted color)
- `.submenu` (transition height for collapse animation)
- `.submenu--open` (show state)
- `.sidebar-collapse-btn`
- `.topbar-search` (input styles)
- `.user-avatar` (circle, initials)
- `#app.sidebar-collapsed .nav-item span` → `display: none`

###  Done When — Phase 2
Every item below must pass before moving to Phase 3:

- [ ] Open app in browser — sidebar fully visible on the left with dark navy background
- [ ] Sidebar shows: SalesHub logo, all nav items, section labels
- [ ] Click **Dashboard** nav item → `window.location.hash` becomes `#dashboard`, item gets blue highlight
- [ ] Click **Customers** label → sub-menu collapses. Click again → expands. Arrow rotates.
- [ ] Click **All Customers** → hash becomes `#customers-all`, that child item is highlighted
- [ ] Click **New Leads** → hash changes, item highlighted
- [ ] Click **Interested Customers** → hash changes, item highlighted
- [ ] Click **Hot Leads** → hash changes, item highlighted
- [ ] Click **Follow Ups** → hash changes, item highlighted
- [ ] Click **Deals** label → sub-menu collapses/expands
- [ ] Click **Won Deals** → hash changes, item highlighted
- [ ] Click **Lost Deals** → hash changes, item highlighted
- [ ] Click **Notes & Questions** → hash changes, item highlighted
- [ ] Click **Settings** → hash changes, item highlighted
- [ ] Click collapse button (◄) → sidebar shrinks to ~64px wide, labels disappear, icons remain
- [ ] Click expand button (►) → sidebar returns to 240px, labels visible again
- [ ] Topbar visible: search input + bell icon + avatar placeholder
- [ ] Page title in topbar updates when navigating (e.g., shows "All Customers" when on that route)
- [ ] DevTools Console → **zero errors**

---

---

## PHASE 3 — Add/Edit Customer Modal

### Session Start Prompt
> "Read PROJECT_SOP.md and Plan.md fully. Phases 1 and 2 are complete. We are on Phase 3 — Add/Edit Customer Modal. This modal must be fully working before we touch any page. Only modify app.js and style.css."

### Files to Touch
- `app.js` — add modal function + helpers
- `style.css` — add modal styles

### Do NOT Touch
- `index.html`
- `data.js`

### Do NOT (Constraints)
- Do NOT build the customer detail page — that is Phase 7
- Do NOT connect this modal to any nav item or page yet — test it via console only
- Do NOT use `<form>` HTML elements — use `<div>` wrappers with `onclick` handlers
- Do NOT use `document.write()`

### Why This Phase Comes First
The modal is used in Phase 4 (Dashboard 3-dot → Edit), Phase 5 (All Customers → Add + Edit), Phase 6 (filtered pages → Edit), and Phase 7 (Customer Detail → Edit). Building it now means it works everywhere automatically.

### Build Tasks

#### addActivity() in app.js
Function signature:
```javascript
function addActivity(type, customerName, description) {
  // Creates activity object with id, type, customerName, description, timestamp (new Date().toISOString())
  // Prepends to activityLog array (unshift, not push — newest first)
  // Saves via saveData()
}
```
Activity types: `"new_customer"` | `"status_change"` | `"note_added"` | `"follow_up"`

#### generateId() in app.js
Function signature:
```javascript
function generateId(prefix) {
  // Returns prefix + "_" + Date.now()
  // Example: generateId("cust") → "cust_1715686400000"
}
```

#### showCustomerModal(customer) in app.js
Function signature:
```javascript
function showCustomerModal(customer = null) {
  // customer = null → Add mode
  // customer = object → Edit mode
}
```

This function must:
1. Build the modal HTML as a string
2. Set `document.getElementById('modal-overlay').innerHTML` to the modal HTML
3. Add class `modal-open` to `document.body` (prevents background scroll)
4. Attach all event listeners after setting innerHTML

Modal HTML structure required:
```html
<div class="modal-backdrop">
  <div class="modal-panel">
    <div class="modal-header">
      <h2 class="modal-title">Add Customer / Edit Customer</h2>
      <button class="modal-close-btn">✕</button>
    </div>
    <div class="modal-body">
      <!-- Fields: Full Name, Phone, Email, Company, Source (select), Status (select) -->
      <!-- Last Contact Date (date input), Next Follow Up Date (date input) -->
      <!-- Notes textarea (Add mode only — hidden in Edit mode) -->
      <!-- Inline error spans below required fields -->
    </div>
    <div class="modal-footer">
      <button class="btn-secondary modal-cancel">Cancel</button>
      <button class="btn-primary modal-submit">Save Customer / Update Customer</button>
    </div>
  </div>
</div>
```

Field IDs (exact — used by submit handler):
- `#modal-name` — Full Name (required)
- `#modal-phone` — Phone (required)
- `#modal-email` — Email
- `#modal-company` — Company
- `#modal-source` — Source `<select>` (populated from SOURCES constant)
- `#modal-status` — Status `<select>` (populated from STATUSES constant, keys only)
- `#modal-last-contact` — date input
- `#modal-next-followup` — date input
- `#modal-notes` — textarea (visible in Add mode, hidden in Edit mode)
- `#modal-name-error` — span for name validation error
- `#modal-phone-error` — span for phone validation error

#### closeModal() in app.js
Function signature:
```javascript
function closeModal() {
  document.getElementById('modal-overlay').innerHTML = '';
  document.body.classList.remove('modal-open');
}
```

#### Event listeners inside showCustomerModal():
After setting innerHTML, attach:
1. `.modal-close-btn` onclick → `closeModal()`
2. `.modal-cancel` onclick → `closeModal()`
3. `.modal-backdrop` onclick → if `event.target === this` (click on backdrop, not panel) → `closeModal()`
4. `.modal-panel` onclick → `event.stopPropagation()`
5. `document` keydown → if `event.key === 'Escape'` → `closeModal()`
6. `.modal-submit` onclick → `handleModalSubmit(customer)`

#### handleModalSubmit(existingCustomer) in app.js
```javascript
function handleModalSubmit(existingCustomer) {
  // 1. Read all field values
  // 2. Validate: name required, phone required
  //    → If invalid: show error text in #modal-name-error / #modal-phone-error, return early
  // 3a. ADD MODE (existingCustomer === null):
  //    → Create new customer object with generateId("cust")
  //    → Push to customers array
  //    → Call addActivity("new_customer", name, "added as new lead")
  //    → Call saveData()
  //    → Call closeModal()
  //    → Re-render current page
  // 3b. EDIT MODE (existingCustomer exists):
  //    → Find customer by id in customers array
  //    → Update all fields
  //    → Call addActivity("status_change", name, "profile updated")
  //    → Call saveData()
  //    → Call closeModal()
  //    → Re-render current page
}
```

#### Re-render after modal submit
After save + close, call `router()` to re-render the current page so the table refreshes automatically.

#### style.css additions for modal
```css
/* Modal overlay */
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-panel { background: var(--color-surface); border-radius: 16px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
.modal-header { ... }
.modal-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.modal-footer { ... }
/* Form field styles */
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 13px; font-weight: 500; color: var(--color-text-secondary); }
.form-input, .form-select, .form-textarea { border: 1px solid var(--color-border); border-radius: 8px; padding: 10px 12px; font-size: 14px; color: var(--color-text-primary); background: var(--color-bg); }
.form-input:focus { outline: none; border-color: var(--color-accent); box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
.form-error { font-size: 12px; color: #EF4444; display: none; }
.form-error.visible { display: block; }
/* Prevent background scroll when modal open */
body.modal-open { overflow: hidden; }
```

###  Done When — Phase 3
Every item below must pass before moving to Phase 4:

- [ ] Open browser console and run: `showCustomerModal()` → modal appears centered on screen with overlay
- [ ] Modal title shows "Add Customer" in Add mode
- [ ] All fields are empty in Add mode
- [ ] Source `<select>` shows all 8 sources from SOURCES constant
- [ ] Status `<select>` shows all 6 statuses from STATUSES constant
- [ ] Notes textarea is visible in Add mode
- [ ] Click **Cancel** → modal closes, background scroll restored
- [ ] Click **✕** → modal closes
- [ ] Click outside the modal panel (on dark overlay) → modal closes
- [ ] Press **Escape** key → modal closes
- [ ] Click **Save Customer** with empty form → validation errors appear under Name and Phone fields. Modal stays open.
- [ ] Fill Name + Phone → click Save → modal closes, `customers.length` is now 21 in console
- [ ] Open Application tab → `saleshub_customers` in localStorage updated with new entry
- [ ] Run: `showCustomerModal(customers[0])` → modal opens with "Edit Customer" title, all fields pre-filled with that customer's data
- [ ] Notes textarea is NOT visible in Edit mode
- [ ] Edit name → click Update Customer → close → run `customers[0].fullName` in console → shows updated name
- [ ] DevTools Console → **zero errors**

---

---

## PHASE 4 — Dashboard Page

### Session Start Prompt
> "Read PROJECT_SOP.md and Plan.md fully. Phases 1–3 are complete. We are on Phase 4 — Dashboard. Only modify app.js and style.css. The modal (showCustomerModal) already exists from Phase 3 — do not rebuild it."

### Files to Touch
- `app.js` — add `renderDashboard()` and helper functions
- `style.css` — add dashboard-specific styles

### Do NOT Touch
- `index.html`
- `data.js`

### Do NOT (Constraints)
- Do NOT rebuild the modal — use `showCustomerModal()` from Phase 3
- Do NOT hardcode any counts — always calculate from `customers` array at render time
- Do NOT create a Chart.js chart without checking if `chartInstance !== null` first → if so, call `chartInstance.destroy()` before creating new one
- Do NOT add styles using `element.style.X = "..."` — only add/remove CSS classes

### Build Tasks

#### renderDashboard() in app.js
Replace the empty `() => {}` in ROUTES with this function.

**Section A — 8 Stat Cards**

Calculate these values from the `customers` array:
```javascript
const total = customers.length;
const newLeads = customers.filter(c => c.status === "New Lead").length;
const interested = customers.filter(c => c.status === "Interested Customer").length;
const hotLeads = customers.filter(c => c.status === "Hot Lead").length;
const followUps = customers.filter(c => c.status === "Follow Up").length;
const wonDeals = customers.filter(c => c.status === "Won Deal").length;
const lostDeals = customers.filter(c => c.status === "Lost Deal").length;
const dealsValue = customers.filter(c => c.status === "Won Deal").reduce((sum, c) => sum + (c.dealValue || 0), 0);
```

Each stat card HTML structure:
```html
<div class="stat-card">
  <div class="stat-card__left">
    <p class="stat-card__label">Total Customers</p>
    <h2 class="stat-card__value">320</h2>
    <p class="stat-card__trend trend-up">↑ 12% vs last month</p>
  </div>
  <div class="stat-card__icon-wrap" style="background: #EFF6FF;">
    <!-- SVG icon here -->
  </div>
</div>
```

For the trend percentage: use a simple fixed placeholder (e.g., "12%") — real trend calculation is not required in Phase 4. This is acceptable.

**Section B — Recent Activity + Customers by Source (two-column grid)**

Left column (Recent Activity):
- Heading + "View All" link (opens a modal with all activity — implement as a button that calls `showActivityModal()`)
- Last 10 entries from `activityLog` array
- Each row: icon circle (colored by type) + `"CustomerName **description**"` + formatted timestamp
- Use `formatTimeAgo(timestamp)` helper for "2 minutes ago" style

Right column (Customers by Source — Chart.js):
```javascript
// Always destroy before creating:
if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

const canvas = document.getElementById('source-chart');
const ctx = canvas.getContext('2d');
chartInstance = new Chart(ctx, {
  type: 'doughnut',
  data: {
    labels: SOURCES,
    datasets: [{ data: [ /* count per source */ ], backgroundColor: [ /* 8 colors */ ] }]
  },
  options: { cutout: '65%', plugins: { legend: { display: false } } }
});
```
Below the canvas: render a custom legend (list of source name + count + percentage).

**Section C — Upcoming Follow Ups table**

Filter: `customers.filter(c => c.nextFollowUpDate)` sorted by `nextFollowUpDate` ascending, show all with a date (no 14-day limit in Phase 4 — keep it simple).

Table columns: Customer (avatar circle + name) | Phone | Status badge | Next Follow Up | Source | Actions

Actions column (3 buttons per row):
1. Phone button (`btn-icon btn-phone`) → `onclick="window.open('tel:' + phone)"`
2. Message button (`btn-icon btn-message`) → `onclick="window.open('mailto:' + email)"`
3. Three-dot button (`btn-icon btn-more`) → `onclick="showRowMenu(event, customerId)"` (see below)

#### showRowMenu(event, customerId) in app.js
```javascript
function showRowMenu(event, customerId) {
  event.stopPropagation();
  // Close any open menu first
  closeAllMenus();
  // Build dropdown HTML with options: View, Edit, Delete
  // Position it near the button using event.target.getBoundingClientRect()
  // Append to document.body
  // Add a one-time click listener on document to close the menu on next click
}
function closeAllMenus() {
  document.querySelectorAll('.row-menu').forEach(m => m.remove());
}
```

#### formatTimeAgo(isoString) in app.js
```javascript
function formatTimeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return minutes + " minutes ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + " hours ago";
  return Math.floor(hours / 24) + " days ago";
}
```

#### showActivityModal() in app.js
Opens a modal showing all activity log entries. Use the existing `#modal-overlay` element. Style consistent with the customer modal but wider (max-width: 640px). Close button in header.

###  Done When — Phase 4
Every item below must pass before moving to Phase 5:

- [ ] Navigate to `#dashboard` → page renders without errors
- [ ] 8 stat cards visible in two rows of 4
- [ ] All stat card numbers match actual data: run `customers.length` in console → matches "Total Customers" card
- [ ] Run `customers.filter(c=>c.status==="New Lead").length` → matches New Leads card
- [ ] Run `customers.filter(c=>c.status==="Won Deal").length` → matches Won Deals card
- [ ] Donut chart renders in the Customers by Source panel — no console error
- [ ] Custom legend below chart shows source names + counts
- [ ] Recent Activity list shows at least 5 entries
- [ ] Each activity entry shows a timestamp string ("X minutes ago")
- [ ] Click "View All" in Recent Activity → modal opens with full list
- [ ] Upcoming Follow Ups table shows rows of data
- [ ] Click phone icon in a row → browser attempts to open phone dialer
- [ ] Click message icon in a row → browser opens email client
- [ ] Click three-dot → dropdown appears with View / Edit / Delete options
- [ ] Click "Edit" in dropdown → `showCustomerModal(customer)` opens pre-filled
- [ ] Click "Delete" in dropdown → `confirm()` dialog appears, on cancel nothing happens
- [ ] Click "Delete" → confirm → customer removed, row disappears
- [ ] Navigate away (`#settings`) and back to `#dashboard` → chart re-renders, no "Canvas already in use" console error
- [ ] DevTools Console → **zero errors**

---

---

## PHASE 5 — All Customers Page

### Session Start Prompt
> "Read PROJECT_SOP.md and Plan.md fully. Phases 1–4 complete. We are on Phase 5 — All Customers Page. Only modify app.js and style.css. Use showCustomerModal() from Phase 3 — do not rebuild it."

### Files to Touch
- `app.js`
- `style.css`

### Do NOT Touch
- `index.html`
- `data.js`

### Do NOT (Constraints)
- Do NOT rebuild the modal — use `showCustomerModal()` from Phase 3
- Do NOT add filtering by status here — that is Phase 6
- Do NOT build the customer detail page — that is Phase 7
- Do NOT duplicate the table HTML structure — note that Phase 6 will refactor this into a shared function

### Build Tasks

#### renderAllCustomers() in app.js
Replace the empty `() => {}` in ROUTES.

Function must:
1. Read `customers` array
2. Apply current search query from a module-level variable `let currentSearchQuery = ""`
3. Apply current sort (column + direction) from module-level variables `let sortColumn = "fullName"`, `let sortDir = "asc"`
4. Render the page HTML into `#content`

Page structure:
```
[Page header row]
  Left: h2 "All Customers" + span showing count "(20)"
  Right: [Search input] [Add Customer button]

[Table wrapper card]
  [table]
    [thead] → Name | Phone | Email | Source | Status | Last Contact | Actions
    [tbody] → one row per filtered+sorted customer
```

Each table row:
```html
<tr onclick="window.location.hash='#customer/' + customer.id" style="cursor:pointer">
  <td>[avatar circle with initials] [Full Name]</td>
  <td>[Phone]</td>
  <td>[Email]</td>
  <td>[Source]</td>
  <td>[Status Badge]</td>
  <td>[Last Contact Date, formatted]</td>
  <td onclick="event.stopPropagation()"> <!-- IMPORTANT: stop propagation so row click doesn't fire -->
    [Edit icon button] [Delete icon button]
  </td>
</tr>
```

#### renderStatusBadge(status) helper
```javascript
function renderStatusBadge(status) {
  const s = STATUSES.find(s => s.key === status);
  if (!s) return `<span class="status-badge">${status}</span>`;
  return `<span class="status-badge" style="color:${s.color};background:${s.bg}">${s.key}</span>`;
}
```

#### renderAvatarCircle(name) helper
```javascript
function renderAvatarCircle(name) {
  const initials = name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
  return `<span class="avatar-circle">${initials}</span>`;
}
```

#### Live Search
Add `oninput` listener to the search input. On input:
```javascript
currentSearchQuery = event.target.value.toLowerCase();
renderAllCustomers(); // re-render with filter applied
```

Filter logic:
```javascript
let filtered = customers.filter(c =>
  c.fullName.toLowerCase().includes(currentSearchQuery) ||
  c.phone.includes(currentSearchQuery) ||
  (c.email && c.email.toLowerCase().includes(currentSearchQuery))
);
```

#### Column Sorting
Each `<th>` gets:
- `onclick="sortCustomers('fieldName')"`
- A sort indicator span: `<span class="sort-arrow">` → shows `↑` when asc, `↓` when desc, nothing when not sorted by this column

```javascript
function sortCustomers(column) {
  if (sortColumn === column) {
    sortDir = sortDir === "asc" ? "desc" : "asc";
  } else {
    sortColumn = column;
    sortDir = "asc";
  }
  renderAllCustomers(); // re-render sorted
}
```

Apply sort to filtered array before rendering:
```javascript
filtered.sort((a, b) => {
  const aVal = (a[sortColumn] || "").toString().toLowerCase();
  const bVal = (b[sortColumn] || "").toString().toLowerCase();
  return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
});
```

#### Delete from table
```javascript
function deleteCustomer(id) {
  if (!confirm("Delete this customer? This cannot be undone.")) return;
  customers = customers.filter(c => c.id !== id);
  addActivity("status_change", "", "A customer was deleted");
  saveData();
  renderAllCustomers(); // re-render
}
```

#### Empty State
If `filtered.length === 0`, instead of an empty table, render:
```html
<div class="empty-state">
  <p>No customers found.</p>
  <button onclick="document.getElementById('customer-search').value=''; currentSearchQuery=''; renderAllCustomers();">Clear Search</button>
</div>
```

###  Done When — Phase 5
Every item below must pass before moving to Phase 6:

- [ ] Navigate to `#customers-all` → table shows all 20 customers
- [ ] Each row shows: avatar circle with initials, name, phone, email, source, colored status badge, last contact date
- [ ] Type "ahmed" in search → table shows only customers whose name/phone/email matches "ahmed" (case-insensitive)
- [ ] Clear search → all 20 customers shown again
- [ ] Type a string that matches nothing → empty state card appears with "Clear Search" button
- [ ] Click "Clear Search" button → all customers shown again
- [ ] Click "Name" column header → rows sort A-Z, ↑ arrow appears on Name header
- [ ] Click "Name" again → rows sort Z-A, ↓ arrow appears
- [ ] Click "Status" header → rows sort by status alphabetically
- [ ] Click any table row body (not the Actions cell) → URL changes to `#customer/[id]` (detail page not built yet — 404 state is OK)
- [ ] Click edit icon → `showCustomerModal(customer)` opens with pre-filled data
- [ ] Edit + save → row updates immediately in the table
- [ ] Click delete icon → confirm dialog appears
- [ ] Cancel delete → nothing changes
- [ ] Confirm delete → customer disappears from table, `customers.length` decreases by 1 in console
- [ ] Click "Add Customer" → `showCustomerModal()` opens (Add mode, empty)
- [ ] Add a customer → appears in table immediately
- [ ] DevTools Console → **zero errors**

---

---

## PHASE 6 — Status Filter Pages

### Session Start Prompt
> "Read PROJECT_SOP.md and Plan.md fully. Phases 1–5 complete. We are on Phase 6 — Status Filter Pages. The key rule for this phase: build ONE shared function, then call it 6 times. Do not copy-paste table code. Only touch app.js and style.css."

### Files to Touch
- `app.js`
- `style.css` — only if extra column styles are needed for Won/Lost

### Do NOT Touch
- `index.html`
- `data.js`

### Do NOT (Constraints)
- Do NOT build 6 separate render functions that duplicate table HTML — only 1 shared function
- Do NOT rebuild the modal — use `showCustomerModal()` from Phase 3
- Do NOT remove or modify `renderAllCustomers()` from Phase 5

### Build Tasks

#### renderCustomerTable(config) — the shared function
```javascript
function renderCustomerTable(config) {
  // config = {
  //   filterFn: function(customer) → boolean,
  //   title: string,
  //   extraColumns: [ { header: string, getValue: function(customer) → string } ]
  // }
}
```

This function:
1. Filters `customers` using `config.filterFn`
2. Applies the same search + sort logic as Phase 5 (reuse `currentSearchQuery`, `sortColumn`, `sortDir`)
3. Builds the same table structure as Phase 5
4. Appends extra columns from `config.extraColumns` after the Status column
5. Shows empty state if no results

#### 6 Route Functions (each calls renderCustomerTable):

```javascript
// NEW LEADS
function renderNewLeads() {
  renderCustomerTable({
    filterFn: c => c.status === "New Lead",
    title: "New Leads",
    extraColumns: []
  });
}

// INTERESTED CUSTOMERS
function renderInterestedCustomers() {
  renderCustomerTable({
    filterFn: c => c.status === "Interested Customer",
    title: "Interested Customers",
    extraColumns: []
  });
}

// HOT LEADS
function renderHotLeads() {
  renderCustomerTable({
    filterFn: c => c.status === "Hot Lead",
    title: "Hot Leads",
    extraColumns: []
  });
}

// FOLLOW UPS
function renderFollowUps() {
  renderCustomerTable({
    filterFn: c => c.status === "Follow Up",
    title: "Follow Ups",
    extraColumns: []
  });
}

// WON DEALS
function renderWonDeals() {
  renderCustomerTable({
    filterFn: c => c.status === "Won Deal",
    title: "Won Deals",
    extraColumns: [
      { header: "Deal Value", getValue: c => c.dealValue ? "$" + c.dealValue.toLocaleString() : "—" },
      { header: "Product", getValue: c => c.productPurchased || "—" }
    ]
  });
}

// LOST DEALS
function renderLostDeals() {
  renderCustomerTable({
    filterFn: c => c.status === "Lost Deal",
    title: "Lost Deals",
    extraColumns: [
      { header: "Lost Reason", getValue: c => c.lostReason || "—" }
    ]
  });
}
```

Register all 6 in ROUTES.

###  Done When — Phase 6
Every item below must pass before moving to Phase 7:

- [ ] Navigate to `#customers-new-leads` → only customers with status "New Lead" shown
- [ ] Navigate to `#customers-interested` → only "Interested Customer" shown
- [ ] Navigate to `#customers-hot-leads` → only "Hot Lead" shown
- [ ] Navigate to `#customers-follow-ups` → only "Follow Up" shown
- [ ] Navigate to `#deals-won` → "Won Deal" customers shown + "Deal Value" and "Product" columns visible
- [ ] Navigate to `#deals-lost` → "Lost Deal" customers shown + "Lost Reason" column visible
- [ ] Search works on each filtered page (type in search → live filter within already-filtered results)
- [ ] Edit icon works on each filtered page (modal opens pre-filled)
- [ ] Delete from a filtered page removes customer from localStorage
- [ ] Navigate to `#customers-all` → still works correctly (Phase 5 not broken)
- [ ] Open `app.js` → search for the table `<thead>` HTML string → it appears exactly ONCE in the file (DRY confirmed)
- [ ] DevTools Console → **zero errors**

---

---

## PHASE 7 — Customer Detail Page

### Session Start Prompt
> "Read PROJECT_SOP.md and Plan.md fully. Phases 1–6 complete. We are on Phase 7 — Customer Detail Page. Only modify app.js and style.css. Use showCustomerModal() from Phase 3 — do not rebuild it."

### Files to Touch
- `app.js`
- `style.css`

### Do NOT Touch
- `index.html`
- `data.js`

### Do NOT (Constraints)
- Do NOT rebuild the modal
- Do NOT handle the `#customer/:id` route inside ROUTES object — handle it separately in `router()`
- Do NOT store the "back" route as a hardcoded string — capture `currentRoute` before navigating

### Build Tasks

#### Router update for customer detail
In `router()`:
```javascript
function router() {
  const hash = window.location.hash || "#dashboard";

  // Handle dynamic route
  if (hash.startsWith("#customer/")) {
    const id = hash.replace("#customer/", "");
    renderCustomerDetail(id);
    updateSidebarActive(""); // no sidebar item active for detail pages
    return;
  }

  // ... rest of router
}
```

#### renderCustomerDetail(id) in app.js
```javascript
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
  // Render two-column layout
}
```

Two-column layout structure:
```html
<div class="detail-page">
  <div class="detail-back-bar">
    <button onclick="history.back()" class="btn-back">← Back</button>
    <h2>[Customer Full Name]</h2>
  </div>
  <div class="detail-columns">
    <div class="detail-left"> <!-- 60% width -->
      [Info card]
      [Status change section]
    </div>
    <div class="detail-right"> <!-- 40% width -->
      [Notes panel]
    </div>
  </div>
</div>
```

**Info card** — display all fields:
- Full Name, Phone, Email, Company, Source
- Status (shown as a colored badge + a `<select>` to change it)
- Created Date, Last Contact Date, Next Follow Up Date
- "Edit Customer" button → `showCustomerModal(customer)`

If status is "Won Deal": also show Deal Value and Product Purchased.
If status is "Lost Deal": also show Lost Reason.

**Status change `<select>`:**
```javascript
function changeCustomerStatus(customerId, newStatus) {
  const customer = customers.find(c => c.id === customerId);
  if (!customer) return;
  const oldStatus = customer.status;
  customer.status = newStatus;
  addActivity("status_change", customer.fullName, `moved from ${oldStatus} to ${newStatus}`);
  saveData();
  renderCustomerDetail(customerId); // re-render to reflect new status badge + any new fields
}
```

**Notes panel:**
```html
<div class="notes-panel">
  <h3>Notes</h3>
  <div class="note-add">
    <textarea id="note-input" placeholder="Add a note..."></textarea>
    <button onclick="addNote('[customerId]')">Add Note</button>
  </div>
  <div class="notes-list">
    <!-- newest note first -->
    [for each note]
    <div class="note-item">
      <p class="note-text">[note.text]</p>
      <div class="note-meta">
        <span>[formatted date]</span>
        <button onclick="deleteNote('[customerId]', '[noteId]')">✕</button>
      </div>
    </div>
  </div>
</div>
```

#### addNote(customerId) in app.js
```javascript
function addNote(customerId) {
  const text = document.getElementById('note-input').value.trim();
  if (!text) return;
  const customer = customers.find(c => c.id === customerId);
  if (!customer) return;
  customer.notes.unshift({ id: generateId("note"), text, createdAt: new Date().toISOString() });
  addActivity("note_added", customer.fullName, "added a note");
  saveData();
  renderCustomerDetail(customerId); // re-render to show new note
}
```

#### deleteNote(customerId, noteId) in app.js
```javascript
function deleteNote(customerId, noteId) {
  const customer = customers.find(c => c.id === customerId);
  if (!customer) return;
  customer.notes = customer.notes.filter(n => n.id !== noteId);
  saveData();
  renderCustomerDetail(customerId);
}
```

###  Done When — Phase 7
Every item below must pass before moving to Phase 8:

- [ ] Navigate to `#customers-all` → click any row → URL changes to `#customer/[id]`
- [ ] Detail page renders — shows all customer fields
- [ ] Correct customer data displayed (matches what was in the table row)
- [ ] Status badge shows correct color
- [ ] Status `<select>` shows correct current value
- [ ] Change status in `<select>` → badge updates, status saved to localStorage
- [ ] After status change, navigate to the matching filter page → customer appears there
- [ ] Click "Edit Customer" button → modal opens pre-filled
- [ ] Edit and save → detail page re-renders with updated data
- [ ] Add a note (type in textarea + click Add Note) → note appears at top of notes list
- [ ] Note has timestamp shown
- [ ] Click ✕ on a note → note disappears from list, removed from localStorage
- [ ] Click ← Back button → returns to previous page (All Customers or wherever came from)
- [ ] Navigate to `#customer/nonexistent123` → "Customer not found" message appears + back button works
- [ ] DevTools Console → **zero errors**

---

---

## PHASE 8 — Notes & Questions Page + Settings

### Session Start Prompt
> "Read PROJECT_SOP.md and Plan.md fully. Phases 1–7 complete. We are on Phase 8 — Notes & Questions and Settings. Only touch app.js and style.css. Dark mode must only override CSS variables — no hardcoded colors."

### Files to Touch
- `app.js`
- `style.css`

### Do NOT Touch
- `index.html`
- `data.js`

### Do NOT (Constraints)
- Do NOT use hardcoded color values in dark mode CSS — only override `--color-*` CSS variables
- Do NOT build a new modal component — use the existing `#modal-overlay` infrastructure

### Build Tasks

#### renderNotes() in app.js
Aggregated feed from all customers:
```javascript
function renderNotes() {
  // 1. Flatten: collect all notes from all customers
  const allNotes = [];
  customers.forEach(customer => {
    customer.notes.forEach(note => {
      allNotes.push({ ...note, customerName: customer.fullName, customerId: customer.id });
    });
  });
  // 2. Sort: newest first by createdAt
  allNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  // 3. Apply search filter if query exists
  // 4. Render page with search bar + feed
}
```

Each note entry in the feed:
```html
<div class="note-feed-item">
  <div class="avatar-circle">[initials]</div>
  <div class="note-feed-body">
    <p class="note-feed-customer">
      <a onclick="window.location.hash='#customer/[customerId]'" href="#">[Customer Name]</a>
    </p>
    <p class="note-feed-text">[note.text]</p>
    <p class="note-feed-date">[formatted date]</p>
  </div>
</div>
```

Search: filter by `customerName.includes(query)` OR `note.text.includes(query)`.

#### renderSettings() in app.js
```javascript
function renderSettings() {
  const currentTheme = settings.theme || "light";
  // Render two theme option cards
  // Card has class "theme-card" + "theme-card--active" if selected
}
```

Theme card onclick:
```javascript
function setTheme(theme) {
  settings.theme = theme;
  saveData();
  applyTheme();
  renderSettings(); // re-render to update active card state
}
function applyTheme() {
  document.body.classList.toggle('dark-mode', settings.theme === 'dark');
}
```

Call `applyTheme()` inside `loadData()` so theme is applied on page load.

#### Dark mode CSS in style.css
Find the placeholder `body.dark-mode { }` block written in Phase 1 and fill it:
```css
body.dark-mode {
  --color-bg:            #0F172A;
  --color-surface:       #1E293B;
  --color-border:        #334155;
  --color-text-primary:  #F1F5F9;
  --color-text-secondary:#94A3B8;
  --color-text-muted:    #64748B;
  --color-sidebar-bg:    #020617;
}
```
No additional color rules needed if all components use CSS variables (which they do, per the Phase 1 token system).

#### Notification Bell Dropdown in app.js
```javascript
function toggleNotifDropdown() {
  const existing = document.getElementById('notif-dropdown');
  if (existing) { existing.remove(); return; }

  const last5 = activityLog.slice(0, 5);
  const html = `
    <div id="notif-dropdown" class="notif-dropdown">
      <h4>Recent Activity</h4>
      ${last5.map(a => `
        <div class="notif-item">
          <strong>${a.customerName}</strong> ${a.description}
          <span class="notif-time">${formatTimeAgo(a.timestamp)}</span>
        </div>
      `).join('')}
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  // Position it near the bell button
  const bell = document.getElementById('notif-bell');
  const rect = bell.getBoundingClientRect();
  const dropdown = document.getElementById('notif-dropdown');
  dropdown.style.top = (rect.bottom + 8) + 'px';
  dropdown.style.right = (window.innerWidth - rect.right) + 'px';

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', function handler() {
      document.getElementById('notif-dropdown')?.remove();
      document.removeEventListener('click', handler);
    });
  }, 0);
}
```
Connect to the bell button in `renderTopbar()`: `onclick="toggleNotifDropdown()"`.

###  Done When — Phase 8
Every item below must pass before moving to Phase 9:

- [ ] Navigate to `#notes` → feed shows all notes from all customers combined
- [ ] Notes sorted newest first
- [ ] Each entry shows: customer avatar (initials), clickable customer name, note text, date
- [ ] Click a customer name in the feed → navigates to that customer's detail page
- [ ] Type in search on Notes page → feed filters to matching customer names or note content
- [ ] Navigate to `#settings` → two theme option cards visible (Light Mode, Dark Mode)
- [ ] Click **Dark Mode** card → entire app immediately turns dark (sidebar, topbar, cards, tables, modal)
- [ ] Refresh the page → dark mode still active (persisted in localStorage)
- [ ] Click **Light Mode** card → app returns to light theme
- [ ] Open dark mode, navigate to `#customers-all` → table readable, no invisible text on dark backgrounds
- [ ] Open dark mode, navigate to `#dashboard` → cards readable
- [ ] Open dark mode, open the Add Customer modal → modal readable
- [ ] Click notification bell → small dropdown appears showing last 5 activity entries
- [ ] Click anywhere outside the dropdown → it closes
- [ ] Click bell again → dropdown reopens
- [ ] DevTools Console → **zero errors** in both light and dark mode

---

---

## PHASE 9 — Polish & QA

### Session Start Prompt
> "Read PROJECT_SOP.md and Plan.md fully. Phases 1–8 complete. We are on Phase 9 — Polish and QA. No new features. Only polish existing functionality and fix any bugs found during the QA checklist."

### Files to Touch
- `app.js` — fix bugs, connect global search
- `style.css` — add transitions, fix visual inconsistencies

### Do NOT Touch
- `index.html`
- `data.js`

### Do NOT (Constraints)
- Do NOT add any new features that are not in the SOP
- Do NOT refactor working code unless it is causing a documented bug
- Do NOT add excessive animations — only: sidebar collapse transition (0.3s), modal fade-in (0.2s), row hover (0.15s), button hover scale (0.1s)

### Build Tasks

#### Global Topbar Search
Connect `#global-search` input to a live search across all customers:
```javascript
document.getElementById('global-search').addEventListener('input', function() {
  const q = this.value.trim();
  if (q.length > 0) {
    currentSearchQuery = q.toLowerCase();
    window.location.hash = "#customers-all";
    renderAllCustomers();
  } else {
    currentSearchQuery = "";
  }
});
```

#### CSS Transitions
Add to style.css:
```css
/* Sidebar collapse */
#sidebar { transition: width 0.3s ease; }
#main-wrapper { transition: margin-left 0.3s ease; }

/* Modal fade in */
.modal-backdrop { animation: fadeIn 0.2s ease; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.modal-panel { animation: slideUp 0.2s ease; }
@keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

/* Row hover */
tbody tr { transition: background-color 0.15s ease; }

/* Button hover */
.btn-primary:hover { background: var(--color-accent-hover); transform: translateY(-1px); transition: all 0.1s ease; }
```

#### Remove Debug Logs
Remove any `console.log` statements added during development (except error handlers).

###  Done When — Phase 9 (Full QA Checklist)
This is the final verification. Every single item must pass:

**Data Persistence**
- [ ] Add a new customer → refresh page → customer still there
- [ ] Edit a customer → refresh → edited data still there
- [ ] Delete a customer → refresh → customer still gone
- [ ] Set dark mode → refresh → dark mode still on

**Dashboard**
- [ ] All 8 stat cards show correct live counts from actual data
- [ ] Dashboard chart renders without console error
- [ ] Dashboard chart re-renders correctly when navigating away and back
- [ ] Recent Activity shows real data from activityLog
- [ ] Upcoming Follow Ups table has correct rows
- [ ] Phone icon → opens phone dialer intent
- [ ] Message icon → opens email client intent
- [ ] Three-dot menu → all three options (View, Edit, Delete) work

**Sidebar & Navigation**
- [ ] Every single sidebar nav item navigates to its correct page
- [ ] Active item highlighted with blue background
- [ ] Customers sub-menu collapses and expands
- [ ] Deals sub-menu collapses and expands
- [ ] Sidebar collapse → icons visible, labels hidden
- [ ] Sidebar expand → labels visible again
- [ ] Page title in topbar updates on every navigation

**All Customers Page**
- [ ] All customers shown
- [ ] Search filters by name, phone, and email
- [ ] Sort works on at least Name, Status, Last Contact columns
- [ ] Row click → customer detail page
- [ ] Edit → modal pre-filled → save → row updates
- [ ] Delete → confirm → removed from table
- [ ] Add Customer → modal empty → save → appears in table

**Status Filter Pages (test each one)**
- [ ] New Leads → only "New Lead" customers
- [ ] Interested Customers → only "Interested Customer"
- [ ] Hot Leads → only "Hot Lead"
- [ ] Follow Ups → only "Follow Up"
- [ ] Won Deals → "Won Deal" + Deal Value + Product columns
- [ ] Lost Deals → "Lost Deal" + Lost Reason column

**Customer Detail Page**
- [ ] All fields shown for any customer
- [ ] Status change dropdown works + logged in activity
- [ ] Edit button → modal → save → detail page updates
- [ ] Add note → appears in notes list
- [ ] Delete note → removed from notes list
- [ ] Back button → returns to previous page

**Modal (Add/Edit)**
- [ ] Add mode → empty form
- [ ] Edit mode → pre-filled form
- [ ] Submit empty → validation errors shown, modal stays open
- [ ] Submit valid Add → customer created, table updated
- [ ] Submit valid Edit → customer updated, table updated
- [ ] Escape closes modal
- [ ] Click outside closes modal
- [ ] Close (✕) button closes modal

**Notes & Questions**
- [ ] All notes from all customers shown
- [ ] Sorted newest first
- [ ] Customer name link → navigates to detail page
- [ ] Search filters notes correctly

**Settings**
- [ ] Light/Dark mode cards visible
- [ ] Dark mode applies to every page
- [ ] Light mode restores all pages
- [ ] Theme persists after refresh

**Notification Bell**
- [ ] Bell opens dropdown with last 5 activities
- [ ] Click outside closes dropdown
- [ ] Click bell again closes it if open

**Global Search (Topbar)**
- [ ] Type in topbar search → navigates to All Customers with filter applied
- [ ] Clear search → all customers shown

**Visual QA**
- [ ] Dashboard matches the reference image layout (two rows of 4 cards, activity + chart row, follow-ups table)
- [ ] Sidebar dark navy with white text
- [ ] Active nav item has blue pill/highlight
- [ ] Status badges are colored correctly (Blue=New, Amber=Interested, Red=Hot, Purple=Follow Up, Green=Won, Gray=Lost)
- [ ] Modal is centered and readable
- [ ] No visible console errors on any page

**Final Check**
- [ ] Open DevTools → Console tab → navigate through EVERY page → zero errors total
- [ ] Open DevTools → Application → LocalStorage → `saleshub_customers` and `saleshub_activity` and `saleshub_settings` all present

---

*Plan.md — Version 2.0 — AI-Hardened Edition*
*Only update this file to mark items complete or add new phases. Never remove content.*
