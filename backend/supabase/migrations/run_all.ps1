# ============================================================================
# Run All Migrations (PowerShell)
# ============================================================================
# Usage: .\run_all.ps1 -DatabaseUrl "<database_url>"
# Example: .\run_all.ps1 -DatabaseUrl "postgresql://postgres:password@localhost:5432/postgres"
# ============================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$DatabaseUrl
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Running Dez database migrations..." -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

$migrations = Get-ChildItem -Path $ScriptDir -Filter "[0-9]*.sql" | Sort-Object Name

foreach ($migration in $migrations) {
    Write-Host "Running: $($migration.Name)" -ForegroundColor Yellow
    
    # Run migration using psql
    & psql $DatabaseUrl -f $migration.FullName
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed: $($migration.Name)" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Completed: $($migration.Name)" -ForegroundColor Green
    Write-Host ""
}

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "All migrations completed successfully!" -ForegroundColor Green
