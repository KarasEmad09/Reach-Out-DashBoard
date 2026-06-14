# SalesHub CRM

A lightweight, zero-dependency CRM dashboard built with vanilla HTML, CSS, and JavaScript. No build tools, no frameworks — open `index.html` in a browser and it works.

---

## Features

### Dashboard
- 8 KPI stat cards: Total Customers, New Leads, Interested, Hot Leads, Follow Ups, Won Deals, Lost Deals, and total Deal Value
- Customers by Source doughnut chart (powered by Chart.js)
- Upcoming Follow Ups table sorted by date
- Recent Activity feed (last 10 events)

### Customer Management
- Filterable list views for each pipeline stage: All Customers, New Leads, Interested Customers, Hot Leads, Follow Ups, Won Deals, Lost Deals
- Sortable columns with search per view and a global topbar search
- Add / Edit / Delete customers via modal form
- Inline row action menu (View, Edit, Delete)

### Customer Detail Page
- Full profile: name, phone, email, company, source, status, dates
- Inline status change via dropdown
- Won Deal fields: deal value and product purchased
- Lost Deal field: reason for loss
- Notes panel: add, view, and delete timestamped notes per customer

### Notes & Questions Page
- Aggregated feed of all notes across all customers, sorted by date
- Search by customer name or note content
- Clickable links back to individual customer pages

### Activity Log
- Auto-logged events for new customers, status changes, and note additions
- Bell icon in topbar shows the 5 most recent events
- "View All" modal on the dashboard activity panel

### Settings
- Light / dark mode toggle with visual theme cards
- Preference persisted to localStorage

### Navigation
- Hash-based client-side router (`#dashboard`, `#customers-all`, `#customer/:id`, etc.)
- Collapsible sidebar on desktop (collapses to icon-only)
- Hamburger menu + slide-in overlay sidebar on mobile

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 with custom properties (CSS variables) |
| Logic | Vanilla JavaScript (ES6+) |
| Charts | [Chart.js](https://www.chartjs.org/) via CDN |
| Fonts | Inter (Google Fonts) |
| Storage | `localStorage` |

No npm, no bundler, no framework.

---

## File Structure

```
saleshub/
├── index.html   # App shell — sidebar, topbar, content, and modal overlay placeholders
├── style.css    # All styling: CSS variables, light/dark themes, layout, components
├── data.js      # Constants (SOURCES, STATUSES, STORAGE_KEYS) and sample seed data
└── app.js       # State, routing, rendering, CRUD, and event logic
```

---

## Data Model

### Customer

| Field | Type | Notes |
|---|---|---|
| `id` | string | Generated (`cust_<timestamp>`) |
| `fullName` | string | Required |
| `phone` | string | Required |
| `email` | string | Optional |
| `company` | string | Optional |
| `source` | string | One of 8 lead sources |
| `status` | string | One of 6 pipeline stages |
| `notes` | array | `{ id, text, createdAt }` |
| `dealValue` | number \| null | Populated on Won Deal |
| `productPurchased` | string \| null | Populated on Won Deal |
| `lostReason` | string \| null | Populated on Lost Deal |
| `lastContactDate` | string | ISO date |
| `nextFollowUpDate` | string \| null | ISO date |
| `createdAt` | string | ISO datetime |

### Pipeline Statuses

| Status | Color |
|---|---|
| New Lead | Blue |
| Interested Customer | Amber |
| Hot Lead | Red |
| Follow Up | Purple |
| Won Deal | Green |
| Lost Deal | Gray |

### Lead Sources

Facebook Ads, Instagram Ads, Website Form, Referral, WhatsApp, LinkedIn, Cold Outreach, Manual Entry

---

## Getting Started

1. Clone or download the repository.
2. Open `index.html` directly in any modern browser.
3. No installation, no build step, no server required.

On first load the app seeds `localStorage` with 20 sample customers and 15 activity events. All changes (add, edit, delete, status changes, notes) are persisted to `localStorage` automatically.

---

## Storage

All data lives in the browser's `localStorage` under three keys:

| Key | Contents |
|---|---|
| `saleshub_customers` | Array of customer objects |
| `saleshub_activity` | Array of activity log entries |
| `saleshub_settings` | User preferences (theme) |

To reset to the sample data, clear `localStorage` and reload.

---

## Browser Support

Any modern browser with ES6 and `localStorage` support (Chrome, Firefox, Edge, Safari).
