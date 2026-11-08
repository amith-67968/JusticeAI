<#
.SYNOPSIS
    JusticeAI Backend — Environment Setup Script

.DESCRIPTION
    Creates a Python virtual environment, upgrades pip, and installs
    all dependencies from requirements.txt.

.PARAMETER PythonVersion
    Python version to use (default: 3.12)
#>

param(
    [string]$PythonVersion = "3.12"
)

$ErrorActionPreference = "Stop"

# ── Project root ─────────────────────────────────────────────────────────
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$venvPath    = Join-Path $projectRoot ".venv"
$reqFile     = Join-Path $projectRoot "requirements.txt"

Write-Host "`n=== JusticeAI Backend Setup ===" -ForegroundColor Cyan
Write-Host "Project root : $projectRoot"
Write-Host "Python target: $PythonVersion"
Write-Host "Venv path    : $venvPath`n"

# ── Warn if a different venv is active ───────────────────────────────────
if ($env:VIRTUAL_ENV -and $env:VIRTUAL_ENV -ne $venvPath) {
    Write-Host "[WARNING] Active virtualenv ($env:VIRTUAL_ENV) differs from expected ($venvPath)." -ForegroundColor Yellow
    Write-Host "          Deactivate it first if you want to use the project venv.`n"
}

# ── Create venv if it doesn't exist ─────────────────────────────────────
if (-not (Test-Path $venvPath)) {
    Write-Host "Creating virtual environment..." -ForegroundColor Green
    & py "-$PythonVersion" -m venv $venvPath
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to create venv. Is Python $PythonVersion installed?" -ForegroundColor Red
        exit 1
    }
    Write-Host "Virtual environment created.`n"
} else {
    Write-Host "Virtual environment already exists.`n" -ForegroundColor Gray
}

# ── Activate venv ────────────────────────────────────────────────────────
$activateScript = Join-Path $venvPath "Scripts\Activate.ps1"
if (Test-Path $activateScript) {
    & $activateScript
}

# ── Upgrade pip ──────────────────────────────────────────────────────────
Write-Host "Upgrading pip..." -ForegroundColor Green
& (Join-Path $venvPath "Scripts\python.exe") -m pip install --upgrade pip --quiet
Write-Host "pip upgraded.`n"

# ── Install requirements ────────────────────────────────────────────────
if (Test-Path $reqFile) {
    Write-Host "Installing requirements..." -ForegroundColor Green
    & (Join-Path $venvPath "Scripts\pip.exe") install -r $reqFile
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`nSome packages failed to install. Check output above." -ForegroundColor Red
        exit 1
    }
    Write-Host "`nAll requirements installed." -ForegroundColor Green
} else {
    Write-Host "requirements.txt not found at $reqFile" -ForegroundColor Red
    exit 1
}

# ── Done ─────────────────────────────────────────────────────────────────
Write-Host "`n=== Setup Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "To activate the virtual environment:"
Write-Host "  .\.venv\Scripts\Activate.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "To run the backend:"
Write-Host "  python main.py" -ForegroundColor Yellow
Write-Host ""
Write-Host "Or with uvicorn directly:"
Write-Host "  uvicorn main:app --reload --host 0.0.0.0 --port 8000" -ForegroundColor Yellow
Write-Host ""
