# SalesHub CRM — Update Plan

**Stack:** Single self-contained HTML file | Plain HTML + CSS + JS | CDN libraries only | No backend | Android-first  
**Storage:** IndexedDB (primary) + localStorage (settings/auth)  
**Status:** Planning

---

## EXECUTION RULES

- Never develop in one large step.
- Complete and verify each sub-phase before moving to the next.
- After every phase: stop, report what was done, and generate a verification checklist.
- Do not auto-continue. Wait for manual confirmation before proceeding.
- Prioritize: Reliability > Maintainability > UX > Speed.

---

## PHASE VERIFICATION CHECKLIST TEMPLATE

After every completed phase, the AI must generate a checklist using this format. Do not proceed to the next phase until all items are confirmed.

```
## PHASE X.X VERIFICATION CHECKLIST

[ ] Sub-phase task was completed as described
[ ] No console errors or JS exceptions
[ ] Feature works correctly on Android (mobile viewport)
[ ] All new data correctly reads/writes to IndexedDB
[ ] UI updates reflect the change without a page reload
[ ] Role-based visibility is respected (if applicable)
[ ] Error states handled (empty input, failed DB op, etc.)
[ ] PROGRESS.md updated with completed task and results
[ ] CHANGELOG.md updated with version entry
[ ] Ready to proceed to next sub-phase: YES / NO
```

---

## PHASE 1 — Project Foundation & Architecture Refactor
**Status:** In Progress (1.6 complete)  
**Goal:** Restructure the existing single HTML file into clearly separated internal modules using JS module pattern (IIFE or object namespacing). Establish documentation files.

| Sub-Phase | Task | Status |
|-----------|------|--------|
| 1.1 | Audit existing HTML file — document all current features, sections, and JS functions | Not Started |
| 1.2 | Define internal module structure (AppDB, AppAuth, AppUI, AppCRM, AppTasks, AppNotifications, AppAudit, AppAnalytics) | Not Started |
| 1.3 | Establish IndexedDB schema design (replaces PostgreSQL) | Not Started |
| 1.4 | Define shared constants and config object (roles, statuses, pipeline stages) | Not Started |
| 1.5 | Define error handling strategy (toast notifications for all errors) | Not Started |
| 1.6 | Create PLAN.md, PROGRESS.md, CHANGELOG.md | ✅ Done |

**Dependencies:** None  
**Libraries needed:** None (built-in IndexedDB API)

---

## PHASE 2 — Data Layer (IndexedDB Schema)
**Status:** Not Started  
**Goal:** Replace any ad-hoc localStorage data with a proper IndexedDB schema. Structured like a relational DB but client-side.

| Sub-Phase | Task | Status |
|-----------|------|--------|
| 2.1 | Define and initialize IndexedDB database (`saleshub_db`) | Not Started |
| 2.2 | Object store: `users` (id, name, email, role, passwordHash, createdAt) | Not Started |
| 2.3 | Object store: `roles` (super_admin, admin, employee) | Not Started |
| 2.4 | Object store: `customers` (id, name, email, phone, company, status, assignedTo, source, createdAt, updatedAt) | Not Started |
| 2.5 | Object store: `customer_notes` (id, customerId, userId, content, createdAt) | Not Started |
| 2.6 | Object store: `tasks` (id, title, description, assignedTo, customerId, dueDate, status, priority, createdAt) | Not Started |
| 2.7 | Object store: `notifications` (id, userId, type, message, isRead, createdAt, referenceId) | Not Started |
| 2.8 | Object store: `audit_logs` (id, userId, action, entityType, entityId, details, timestamp) | Not Started |
| 2.9 | Object store: `analytics_events` (id, userId, eventType, page, target, timestamp, metadata) | Not Started |
| 2.10 | Seed data: default super admin user + sample customers + sample tasks | Not Started |

**Dependencies:** Phase 1  
**Libraries needed:** None (native IndexedDB)

---

## PHASE 3 — Authentication & Role-Based Access Control
**Status:** Not Started  
**Goal:** Local auth system with role enforcement. No server — passwords hashed client-side using SubtleCrypto (SHA-256).

