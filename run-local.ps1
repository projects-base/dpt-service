# Starts the service locally, loading secrets from a .env file that is never committed.
#
#   1. Copy .env.example to .env and fill in your Neon credentials.
#   2. .\run-local.ps1                 → starts on port 8080
#      .\run-local.ps1 -Port 8081      → starts elsewhere, if 8080 is taken
#
# Without a .env the service falls back to the local docker-compose Postgres
# (see application.yml), so `docker-compose up -d` then this script also works.

param(
    [int]$Port = 8080
)

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

$envFile = Join-Path $PSScriptRoot '.env'
if (Test-Path $envFile) {
    Write-Host "Loading environment from .env" -ForegroundColor DarkGray
    foreach ($line in Get-Content $envFile) {
        $trimmed = $line.Trim()
        if ($trimmed -eq '' -or $trimmed.StartsWith('#')) { continue }

        $split = $trimmed.IndexOf('=')
        if ($split -lt 1) { continue }

        $name  = $trimmed.Substring(0, $split).Trim()
        $value = $trimmed.Substring($split + 1).Trim()

        # Strip surrounding quotes if present.
        if ($value.Length -ge 2 -and
            (($value.StartsWith('"') -and $value.EndsWith('"')) -or
             ($value.StartsWith("'") -and $value.EndsWith("'")))) {
            $value = $value.Substring(1, $value.Length - 2)
        }

        Set-Item -Path "env:$name" -Value $value
        # Never echo the value: this file holds the database password.
        Write-Host "  set $name" -ForegroundColor DarkGray
    }
} else {
    Write-Host "No .env found - falling back to the local docker-compose Postgres." -ForegroundColor Yellow
    Write-Host "  Run 'docker-compose up -d' first, or copy .env.example to .env." -ForegroundColor Yellow
}

# Warn early if the port is already taken - otherwise Spring fails with a
# less obvious "Web server failed to start" further down.
$inUse = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($inUse) {
    $owner = (Get-Process -Id $inUse[0].OwningProcess -ErrorAction SilentlyContinue).ProcessName
    Write-Host ""
    Write-Host "Port $Port is already in use by '$owner' (PID $($inUse[0].OwningProcess))." -ForegroundColor Red
    Write-Host "Either stop it, or start on another port:" -ForegroundColor Red
    Write-Host "    .\run-local.ps1 -Port 8081" -ForegroundColor Red
    Write-Host "Then open the dashboard with the matching override:" -ForegroundColor Red
    Write-Host "    http://localhost:3000/?api=http://localhost:8081" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "Starting Daily Problem Dynamic Tracker service on port $Port ..." -ForegroundColor Cyan
& "$PSScriptRoot\mvnw.cmd" spring-boot:run "-Dspring-boot.run.arguments=--server.port=$Port"
