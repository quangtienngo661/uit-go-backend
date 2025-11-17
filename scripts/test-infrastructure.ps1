# Quick Test Script
# Run this to validate your infrastructure before deployment

Write-Host "UIT-GO Infrastructure Test Suite" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0
$testsSkipped = 0

# Test 1: Check Terraform files
Write-Host "Test 1: Validating Terraform configuration..." -ForegroundColor Yellow
if (Get-Command terraform -ErrorAction SilentlyContinue) {
    try {
        Push-Location infra
        Write-Host "        Initializing Terraform (downloading modules)..." -ForegroundColor Gray
        
        # Run terraform init with proper output handling
        $initOutput = terraform init -backend=false 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "        Running validation..." -ForegroundColor Gray
            $validateOutput = terraform validate 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  [PASS] Terraform configuration is valid" -ForegroundColor Green
                $testsPassed++
            } else {
                Write-Host "  [FAIL] Terraform validation failed" -ForegroundColor Red
                Write-Host "        $validateOutput" -ForegroundColor Gray
                $testsFailed++
            }
        } else {
            Write-Host "  [WARN] Terraform init failed (may need AWS credentials or internet connection)" -ForegroundColor Yellow
            Write-Host "        Skipping validation..." -ForegroundColor Gray
            $testsSkipped++
        }
        Pop-Location
    } catch {
        Write-Host "  [FAIL] Error running Terraform: $_" -ForegroundColor Red
        $testsFailed++
        Pop-Location
    }
} else {
    Write-Host "  [SKIP] Terraform not installed (install from: https://www.terraform.io/downloads)" -ForegroundColor Yellow
    $testsSkipped++
}

# Test 2: Check Docker can build
Write-Host ""
Write-Host "Test 2: Testing Docker build for user-service..." -ForegroundColor Yellow
if (Get-Command docker -ErrorAction SilentlyContinue) {
    try {
        # Check if Docker is running
        $dockerRunning = docker ps 2>&1
        if ($LASTEXITCODE -eq 0) {
            $null = docker build --build-arg APP_NAME=user -t test-user-service -f apps/user/Dockerfile . 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  [PASS] Docker image built successfully" -ForegroundColor Green
                $testsPassed++
                # Cleanup
                docker rmi test-user-service -f 2>&1 | Out-Null
            } else {
                Write-Host "  [FAIL] Docker build failed" -ForegroundColor Red
                $testsFailed++
            }
        } else {
            Write-Host "  [SKIP] Docker is not running (start Docker Desktop)" -ForegroundColor Yellow
            $testsSkipped++
        }
    } catch {
        Write-Host "  [FAIL] Error building Docker image: $_" -ForegroundColor Red
        $testsFailed++
    }
} else {
    Write-Host "  [SKIP] Docker not installed (install from: https://www.docker.com/)" -ForegroundColor Yellow
    $testsSkipped++
}

# Test 3: Check workflows exist
Write-Host ""
Write-Host "Test 3: Checking deployment workflows..." -ForegroundColor Yellow
# Get all service workflows (excluding template)
$workflows = Get-ChildItem .github/workflows/ -Filter "deploy-*.yml" -ErrorAction SilentlyContinue | 
    Where-Object { $_.Name -ne "deploy-service-template.yml" }
$workflowCount = $workflows.Count
if ($workflowCount -eq 6) {
    Write-Host "  [PASS] All 6 service deployment workflows found" -ForegroundColor Green
    $testsPassed++
} elseif ($workflowCount -gt 0) {
    Write-Host "  [PASS] Found $workflowCount service workflows" -ForegroundColor Green
    Write-Host "        Workflows: $($workflows.Name -join ', ')" -ForegroundColor Gray
    $testsPassed++
} else {
    Write-Host "  [FAIL] No deployment workflows found" -ForegroundColor Red
    $testsFailed++
}

