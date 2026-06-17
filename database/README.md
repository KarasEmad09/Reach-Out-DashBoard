# SalesHub CRM — Database Setup Guide

## Architecture

```
Browser (index.html + app.js)
       │
       ▼ HTTP REST + realtime SSE
PocketBase (single Go binary)
       │
       ▼
SQLite (WAL mode, single file: pb_data/data.db)
```

## Quickstart

### 1. Run setup

```powershell
# From project root
powershell -ExecutionPolicy Bypass -File .\database\setup.ps1
```

This downloads PocketBase, creates the database, starts it, creates all collections, and seeds initial data.

### 2. Open the app

Open `index.html` in a browser. The app auto-detects PocketBase at `http://localhost:8090` and uses it. If PocketBase is not running, falls back to localStorage.

### 3. Login credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@saleshub.com` | `Admin@123456` |
| Sales Manager | `manager@saleshub.com` | `Manager@123456` |
| Sales Agent | `agent@saleshub.com` | `Agent@123456` |

### 4. Admin UI

Visit `http://localhost:8090/_/` and login with super admin credentials to manage collections, users, and data directly.

---

## Database Schema

### `users` (managed by PocketBase)

| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT PK | Auto-generated |
| `email` | TEXT UNIQUE | Login email |
| `name` | TEXT | Display name |
| `role` | TEXT | `super_admin` / `admin` / `employee` |
| `permissions` | JSON | Permission array (future use) |

### `customers`

| Field | Type | Required | Index | Description |
|-------|------|----------|-------|-------------|
| `id` | TEXT PK | auto | — | "cust_xxx" format |
| `full_name` | TEXT(200) | yes | yes | Customer full name |
| `phone` | TEXT(30) | yes | — | Phone number |
| `email` | EMAIL | no | — | Email address |
| `company` | TEXT(200) | no | — | Company name |
| `source` | TEXT(100) | no | yes | Lead source |
| `status` | SELECT | yes | yes | Pipeline stage |
| `lifecycle` | SELECT | yes | yes | Contact lifecycle |
| `assigned_to` | FK→users | no | yes | Owner |
| `deal_value` | NUMBER | no | — | Deal amount |
| `product` | TEXT(200) | no | — | Product purchased |
| `lost_reason` | TEXT(500) | no | — | Lost deal reason |
| `last_contact_date` | DATE | no | — | Last contact |
| `next_followup` | DATE | no | yes | Next follow-up |

**Row-level security:** Admin sees all. Employee sees only `assigned_to = their user ID`.

### `notes`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | TEXT PK | auto | — |
| `customer_id` | FK→customers | yes | CASCADE DELETE |
| `author_id` | FK→users | yes | Note author |
| `text` | TEXT(2000) | yes | Content |
| `type` | SELECT | no | `note` or `question` |

### `tasks`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | TEXT PK | auto | — |
| `title` | TEXT(300) | yes | Task title |
| `description` | TEXT(2000) | no | Details |
| `customer_id` | FK→customers | no | Linked customer |
| `assigned_to` | FK→users | no | Assignee |
| `created_by` | FK→users | yes | Creator |
| `status` | SELECT | yes | `todo`/`in_progress`/`done`/`overdue` |
| `priority` | SELECT | yes | `low`/`medium`/`high`/`urgent` |
| `due_date` | DATE | no | Deadline |

### `activity_log`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | TEXT PK | auto | — |
| `type` | SELECT | yes | Status change, note, etc. |
| `user_id` | FK→users | yes | Actor |
| `customer_id` | FK→customers | no | Affected customer |
| `customer_name` | TEXT(200) | yes | Denormalized (survives deletion) |
| `description` | TEXT(500) | yes | Human-readable |

### `notifications`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | TEXT PK | auto | — |
| `recipient_id` | FK→users | yes | Who receives it |
| `type` | SELECT | yes | Notification category |
| `message` | TEXT(500) | yes | Content |
| `is_read` | BOOL | no | Read status |

**Row-level security:** User sees only `recipient_id = their user ID`.

### `audit_log`

| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT PK | auto |
| `user_id` | FK→users | Actor |
| `action` | SELECT | `created`/`updated`/`deleted`/... |
| `entity_type` | SELECT | `customer`/`task`/`note`/`user` |
| `entity_id` | TEXT | Affected record ID |
| `details` | TEXT(2000) | JSON diff |
| `ip_address` | TEXT(45) | Client IP |

**Access:** Only super_admin and admin.

### `settings`

| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT PK | auto |
| `user_id` | FK→users | Owner |
| `key` | TEXT(100) | Setting name |
| `value` | TEXT(2000) | JSON value |

**Row-level security:** User sees only `user_id = their user ID`. Unique constraint on `(user_id, key)`.

### `sources`

| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT PK | auto |
| `name` | TEXT | Source name |
| `order` | NUMBER | Display order |

---

## File Structure

```
project/
├── index.html              # Updated: loads PocketBase SDK + pb-client
├── app.js                  # Updated: hybrid data layer calls
├── style.css
├── data.js                 # Constants (SOURCES, STATUSES, LIFECYCLE_MAP)
├── js/
│   ├── pb-client.js        # PocketBase SDK wrapper (raw API calls)
│   └── data-layer.js       # Hybrid layer: PB ↔ localStorage
├── database/
│   ├── schema.json         # Schema documentation
│   ├── setup.ps1           # Setup script
│   └── README.md           # This file
└── pb/                     # PocketBase binary + data (gitignored)
    ├── pocketbase.exe
    └── pb_data/
        └── data.db         # SQLite database file
```

---

## Deployment

### Option A: Single VPS (recommended)

```bash
# 1. Upload project files
# 2. Install PocketBase
# 3. Run: ./pocketbase serve --http="0.0.0.0:8090"
# 4. Serve static files via nginx or PocketBase's built-in --publicDir
```

### Option B: Static host + PocketBase

```bash
# Static files on Netlify/Vercel/GitHub Pages
# PocketBase on Railway/Render/Fly.io
# Update PB_URL in pb-client.js to point to your PocketBase instance
```

---

## Lifecycle Mapping

Pipeline status → lifecycle (auto-set on status change):

| Status | Lifecycle |
|--------|-----------|
| New Lead | `lead` |
| Interested Customer | `prospect` |
| Hot Lead | `prospect` |
| Follow Up | `active_customer` |
| Won Deal | `active_customer` |
| Lost Deal | `inactive` |

`churned` lifecycle reserved for manual admin override (e.g., active customer who stops paying).

---

## Backup

```powershell
# Backup the SQLite database
Copy-Item pb\pb_data\data.db "backups\saleshub_$(Get-Date -Format 'yyyyMMdd_HHmm').db"
```

PocketBase also supports automatic backups via cron:
```bash
# Add to cron:
0 2 * * * cp /path/to/pb_data/data.db /backups/saleshub_$(date +\%Y\%m\%d).db
```
