# PROJECT_SOP.md — Sales Outreach CRM Dashboard
> Feed this file into OpenCode / Antigravity at the START of every session.
> Never delete or rename this file. Update Progress.md to journal session work.

---

## 1. WHAT WE ARE BUILDING

A local, single-page web application called **SalesHub** — an internal Sales Outreach CRM Dashboard.

**Purpose:** Help one user manage customers, organize leads, track conversations, and monitor potential sales opportunities through a clean, professional dashboard UI.

**Deployment:** Strictly local. No server, no internet, no backend. Open `index.html` in a browser — that is the entire product.

**Tech stack:** Pure HTML5 + CSS3 + Vanilla JavaScript (ES6+). Zero frameworks, zero build tools, zero dependencies except one optional chart library (Chart.js via CDN).

---

## 2. FILE STRUCTURE

All files live in a single flat folder (e.g., `saleshub/`):

```
saleshub/
├── index.html          ← Single HTML shell; all pages render here
├── style.css           ← All styles (design tokens → components → pages)
├── app.js              ← All logic (router, data layer, page renderers)
├── data.js             ← Sample/seed data (customers array, activity log)
└── PROJECT_SOP.md      ← (this file — keep in the folder for reference)
```

No subfolders. No module bundler. All JS is vanilla, non-module scripts loaded in order: `data.js` → `app.js`.

---

## 3. DESIGN SYSTEM (match the reference image exactly)

### 3.1 Color Tokens (CSS variables in `:root`)

```css
--color-sidebar-bg:    #0F172A;   /* Very dark navy — sidebar background */
--color-sidebar-text:  #94A3B8;   /* Muted slate — inactive nav items */
--color-sidebar-active:#3B82F6;   /* Bright blue — active nav item background */
--color-sidebar-active-text: #FFFFFF;
--color-accent:        #3B82F6;   /* Primary blue — buttons, links, highlights */
--color-accent-hover:  #2563EB;
--color-bg:            #F8FAFC;   /* Page background */
--color-surface:       #FFFFFF;   /* Card/panel background */
--color-border:        #E2E8F0;   /* Subtle borders */
--color-text-primary:  #0F172A;   /* Headings, main text */
--color-text-secondary:#64748B;   /* Labels, subtext */
--color-text-muted:    #94A3B8;   /* Timestamps, minor labels */

/* Status badge colors */
--status-new-lead:     #3B82F6;   /* Blue */
--status-interested:   #F59E0B;   /* Amber/orange */
--status-hot-lead:     #EF4444;   /* Red */
--status-follow-up:    #8B5CF6;   /* Purple */
--status-won:          #10B981;   /* Green */
--status-lost:         #6B7280;   /* Gray */

/* Trend indicators */
--color-trend-up:      #10B981;   /* Green arrow + number */
--color-trend-down:    #EF4444;   /* Red arrow + number */
```

### 3.2 Typography

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

Load Inter from Google Fonts CDN in `<head>`:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Type scale:
- `--font-xs: 11px` — timestamps, minor labels
- `--font-sm: 13px` — table cells, secondary text
- `--font-base: 14px` — body default
- `--font-md: 16px` — card values label
- `--font-lg: 24px` — stat card numbers
- `--font-xl: 28px` — page headings
- `--font-2xl: 32px` — large numbers (Deals Value)

### 3.3 Layout

```
┌─────────────────────────────────────────────────────────┐
│  SIDEBAR (240px fixed)  │  TOPBAR (full width, 64px)    │
│                         ├───────────────────────────────┤
│  [Logo: SalesHub]       │                               │
│  ─────────────────      │   MAIN CONTENT AREA           │
│  Dashboard              │   (scrollable)                │
│  ─────────────────      │                               │
│  Customers ▾            │                               │
│    All Customers        │                               │
│    New Leads            │                               │
│    Interested Customers │                               │
│    Hot Leads            │                               │
│    Follow Ups           │                               │
│  ─────────────────      │                               │
│  Deals ▾                │                               │
│    Won Deals            │                               │
│    Lost Deals           │                               │
│  ─────────────────      │                               │
│  Notes & Questions      │                               │
│  Settings               │                               │
│                         │                               │
│  [Collapse ◄]           │                               │
└─────────────────────────┴───────────────────────────────┘
```

