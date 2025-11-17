# PowerShell deployment script for Windows
param(
    [Parameter(Mandatory=$true)]
    [string]$ServiceName,
    
    [Parameter(Mandatory=$false)]
    [string]$Environment = "dev"
)

# Colors for output
function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Validate inputs
if ([string]::IsNullOrWhiteSpace($ServiceName)) {
    Write-ErrorMsg "Usage: .\scripts\deploy-new-service.ps1 -ServiceName <service-name> [-Environment <env>]"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\scripts\deploy-new-service.ps1 -ServiceName user-service -Environment dev"
    Write-Host "  .\scripts\deploy-new-service.ps1 -ServiceName api-gateway -Environment prod"
    exit 1
}

Write-Info "🚀 Starting deployment of $ServiceName to $Environment"
Write-Host ""

# Check if GitHub CLI is installed
if (!(Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-ErrorMsg "GitHub CLI (gh) is not installed"
    Write-Host "Install from: https://cli.github.com/"
    exit 1
}

# Check GitHub authentication
try {
    gh auth status 2>&1 | Out-Null
} catch {
    Write-ErrorMsg "Not authenticated with GitHub CLI"
    Write-Host "Run: gh auth login"
    exit 1
}

# Check if service exists
$servicePath = "apps\$ServiceName"
if (!(Test-Path $servicePath)) {
    Write-ErrorMsg "Service '$ServiceName' not found at $servicePath"
    exit 1
}

Write-Success "Service found at $servicePath"

# Check if workflow exists
$workflowFile = ".github\workflows\deploy-$ServiceName.yml"
if (!(Test-Path $workflowFile)) {
    Write-Warning "Workflow file not found: $workflowFile"
    Write-ErrorMsg "Please create the workflow file first or contact DevOps team"
    exit 1
}

Write-Success "Workflow file found: $workflowFile"

# Show service configuration
Write-Info "Service Configuration:"
$hasDatabase = $ServiceName -match "user-service|trip-service|driver-service"
if ($hasDatabase) {
    Write-Host "  - Has database: Yes"
    Write-Host "  - Needs migrations: Yes"
} else {
    Write-Host "  - Has database: No"
    Write-Host "  - Needs migrations: No"
}

# Get budget info
$budgetLine = Select-String -Path "infra\local.tf" -Pattern "`"$ServiceName`"" -Context 0,5
$budget = if ($budgetLine) {
    ($budgetLine.Context.PostContext | Select-String "budget" | ForEach-Object { $_ -replace '.*budget\s*=\s*(\d+).*','$1' }) -join ""
} else {
    "N/A"
}
Write-Host "  - Monthly budget: `$$budget"
Write-Host ""

# Estimate costs (if Infracost is available)
if (Get-Command infracost -ErrorAction SilentlyContinue) {
    Write-Info "💰 Estimating infrastructure costs..."
    Push-Location infra
    infracost breakdown --path=. --terraform-var="env=$Environment" --format=table 2>$null
    Pop-Location
    Write-Host ""
} else {
    Write-Warning "Infracost not installed - skipping cost estimation"
    Write-Info "Install from: https://www.infracost.io/docs/#quick-start"
    Write-Host ""
}

# Ask for confirmation
Write-Warning "This will trigger a deployment workflow on GitHub Actions"
Write-Host ""
$confirm = Read-Host "Continue with deployment? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Info "Deployment cancelled"
    exit 0
}

# Ask about Terraform apply
Write-Host ""
$applyTf = Read-Host "Apply Terraform changes? (y/n)"
$applyTfBool = if ($applyTf -eq "y" -or $applyTf -eq "Y") { "true" } else { "false" }

# Ask about migrations (only for services with DB)
$runMigrations = "false"
if ($hasDatabase) {
    Write-Host ""
    $migrate = Read-Host "Run database migrations? (y/n)"
    $runMigrations = if ($migrate -eq "y" -or $migrate -eq "Y") { "true" } else { "false" }
}

# Trigger GitHub Actions workflow
Write-Info "🎯 Triggering deployment workflow..."
Write-Host ""

$result = gh workflow run "deploy-$ServiceName.yml" `
    -f environment="$Environment" `
    -f apply-terraform="$applyTfBool" `
    -f run-migrations="$runMigrations"

if ($LASTEXITCODE -eq 0) {
    Write-Success "Deployment workflow triggered successfully!"
    Write-Host ""
    Write-Info "View deployment progress:"
    Write-Host "  gh run watch"
    Write-Host ""
    Write-Info "Or visit:"
    $repo = (git config --get remote.origin.url) -replace '.*:',''; $repo = $repo -replace '.git$',''
    Write-Host "  https://github.com/$repo/actions"
    Write-Host ""
    Write-Info "Monitor costs after deployment:"
    Write-Host "  - CloudWatch Dashboard: UIT-GO-FinOps-Dashboard"
    Write-Host "  - AWS Cost Explorer: Filter by Service=$ServiceName"
    Write-Host "  - AWS Budgets: Check $ServiceName budget alerts"
} else {
    Write-ErrorMsg "Failed to trigger workflow"
    exit 1
}
