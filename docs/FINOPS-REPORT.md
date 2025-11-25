# Module E – Automation & Cost Optimization (FinOps) 🚀💰

## 1. Platform & CI/CD
- CI via GitHub Actions (`ci.yml`): lint + test + build for all services (Nx). ✅
- Image pipeline (`docker-publish.yml`): per‑service GHCR images (`uit-go-<service>:latest` and `:sha`) for immutable deploys. 📦
- Infra toggles in Terraform: `enable_alb`, `enable_mq`, `enable_redis`, `enable_budget`, `enable_anomaly_monitor` let developers provision only what is needed (self‑service, cost‑aware). 🔀
- ECS autoscaling added: target CPU 70%, min 0 / max 2 tasks per service. 📈
- Fargate capacity providers with Spot preference: Spot weight > on‑demand for automatic savings. 🌤️

## 2. Cost Controls Implemented
- **Compute**: Fargate Spot preferred; autoscaling scales services down when idle. Small task sizes recommended (0.25 vCPU / 0.5 GB) for demo/dev. ⚙️
- **Network**: Single NAT gateway (cheapest viable); ALB disabled by default (`enable_alb=false`) to avoid hourly + LCU charges and account limits. 🌐
- **Data stores**: RDS Postgres on the smallest supported class; Redis and MQ are optional (`enable_redis`, `enable_mq`) to remove fixed hourly costs in dev/demo. 🗄️
- **Observability**: CloudWatch Logs retention set to 7 days to limit storage. 👀
- **Budgets/Alerts**: Budget and anomaly monitor are opt‑in with toggles to avoid failing applies and quota issues; enable only when subscriber emails and CE quota are in place. 🔔
- **OSRM data**: Keep large OSRM payload in S3/EFS (not baked into images) to avoid huge image pulls and registry/storage bloat. 🗺️

## 3. Tagging & Cost Allocation
- Base tags on all resources: `Project`, `Env`, `Owner`. 🏷️
- Per‑service tags: `Service=<app>` on ECS tasks/services and RDS instances. 🧩
- Component tags: `Component=redis|mq|vpc|nat|alb` on shared infra (Redis, MQ, network). 🧱
- Cost Categories (AWS CE) can group spend by `Service`/`Component` once cost allocation tags are enabled in Billing. 📊

## 4. Architectural Decisions & Trade-offs (ADR Summary)
- **ECS Fargate + Spot vs EC2**: No-VM ops and per‑task billing; Spot yields ~30%+ savings. Trade‑off: evictions; mitigated with on‑demand fallback. 🌤️
- **Single NAT**: Lowest cost; trade‑off: single egress point (ok for dev/demo). 🔌
- **ALB optional**: Disabled by default to avoid cost/restriction; trade‑off: no public entrypoint unless enabled. 🚪
- **RDS Postgres (small)** vs DynamoDB: Keeps SQL code; DynamoDB would cut ops but requires rewrites. 💾
- **Redis/MQ optional**: Avoid fixed monthly cost when not needed; trade‑off: features off in dev/demo. 📴
- **OSRM via S3/EFS**: Smaller images/faster pulls; trade‑off: download/init or EFS mount. 🗺️
- **Budgets/Anomaly toggles**: Prevents failed applies without emails/quota; enable in prod for governance. 🔔

## 5. Further Optimizations
- Aurora Serverless v2 for dev to auto-scale DB to near-zero. 💤
- Scale-to-zero schedules for non-critical services (off-hours set desired_count=0). 🌙
- S3 VPC endpoint to avoid NAT egress when pulling OSRM data. 🔒
- Remote Terraform state (S3 + DynamoDB) for safe team/self-service applies. 📦
- Secrets in Secrets Manager/SSM; remove plaintext secrets from `.env` and rotate exposed keys. 🔑
- Enable cost allocation tags in AWS Billing (Project/Env/Owner/Service/Component) so Cost Explorer and Cost Categories reflect the tagging in code. 🏷️

## 6. How This Meets Module E
- **Automation & Self-service**: CI/CD pipelines, per-service images, Terraform toggles, autoscaling, and capacity providers give developers a self-serve platform with safety rails. 🤖
- **Cost Management**: Spot preference, small instances, optional expensive components, tagging for CE/Cost Categories, budgets/anomaly monitors (opt-in), short log retention, and ALB disabled by default. 💰
- **Measured Optimization**: Spot + ALB-off reduce steady cost; Redis/MQ optional removes fixed run-rate in dev; autoscaling reduces idle burn. All changes are toggleable for quick experiments and demos. 📉
