# 🚀 UIT-GO Backend Deployment Guide

Complete guide for deploying microservices to AWS using our self-service platform.

## Table of Contents
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Deployment Methods](#deployment-methods)
- [Service Configuration](#service-configuration)
- [Cost Management](#cost-management)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Option 1: Using Script (Recommended for Windows)

```powershell
# Deploy to dev environment
.\scripts\deploy-new-service.ps1 -ServiceName user-service -Environment dev

# Deploy to production
.\scripts\deploy-new-service.ps1 -ServiceName api-gateway -Environment prod
```

### Option 2: Using Bash Script (Linux/Mac)

```bash
# Deploy to dev environment
./scripts/deploy-new-service.sh user-service dev

# Deploy to production
./scripts/deploy-new-service.sh api-gateway prod
```

### Option 3: GitHub Actions UI

1. Go to **Actions** tab in GitHub
2. Select the workflow: **Deploy [Service Name]**
3. Click **Run workflow**
4. Choose parameters:
   - Environment: `dev`, `staging`, or `prod`
   - Apply Terraform: `true` or `false`
   - Run Migrations: `true` or `false` (if applicable)
5. Click **Run workflow**

---

## Prerequisites

### Required Tools

1. **GitHub CLI** (for script method)
   ```powershell
   # Windows (via winget)
   winget install GitHub.cli
   
   # Or download from: https://cli.github.com/
   ```

2. **AWS CLI** (for manual operations)
   ```powershell
   # Windows
   msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
   ```

3. **Infracost** (optional, for cost estimation)
   ```powershell
   # Windows (via Chocolatey)
   choco install infracost
   
   # Or download from: https://www.infracost.io/docs/#quick-start
   ```

4. **Terraform** (for local testing)
   ```powershell
   # Windows (via Chocolatey)
   choco install terraform
   ```

### Required Secrets

Configure these secrets in GitHub repository settings:

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `AWS_ACCESS_KEY_ID` | AWS credentials for deployment | ✅ Yes |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | ✅ Yes |
| `INFRACOST_API_KEY` | Cost estimation API key | ⚠️ Optional |
| `SLACK_WEBHOOK_URL` | Slack notifications | ⚠️ Optional |

**To add secrets:**
1. Go to: Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret

---

## Deployment Methods

### Method 1: Automated via Git Push

When you push code to `main` or `dev` branch affecting a service, deployment automatically triggers.

**Automatic triggers:**
```bash
git add apps/user/**
git commit -m "feat: update user service"
git push origin dev
# ✅ Triggers deploy-user-service.yml automatically
```

**Paths that trigger deployment:**
- `apps/{service-name}/**` - Service code changes
- `libs/shared/**` - Shared library changes
- `infra/**` - Infrastructure changes
- `.github/workflows/deploy-{service-name}.yml` - Workflow changes

### Method 2: Manual via GitHub Actions

**Step-by-step:**

1. Navigate to **Actions** tab
2. Find workflow (e.g., "Deploy User Service")
3. Click **Run workflow**
4. Configure options:

   | Option | Description | Values |
   |--------|-------------|--------|
   | Environment | Target environment | `dev`, `staging`, `prod` |
   | Apply Terraform | Deploy infrastructure changes | `true`, `false` |
   | Run Migrations | Execute database migrations | `true`, `false` |

5. Click **Run workflow** button

### Method 3: CLI Script

**PowerShell (Windows):**
```powershell
# Interactive deployment
.\scripts\deploy-new-service.ps1 -ServiceName user-service -Environment dev

# The script will:
# 1. Validate service exists
# 2. Show cost estimate (if Infracost installed)
# 3. Ask for confirmation
# 4. Trigger GitHub Actions workflow
```

**Bash (Linux/Mac):**
```bash
chmod +x scripts/deploy-new-service.sh
./scripts/deploy-new-service.sh user-service dev
```

---

## Service Configuration

### Available Services

| Service | Has Database | Needs Migrations | Monthly Budget | Port |
|---------|--------------|------------------|----------------|------|
| **api-gateway** | ❌ No | ❌ No | $40 | 3000 |
| **auth-service** | ❌ No | ❌ No | $30 | 3001 |
| **user-service** | ✅ Yes (PostgreSQL) | ✅ Yes | $50 | 3002 |
| **trip-service** | ✅ Yes (PostgreSQL) | ✅ Yes | $60 | 3003 |
| **driver-service** | ✅ Yes (PostgreSQL + Redis) | ✅ Yes | $70 | 3004 |
| **notification-service** | ❌ No | ❌ No | $25 | 3005 |

### Service Dependencies

```
api-gateway (Entry Point)
    ├── auth-service → user-service (gRPC)
    ├── user-service (gRPC)
    ├── trip-service (gRPC)
    ├── driver-service (gRPC)
    └── notification-service (async via RabbitMQ)

trip-service ↔ driver-service (gRPC for nearby search)
```

### Database Migration Services

Services with databases need migrations before deployment:

**user-service:**
```bash
npm run migration:run:user
```

**trip-service:**
```bash
npm run migration:run:trip
```

**driver-service:**
```bash
npm run migration:run:driver
```

**Run all migrations:**
```bash
npm run migration:run:all
```

---

## Cost Management

### Before Deployment: Cost Estimation

**Using Infracost:**
```bash
cd infra
infracost breakdown --path=. --terraform-var="env=dev"
```

**Expected costs per service (dev environment):**

| Service | ECS Fargate | RDS/Redis | Total/Month |
|---------|-------------|-----------|-------------|
| api-gateway | $5 | - | ~$5 |
| auth-service | $4 | - | ~$4 |
| user-service | $5 | $13 | ~$18 |
| trip-service | $5 | $13 | ~$18 |
| driver-service | $6 | $13 + $25 | ~$44 |
| notification-service | $3 | - | ~$3 |

**Infrastructure costs:**
- NAT Gateway: ~$32/month
- ALB: ~$16/month
- ECR: ~$2/month
- CloudWatch Logs: ~$5/month

**Total dev environment: ~$173/month**

### During Deployment: Automatic Checks

The deployment pipeline automatically:
1. ✅ Estimates cost impact (Infracost in PR comments)
2. ✅ Validates against service budget
3. ✅ Tags all resources for cost tracking
4. ✅ Sends metrics to CloudWatch

### After Deployment: Monitoring

**1. CloudWatch Dashboard**
```
Dashboard: UIT-GO-FinOps-Dashboard
Location: AWS Console → CloudWatch → Dashboards
```

**Widgets:**
- ECS CPU/Memory utilization
- RDS connections & CPU
- Redis cache performance
- Error rates

**2. AWS Cost Explorer**
```
Location: AWS Console → Cost Management → Cost Explorer
Filter by: Tag "Service" = "{service-name}"
```

**3. AWS Budgets**
```
Location: AWS Console → Cost Management → Budgets
```

Budget alerts configured at:
- 80% threshold → Email to team
- 100% threshold → Email + SNS alert

**Per-service budgets:**
- Overall project: $500/month
- Individual service budgets (see table above)

**4. Cost Anomaly Detection**
```
Location: AWS Console → Cost Management → Cost Anomaly Detection
Threshold: Alert if anomaly > $100
```

### Monthly Cost Reports

Automated reports generated on 1st of each month:

**View reports:**
```bash
# GitHub Actions artifacts
gh run list --workflow=cost-reports.yml
gh run download <run-id>
```

**Reports include:**
- Cost by service
- Cost by environment
- Budget utilization
- Trend analysis

---

## Troubleshooting

### Deployment Failed

**1. Check workflow logs:**
```bash
# List recent runs
gh run list

# Watch live deployment
gh run watch

# View specific run
gh run view <run-id> --log
```

**2. Common issues:**

**Issue: Docker build fails**
```
Error: failed to solve: failed to compute cache key
```

**Solution:**
- Check Dockerfile path: `apps/{service-name}/Dockerfile`
- Verify build arg: `APP_NAME` matches service name
- Clean local Docker cache: `docker system prune -a`

**Issue: Terraform apply fails**
```
Error: Error creating ECS Service
```

**Solution:**
- Check AWS credentials are valid
- Verify IAM permissions
- Check if cluster exists: `aws ecs describe-clusters --clusters uit-go-dev-ecs`

**Issue: Migration fails**
```
Error: Connection refused to database
```

**Solution:**
- Verify RDS is running
- Check security groups allow ECS → RDS connection
- Verify database credentials in Terraform outputs

**Issue: Health check fails**
```
Service health check failed after 10 attempts
```

**Solution:**
- Check ECS task logs: `aws ecs describe-tasks`
- Verify environment variables
- Check security groups allow ALB → ECS connection
- Verify service is listening on correct port

### Cost Over Budget

**Alert: Service exceeded 80% of budget**

**Immediate actions:**
1. Check CloudWatch Dashboard for resource usage
2. Review Cost Explorer for cost breakdown
3. Identify high-cost resources

**Investigation:**
```bash
# Check ECS task count
aws ecs describe-services --cluster uit-go-dev-ecs --services uit-go-dev-user-service

# Check RDS instance size
aws rds describe-db-instances --db-instance-identifier uit-go-dev-userdb

# Check Redis cache size
aws elasticache describe-cache-clusters --cache-cluster-id uit-go-dev-redis
```

**Optimization options:**
1. **Reduce ECS task count** (if over-provisioned)
2. **Right-size RDS instances** (if under-utilized)
3. **Enable Fargate Spot** for non-critical services
4. **Adjust CloudWatch log retention** (currently 7 days)

### Service Not Responding

**1. Check ECS service status:**
```bash
aws ecs describe-services \
  --cluster uit-go-dev-ecs \
  --services uit-go-dev-user-service \
  --region ap-southeast-1
```

**2. Check task logs:**
```bash
aws logs tail /uit-go-dev/services --follow \
  --filter-pattern "user-service" \
  --region ap-southeast-1
```

**3. Check ALB target health:**
```bash
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>
```

### Rollback Deployment

**Option 1: Revert via GitHub**
```bash
# Revert last commit
git revert HEAD
git push origin dev
# Triggers automatic re-deployment
```

**Option 2: Deploy previous image**
```bash
# List previous images
aws ecr describe-images \
  --repository-name uit-go-user-service \
  --query 'sort_by(imageDetails,& imagePushedAt)[-5:]'

# Update task definition with previous image
# Then force new deployment via workflow
```

**Option 3: Manual ECS rollback**
```bash
# Rollback to previous task definition
aws ecs update-service \
  --cluster uit-go-dev-ecs \
  --service uit-go-dev-user-service \
  --task-definition <previous-task-definition-arn>
```

---

## Advanced: Adding New Service

**1. Create NX application:**
```bash
npx nx g @nx/nest:app new-service
```

**2. Add service configuration to Terraform:**

Edit `infra/local.tf`:
```terraform
service_cfg = {
  # ... existing services ...
  "new-service" = { port = 3006, health = "/health", budget = 30 }
}
```

**3. Create deployment workflow:**

Copy and modify existing workflow:
```bash
cp .github/workflows/deploy-user-service.yml .github/workflows/deploy-new-service.yml
# Edit service-name in the file
```

**4. Deploy:**
```powershell
.\scripts\deploy-new-service.ps1 -ServiceName new-service -Environment dev
```

---

## Support

**Questions or issues?**
- Create GitHub issue with label `deployment`
- Contact Platform Team: platform-team@example.com
- Slack channel: `#uit-go-deployments`

**Useful commands:**
```bash
# Check all workflows
gh workflow list

# View deployment history
gh run list --workflow=deploy-user-service.yml

# Check AWS resources
aws ecs list-services --cluster uit-go-dev-ecs
aws rds describe-db-instances
aws elasticache describe-cache-clusters

# View costs
aws ce get-cost-and-usage --time-period Start=2025-11-01,End=2025-11-30 --granularity MONTHLY --metrics UnblendedCost
```

---

**Last Updated:** November 2025
**Maintained by:** Platform & FinOps Team