- Sidebar: `width: 240px`, fixed, full-height, `--color-sidebar-bg`
- Content wrapper: `margin-left: 240px`, min-height: 100vh
- Topbar: `height: 64px`, sticky top, white background, shadow-sm
- Content area: padding 24px, `--color-bg`

### 3.4 Component Specs

**Stat Cards:**
- White background, `border-radius: 12px`, subtle box-shadow
- Padding: 20px
- Icon circle: 48px, colored background (tinted to match stat category)
- Stat number: `font-size: var(--font-lg)`, bold
- Label: `font-size: var(--font-sm)`, `color: var(--color-text-secondary)`
- Trend row: colored arrow icon + percentage + "vs last month"

**Tables:**
- White background card wrapper, `border-radius: 12px`
- `thead`: light gray background `#F8FAFC`, uppercase labels, font-size 11px
- `tbody tr`: hover highlight `#F1F5F9`, cursor pointer
- Row height: 52px
- Cell padding: 12px 16px

**Status Badges:**
- `border-radius: 20px`, padding: 4px 10px, font-size 12px, font-weight 600
- Colored text + light tinted background (use 15% opacity of status color)

**Modals:**
- Centered overlay, `border-radius: 16px`, max-width 560px
- Header with title + close button
- Scrollable body, sticky footer with action buttons
- Background overlay: `rgba(0,0,0,0.5)`

**Buttons:**
- Primary: `--color-accent` bg, white text, border-radius 8px, padding 8px 16px
- Secondary: white bg, `--color-border` border, `--color-text-primary` text
- Danger: `#EF4444` bg, white text
- Icon buttons: 32px circle, light hover state

---

## 4. DATA MODEL

### 4.1 Customer Object

```javascript
{
  id: "cust_001",          // Unique ID (auto-generated: "cust_" + timestamp)
  fullName: "Ahmed Samir",
  phone: "+20 100 123 4567",
  email: "ahmed@example.com",
  company: "TechCorp",      // Optional
  source: "Facebook Ads",   // See sources list below
  status: "New Lead",       // See statuses list below
  notes: [
    { id: "note_001", text: "Asked about warranty", createdAt: "2024-05-14T10:30:00Z" }
  ],
  dealValue: null,          // Number, filled when Won Deal
  productPurchased: null,   // String, filled when Won Deal
  lostReason: null,         // String, filled when Lost Deal
  lastContactDate: "2024-05-14",
  nextFollowUpDate: "2024-05-18",
  createdAt: "2024-05-10T08:00:00Z"
}
```

### 4.2 Customer Sources (array constant)

```javascript
const SOURCES = [
  "Facebook Ads", "Instagram Ads", "Website Form",
  "Referral", "WhatsApp", "LinkedIn", "Cold Outreach", "Manual Entry"
];
```

### 4.3 Customer Statuses (array constant + display config)

```javascript
const STATUSES = [
  { key: "New Lead",              color: "#3B82F6", bg: "#EFF6FF" },
  { key: "Interested Customer",   color: "#F59E0B", bg: "#FFFBEB" },
  { key: "Hot Lead",              color: "#EF4444", bg: "#FEF2F2" },
  { key: "Follow Up",             color: "#8B5CF6", bg: "#F5F3FF" },
  { key: "Won Deal",              color: "#10B981", bg: "#ECFDF5" },
  { key: "Lost Deal",             color: "#6B7280", bg: "#F9FAFB" }
];
```

### 4.4 Activity Log Object

```javascript
{
  id: "act_001",
  type: "status_change",       // "status_change" | "note_added" | "follow_up" | "new_customer"
  customerName: "Ahmed Ali",
  description: "moved to Hot Leads",
  timestamp: "2024-05-14T10:28:00Z"
}
```

### 4.5 LocalStorage Keys

