# 📊 Module E: Automation & Cost Optimization (FinOps)

> **Platform & FinOps Engineering** - Self-Service Platform với Cost Governance

## 🎯 Overview

Module này implement một **self-service platform** hoàn chỉnh cho phép developers deploy services một cách tự động, an toàn, và có kiểm soát chi phí chặt chẽ.

### Key Features

✅ **Self-Service Deployment Platform**
- Reusable CI/CD workflows cho 6 microservices
- One-command deployment scripts (Bash + PowerShell)
- Automated Docker build & push to ECR
- Terraform automation với approval gates
- Database migration automation

✅ **Cost Management & FinOps**
- Per-service budgets với alerts ($25-$70/service)
- Overall project budget ($500/month)
- AWS Cost Anomaly Detection
- CloudWatch FinOps Dashboard
- Monthly cost reports automation
- Comprehensive resource tagging

✅ **Cost Optimization**
- Graviton processors (db.t4g, cache.t4g) → 20% savings
- Fargate Spot capacity configured → 70% potential savings
- Right-sized instances for dev environment
- 7-day log retention
- Infracost integration for pre-deployment estimation

---

## 📁 Project Structure

```
uit-go-backend/
├── .github/
│   └── workflows/
│       ├── ci.yml                          # Existing CI (lint, test, build)
│       ├── deploy-service-template.yml     # ✨ Reusable deployment workflow
│       ├── deploy-api-gateway.yml          # ✨ Per-service workflows (6 total)
│       ├── deploy-auth-service.yml
│       ├── deploy-user-service.yml
│       ├── deploy-trip-service.yml
│       ├── deploy-driver-service.yml
│       ├── deploy-notification-service.yml
│       ├── cost-reports.yml                # ✨ Monthly cost reporting
│       └── cost-filter.json                # Cost Explorer filter
│
├── infra/
│   ├── main.tf              # VPC, ECS, RDS, Redis, MQ, ALB
│   ├── finops.tf            # ✨ Budgets, anomaly detection, dashboard, alarms
│   ├── local.tf             # ✨ Enhanced with service tags & budgets
│   ├── variable.tf          # All variables
│   ├── output.tf            # Outputs
│   ├── provider.tf          # AWS, Random, RabbitMQ providers
│   └── rabbitmq.tf          # Message queue topology
│
├── scripts/
│   ├── deploy-new-service.ps1      # ✨ PowerShell deployment script
│   ├── deploy-new-service.sh       # ✨ Bash deployment script
│   └── test-infrastructure.ps1     # ✨ Quick test suite
│
├── docs/
│   ├── DEPLOYMENT_GUIDE.md         # ✨ Complete deployment documentation
│   ├── TESTING_GUIDE.md            # ✨ Testing procedures
│   └── ARCHITECTURE.md             # System architecture
│
├── .infracost/
│   └── infracost.yml               # ✨ Cost estimation configuration
│
└── apps/
    ├── api-gateway/
    ├── auth/
    ├── user/
    ├── trip/
    ├── driver/
    └── notification/

✨ = New files for Module E
```

---

## 🚀 Quick Start

### 1. Run Infrastructure Tests

```powershell
# Validate everything is configured correctly
.\scripts\test-infrastructure.ps1
```

Expected output:
```
🚀 UIT-GO Infrastructure Test Suite
=====================================
Test 1: Validating Terraform configuration...
  ✅ Terraform configuration is valid
Test 2: Testing Docker build...
  ✅ Docker image built successfully
...
🎉 All tests passed! Your infrastructure is ready to deploy.
```

### 2. Deploy a Service

```powershell
# Interactive deployment with cost estimation
.\scripts\deploy-new-service.ps1 -ServiceName user-service -Environment dev
```

The script will:
1. ✅ Validate service exists
2. 💰 Show cost estimate (if Infracost installed)
3. ⚙️ Ask for confirmation
4. 🎯 Trigger GitHub Actions workflow
5. 📊 Provide monitoring links

### 3. Monitor Costs

After deployment:
- **CloudWatch Dashboard**: `UIT-GO-FinOps-Dashboard`
- **AWS Cost Explorer**: Filter by `Service=user-service`
- **AWS Budgets**: Check alerts at 80%/100%

---

## 📊 Cost Management

### Budget Structure

| Category | Budget | Alert Threshold |
|----------|--------|----------------|
| **Overall Project** | $500/month | 80% ($400) |
| api-gateway | $40/month | 80% ($32) |
| auth-service | $30/month | 80% ($24) |
| user-service | $50/month | 80% ($40) |
| trip-service | $60/month | 80% ($48) |
| driver-service | $70/month | 80% ($56) |
| notification-service | $25/month | 80% ($20) |