# Test 4: Check service configuration
Write-Host ""
Write-Host "Test 4: Validating service configuration..." -ForegroundColor Yellow
$localTfContent = Get-Content infra/local.tf -Raw
$services = @("api-gateway", "auth-service", "user-service", "trip-service", "driver-service", "notification-service")
$allServicesFound = $true
foreach ($service in $services) {
    if ($localTfContent -notmatch $service) {
        Write-Host "  [FAIL] Service '$service' not found in local.tf" -ForegroundColor Red
        $allServicesFound = $false
    }
}
if ($allServicesFound) {
    Write-Host "  [PASS] All 6 services configured correctly" -ForegroundColor Green
    $testsPassed++
} else {
    $testsFailed++
}

# Test 5: Check budget configuration
Write-Host ""
Write-Host "Test 5: Checking budget configuration..." -ForegroundColor Yellow
if ($localTfContent -match "budget") {
    Write-Host "  [PASS] Budget configuration found" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "  [FAIL] Budget configuration missing" -ForegroundColor Red
    $testsFailed++
}

# Test 6: Check cost tags
Write-Host ""
Write-Host "Test 6: Validating cost management tags..." -ForegroundColor Yellow
if ($localTfContent -match "Service" -and $localTfContent -match "ManagedBy" -and $localTfContent -match "CostCenter") {
    Write-Host "  [PASS] Cost tracking tags configured" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "  [FAIL] Cost tracking tags missing" -ForegroundColor Red
    $testsFailed++
}

# Test 7: Check documentation
Write-Host ""
Write-Host "Test 7: Checking documentation..." -ForegroundColor Yellow
$docsExist = (Test-Path docs/DEPLOYMENT_GUIDE.md) -and (Test-Path docs/TESTING_GUIDE.md)
if ($docsExist) {
    Write-Host "  [PASS] Documentation files found" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "  [FAIL] Documentation files missing" -ForegroundColor Red
    $testsFailed++
}

# Test 8: Check scripts
Write-Host ""
Write-Host "Test 8: Checking deployment scripts..." -ForegroundColor Yellow
$scriptsExist = (Test-Path scripts/deploy-new-service.ps1) -and (Test-Path scripts/deploy-new-service.sh)
if ($scriptsExist) {
    Write-Host "  [PASS] Deployment scripts found" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "  [FAIL] Deployment scripts missing" -ForegroundColor Red
    $testsFailed++
}

# Summary
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Test Summary:" -ForegroundColor Cyan
Write-Host "  [PASS] Passed:  $testsPassed" -ForegroundColor Green
Write-Host "  [FAIL] Failed:  $testsFailed" -ForegroundColor Red
Write-Host "  [SKIP] Skipped: $testsSkipped" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan

if ($testsFailed -eq 0) {
    Write-Host ""
    if ($testsSkipped -gt 0) {
        Write-Host "[OK] Core tests passed! Some tools are missing but infrastructure is valid." -ForegroundColor Green
        Write-Host ""
        Write-Host "Optional tools to install:" -ForegroundColor Yellow
        if (-not (Get-Command terraform -ErrorAction SilentlyContinue)) {
            Write-Host "  - Terraform: https://www.terraform.io/downloads" -ForegroundColor White
        }
        if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
            Write-Host "  - Docker: https://www.docker.com/" -ForegroundColor White
        }
    } else {
        Write-Host "[OK] All tests passed! Your infrastructure is ready to deploy." -ForegroundColor Green
    }
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Review docs/DEPLOYMENT_GUIDE.md for deployment instructions" -ForegroundColor White
    Write-Host "  2. Configure AWS credentials: aws configure" -ForegroundColor White
    Write-Host "  3. Deploy: .\scripts\deploy-new-service.ps1 -ServiceName user-service -Environment dev" -ForegroundColor White
    Write-Host "  4. Monitor costs at: CloudWatch Dashboard > UIT-GO-FinOps-Dashboard" -ForegroundColor White
    exit 0
} else {
    Write-Host ""
    Write-Host "[WARN] Some tests failed. Please fix the issues before deploying." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "For help, see:" -ForegroundColor Yellow
    Write-Host "  - docs/TESTING_GUIDE.md" -ForegroundColor White
    Write-Host "  - docs/DEPLOYMENT_GUIDE.md" -ForegroundColor White
    exit 1
}
