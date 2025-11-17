# 🧪 Testing Guide - UIT-GO Backend

Guide for testing infrastructure, workflows, and deployments locally before pushing to production.

## Table of Contents
- [Infrastructure Testing](#infrastructure-testing)
- [Workflow Testing](#workflow-testing)
- [Docker Image Testing](#docker-image-testing)
- [Cost Estimation Testing](#cost-estimation-testing)
- [Database Migration Testing](#database-migration-testing)
- [Integration Testing](#integration-testing)

---

## Infrastructure Testing

### 1. Terraform Validation

**Validate syntax:**
```bash
cd infra
terraform init
terraform validate
```

**Expected output:**
```
Success! The configuration is valid.
```

### 2. Terraform Plan (Dry Run)

**Check what will be created:**
```bash
cd infra
terraform plan \
  -var="supabase_url=https://test.supabase.co" \
  -var="supabase_key=test_key" \
  -var="supabase_jwt_secret=test_secret" \
  -var="rabbitmq_mgmt_url=https://test-mq.amazonaws.com" \
  -var="rabbitmq_password=test_password"
```

**Check for:**
- ✅ No syntax errors
- ✅ Expected number of resources (should be ~50-60)
- ✅ Correct resource names with `uit-go-dev` prefix
- ✅ Tags are applied correctly

### 3. Terraform Cost Estimation (Infracost)

**Test cost estimation:**
```bash
cd infra
infracost breakdown --path=. --terraform-var="env=dev"
```

**Expected monthly cost:**
```
Total monthly cost: $173 USD

Breakdown:
- VPC NAT Gateway: $32
- ALB: $16
- RDS (3 instances): $38
- ElastiCache Redis: $25
- Amazon MQ: $15
- ECS Fargate: $30
- Other: $17
```

### 4. Test Resource Tagging

**Check tags in plan output:**
```bash
terraform plan | grep -A 10 "tags ="
```

**Verify all resources have:**
- ✅ `Project = "uit-go"`
- ✅ `Environment = "dev"`
- ✅ `ManagedBy = "Terraform"`
- ✅ `Service = "{service-name}"` (for service-specific resources)

---

## Workflow Testing

### 1. Validate Workflow Syntax

**Using GitHub CLI:**
```bash
# Check if workflows are valid
gh workflow list
```

**Using act (local GitHub Actions runner):**
```bash
# Install act (Windows)
choco install act-cli

# List all workflows
act -l

# Test workflow (dry run)
act -n
```

### 2. Test Workflow Triggers

**Check which files trigger which workflows:**
```bash
# User service workflow
git add apps/user/src/**
git commit -m "test: trigger user service"
# Should trigger: deploy-user-service.yml

# Infrastructure changes
git add infra/**
git commit -m "test: trigger all services"
# Should trigger: All deploy workflows
```

### 3. Manual Workflow Trigger Test

**Using GitHub CLI:**
```bash
# Trigger workflow (doesn't actually deploy if tf-apply=false)
gh workflow run deploy-user-service.yml \
  -f environment=dev \
  -f apply-terraform=false \
  -f run-migrations=false

# Check run status
gh run list --workflow=deploy-user-service.yml
gh run watch
```

---

## Docker Image Testing

### 1. Build Docker Image Locally

**Test building a service image:**
```bash
# Build user service image
docker build \
  --build-arg APP_NAME=user \
  -t uit-go-user:test \
  -f apps/user/Dockerfile \
  .

# Check image size (should be < 200MB)
docker images uit-go-user:test
```

**Expected output:**
```
REPOSITORY      TAG    IMAGE ID       CREATED         SIZE
uit-go-user     test   abc123def456   1 minute ago    180MB
```

### 2. Test Image Labels

**Check if cost tags are applied:**
```bash
docker inspect uit-go-user:test --format='{{json .Config.Labels}}' | jq
```

**Should contain:**
```json
{
  "Service": "user",
  "Environment": "dev",
  "ManagedBy": "GitHub-Actions"
}
```

### 3. Run Container Locally

**Test if service starts:**
```bash
# Run with minimal environment
docker run --rm -it \
  -e PORT=3002 \
  -e USERDB_HOST=localhost \
  -e USERDB_PORT=5432 \
  -e USERDB_USERNAME=test \
  -e USERDB_PASSWORD=test \
  -e USERDB_DATABASE=userdb \
  -p 3002:3002 \
  uit-go-user:test

# In another terminal, test health endpoint
curl http://localhost:3002/health
```

**Expected:**
```json
{"status":"ok","timestamp":"2025-11-16T..."}
```

### 4. Test Multi-Stage Build

**Check intermediate layers:**
```bash
# Build and show all stages
docker build \
  --build-arg APP_NAME=user \
  --target=deps \
  -t uit-go-user:deps \
  -f apps/user/Dockerfile \
  .

# Check size of each stage
docker images | grep uit-go-user
```

---

## Cost Estimation Testing

### 1. Test Infracost Locally

**Generate cost report:**
```bash
cd infra
infracost breakdown --path=. --format=json --out-file=cost-estimate.json

# View as table
infracost breakdown --path=. --format=table

# View as HTML report
infracost breakdown --path=. --format=html --out-file=cost-report.html
```

### 2. Test Budget Calculations

**Verify service budgets:**
```bash
# Check budget values in Terraform
grep -A 1 "budget" infra/local.tf
```

**Should show:**
```terraform
"api-gateway" = { port = 3000, health = "/health", budget = 40 }
"user-service" = { port = 3002, health = "/health", budget = 50 }
...
```

**Total should be ≤ $275 (sum of all service budgets)**

### 3. Test Cost Reports Workflow

**Trigger manually:**
```bash
gh workflow run cost-reports.yml

# Wait for completion
gh run watch

# Download artifacts
gh run list --workflow=cost-reports.yml
gh run download <run-id>
```

---

## Database Migration Testing

### 1. Test Migration Files

**Check migration files exist:**
```bash
# User service
ls -la apps/user/src/migrations/

# Trip service
ls -la apps/trip/src/migrations/

# Driver service
ls -la apps/driver/src/migrations/
```

### 2. Test Migration Scripts

**Using local PostgreSQL (via Docker):**
```bash
# Start test database
docker run --name test-userdb -e POSTGRES_PASSWORD=test -p 5433:5432 -d postgres:17

# Run migrations
export USERDB_HOST=localhost
export USERDB_PORT=5433
export USERDB_USERNAME=postgres
export USERDB_PASSWORD=test
export USERDB_DATABASE=postgres

npm run migration:run:user
```

**Expected output:**
```
query: SELECT * FROM "migrations"
query: BEGIN TRANSACTION
query: CREATE TABLE ...
Migration 1234567890123-CreateUser has been executed successfully.
query: COMMIT
```

### 3. Test Migration Rollback

**Test reverting migrations:**
```bash
# Revert last migration
npm run migration:revert:user

# Should undo last migration
```

### 4. Test Migration in CI

**Check workflow has migration step:**
```bash
grep -A 5 "migrate-database:" .github/workflows/deploy-service-template.yml
```

**Should contain:**
```yaml
migrate-database:
  needs: terraform-apply
  if: ${{ inputs.run-migrations == true }}
  ...
  run: npm run migration:run:${SERVICE}
```

---

## Integration Testing

### 1. Test Service Discovery

**Check if services can resolve each other:**
```bash
# After deploying, test from within ECS task
aws ecs execute-command \
  --cluster uit-go-dev-ecs \
  --task <task-id> \
  --container user-service \
  --command "/bin/sh" \
  --interactive

# Inside container
nslookup user.local
ping user.local
```

### 2. Test ALB → ECS Connectivity

**Test from local machine:**
```bash
# Get ALB DNS
cd infra
terraform output alb_dns_name

# Test connectivity
curl http://<alb-dns>/health

# Expected: 200 OK
```

### 3. Test ECS → RDS Connectivity

**From ECS task:**
```bash
# Get RDS endpoint
cd infra
terraform output userdb_address

# From within ECS task
aws ecs execute-command \
  --cluster uit-go-dev-ecs \
  --task <task-id> \
  --container user-service \
  --command "/bin/sh" \
  --interactive

# Inside container
nc -zv <rds-endpoint> 5432
# Should output: Connection successful
```

### 4. Test RabbitMQ Connectivity

**Check RabbitMQ console:**
```bash
# Get RabbitMQ console URL
cd infra
terraform output rabbitmq_console

# Open in browser and login with credentials
# Check queues are created
```

---

## Full End-to-End Test

### Test Scenario: Deploy User Service

**1. Pre-deployment checks:**
```bash
# Validate Terraform
cd infra && terraform validate

# Estimate cost
infracost breakdown --path=. --format=table

# Build Docker image
docker build --build-arg APP_NAME=user -t test-user -f apps/user/Dockerfile .

# Test migrations locally
docker-compose -f docker-compose-dev.yml up -d user-db
npm run migration:run:user
```

**2. Trigger deployment:**
```powershell
.\scripts\deploy-new-service.ps1 -ServiceName user-service -Environment dev
```

**3. Monitor deployment:**
```bash
gh run watch
```

**4. Post-deployment checks:**
```bash
# Check ECS service
aws ecs describe-services --cluster uit-go-dev-ecs --services uit-go-dev-user-service

# Check running tasks
aws ecs list-tasks --cluster uit-go-dev-ecs --service-name uit-go-dev-user-service

# Test health endpoint
ALB_DNS=$(cd infra && terraform output -raw alb_dns_name)
curl http://$ALB_DNS/health

# Check logs
aws logs tail /uit-go-dev/services --follow --filter-pattern "user-service"
```

**5. Verify cost tracking:**
```bash
# Check CloudWatch Dashboard
# Open AWS Console → CloudWatch → Dashboards → UIT-GO-FinOps-Dashboard

# Check cost allocation tags
aws ce get-cost-and-usage \
  --time-period Start=2025-11-01,End=2025-11-30 \
  --granularity MONTHLY \
  --metrics UnblendedCost \
  --group-by Type=TAG,Key=Service
```

---

## Automated Testing Commands

**Run all tests:**
```bash
# Create test script
cat > scripts/run-all-tests.sh << 'EOF'
#!/bin/bash
set -e

echo "🧪 Running all tests..."

# 1. Terraform validation
echo "1️⃣ Validating Terraform..."
cd infra
terraform init -backend=false
terraform validate
cd ..

# 2. Docker build test
echo "2️⃣ Testing Docker builds..."
docker build --build-arg APP_NAME=user -t test-user -f apps/user/Dockerfile .

# 3. Workflow syntax
echo "3️⃣ Checking workflows..."
gh workflow list

# 4. Cost estimation
echo "4️⃣ Estimating costs..."
cd infra
infracost breakdown --path=. --format=table
cd ..

echo "✅ All tests passed!"
EOF

chmod +x scripts/run-all-tests.sh
./scripts/run-all-tests.sh
```

**PowerShell version:**
```powershell
# Create scripts/run-all-tests.ps1
@"
Write-Host "🧪 Running all tests..." -ForegroundColor Blue

# 1. Terraform validation
Write-Host "1️⃣ Validating Terraform..." -ForegroundColor Blue
Push-Location infra
terraform init -backend=`$false
terraform validate
Pop-Location

# 2. Docker build test
Write-Host "2️⃣ Testing Docker builds..." -ForegroundColor Blue
docker build --build-arg APP_NAME=user -t test-user -f apps/user/Dockerfile .

# 3. Workflow syntax
Write-Host "3️⃣ Checking workflows..." -ForegroundColor Blue
gh workflow list

# 4. Cost estimation
Write-Host "4️⃣ Estimating costs..." -ForegroundColor Blue
Push-Location infra
infracost breakdown --path=. --format=table
Pop-Location

Write-Host "✅ All tests passed!" -ForegroundColor Green
"@ | Out-File -FilePath scripts/run-all-tests.ps1

.\scripts\run-all-tests.ps1
```

---

## Troubleshooting Tests

### Test Fails: Terraform Validation

**Error:**
```
Error: Unsupported argument
```

**Solution:**
- Check variable names match between `variable.tf` and usage
- Verify all required variables are provided
- Check for typos in resource names

### Test Fails: Docker Build

**Error:**
```
failed to solve: failed to compute cache key
```

**Solution:**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache --build-arg APP_NAME=user -f apps/user/Dockerfile .
```

### Test Fails: Infracost

**Error:**
```
Error: No INFRACOST_API_KEY environment variable set
```

**Solution:**
```bash
# Get API key from https://www.infracost.io/
infracost auth login

# Or set manually
export INFRACOST_API_KEY="your-key-here"
```

### Test Fails: GitHub Actions

**Error:**
```
Workflow does not have 'workflow_dispatch' trigger
```

**Solution:**
- Add `workflow_dispatch:` to workflow file
- Ensure workflow file is committed to repository

---

## Continuous Testing

### Pre-commit Hook

**Create `.git/hooks/pre-commit`:**
```bash
#!/bin/bash
echo "🧪 Running pre-commit tests..."

# Validate Terraform
cd infra && terraform validate && cd ..

# Check workflow syntax
gh workflow list > /dev/null

echo "✅ Pre-commit tests passed!"
```

```bash
chmod +x .git/hooks/pre-commit
```

### CI Integration

The existing `.github/workflows/ci.yml` runs:
- ✅ Linting
- ✅ Unit tests
- ✅ Build verification

**To add infrastructure tests:**
```yaml
# Add to .github/workflows/ci.yml
- name: Validate Terraform
  run: |
    cd infra
    terraform init -backend=false
    terraform validate
```

---

## Test Checklist

Before deploying to production:

- [ ] Terraform validates without errors
- [ ] Terraform plan shows expected resources
- [ ] Infracost estimate is within budget
- [ ] Docker images build successfully
- [ ] Docker images are < 200MB
- [ ] Health endpoints respond with 200 OK
- [ ] Database migrations run without errors
- [ ] Workflows syntax is valid
- [ ] Cost tags are applied to all resources
- [ ] Service can connect to dependencies (RDS, Redis, RabbitMQ)
- [ ] ALB routes traffic correctly
- [ ] CloudWatch logs are streaming
- [ ] Cost monitoring dashboard shows metrics

---

**Last Updated:** November 2025
**Maintained by:** Platform & FinOps Team