```javascript
const STORAGE_KEYS = {
  CUSTOMERS: "saleshub_customers",
  ACTIVITY:  "saleshub_activity",
  SETTINGS:  "saleshub_settings"
};
```

---

## 5. ROUTING

Use **hash-based routing** (`window.location.hash`). No page reloads.

```javascript
const ROUTES = {
  "#dashboard":           renderDashboard,
  "#customers-all":       renderAllCustomers,
  "#customers-new-leads": renderNewLeads,
  "#customers-interested":renderInterestedCustomers,
  "#customers-hot-leads": renderHotLeads,
  "#customers-follow-ups":renderFollowUps,
  "#deals-won":           renderWonDeals,
  "#deals-lost":          renderLostDeals,
  "#notes":               renderNotes,
  "#settings":            renderSettings,
  "#customer/:id":        renderCustomerDetail
};
```

Router logic:
```javascript
function router() {
  const hash = window.location.hash || "#dashboard";
  // Match route, call renderer, update sidebar active state
}
window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", router);
```

---

## 6. PAGE SPECIFICATIONS

### 6.1 DASHBOARD PAGE (`#dashboard`)

**Section A — Stat Cards Row 1 (4 cards):**
Total Customers | New Leads | Interested Customers | Hot Leads

**Section B — Stat Cards Row 2 (4 cards):**
Follow Ups | Won Deals | Lost Deals | Deals Value ($)

Each card: count from `customers` array, trend % vs last month (calculate from `createdAt` or store separately), icon, colored icon background.

**Section C — Recent Activity + Customers by Source (2-column grid)**

Left: Recent Activity list (last 10 from `activityLog`)
- Each row: status icon | "CustomerName **action description**" | timestamp
- "View All" link top right (shows full log in modal)

Right: Customers by Source (donut chart via Chart.js)
- Use `new Chart(ctx, { type: 'doughnut', ... })` with CDN Chart.js
- Legend below chart: source name + count + percentage
- Colors: match design reference

**Section D — Upcoming Follow Ups table (full width)**
- Show customers with `nextFollowUpDate` within next 14 days, sorted by date
- Columns: Customer (avatar + name) | Phone | Status badge | Next Follow Up | Source | Actions
- Actions: Phone icon button | Message icon button | Three-dot menu (Edit, View, Delete)
- "View All" link top right → navigate to `#customers-follow-ups`

### 6.2 ALL CUSTOMERS PAGE (`#customers-all`)

**Topbar within content:**
- Page title "All Customers"
- Right side: Search input (live filter) + "Add Customer" button

**Table columns:**
Name | Phone | Email | Source | Status | Last Contact | Actions (edit icon + delete icon)

**Features:**
- Live search: filter by name, phone, email as user types
- Sort: click column header toggles asc/desc (indicate with ▲▼ icon)
- Row click → navigate to `#customer/:id`
- Edit icon → open Edit Customer modal (pre-filled)
- Delete icon → confirm dialog → remove from array + localStorage
- Empty state: "No customers found" card if array is empty or search matches nothing

### 6.3 STATUS FILTER PAGES

All six filtered pages share the same layout as All Customers but pre-filter by status:

| Route                      | Filter                    | Page Title              |
|---------------------------|---------------------------|-------------------------|
| `#customers-new-leads`    | status === "New Lead"     | New Leads               |
| `#customers-interested`   | status === "Interested Customer" | Interested Customers |
| `#customers-hot-leads`    | status === "Hot Lead"     | Hot Leads               |
| `#customers-follow-ups`   | status === "Follow Up"    | Follow Ups              |
| `#deals-won`              | status === "Won Deal"     | Won Deals               |
| `#deals-lost`             | status === "Lost Deal"    | Lost Deals              |

Won Deals extra columns: Deal Value | Product Purchased
Lost Deals extra columns: Lost Reason

Use a single reusable function `renderCustomerTable(filterFn, title, extraColumns)` to avoid code duplication.

### 6.4 CUSTOMER DETAIL PAGE (`#customer/:id`)

