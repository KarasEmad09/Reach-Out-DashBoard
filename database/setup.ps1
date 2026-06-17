# SalesHub CRM — PocketBase Setup & Seed Script
# Run: powershell -ExecutionPolicy Bypass -File database\setup.ps1
# PocketBase runs on http://localhost:8090

param(
  [int]$Port = 8090,
  [string]$PbVersion = "0.22.5",
  [switch]$SkipDownload = $false
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$PbDir = Join-Path $ProjectRoot "pb"
$PbDataDir = Join-Path $PbDir "pb_data"
$PbExe = Join-Path $PbDir "pocketbase.exe"
$BaseUrl = "http://localhost:$Port"

Write-Host "=== SalesHub PocketBase Setup v1.0 ===" -ForegroundColor Cyan
Write-Host "Project Root: $ProjectRoot" -ForegroundColor Gray

# ── Step 1: Download PocketBase ──
if (-not $SkipDownload -and -not (Test-Path $PbExe)) {
  Write-Host "`n[1/6] Downloading PocketBase v$PbVersion..." -ForegroundColor Yellow
  New-Item -ItemType Directory -Path $PbDir -Force | Out-Null

  $Os = if ($env:PROCESSOR_ARCHITECTURE -like "*ARM*") { "windows_arm64" } else { "windows_amd64" }
  $Url = "https://github.com/pocketbase/pocketbase/releases/download/v$PbVersion/pocketbase_${PbVersion}_${Os}.zip"
  $ZipPath = Join-Path $PbDir "pocketbase.zip"

  Write-Host "  Downloading: $Url"
  Invoke-WebRequest -Uri $Url -OutFile $ZipPath -ErrorAction Stop

  Write-Host "  Extracting..."
  Expand-Archive -Path $ZipPath -DestinationPath $PbDir -Force
  Remove-Item $ZipPath

  Write-Host "  PocketBase downloaded to: $PbExe" -ForegroundColor Green
} else {
  Write-Host "`n[1/6] PocketBase binary found. Skipping download." -ForegroundColor Gray
}

# ── Step 2: Stop any existing PocketBase on this port ──
Write-Host "`n[2/6] Checking for running instances..." -ForegroundColor Yellow
$existing = Get-Process -Name "pocketbase" -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "  Stopping existing PocketBase process..." -ForegroundColor Gray
  $existing | Stop-Process -Force
  Start-Sleep -Seconds 2
}

# ── Step 3: Start PocketBase ──
Write-Host "`n[3/6] Starting PocketBase on port $Port..." -ForegroundColor Yellow
$PbProcess = Start-Process -FilePath $PbExe `
  -ArgumentList "serve", "--http=localhost:$Port", "--dir=$PbDataDir" `
  -PassThru -WindowStyle Hidden

Write-Host "  Waiting for PocketBase to be ready..." -ForegroundColor Gray
$maxRetries = 30
for ($i = 0; $i -lt $maxRetries; $i++) {
  try {
    $null = Invoke-WebRequest -Uri "$BaseUrl/api/health" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "  PocketBase is running!" -ForegroundColor Green
    break
  } catch {
    Start-Sleep -Seconds 1
  }
}

if ($i -eq $maxRetries) {
  Write-Host "  ERROR: PocketBase failed to start." -ForegroundColor Red
  Stop-Process -Id $PbProcess.Id -Force
  exit 1
}

# ── Step 4: Create Super Admin ──
Write-Host "`n[4/6] Creating admin accounts..." -ForegroundColor Yellow
$AdminBody = @{
  email = "admin@saleshub.com"
  password = "Admin@123456"
  passwordConfirm = "Admin@123456"
} | ConvertTo-Json

try {
  Invoke-RestMethod -Uri "$BaseUrl/api/admins" -Method Post -Body $AdminBody -ContentType "application/json" | Out-Null
  Write-Host "  Super admin created: admin@saleshub.com" -ForegroundColor Green
} catch {
  if ($_.Exception.Message -like "*already exists*" -or $_.Exception.Response.StatusCode -eq 400) {
    Write-Host "  Super admin already exists. Skipping." -ForegroundColor Gray
  } else {
    Write-Host "  Admin creation failed: $_" -ForegroundColor Red
  }
}

