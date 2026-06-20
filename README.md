# SalesHub CRM

A full-stack CRM dashboard built with vanilla HTML/CSS/JS frontend and a Node.js + Express + SQLite backend. Features role-based access control, customer pipeline management, task tracking, notes, notifications, and activity logging.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript (Chart.js CDN) |
| Backend | Node.js + Express 5 |
| Database | SQLite (via better-sqlite3) |
| Auth | bcrypt + express-session |
| Styling | CSS custom properties, dark/light themes |

## Quick Start

You only need **Node.js** installed on your machine. Three commands and you're running:

```bash
git clone https://github.com/KarasEmad09/Reach-Out-DashBoard.git
cd "Reach-Out DashBoard"
npm install
npm start
```

Then open **http://localhost:3000** in your browser. The first run creates the SQLite database and seeds it with 20 sample customers, tasks, and notes automatically.

### Prerequisites
- **Node.js** v18 or later ([download](https://nodejs.org))
- A modern browser (Chrome, Firefox, Edge, Safari)

## Environment

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `SESSION_SECRET` | (built-in) | Session encryption key |

Example:
```bash
# Windows PowerShell
$env:PORT=8080; npm start

# Mac / Linux
PORT=8080 npm start
```

## Troubleshooting

**"Port 3000 already in use"**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac / Linux
lsof -i :3000
kill -9 <PID>
```

**Reset the database** (delete all data, re-seed on next start):
```bash
# Windows PowerShell
Remove-Item saleshub.db -Force; npm start
```

**Login not working?** Make sure cookies are enabled. The app uses session cookies for authentication.

## Seed Accounts

| Role | Email | Password |
|---|---|---|
| Super Admin | `superadmin@saleshub.local` | `SuperAdmin@123` |
| Admin | `admin@saleshub.local` | `Admin@123` |
| Agent | `agent@saleshub.local` | `Agent@123` |
| Agent 2 | `agent2@saleshub.local` | `Agent@123` |

## Role Permissions

| Action | Super Admin | Admin | Agent |
|---|---|---|---|
| View all customers | ✅ | ✅ | ❌ (own only) |
| Create/edit/delete customers | ✅ | ✅ | ❌ |
| View all tasks | ✅ | ✅ | ❌ (own only) |
| Create/edit/delete tasks | ✅ | ✅ | ❌ |
| View all notes | ✅ | ✅ | ❌ (own only) |
| Add notes | ✅ | ✅ | ❌ |
| View employees | ✅ | ✅ (agents only) | ❌ |
| Customer assignment | ✅ | ✅ | ❌ |
| Activity log | ✅ | ✅ | ❌ |

## Features

- **Customer pipeline** — 6 stages: New Lead → Interested → Hot Lead → Follow Up → Won Deal → Lost Deal
- **Deal tracking** — deal value, product purchased, lost reason tied to status changes
- **Task management** — assign tasks to agents, inline status/priority editing, overdue highlighting
- **Notes & Questions** — per-customer notes with type badges (📝 Note, ❓ Question)
- **Notifications** — real-time bell dropdown, mark read, dismiss
- **Dashboard** — stat cards, source doughnut chart, recent activity, upcoming follow-ups
- **Reports** — pipeline overview, lead sources, sales funnel
- **Employees page** — view agents and admins (admin sees team, super admin sees all)
- **Dark/light theme** — pill toggle with animated sun/moon transition
- **Responsive** — breakpoints at 1024px, 768px, 480px
- **Keyboard accessible** — focus-visible rings, aria-live regions

## Project Structure

```
├── index.html          # HTML shell
├── app.js              # Frontend logic (~1930 lines)
├── style.css           # All styles (~1700 lines)
├── data.js             # Constants (sources, statuses, lifecycle maps)
├── api-client.js       # Frontend API wrapper
├── package.json
├── server/
│   ├── server.js       # Express app entry point
│   ├── db.js           # SQLite setup + schema migration
│   ├── seed.js         # Seed data (20 customers, 3 users)
│   └── api/
│       ├── auth.js         # Login/logout/session
│       ├── customers.js    # Customer CRUD
│       ├── deals.js        # Deal CRUD
│       ├── tasks.js        # Task CRUD
│       ├── notes.js        # Note CRUD
│       ├── notifications.js# Notification CRUD
│       ├── settings.js     # Key/value settings
│       ├── activity.js     # Audit trail
│       ├── users.js        # Employee listing
│       └── middleware.js   # Auth, RBAC, scoping, logging
```

## API Endpoints

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Login (returns user + session cookie) |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |

### Customers
| Method | Path | Description |
|---|---|---|
| GET | `/api/customers` | List (scoped by role) |
| GET | `/api/customers/:id` | Detail with notes/deals/tasks |
| POST | `/api/customers` | Create (admin+) |
| PUT | `/api/customers/:id` | Update (admin+) |
| DELETE | `/api/customers/:id` | Delete (admin+) |

### Deals
| Method | Path | Description |
|---|---|---|
| GET | `/api/deals` | List (scoped) |
| POST | `/api/deals` | Create (admin+) |
| PUT | `/api/deals/:id` | Update (admin+) |
| DELETE | `/api/deals/:id` | Delete (admin+) |

### Tasks
| Method | Path | Description |
|---|---|---|
| GET | `/api/tasks` | List (scoped) |
| GET | `/api/tasks/:id` | Detail |
| POST | `/api/tasks` | Create (admin+) |
| PUT | `/api/tasks/:id` | Update (admin+) |
| DELETE | `/api/tasks/:id` | Delete (admin+) |

### Notes
| Method | Path | Description |
|---|---|---|
| GET | `/api/notes` | List (scoped) |
| POST | `/api/notes` | Create (admin+) |
| DELETE | `/api/notes/:id` | Delete (admin+) |

### Notifications
| Method | Path | Description |
|---|---|---|
| GET | `/api/notifications` | List (own) |
| PUT | `/api/notifications/:id/read` | Mark read |
| PUT | `/api/notifications/read-all` | Mark all read |
| DELETE | `/api/notifications/:id` | Dismiss |

### Users (Employees)
| Method | Path | Description |
|---|---|---|
| GET | `/api/users` | List (admin+: own agents, super: all) |

### Settings
| Method | Path | Description |
|---|---|---|
| GET | `/api/settings` | Get settings |
| PUT | `/api/settings/:key` | Set value |

### Activity
| Method | Path | Description |
|---|---|---|
| GET | `/api/activity` | Audit trail (admin+) |

## Database

SQLite with WAL mode. Tables: `users`, `customers`, `deals`, `tasks`, `notes`, `notifications`, `settings`, `activity_log`. All write operations log to `activity_log` for full audit trail.

## License

ISC