Layout: Back button | Customer name heading

**Left column (60%):**
- Info card: all fields (name, phone, email, company, source, status, created date, last contact, next follow-up)
- Status dropdown to change status (logs activity on change)
- Edit button → opens Edit Customer modal

**Right column (40%):**
- Notes panel with "Add Note" textarea + Submit button
- Notes list: newest first, each note shows text + date
- Delete note button (×) per note

### 6.5 ADD / EDIT CUSTOMER MODAL

Single reusable modal `showCustomerModal(customer = null)`:
- If `customer` is null → Add mode (empty fields, "Add Customer" title)
- If `customer` is provided → Edit mode (pre-filled, "Edit Customer" title)

Fields:
Full Name* | Phone* | Email | Company | Source (dropdown) | Status (dropdown) | Last Contact Date | Next Follow Up Date | Notes (textarea, add mode only)

Validation: Full Name and Phone are required. Show inline error if empty on submit.

On submit:
- Add mode: push new customer to array, log activity "added as new lead", save to localStorage
- Edit mode: update existing customer by id, log activity "updated", save to localStorage

### 6.6 NOTES & QUESTIONS PAGE (`#notes`)

Shows all notes from all customers in one feed, newest first.

Each entry:
- Customer avatar circle (initials) | Customer name (clickable → their detail page) | Note text | Date

Topbar: search by customer name or note text content (live filter).

### 6.7 SETTINGS PAGE (`#settings`)

**Theme section:**
- "Appearance" heading
- Two option cards: Light Mode | Dark Mode
- Selected card gets blue border + checkmark
- On select: toggle class `dark-mode` on `<body>`, save to localStorage

**About section:**
- App name, version (v1.0.0), description

Dark mode overrides: override the CSS token values in a `body.dark-mode` block:
```css
body.dark-mode {
  --color-bg: #0F172A;
  --color-surface: #1E293B;
  --color-border: #334155;
  --color-text-primary: #F1F5F9;
  --color-text-secondary: #94A3B8;
}
```

---

## 7. INTERACTIVE BEHAVIOR REQUIREMENTS

Every visible interactive element must work. This is a non-negotiable rule.

| Element                        | Required Behavior                                                    |
|-------------------------------|----------------------------------------------------------------------|
| Search input (topbar)         | Live filter across `customers` array by name, phone, email. Navigate to all-customers view if not already there. |
| Search input (page-level)     | Live filter the current page's table rows                            |
| Sidebar nav items             | Update hash, re-render content area, highlight active item           |
| Customers ▾ / Deals ▾         | Toggle sub-menu expand/collapse with smooth animation                |
| "Add Customer" button         | Open Add Customer modal                                              |
| Row click (table)             | Navigate to that customer's detail page                              |
| Edit icon / "Edit" in menu    | Open Edit Customer modal pre-filled with customer data               |
| Delete icon / "Delete" in menu| Show confirmation dialog. On confirm: remove + log activity + re-render |
| Phone icon button (📞)        | Open `tel:` link in new tab (e.g., `window.open("tel:+201001234567")`) |
| Message icon button (💬)      | Open `mailto:` link (e.g., `window.open("mailto:email@example.com")`) |
| Three-dot menu (⋮)            | Show dropdown: View | Edit | Delete | Change Status (sub-menu)       |
| Status dropdown (detail page) | Change status → update customer → log activity → re-render           |
| "View All" links              | Navigate to relevant page or open full modal                         |
| Add Note (detail page)        | Append note to customer.notes array → save → re-render notes list    |
| Delete note (×)               | Remove note from array → save → re-render                            |
| Theme toggle (settings)       | Instantly apply dark/light mode + persist                            |
| Sort column header            | Sort table by that column, toggle asc/desc, update arrow indicator   |
| Notification bell 🔔          | Open a simple modal/dropdown listing last 5 activity items            |
| Collapse sidebar (◄)          | Shrink sidebar to 64px (icons only), expand on click (►)             |

---

## 8. SAMPLE DATA (seed in `data.js`)

