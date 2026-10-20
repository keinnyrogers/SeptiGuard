$ErrorActionPreference = "Stop"

$backendDirectory = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $backendDirectory ".env"
if (-not (Test-Path $envFile)) {
    throw "Backend environment file not found: $envFile"
}

$keyLine = Get-Content $envFile | Where-Object { $_ -match '^PREDICTION_SERVICE_API_KEY=' } | Select-Object -First 1
if (-not $keyLine) {
    throw "PREDICTION_SERVICE_API_KEY is not configured in backend/.env."
}

$apiKey = $keyLine.Substring("PREDICTION_SERVICE_API_KEY=".Length)
if ([string]::IsNullOrWhiteSpace($apiKey)) {
    throw "PREDICTION_SERVICE_API_KEY is empty in backend/.env."
}

$env:PREDICTION_SERVICE_API_KEY = $apiKey
Set-Location $PSScriptRoot
python -m uvicorn app:app --host 127.0.0.1 --port 8001
