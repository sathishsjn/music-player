# dev_start.ps1 - local dev helper
# This helper starts the server but does NOT set secrets.
# Set these environment variables before running this script:
# SESSION_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD, FRONTEND_URL

if (-not $env:SESSION_SECRET) {
	Write-Host "SESSION_SECRET is not set. Export SESSION_SECRET before starting the server." -ForegroundColor Yellow
}

if (-not $env:ADMIN_USERNAME -or -not $env:ADMIN_PASSWORD) {
	Write-Host "ADMIN_USERNAME or ADMIN_PASSWORD not set. Set them before starting the server." -ForegroundColor Yellow
}

node server.js