### Cost Tracking Features

✅ **Automatic Tagging**
```terraform
All resources tagged with:
- Project: uit-go
- Environment: dev/staging/prod
- Service: {service-name}
- ManagedBy: Terraform
- CostCenter: Engineering
- Criticality: low/medium/high
```

✅ **Cost Anomaly Detection**
- Daily monitoring
- Alerts if cost spikes > $100
- Email + SNS notifications

✅ **Monthly Reports**
- Auto-generated on 1st of each month
- Cost breakdown by service
- Cost breakdown by environment
- Budget utilization tracking

### Cost Optimization Applied

| Strategy | Savings | Status |
|----------|---------|--------|
| Graviton processors (ARM) | 20% | ✅ Implemented |
| Fargate Spot instances | 70% | ⚙️ Configured, not active |
| Single NAT Gateway (dev) | $32/month | ✅ Implemented |
| 7-day log retention | ~80% | ✅ Implemented |
| Right-sized instances | 30-40% | ✅ Implemented |

**Current dev environment cost: ~$173/month**

---

## 🔄 CI/CD Pipeline

### Deployment Flow

```
1. Code Push → GitHub
        ↓
2. Build & Test (ci.yml)
   - Lint code
   - Run tests
   - Build with NX
        ↓
3. Deploy Workflow Triggers (deploy-{service}.yml)
   - Cost estimation (Infracost)
   - Docker build & push to ECR
   - Security scan (Trivy)
        ↓
4. Infrastructure (Terraform)
   - Plan infrastructure changes
   - Apply with approval gate
        ↓
5. Database Migration
   - Run TypeORM migrations (if service has DB)
        ↓
6. ECS Deployment
   - Update service with new image
   - Wait for stability
        ↓
7. Health Checks
   - Test service endpoints
   - Verify connectivity
        ↓
8. Monitoring & Alerts
   - Send CloudWatch metrics
   - Notify Slack (optional)
   - Update cost dashboard
```

### Workflow Features

✅ **Automated Steps**
- Docker multi-stage build optimization
- ECR repository auto-creation
- Image vulnerability scanning
- Cost estimation in PRs (Infracost comments)
- Database migration execution
- Health check validation
- Rollback on failure

✅ **Manual Controls**
- Approval gates for Terraform apply
- Environment selection (dev/staging/prod)
- Migration toggle
- Terraform apply toggle

---

## 🧪 Testing

### Quick Test

```powershell
# Run all infrastructure tests
.\scripts\test-infrastructure.ps1
```

### Comprehensive Testing

See [docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md) for:
- Terraform validation
- Docker image testing
- Workflow testing
- Cost estimation testing
- Database migration testing
- Integration testing

---

## 📖 Documentation

### For Developers

1. **[DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)**
   - How to deploy services
   - Service configurations
   - Troubleshooting guide
   - Cost monitoring

2. **[TESTING_GUIDE.md](docs/TESTING_GUIDE.md)**
   - How to test locally
   - Validation procedures
   - End-to-end testing
   - Pre-commit hooks

### For Operations

3. **[terraform-apply-guide.md](infra/terraform-apply-guide.md)**
   - Manual Terraform deployment
   - Required variables
   - Initial setup

---

## 🛠️ Prerequisites

### Required

1. **GitHub CLI** - For triggering workflows
   ```powershell
   winget install GitHub.cli
   gh auth login
   ```

2. **AWS CLI** - For accessing AWS services
   ```powershell
   # Download from: https://aws.amazon.com/cli/
   aws configure
   ```

3. **Terraform** - For infrastructure management
   ```powershell
   choco install terraform
   ```

4. **Docker** - For building images
   ```powershell
   # Download from: https://www.docker.com/products/docker-desktop/
   ```

### Optional (Recommended)

5. **Infracost** - For cost estimation
   ```powershell
   choco install infracost
   infracost auth login
   ```

### GitHub Repository Secrets

Configure in: **Settings → Secrets and variables → Actions**

| Secret | Description | Required |
|--------|-------------|----------|
| `AWS_ACCESS_KEY_ID` | AWS credentials | ✅ Yes |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | ✅ Yes |
| `INFRACOST_API_KEY` | Cost estimation | ⚠️ Recommended |
| `SLACK_WEBHOOK_URL` | Notifications | ⚠️ Optional |

---

## 📊 Module E Completion Status

### ✅ Mục 2: Cost Management (100% Complete)