# ── Step 5: Auth as admin ──
Write-Host "`n[5/6] Authenticating as admin..." -ForegroundColor Yellow
$AuthBody = @{
  identity = "admin@saleshub.com"
  password = "Admin@123456"
} | ConvertTo-Json

$AuthRes = Invoke-RestMethod -Uri "$BaseUrl/api/admins/auth-with-password" `
  -Method Post -Body $AuthBody -ContentType "application/json"
$AdminToken = $AuthRes.token
$AdminHeaders = @{ "Authorization" = "Bearer $AdminToken" }
Write-Host "  Authenticated." -ForegroundColor Green

# ── Step 6: Create Users (non-admin accounts) ──
Write-Host "`n[6/6] Creating users..." -ForegroundColor Yellow

$Users = @(
  @{ email = "manager@saleshub.com"; password = "Manager@123456"; passwordConfirm = "Manager@123456"; name = "Sales Manager"; role = "admin" },
  @{ email = "agent@saleshub.com";   password = "Agent@123456";   passwordConfirm = "Agent@123456";   name = "Sales Agent";   role = "employee" }
)

$UserIdMap = @{}

foreach ($user in $Users) {
  $body = $user | ConvertTo-Json
  try {
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/collections/users/records" `
      -Method Post -Body $body -ContentType "application/json" -Headers $AdminHeaders
    $UserIdMap[$user.email] = $res.id
    Write-Host "  Created: $($user.email) (role: $($user.role))" -ForegroundColor Green
  } catch {
    if ($_.Exception.Message -like "*duplicate*") {
      Write-Host "  User $($user.email) already exists. Looking up ID..." -ForegroundColor Gray
      $listRes = Invoke-RestMethod -Uri "$BaseUrl/api/collections/users/records?filter=(email='$($user.email)')" `
        -Headers $AdminHeaders
      if ($listRes.items.Count -gt 0) {
        $UserIdMap[$user.email] = $listRes.items[0].id
        Write-Host "  Found existing: $($user.email)" -ForegroundColor Gray
      }
    } else {
      Write-Host "  User creation failed for $($user.email): $_" -ForegroundColor Red
    }
  }
}

# ── Step 7: Create Collections ──
Write-Host "`n[7/6] Creating collections..." -ForegroundColor Yellow

function New-Collection($name, $fields, $rules, $indexes) {
  $body = @{
    name = $name
    type = "base"
    fields = $fields
  } | ConvertTo-Json -Depth 5

  try {
    $col = Invoke-RestMethod -Uri "$BaseUrl/api/collections" `
      -Method Post -Body $body -ContentType "application/json" -Headers $AdminHeaders
    Write-Host "  Collection created: $name (ID: $($col.id))" -ForegroundColor Green

    # Update rules
    $rulesBody = $rules | ConvertTo-Json
    try {
      Invoke-RestMethod -Uri "$BaseUrl/api/collections/$($col.id)" `
        -Method Patch -Body $rulesBody -ContentType "application/json" -Headers $AdminHeaders | Out-Null
    } catch {
      Write-Host "  Warning: Could not set rules for $name" -ForegroundColor DarkYellow
    }

    # Create indexes
    foreach ($idx in $indexes) {
      $idxBody = @{ sql = $idx } | ConvertTo-Json
      try {
        Invoke-RestMethod -Uri "$BaseUrl/api/collections/$($col.id)/indexes" `
          -Method Post -Body $idxBody -ContentType "application/json" -Headers $AdminHeaders | Out-Null
      } catch {
        Write-Host "  Warning: Could not create index: $idx" -ForegroundColor DarkYellow
      }
    }

    return $col
  } catch {
    if ($_.Exception.Message -like "*already exists*") {
      Write-Host "  Collection $name already exists. Skipping." -ForegroundColor Gray
      return $null
    }
    Write-Host "  ERROR creating collection $name : $_" -ForegroundColor Red
    return $null
  }
}

# Sources
New-Collection "sources" @(
  @{ name = "name"; type = "text"; required = $true }
  @{ name = "order"; type = "number"; required = $false; min = 0 }
) @{
  listRule = "@request.auth.id != ''"
  viewRule = "@request.auth.id != ''"
} @()

# Customers
$customersCol = New-Collection "customers" @(
  @{ name = "full_name"; type = "text"; required = $true; max = 200 }
  @{ name = "phone"; type = "text"; required = $true; max = 30 }
  @{ name = "email"; type = "email"; required = $false }
  @{ name = "company"; type = "text"; required = $false; max = 200 }
  @{ name = "source"; type = "text"; required = $false; max = 100 }
  @{ name = "status"; type = "select"; required = $true; values = @("New Lead", "Interested Customer", "Hot Lead", "Follow Up", "Won Deal", "Lost Deal") }
  @{ name = "lifecycle"; type = "select"; required = $true; values = @("lead", "prospect", "active_customer", "inactive", "churned") }
  @{ name = "assigned_to"; type = "relation"; required = $false; collectionId = ""; cascadeDelete = $false }
  @{ name = "deal_value"; type = "number"; required = $false; min = 0 }
  @{ name = "product"; type = "text"; required = $false; max = 200 }
  @{ name = "lost_reason"; type = "text"; required = $false; max = 500 }
  @{ name = "last_contact_date"; type = "date"; required = $false }
  @{ name = "next_followup"; type = "date"; required = $false }
) @{
  listRule = "@request.auth.role = 'super_admin' || @request.auth.role = 'admin' || (@request.auth.role = 'employee' && assigned_to = @request.auth.id)"
  viewRule = "@request.auth.role = 'super_admin' || @request.auth.role = 'admin' || (@request.auth.role = 'employee' && assigned_to = @request.auth.id)"
  createRule = "@request.auth.role = 'super_admin' || @request.auth.role = 'admin'"
  updateRule = "@request.auth.role = 'super_admin' || @request.auth.role = 'admin' || (@request.auth.role = 'employee' && assigned_to = @request.auth.id)"
  deleteRule = "@request.auth.role = 'super_admin' || @request.auth.role = 'admin'"
} @(
  "CREATE INDEX idx_cust_status ON customers(status)",
  "CREATE INDEX idx_cust_lifecycle ON customers(lifecycle)",
  "CREATE INDEX idx_cust_assigned ON customers(assigned_to)",
  "CREATE INDEX idx_cust_source ON customers(source)"
)

# Notes
New-Collection "notes" @(
  @{ name = "customer_id"; type = "relation"; required = $true; collectionId = ""; cascadeDelete = $true }
  @{ name = "author_id"; type = "relation"; required = $true; collectionId = ""; cascadeDelete = $false }
  @{ name = "text"; type = "text"; required = $true; max = 2000 }
  @{ name = "type"; type = "select"; required = $false; values = @("note", "question"); default = "note" }
) @{
  listRule = "@request.auth.id != ''"
  viewRule = "@request.auth.id != ''"
  createRule = "@request.auth.id != ''"
  updateRule = "@request.auth.id = author_id"
  deleteRule = "@request.auth.id = author_id || @request.auth.role = 'super_admin' || @request.auth.role = 'admin'"
} @(
  "CREATE INDEX idx_notes_customer ON notes(customer_id)",
  "CREATE INDEX idx_notes_author ON notes(author_id)",
  "CREATE INDEX idx_notes_created ON notes(created)"
)

# Tasks
New-Collection "tasks" @(
  @{ name = "title"; type = "text"; required = $true; max = 300 }
  @{ name = "description"; type = "text"; required = $false; max = 2000 }
  @{ name = "customer_id"; type = "relation"; required = $false; collectionId = ""; cascadeDelete = $false }
  @{ name = "assigned_to"; type = "relation"; required = $false; collectionId = ""; cascadeDelete = $false }
  @{ name = "created_by"; type = "relation"; required = $true; collectionId = ""; cascadeDelete = $false }
  @{ name = "status"; type = "select"; required = $true; values = @("todo", "in_progress", "done", "overdue"); default = "todo" }
  @{ name = "priority"; type = "select"; required = $true; values = @("low", "medium", "high", "urgent"); default = "medium" }
  @{ name = "due_date"; type = "date"; required = $false }
) @{
  listRule = "@request.auth.role = 'super_admin' || @request.auth.role = 'admin' || (@request.auth.role = 'employee' && assigned_to = @request.auth.id)"
  viewRule = "@request.auth.role = 'super_admin' || @request.auth.role = 'admin' || (@request.auth.role = 'employee' && assigned_to = @request.auth.id)"
  createRule = "@request.auth.role = 'super_admin' || @request.auth.role = 'admin'"
  updateRule = "@request.auth.role = 'super_admin' || @request.auth.role = 'admin' || (@request.auth.role = 'employee' && assigned_to = @request.auth.id)"
  deleteRule = "@request.auth.role = 'super_admin' || @request.auth.role = 'admin'"
} @(
  "CREATE INDEX idx_tasks_assigned ON tasks(assigned_to)",
  "CREATE INDEX idx_tasks_status ON tasks(status)",
  "CREATE INDEX idx_tasks_priority ON tasks(priority)",
  "CREATE INDEX idx_tasks_customer ON tasks(customer_id)"
)

# Activity Log
New-Collection "activity_log" @(
  @{ name = "type"; type = "select"; required = $true; values = @("status_change", "note_added", "follow_up", "new_customer", "customer_deleted", "task_update", "task_done", "task_reopened") }
  @{ name = "user_id"; type = "relation"; required = $true; collectionId = ""; cascadeDelete = $false }
  @{ name = "customer_id"; type = "relation"; required = $false; collectionId = ""; cascadeDelete = $false }
  @{ name = "customer_name"; type = "text"; required = $true; max = 200 }
  @{ name = "description"; type = "text"; required = $true; max = 500 }
) @{
  listRule = "@request.auth.id != ''"
  viewRule = "@request.auth.id != ''"
  createRule = "@request.auth.id != ''"
  updateRule = ""
  deleteRule = "@request.auth.role = 'super_admin'"
} @(
  "CREATE INDEX idx_activity_created ON activity_log(created)",
  "CREATE INDEX idx_activity_user ON activity_log(user_id)",
  "CREATE INDEX idx_activity_customer ON activity_log(customer_id)"
)

# Notifications
New-Collection "notifications" @(
  @{ name = "recipient_id"; type = "relation"; required = $true; collectionId = ""; cascadeDelete = $true }
  @{ name = "type"; type = "select"; required = $true; values = @("task_assigned", "status_change", "follow_up_due", "note_added", "customer_assigned") }
  @{ name = "message"; type = "text"; required = $true; max = 500 }
  @{ name = "reference_type"; type = "select"; required = $false; values = @("customer", "task", "note") }
  @{ name = "reference_id"; type = "text"; required = $false; max = 100 }
  @{ name = "is_read"; type = "bool"; required = $false; default = $false }
) @{
  listRule = "recipient_id = @request.auth.id"
  viewRule = "recipient_id = @request.auth.id"
  createRule = "@request.auth.role = 'super_admin' || @request.auth.role = 'admin'"
  updateRule = "recipient_id = @request.auth.id"
  deleteRule = "recipient_id = @request.auth.id"
} @(
  "CREATE INDEX idx_notifs_user ON notifications(recipient_id, is_read, created)"
)

# Audit Log
New-Collection "audit_log" @(
  @{ name = "user_id"; type = "relation"; required = $true; collectionId = ""; cascadeDelete = $false }
  @{ name = "action"; type = "select"; required = $true; values = @("created", "updated", "deleted", "status_changed", "assigned", "reassigned", "login", "logout", "note_added", "note_deleted") }
  @{ name = "entity_type"; type = "select"; required = $true; values = @("customer", "task", "note", "user", "settings") }
  @{ name = "entity_id"; type = "text"; required = $false; max = 100 }
  @{ name = "details"; type = "text"; required = $false; max = 2000 }
  @{ name = "ip_address"; type = "text"; required = $false; max = 45 }
) @{
  listRule = "@request.auth.role = 'super_admin' || @request.auth.role = 'admin'"
  viewRule = "@request.auth.role = 'super_admin' || @request.auth.role = 'admin'"
  createRule = "@request.auth.id != ''"
  updateRule = ""
  deleteRule = "@request.auth.role = 'super_admin'"
} @(
  "CREATE INDEX idx_audit_user ON audit_log(user_id)",
  "CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id)",
  "CREATE INDEX idx_audit_created ON audit_log(created)"
)

# Settings
New-Collection "settings" @(
  @{ name = "user_id"; type = "relation"; required = $true; collectionId = ""; cascadeDelete = $true }
  @{ name = "key"; type = "text"; required = $true; max = 100 }
  @{ name = "value"; type = "text"; required = $false; max = 2000 }
) @{
  listRule = "user_id = @request.auth.id"
  viewRule = "user_id = @request.auth.id"
  createRule = "@request.auth.id != ''"
  updateRule = "user_id = @request.auth.id"
  deleteRule = "user_id = @request.auth.id"
} @(
  "CREATE UNIQUE INDEX idx_settings_user_key ON settings(user_id, key)"
)

# ── Step 8: Seed Data ──
Write-Host "`n[8/6] Seeding sources..." -ForegroundColor Yellow

# Get admin user ID for seeding (find the super_admin)
$adminList = Invoke-RestMethod -Uri "$BaseUrl/api/collections/users/records?filter=(role='super_admin')" -Headers $AdminHeaders
$adminUserId = if ($adminList.items.Count -gt 0) { $adminList.items[0].id } else { $UserIdMap["admin@saleshub.com"] }

# Seed sources
$sourcesData = @(
  @{ name = "Facebook Ads";   order = 1 },
  @{ name = "Instagram Ads";  order = 2 },
  @{ name = "Website Form";   order = 3 },
  @{ name = "Referral";       order = 4 },
  @{ name = "WhatsApp";       order = 5 },
  @{ name = "LinkedIn";       order = 6 },
  @{ name = "Cold Outreach";  order = 7 },
  @{ name = "Manual Entry";   order = 8 }
)

$existingSources = Invoke-RestMethod -Uri "$BaseUrl/api/collections/sources/records" -Headers $AdminHeaders
if ($existingSources.totalItems -eq 0) {
  foreach ($src in $sourcesData) {
    $srcBody = $src | ConvertTo-Json
    try {
      Invoke-RestMethod -Uri "$BaseUrl/api/collections/sources/records" `
        -Method Post -Body $srcBody -ContentType "application/json" -Headers $AdminHeaders | Out-Null
      Write-Host "  Source: $($src.name)" -ForegroundColor Green
    } catch {
      Write-Host "  Source failed: $($src.name): $_" -ForegroundColor Red
    }
  }
} else {
  Write-Host "  Sources already seeded ($($existingSources.totalItems) records)." -ForegroundColor Gray
}

# ── Done ──
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  PocketBase Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  URL:       $BaseUrl" -ForegroundColor White
Write-Host "  Admin UI:  $BaseUrl/_/" -ForegroundColor White
Write-Host "  Admin:     admin@saleshub.com / Admin@123456" -ForegroundColor White
Write-Host "  Users:     2 created (use Admin UI to manage)" -ForegroundColor White
Write-Host "  Data dir:  $PbDataDir" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nPocketBase is still running. Press Ctrl+C to stop, or close this window." -ForegroundColor Yellow
Write-Host "To stop: Stop-Process -Name pocketbase`n" -ForegroundColor Gray

# Keep script alive so PocketBase stays running
try {
  Wait-Process -Id $PbProcess.Id
} catch {
  Write-Host "PocketBase stopped." -ForegroundColor Gray
}