| Sub-Phase | Task | Status |
|-----------|------|--------|
| 3.1 | Login page/modal UI (email + password fields) | Not Started |
| 3.2 | Password hashing with SubtleCrypto SHA-256 (replaces bcrypt) | Not Started |
| 3.3 | Session handling via sessionStorage (active user object) | Not Started |
| 3.4 | Route/view protection — redirect to login if no active session | Not Started |
| 3.5 | Role definitions: super_admin / admin / employee | Not Started |
| 3.6 | Super Admin permissions: all access + user management + delete + analytics | Not Started |
| 3.7 | Admin permissions: manage customers, tasks, view reports | Not Started |
| 3.8 | Employee permissions: view/edit assigned customers and tasks only | Not Started |
| 3.9 | UI elements conditionally shown/hidden based on role | Not Started |
| 3.10 | Auth testing: login, wrong password, session persistence, logout | Not Started |

**Dependencies:** Phase 2  
**Libraries needed:** SubtleCrypto (built-in browser API)

---

## PHASE 4 — CRM Core Features
**Status:** Not Started  
**Goal:** Full customer lifecycle management within the single-file app.

| Sub-Phase | Task | Status |
|-----------|------|--------|
| 4.1 | Customer creation form (name, email, phone, company, source, status, assigned user) | Not Started |
| 4.2 | Customer edit modal | Not Started |
| 4.3 | Customer assignment to users (dropdown filtered by role) | Not Started |
| 4.4 | Customer search (real-time filter by name/email/company) | Not Started |
| 4.5 | Customer filtering (by status, assigned user, source, date range) | Not Started |
| 4.6 | Customer pipeline view (Kanban-style drag-and-drop columns by status) | Not Started |
| 4.7 | Customer status changes (with confirmation + audit log trigger) | Not Started |
| 4.8 | Customer history tab (all notes, status changes, task references) | Not Started |
| 4.9 | Customer timeline view (chronological activity feed per customer) | Not Started |
| 4.10 | CRM testing: CRUD, search, filter, pipeline drag, history | Not Started |

**Dependencies:** Phase 3  
**Libraries needed:** SortableJS (drag-and-drop for pipeline)

---

## PHASE 5 — Task Management Module
**Status:** Not Started  
**Goal:** Fully separate sidebar section for task management, linked to customers and users.

| Sub-Phase | Task | Status |
|-----------|------|--------|
| 5.1 | Tasks sidebar navigation item | Not Started |
| 5.2 | Tasks list page (all tasks, filterable) | Not Started |
| 5.3 | Task detail view/modal | Not Started |
| 5.4 | Task creation (title, description, assigned user, linked customer, due date, priority) | Not Started |
| 5.5 | Task assignment and reassignment | Not Started |
| 5.6 | Task status tracking (To Do / In Progress / Done / Overdue) | Not Started |
| 5.7 | Task due date with overdue visual indicator | Not Started |
| 5.8 | Task notifications (trigger to Notifications module on assignment/update) | Not Started |
| 5.9 | Task history (log of status changes per task) | Not Started |
| 5.10 | Task search and filters (by status, assignee, priority, due date) | Not Started |

**Dependencies:** Phase 4  
**Libraries needed:** None (native JS date handling)

---

## PHASE 6 — Notifications System
**Status:** Not Started  
**Goal:** In-app notification center with unread counter in the header.

| Sub-Phase | Task | Status |
|-----------|------|--------|
| 6.1 | Notification bell icon in header with unread count badge | Not Started |
| 6.2 | Notification dropdown/panel (list of recent notifications) | Not Started |
| 6.3 | Mark as read (single + mark all as read) | Not Started |
| 6.4 | Assignment notifications (customer or task assigned to you) | Not Started |
| 6.5 | Task notifications (due soon, overdue, status changed) | Not Started |
| 6.6 | Follow-up / reminder notifications (manual or auto-generated) | Not Started |
| 6.7 | Notification persistence in IndexedDB (`notifications` store) | Not Started |

**Dependencies:** Phase 5  
**Libraries needed:** None

---

## PHASE 7 — Audit Logging System
**Status:** Not Started  
**Goal:** Every important action is logged silently to IndexedDB and viewable by admin/super_admin.

| Sub-Phase | Task | Status |
|-----------|------|--------|
| 7.1 | Audit log write function (auto-called on every tracked action) | Not Started |
| 7.2 | Tracked events: customer created/updated/deleted/assigned | Not Started |
| 7.3 | Tracked events: task created/updated/assigned/completed | Not Started |
| 7.4 | Tracked events: user login/logout | Not Started |
| 7.5 | Tracked events: role changed, user created/deleted | Not Started |
| 7.6 | Audit log viewer page (admin only) — filterable by user, action, date | Not Started |

