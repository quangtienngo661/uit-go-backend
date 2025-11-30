# UIT-Go Backend - Cloud-Native Ride-Sharing Platform

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=flat&logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

**UIT-Go** is a cloud-native microservices backend system for a ride-sharing platform, developed as part of the **SE360: Cloud-Native System Architecture** course at the University of Information Technology (UIT).

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [CI/CD Pipelines](#cicd-pipelines)
- [AWS Deployment](#aws-deployment)
- [Testing Inter-Service Communication](#testing-inter-service-communication)
- [Project Structure](#project-structure)
- [Development Guide](#development-guide)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)
- [Team Members](#team-members)
- [License](#license)

---

## Project Overview

**UIT-Go** simulates a real-world ride-sharing platform (similar to Uber/Grab) with a focus on:

- **Microservices Architecture**: Six independent, scalable services
- **Cloud-Native Design**: Containerized deployment with Docker
- **Event-Driven Communication**: Asynchronous messaging with RabbitMQ
- **Module E Focus**: Automation & Cost Optimization (FinOps)

### Key Features

- Authentication: Supabase BaaS integration with JWT validation
- User Management: Passenger and driver profile management
- Trip Management: Create, track, and complete ride requests
- Real-Time Location: Redis Geospatial for driver location tracking
- Notifications: Email notifications for trip events
- API Gateway: Centralized routing and request validation

---

## Architecture

UIT-Go follows a **microservices cloud-native pattern** with the following services:

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ REST
       ▼
┌─────────────────┐
│  API Gateway    │ ◄─── JWT Validation (Supabase)
└────────┬────────┘
         │
    ┌────┴────┬─────────┬──────────┬──────────┐
    ▼         ▼         ▼          ▼          ▼
┌────────┐ ┌──────┐ ┌──────┐ ┌────────┐ ┌──────────┐
│  Auth  │ │ User │ │ Trip │ │ Driver │ │  Notif   │
└───┬────┘ └──┬───┘ └──┬───┘ └───┬────┘ └────┬─────┘
    │         │        │         │           │
    ▼         ▼        ▼         ▼           │
 Supabase  User-DB  Trip-DB  Driver-DB       │
                                 │            │
                                 ▼            │
                             Redis Geo       │
                                             │
         ┌───────────────────────────────────┘
         │
         ▼
   ┌──────────────┐
   │  RabbitMQ    │ (Event Bus)
   └──────────────┘
```

**See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.**

---

## Technology Stack

### Core Framework

- NestJS
- TypeScript
- Nx (monorepo)

### Databases

- PostgreSQL 17 (3 instances: user-db, trip-db, driver-db)
- Redis 7 (geospatial)

### Messaging & Communication

- RabbitMQ (topic exchange)
- gRPC (Trip ↔ Driver)
- REST

### Routing & Navigation

- OSRM (Open Source Routing Machine)

### Infrastructure

- Docker & Docker Compose
- Terraform (IaC) - beta
- Supabase (auth BaaS)

### Libraries & Tools

- TypeORM, class-validator, passport-jwt, amqplib, @grpc/grpc-js, nodemailer

---

## Prerequisites

- Node.js v20+
- npm v10+
- Docker Desktop v24+
- Git
- Supabase account

Optional: VS Code + Nx Console, pgAdmin/DBeaver, Postman/Insomnia.

---

## Installation & Setup

1. Clone the repository

```bash
git clone https://github.com/se360-uit-go/uit-go-backend.git
cd uit-go-backend
```

2. Install dependencies

```bash
npm install
```

3. Setup environment variables

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` with your values:

```env
# === Service Ports ===
GATEWAY_SERVICE_PORT=3000
AUTH_SERVICE_PORT=3001
USER_SERVICE_PORT=3002
TRIP_SERVICE_PORT=3003
DRIVER_SERVICE_PORT=3004
NOTIFICATION_SERVICE_PORT=3005

# === Supabase Configuration (Authentication) ===
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret

# === Database Configuration ===
USERDB_HOST=localhost
USERDB_PORT=5433
USERDB_USERNAME=userdb_admin
USERDB_PASSWORD=userdb_password
USERDB_DATABASE=userdb

TRIPDB_HOST=localhost
TRIPDB_PORT=5434
TRIPDB_USERNAME=tripdb_admin
TRIPDB_PASSWORD=tripdb_password
TRIPDB_DATABASE=tripdb

DRIVERDB_HOST=localhost
DRIVERDB_PORT=5435
DRIVERDB_USERNAME=driverdb_admin
DRIVERDB_PASSWORD=driverdb_password
DRIVERDB_DATABASE=driverdb

# === Redis Configuration (Driver Location) ===
REDIS_HOST=localhost
REDIS_PORT=6379

# === RabbitMQ Configuration (Event Bus) ===
RABBITMQ_DEFAULT_USER=admin
RABBITMQ_DEFAULT_PASS=admin123

# === Firebase Configuration (Push Notifications) ===
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"

# === Nodemailer Configuration (Email Notifications) ===
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
```

> Auth service uses Supabase (no separate DB). See [ADR-004](docs/ADR/ADR-004-supabase-authentication.md).

4. Setup Supabase: create project, grab `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_JWT_SECRET` from dashboard.

5. Setup OSRM (routing engine)

- Option A (fast): download pre-processed Vietnam data (~400MB) → unzip to `osrm/` → `docker compose up -d osrm-backend` → test route.
- Option B (from scratch): run `./scripts/setup-osrm.sh` (or `./scripts/setup-osrm.ps1` on Windows) to download OSM data and start OSRM at http://localhost:5050. See [OSRM-QUICK-START.md](docs/OSRM-QUICK-START.md).

---

## Running the Application

### Method 1: Docker Compose (recommended)

```bash
# Build and start all containers
docker-compose up --build

# Detached
 docker-compose up -d --build
```

Starts:

- 3x PostgreSQL (5433, 5434, 5435)
- Redis (6379)
- RabbitMQ (5672, mgmt 15672)
- OSRM (5050)
- All 6 microservices

Access: API Gateway http://localhost:3000, RabbitMQ http://localhost:15672 (admin/admin123), OSRM http://localhost:5050.

### Method 2: Local development per service

```bash
docker-compose up user-db trip-db driver-db redis rabbitmq
npm run migration:run:all
```

Then in separate terminals:

```bash
npx nx serve api-gateway
npx nx serve auth
npx nx serve user
npx nx serve trip
npx nx serve driver
npx nx serve notification
```

### Stopping

```bash
# Stop all containers
docker-compose down

# Stop and remove volumes (deletes data)
docker-compose down -v
```

---

## CI/CD Pipelines

- **CI** (`.github/workflows/ci.yml`): runs on PRs and pushes to `main`/`dev`/`deployment`; uses Node 20, `npm ci`, `npx nx run-many -t lint build`, then `npx nx fix-ci`.
- **Docker Publish** (`.github/workflows/docker-publish.yml`): builds & pushes images for `api-gateway`, `auth`, `user`, `trip`, `driver`, `notification` to GHCR with tags `:latest` and `:${GITHUB_SHA}`; triggers on the same branches or manual dispatch; optionally calls `RENDER_DEPLOY_HOOK` on `main` success.
- **Self-Service Deploy** (`.github/workflows/self-service.yml`): manual `workflow_dispatch` for one service; inputs `service`, `environment` (maps to `infra/stacks/*`), `image_tag`, `apply` (plan vs apply). Auth via repo/org AWS secrets; runs Terraform in the chosen stack. Docker build step is commented; publish images first via Docker Publish or push your own tag.

Recommended flow:

1. Push/PR → CI green.
2. Run Docker Publish (or push your own image) to update GHCR tags.
3. Run Self-Service Deploy with `environment=dev`, `service=<name>`, `image_tag=<tag>`, `apply=true`.
4. Verify ECS tasks/ALB/service discovery.

Secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (or OIDC role), `GITHUB_TOKEN` (provided), optional `RENDER_DEPLOY_HOOK`.

---

## AWS Deployment

Terraform stacks live in `infra/stacks/<env>` (example: `infra/stacks/dev`) using S3 backend `uit-go-terraform-state` and DynamoDB lock `terraform-locks` in `ap-southeast-1`.

Prerequisites: AWS account + IAM perms for ECS/ALB/RDS/VPC/CloudWatch, S3 bucket + DynamoDB table created, GHCR images pushed, Supabase/Firebase/RabbitMQ/SMTP secrets ready.

Manual apply (local CLI):

```bash
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
cd infra/stacks/dev
terraform init
terraform plan \
  -var="region=ap-southeast-1" \
  -var='container_image_map={"api-gateway":"ghcr.io/<owner>/uit-go-api-gateway:latest","auth-service":"ghcr.io/<owner>/uit-go-auth:latest"}'
terraform apply -auto-approve \
  -var="supabase_url=https://<project>.supabase.co" \
  -var="supabase_key=<anon-key>" \
  -var="supabase_jwt_secret=<jwt-secret>" \
  -var="rabbitmq_mgmt_url=https://<mq-host>" \
  -var="firebase_project_id=<firebase-project-id>" \
  -var="firebase_client_email=<service-account-email>" \
  -var="firebase_private_key=<service-account-key>" \
  -var="mail_user=<smtp-user>" \
  -var="mail_pass=<smtp-pass>"
```

Cost levers: `enable_alb`, `enable_rds`, `enable_budget`, `enable_anomaly_monitor`, `desired_count`. Override images with `container_image_map`; others fall back to defaults in the stack.

---

## Testing Inter-Service Communication

1. Health check

```bash
curl http://localhost:3000/health
```

2. Auth flow

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "passenger@test.com",
    "password": "Test@1234",
    "fullName": "Test User",
    "phoneNumber": "+84901234567",
    "role": "passenger"
  }'

curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "passenger@test.com",
    "password": "Test@1234"
  }'
```

3. Trip → Driver (gRPC)

```bash
curl -X POST http://localhost:3000/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "pickupLat": 10.8231,
    "pickupLng": 106.6297,
    "dropoffLat": 10.7769,
    "dropoffLng": 106.7009,
    "vehicleType": "car"
  }'
```

Behind the scenes: API Gateway → Trip (REST) → RabbitMQ `trip.created` → Driver consumes (Redis Geo) → Driver → Trip (gRPC) → Notification sends email.

4. RabbitMQ flow: visit http://localhost:15672 (admin/admin123) and check queues `trip.q`, `driver.q`, `notif.q`, `user.q`.

5. Driver location update

```bash
curl -X PUT http://localhost:3000/drivers/location \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer DRIVER_ACCESS_TOKEN" \
  -d '{
    "lat": 10.8231,
    "lng": 106.6297,
    "status": "available"
  }'
```

Verify:

```bash
docker exec -it driver-redis redis-cli
GEOPOS drivers:available driver_id_here
```

---

## Project Structure

```
uit-go-backend/
├── apps/
│   ├── api-gateway/
│   ├── auth/
│   ├── user/
│   ├── trip/
│   ├── driver/
│   ├── notification/
│   └── docs/               # legacy path reference
├── docs/                   # documentation (current)
│   ├── ARCHITECTURE.md
│   ├── REPORT.md
│   ├── ADR/
│   ├── openapi.yaml
│   └── README.md (this file)
├── libs/
│   └── shared/
├── infra/
│   ├── modules/
│   └── stacks/
├── docker-compose.yml
├── nx.json
├── package.json
└── tsconfig.base.json
```

---

## Development Guide

### Running migrations

```bash
npm run migration:generate:user -- apps/user/src/migrations/YourMigrationName
npm run migration:generate:trip -- apps/trip/src/migrations/YourMigrationName
npm run migration:generate:driver -- apps/driver/src/migrations/YourMigrationName

npm run migration:run:all
npm run migration:run:user
npm run migration:run:trip
npm run migration:run:driver
npm run migration:revert:all
```

### Working with gRPC

```bash
npx nx run shared:proto-gen
```

Proto files: `libs/shared/src/lib/protos/`.

### Code generation

```bash
npx nx g @nx/nest:app my-new-service
npx nx g @nx/node:lib my-lib
```

### Visualize dependencies

```bash
npx nx graph
```

---

## Troubleshooting

- Docker fails to start: `docker-compose down -v && docker-compose up --build`
- Port in use: `netstat -ano | findstr :5432` → kill PID or change compose ports.
- Migration errors: `npm run migration:revert:all` then `npm run migration:run:all`.
- RabbitMQ connection refused: `docker-compose restart rabbitmq` and check `docker-compose logs rabbitmq`.
- gRPC method not implemented: `npx nx run shared:proto-gen` then `npx nx affected:build`.
- Supabase JWT issues: verify `SUPABASE_JWT_SECRET`, token expiry, `Authorization: Bearer <token>` header.

---

## Documentation

Docs live in `docs/`:

- [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [REPORT.md](docs/REPORT.md)
- [ADR/](docs/ADR/) (RabbitMQ vs Kafka, Redis Geo, gRPC, Supabase, DB per service, Nx monorepo, etc.)
- [openapi.yaml](docs/openapi.yaml)

---

## Team Members

| Name                 | Student ID | Responsibilities                                                     |
| -------------------- | ---------- | -------------------------------------------------------------------- |
| Không Huỳnh Ngọc Hân | 23520427   | Auth Service, User Service, Terraform, Docker Compose, Documentation |
| Ngô Quang Tiến       | 23521574   | Project Init, Database Design, Driver Service, Trip Service          |
| Nguyễn Hữu Duy       | 23520374   | Notification Service, RabbitMQ Integration                           |

---

## License

MIT License. See [LICENSE](LICENSE).

---

## Acknowledgments

- NestJS
- Nx
- Supabase
- Course instructor

---

## Contact

- Email: 23520427@gm.uit.edu.vn
- Repository: https://github.com/se360-uit-go/uit-go-backend

---

Built by UIT-Go Team