Generate **20 sample customers** with realistic Arabic/Egyptian names and phone numbers (+20 format), spread across all 6 statuses (roughly 4 per status), various sources, and dates in May 2024.

Also generate **15 activity log entries** covering the last 3 days.

These samples make every page look populated on first open.

---

## 9. BUILD PHASES

Execute in order. Never skip a phase. Update `Progress.md` after each phase.

### Phase 1 — Foundation (Session 1)
- [ ] Create `index.html` with HTML shell, `<head>` (fonts, Chart.js CDN, CSS link), `<body>` structure (sidebar + content wrapper)
- [ ] Create `style.css` with CSS custom properties (all tokens from Section 3), base reset, layout grid
- [ ] Create `data.js` with sample customers (20) and activity log (15 entries), SOURCES, STATUSES constants
- [ ] Create `app.js` with: STORAGE_KEYS, loadData/saveData helpers, router skeleton, sidebar render
- [ ] Verify: page opens in browser, sidebar visible with dark background, no console errors

### Phase 2 — Sidebar & Navigation (Session 1 or 2)
- [ ] Render full sidebar: logo, nav sections with icons (use inline SVGs or Unicode symbols)
- [ ] Collapsible Customers and Deals sub-menus (click to expand/collapse)
- [ ] Hash-based router: all routes registered, active sidebar item highlights on navigate
- [ ] Topbar: search input, notification bell, user avatar placeholder
- [ ] Collapse/expand sidebar button
- [ ] Verify: clicking every sidebar item changes the URL hash and clears content area

### Phase 3 — Dashboard Page (Session 2)
- [ ] Render 8 stat cards with live counts from data
- [ ] Render Recent Activity list (last 10 entries)
- [ ] Render Customers by Source donut chart (Chart.js)
- [ ] Render Upcoming Follow Ups table (next 14 days)
- [ ] All "View All" links navigate correctly
- [ ] Phone / message / three-dot action buttons in Follow Ups table all work
- [ ] Verify: Dashboard matches reference image layout and color scheme

### Phase 4 — All Customers Page (Session 2 or 3)
- [ ] Table with all 20 sample customers
- [ ] Live search (name, phone, email)
- [ ] Sort by clicking column header (name, status, last contact)
- [ ] Row click → customer detail page
- [ ] Edit icon → Edit modal pre-filled
- [ ] Delete icon → confirmation → remove + re-render
- [ ] "Add Customer" button → Add modal
- [ ] Empty state UI

### Phase 5 — Filtered Status Pages (Session 3)
- [ ] Reusable `renderCustomerTable(filterFn, title, extraColumns)` function
- [ ] Implement: New Leads, Interested, Hot Leads, Follow Ups, Won Deals, Lost Deals
- [ ] Won Deals extra columns: Deal Value, Product Purchased
- [ ] Lost Deals extra column: Lost Reason
- [ ] Verify all 6 routes render correct filtered data

### Phase 6 — Add / Edit Customer Modal (Session 3)
- [ ] Single reusable modal function `showCustomerModal(customer)`
- [ ] All form fields per Section 6.5
- [ ] Validation (name + phone required)
- [ ] Add mode: creates new customer, logs activity, saves, re-renders
- [ ] Edit mode: updates existing, saves, re-renders
- [ ] Close button, click-outside-to-close, Escape key to close

### Phase 7 — Customer Detail Page (Session 4)
- [ ] Two-column layout (info + notes)
- [ ] All customer fields displayed
- [ ] Status change dropdown with live update + activity log
- [ ] Notes: add, display list, delete
- [ ] Edit button opens Edit modal
- [ ] Back button navigates to previous route

### Phase 8 — Notes & Questions Page + Settings (Session 4)
- [ ] Notes & Questions: aggregated feed from all customers, live search
- [ ] Settings: light/dark mode cards, toggle works, persists in localStorage
- [ ] Dark mode CSS overrides applied to all pages correctly
- [ ] Notification bell dropdown (last 5 activities)