**Dependencies:** Phase 6  
**Libraries needed:** None

---

## PHASE 8 — UX Analytics & Behavior Tracking
**Status:** Not Started  
**Goal:** Track user behavior inside the app for UX improvement. All data stays local in IndexedDB.

| Sub-Phase | Task | Status |
|-----------|------|--------|
| 8.1 | Page visit tracking (which views are opened and how often) | Not Started |
| 8.2 | Click event tracking (button-level, tagged with data attributes) | Not Started |
| 8.3 | Dead click detection (clicks that produce no visible result) | Not Started |
| 8.4 | Rage click detection (3+ rapid clicks on same element) | Not Started |
| 8.5 | Scroll depth tracking per page | Not Started |
| 8.6 | Navigation flow tracking (page-to-page sequence) | Not Started |
| 8.7 | Most/least used features report | Not Started |
| 8.8 | Time-on-page tracking | Not Started |
| 8.9 | Search and filter usage patterns | Not Started |
| 8.10 | UX analytics dashboard (super_admin only) | Not Started |

**UX Evaluation Rule (apply to every screen):**
- Every button: does it do what the user expects?
- Every icon: is the meaning obvious without a label?
- Every card: understandable in under 3 seconds?
- Every workflow: completable with minimum clicks?

**Dependencies:** Phase 7  
**Libraries needed:** None (custom lightweight tracker)

---

## PHASE 9 — Reporting & Analytics Dashboard
**Status:** Not Started  
**Goal:** Visual reports for admins and super admins.

| Sub-Phase | Task | Status |
|-----------|------|--------|
| 9.1 | Customer reports (by status, source, assigned user, date range) | Not Started |
| 9.2 | Employee activity reports (customers handled, tasks completed, logins) | Not Started |
| 9.3 | Task reports (completion rate, overdue rate, by assignee) | Not Started |
| 9.4 | Conversion reports (pipeline stage progression rates) | Not Started |
| 9.5 | Lead source reports (which source produces most customers) | Not Started |
| 9.6 | Sales funnel chart (visual pipeline drop-off) | Not Started |
| 9.7 | UX behavior reports (from Phase 8 data) | Not Started |

**Dependencies:** Phase 8  
**Libraries needed:** Chart.js (CDN)

---

## PHASE 10 — Polish & Optimization
**Status:** Not Started  
**Goal:** Final pass on performance, accessibility, consistency, and Android UX.

| Sub-Phase | Task | Status |
|-----------|------|--------|
| 10.1 | JS performance — debounce search, lazy-load heavy views | Not Started |
| 10.2 | Accessibility review (ARIA labels, focus management, contrast) | Not Started |
| 10.3 | Android/mobile responsiveness pass (touch targets, scroll behavior) | Not Started |
| 10.4 | UI consistency audit (spacing, colors, font sizes, button styles) | Not Started |
| 10.5 | Error handling review (every async op has a catch + user feedback) | Not Started |
| 10.6 | Security review (XSS prevention, input sanitization) | Not Started |
| 10.7 | Final end-to-end testing across all roles | Not Started |
| 10.8 | File size optimization (minify inline CSS/JS if needed) | Not Started |

**Dependencies:** Phase 9  
**Libraries needed:** None

---

## FUTURE FEATURES (Post-Phase 10)

- Export data to CSV (customers, tasks, reports)
- Import customers from CSV
- Dark mode toggle
- Offline-first PWA wrapper
- Email integration (mailto links + templates)
- WhatsApp click-to-chat integration
- Recurring task scheduling
- Multi-file split (if single file becomes too large)

---

## TECH STACK SUMMARY

| Concern | Solution |
|---------|----------|
| Data storage | IndexedDB via native API |
| Auth | SubtleCrypto SHA-256 + sessionStorage |
| Drag & drop | SortableJS (CDN) |
| Charts | Chart.js (CDN) |
| Icons | Lucide (CDN) |
| Toasts | Custom toast.js (inline) |
| Framework | None — plain JS module pattern |
| Deployment | Single HTML file, open in browser |