- [x] Per-service budgets (6 services)
- [x] Overall project budget ($500/month)
- [x] Cost Anomaly Detection
- [x] CloudWatch FinOps Dashboard
- [x] Cost allocation tags (Service, Environment, ManagedBy, etc.)
- [x] Monthly cost reports automation
- [x] Budget alerts (80%, 100% thresholds)
- [x] CloudWatch alarms (ECS CPU, RDS connections)

### ✅ Mục 5: Self-Service Platform (100% Complete)

- [x] Reusable CI/CD workflow template
- [x] 6 per-service deployment workflows
- [x] Docker build & ECR push automation
- [x] Terraform automation with approval gates
- [x] Database migration automation
- [x] One-command deployment scripts (Bash + PowerShell)
- [x] Cost estimation integration (Infracost)
- [x] Health checks & rollback
- [x] Comprehensive documentation
- [x] Testing guide & test scripts

---

## 🎯 Key Achievements

### Cost Governance
- ✅ Per-service cost tracking via tags
- ✅ Automated budget alerts
- ✅ Cost anomaly detection
- ✅ Monthly cost reporting
- ✅ Pre-deployment cost estimation

### Developer Experience
- ✅ One-command deployment
- ✅ Automatic Docker build & push
- ✅ Automatic database migrations
- ✅ Self-healing CI/CD
- ✅ Clear error messages & documentation

### Cost Optimization
- ✅ 20% savings via Graviton processors
- ✅ Right-sized instances
- ✅ Optimized log retention
- ✅ Single NAT for dev environment
- ⚙️ Fargate Spot configured (70% potential savings)

---

## 🔧 Usage Examples

### Deploy Single Service
```powershell
.\scripts\deploy-new-service.ps1 -ServiceName user-service -Environment dev
```

### Trigger via GitHub CLI
```bash
gh workflow run deploy-user-service.yml \
  -f environment=dev \
  -f apply-terraform=true \
  -f run-migrations=true
```

### Check Deployment Status
```bash
gh run watch
gh run list --workflow=deploy-user-service.yml
```

### View Costs
```bash
# Get current month costs by service
aws ce get-cost-and-usage \
  --time-period Start=2025-11-01,End=2025-11-30 \
  --granularity MONTHLY \
  --metrics UnblendedCost \
  --group-by Type=TAG,Key=Service
```

### Generate Cost Report
```bash
gh workflow run cost-reports.yml
```

---

## 🐛 Troubleshooting

### Common Issues

**❌ Workflow trigger failed**
```powershell
# Check if authenticated
gh auth status

# Re-authenticate
gh auth login
```

**❌ Terraform validation failed**
```bash
cd infra
terraform init
terraform validate
```

**❌ Docker build failed**
```bash
# Clean cache
docker system prune -a

# Rebuild
docker build --no-cache --build-arg APP_NAME=user -f apps/user/Dockerfile .
```

**❌ Cost over budget**
- Check CloudWatch Dashboard for resource usage
- Review AWS Cost Explorer for breakdown
- Consider Fargate Spot for non-critical services
- Review right-sizing recommendations

See [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md#troubleshooting) for detailed troubleshooting.

---

## 📞 Support

**Documentation:**
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Testing Guide](docs/TESTING_GUIDE.md)
- [Architecture](apps/docs/ARCHITECTURE.md)

**Issues:**
- Create GitHub issue with label `module-e` or `finops`
- Check existing issues for similar problems

**Cost Questions:**
- Review CloudWatch Dashboard: `UIT-GO-FinOps-Dashboard`
- Check AWS Budgets for alerts
- Review Cost Explorer for detailed breakdown

---

## 📝 Next Steps

### For Development
1. Run tests: `.\scripts\test-infrastructure.ps1`
2. Deploy to dev: `.\scripts\deploy-new-service.ps1 -ServiceName user-service`
3. Monitor costs: Check CloudWatch Dashboard

### For Production
1. Review security settings in Terraform
2. Enable Fargate Spot for notification-service
3. Set up multi-AZ RDS (change `single_nat_gateway = false`)
4. Configure AWS Secrets Manager for sensitive data
5. Set up CloudWatch alarms for critical metrics

### For Cost Optimization
1. Analyze Cost Explorer reports
2. Implement Fargate Spot for suitable services
3. Review right-sizing recommendations monthly
4. Consider Reserved Instances for stable workloads
5. Archive old logs to S3 for cheaper storage

---

**Last Updated:** November 16, 2025  
**Module:** E - Automation & Cost Optimization (FinOps)  
**Status:** ✅ Complete (100%)  
**Maintained by:** Platform & FinOps Engineering Team