### Phase 9 — Polish & QA (Session 5)
- [ ] Topbar global search works across all pages
- [ ] Every button in the reference image's interactive areas works
- [ ] Smooth CSS transitions on sidebar collapse, modal open/close, row hover
- [ ] Consistent spacing, typography, and color usage everywhere
- [ ] No broken routes, no console errors
- [ ] Test all CRUD operations end-to-end: add → view → edit → delete
- [ ] Verify localStorage persistence: data survives page refresh
- [ ] Responsive: app is usable at 1280px and 1440px viewport widths

---

## 10. SESSION START INSTRUCTIONS

At the beginning of every OpenCode/AI session, say:

> "Read PROJECT_SOP.md and Progress.md fully before writing any code. Follow the build phases in order. Only work on the current unchecked phase. Ask before starting any work outside the current phase scope. After completing a phase, update Progress.md."

When a session ends, always:
1. Mark completed items in `Progress.md`
2. Note any blockers or decisions made
3. Note which phase to continue in the next session

---

## 11. CODE QUALITY RULES

1. **No frameworks.** No React, Vue, jQuery, Bootstrap, etc. Vanilla only.
2. **One function per responsibility.** Never write a 200-line function. Break it up.
3. **No inline styles.** All visual styling goes in `style.css`. JS only adds/removes CSS classes.
4. **Consistent naming.** Functions: camelCase verbs (`renderDashboard`, `saveCustomer`). CSS classes: kebab-case nouns (`stat-card`, `sidebar-nav-item--active`). Data keys: camelCase.
5. **Comment every major section** in `app.js` and `style.css` with `/* === SECTION NAME === */` headers.
6. **DRY principle.** If you write the same table structure twice, refactor into a shared function.
7. **LocalStorage always.** Every data mutation must call `saveData()` immediately after.
8. **No `document.write()`.** All DOM updates via `innerHTML`, `createElement`, or template literals.
9. **Chart.js for charts only.** Load via CDN. One chart per canvas. Destroy old instance before re-creating on re-render.

---

## 12. MCP & SKILL RECOMMENDATIONS

### Recommended MCPs to Install in OpenCode

| MCP | Purpose | Priority |
|-----|---------|----------|
| **Filesystem MCP** (`@modelcontextprotocol/server-filesystem`) | Read, create, edit local `.html`, `.css`, `.js` files directly — essential for the whole project | 🔴 Critical |
| **Puppeteer MCP** (`@modelcontextprotocol/server-puppeteer`) | Launch the app in a real browser, take screenshots, click through UI to test behavior automatically | 🟠 High |
| **Memory MCP** (`@modelcontextprotocol/server-memory`) | Persist key project decisions and context across sessions so AI doesn't forget patterns you've established | 🟡 Medium |
| **Browser Tools MCP** (Browserbase or similar) | Inspect console errors, capture DOM state while the app is running — good for debugging | 🟡 Medium |

Install Filesystem + Puppeteer first. They are the two that will have the most impact on build quality and speed.

### Recommended Skill to Activate

| Skill | Why |
|-------|-----|
| **`frontend-design`** | Guides the AI to make deliberate, non-templated visual choices — essential for matching your reference image and producing professional UI instead of generic output. Activate this at the start of any session involving CSS or layout work. |

No other skills from the current set (docx, pdf, pptx, xlsx) are needed for this project.

---

## 13. REFERENCE IMAGE NOTES

The uploaded dashboard reference image shows:
- Sidebar: near-black navy (`#0F172A`), white text, blue pill highlight for active item
- Logo: bar chart icon + "Sales**Hub**" with "Hub" in blue
- Cards: white, rounded-12px, icon on right side in colored circle
- Trend indicators: green ▲ for positive, red ▼ for negative
- Chart: donut chart with legend on right
- Table: clean rows, avatar initials circle, colored status badges
- Action icons: phone (green), message (blue), three-dot menu
- Fonts: Inter throughout

Treat this image as the ground truth for visual decisions. When in doubt, match it exactly.

---

*End of PROJECT_SOP.md — Version 1.0*
