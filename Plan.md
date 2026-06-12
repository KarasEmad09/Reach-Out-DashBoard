# Plan.md — SalesHub CRM Dashboard
> Human-readable checklist. Check items off as they're completed.

## Phase 1 — Foundation
- [ ] index.html shell created
- [ ] style.css with all color tokens + layout
- [ ] data.js with 20 sample customers + 15 activity entries
- [ ] app.js with router skeleton + localStorage helpers
- [ ] Page opens in browser, sidebar visible, no errors

## Phase 2 — Sidebar & Navigation
- [ ] Full sidebar rendered (logo + all nav items + icons)
- [ ] Customers / Deals sub-menus collapse/expand
- [ ] Hash router working — all routes registered
- [ ] Topbar: search bar + bell + avatar
- [ ] Sidebar collapse (◄ / ►) button works

## Phase 3 — Dashboard
- [ ] 8 stat cards showing live counts
- [ ] Recent Activity list (last 10)
- [ ] Donut chart: Customers by Source (Chart.js)
- [ ] Upcoming Follow Ups table
- [ ] All "View All" links work
- [ ] Phone / message / 3-dot buttons in Follow Ups table work

## Phase 4 — All Customers Page
- [ ] Full table with all customers
- [ ] Live search by name / phone / email
- [ ] Column header sorting (asc/desc)
- [ ] Row click → customer detail
- [ ] Edit + Delete per row
- [ ] Add Customer button + modal
- [ ] Empty state shown when no results

## Phase 5 — Status Filter Pages
- [ ] Shared reusable table function built
- [ ] New Leads page (/customers-new-leads)
- [ ] Interested Customers page
- [ ] Hot Leads page
- [ ] Follow Ups page
- [ ] Won Deals page (+ Deal Value, Product columns)
- [ ] Lost Deals page (+ Lost Reason column)

## Phase 6 — Add / Edit Customer Modal
- [ ] Shared modal function (add + edit modes)
- [ ] All fields + validation
- [ ] Saves to localStorage, logs activity
- [ ] Escape / click-outside closes modal

## Phase 7 — Customer Detail Page
- [ ] Two-column layout (info + notes)
- [ ] Status change dropdown with activity log
- [ ] Notes: add + display + delete
- [ ] Back button works

## Phase 8 — Notes & Questions + Settings
- [ ] Notes feed: aggregated from all customers, searchable
- [ ] Settings: light/dark mode toggle persists
- [ ] Dark mode applied everywhere
- [ ] Notification bell dropdown (last 5 activities)

## Phase 9 — Polish & QA
- [ ] Global topbar search works
- [ ] All buttons in entire app are functional
- [ ] Smooth transitions/animations
- [ ] No console errors
- [ ] Data persists after page refresh
- [ ] Visual QA vs reference image — all pages look correct
