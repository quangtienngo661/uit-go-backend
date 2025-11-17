# UIT-Go Backend - Cloud-Native Ride-Sharing Platform

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=flat&logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

**UIT-Go** is a cloud-native microservices backend system for a ride-sharing platform, developed as part of the **SE360: Cloud-Native System Architecture** course at the University of Information Technology (UIT).

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Running the Application](#-running-the-application)
- [Testing Inter-Service Communication](#-testing-inter-service-communication)
- [Project Structure](#-project-structure)
- [Development Guide](#-development-guide)
- [Troubleshooting](#-troubleshooting)
- [Documentation](#-documentation)
- [Team Members](#-team-members)
- [License](#-license)

---

## 🎯 Project Overview

**UIT-Go** simulates a real-world ride-sharing platform (similar to Uber/Grab) with a focus on:

- **Microservices Architecture**: Six independent, scalable services
- **Cloud-Native Design**: Containerized deployment with Docker
- **Event-Driven Communication**: Asynchronous messaging with RabbitMQ
- **Module E Focus**: Automation & Cost Optimization (FinOps)

### Key Features

- 🔐 **Authentication**: Supabase BaaS integration with JWT validation
- 👤 **User Management**: Passenger and driver profile management
- 🚗 **Trip Management**: Create, track, and complete ride requests
- 📍 **Real-Time Location**: Redis Geospatial for driver location tracking
- 🔔 **Notifications**: Email notifications for trip events
- 📊 **API Gateway**: Centralized routing and request validation

---

## 🏗 Architecture

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
                                 │           │
                                 ▼           │
                             Redis Geo       │
                                             │
         ┌───────────────────────────────────┘
         │
         ▼
   ┌──────────────┐
   │  RabbitMQ    │ (Event Bus)-
   └──────────────┘
```

**See [ARCHITECTURE.md](./apps/docs/ARCHITECTURE.md) for detailed architecture documentation.**

---

## 🛠 Technology Stack

### Core Framework
- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **Nx** - Monorepo management and build orchestration

### Databases
- **PostgreSQL 17** - Primary database (3 instances: user-db, trip-db, driver-db)
- **Redis 7** - Geospatial indexing for driver locations

### Messaging & Communication
- **RabbitMQ** - Asynchronous event bus (topic exchange)
- **gRPC** - High-performance inter-service communication (Trip ↔ Driver)
- **REST** - Public API and general inter-service communication

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **Terraform** - Infrastructure as Code (IaC) - beta version
- **Supabase** - Authentication BaaS

### Libraries & Tools
- **TypeORM** - Database ORM and migrations
- **class-validator** - DTO validation
- **passport-jwt** - JWT authentication
- **amqplib** - RabbitMQ client
- **@grpc/grpc-js** - gRPC implementation
- **nodemailer** - Email notifications

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v20.x or higher) - [Download](https://nodejs.org/)
- **npm** (v10.x or higher) - Comes with Node.js
- **Docker Desktop** (v24.x or higher) - [Download](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download](https://git-scm.com/)
- **Supabase Account** - [Sign up](https://supabase.com/) for authentication service

### Optional
- **Visual Studio Code** with Nx Console extension
- **pgAdmin** or **DBeaver** for database management
- **Postman** or **Insomnia** for API testing

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/quangtienngo661/uit-go-backend.git
cd uit-go-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the root directory:

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` with your configurations:

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
# User Service Database
USERDB_HOST=localhost
USERDB_PORT=5433
USERDB_USERNAME=userdb_admin
USERDB_PASSWORD=userdb_password
USERDB_DATABASE=userdb

# Trip Service Database
TRIPDB_HOST=localhost
TRIPDB_PORT=5434
TRIPDB_USERNAME=tripdb_admin
TRIPDB_PASSWORD=tripdb_password
TRIPDB_DATABASE=tripdb

# Driver Service Database
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

> **Note:** Auth service no longer requires a separate database. It uses **Supabase BaaS** for authentication, eliminating `AUTHDB_*` and `JWT_*` variables. See [ADR-004](./apps/docs/ADR/ADR-004-supabase-authentication.md) for details.

### 4. Setup Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project
3. Get your API credentials from **Settings > API**:
   - `SUPABASE_URL`
   - `SUPABASE_KEY` (anon/public key)
   - `SUPABASE_JWT_SECRET` from **Settings > API > JWT Settings**

---

## 🏃 Running the Application

### Method 1: Docker Compose (Recommended)

Start all services with Docker Compose:

```bash
# Build and start all containers
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

This will start:
- ✅ 3x PostgreSQL databases (ports 5433, 5434, 5435)
- ✅ Redis (port 6379)
- ✅ RabbitMQ (port 5672, management UI on 15672)
- ✅ All 6 microservices

**Access Points:**
- API Gateway: http://localhost:3000
- RabbitMQ Management: http://localhost:15672 (admin/admin123)

### Method 2: Local Development (Individual Services)

Start infrastructure only:

```bash
docker-compose up user-db trip-db driver-db redis rabbitmq
```

Run database migrations:

```bash
npm run migration:run:all
```

Serve services individually with Nx:

```bash
# Terminal 1 - API Gateway
npx nx serve api-gateway

# Terminal 2 - Auth Service
npx nx serve auth

# Terminal 3 - User Service
npx nx serve user

# Terminal 4 - Trip Service
npx nx serve trip

# Terminal 5 - Driver Service
npx nx serve driver

# Terminal 6 - Notification Service
npx nx serve notification
```

### Stopping the Application

```bash
# Stop all containers
docker-compose down

# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v
```

---

## 🧪 Testing Inter-Service Communication

### 1. Health Check

```bash
# Check API Gateway
curl http://localhost:3000/health

# Expected: {"status": "ok"}
```

### 2. Test Authentication Flow

**Register a User:**

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
```

**Login:**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "passenger@test.com",
    "password": "Test@1234"
  }'
```

Save the returned `access_token` for subsequent requests.

### 3. Test Trip Service → Driver Service (gRPC)

**Create a Trip Request:**

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

**What happens behind the scenes:**
1. API Gateway → Trip Service (REST)
2. Trip Service → RabbitMQ (`trip.created` event)
3. Driver Service consumes event → Searches nearby drivers (Redis Geospatial)
4. Driver Service → Trip Service (gRPC) - Returns available drivers
5. Notification Service → Sends email to passenger

### 4. Test RabbitMQ Message Flow

Access RabbitMQ Management UI:
- URL: http://localhost:15672
- Username: `admin`
- Password: `admin123`

Navigate to **Queues** tab to see:
- `trip.q` - Trip events
- `driver.q` - Driver events
- `notif.q` - Notification events
- `user.q` - User events

### 5. Test Driver Location Update

**Update Driver Location:**

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

**Verify in Redis:**

```bash
# Connect to Redis container
docker exec -it driver-redis redis-cli

# Check driver location
GEOPOS drivers:available driver_id_here
```

---

## 📁 Project Structure

```
uit-go-backend/
├── apps/
│   ├── api-gateway/          # API Gateway service
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── project.json
│   ├── auth/                 # Authentication service
│   ├── user/                 # User management service
│   ├── trip/                 # Trip management service
│   ├── driver/               # Driver & location service
│   ├── notification/         # Notification service
│   └── docs/                 # Documentation
│       ├── ARCHITECTURE.md
│       ├── REPORT.md
│       ├── ADR/              # Architectural Decision Records
│       └── openapi.yaml
├── libs/
│   └── shared/               # Shared libraries
│       ├── protos/           # gRPC proto definitions
│       ├── enums/
│       ├── helpers/
│       └── redis/
├── infra/                    # Terraform IaC (beta)
│   ├── main.tf
│   ├── rabbitmq.tf
│   └── variable.tf
├── docker-compose.yml        # Local development setup
├── nx.json                   # Nx workspace configuration
├── package.json
└── README.md
```

---

## 💻 Development Guide

### Running Migrations

**Generate a new migration:**

```bash
# For User Service
npm run migration:generate:user -- apps/user/src/migrations/YourMigrationName

# For Trip Service
npm run migration:generate:trip -- apps/trip/src/migrations/YourMigrationName

# For Driver Service
npm run migration:generate:driver -- apps/driver/src/migrations/YourMigrationName
```

**Run migrations:**

```bash
# Run all migrations
npm run migration:run:all

# Run for specific service
npm run migration:run:user
npm run migration:run:trip
npm run migration:run:driver
```

**Revert migration:**

```bash
npm run migration:revert:all
```

### Working with gRPC

**Regenerate proto files:**

```bash
npx nx run shared:proto-gen
```

Proto definitions are in `libs/shared/src/lib/protos/`.

### Code Generation

**Generate a new service:**

```bash
npx nx g @nx/nest:app my-new-service
```

**Generate a new library:**

```bash
npx nx g @nx/node:lib my-lib
```

### Visualize Dependencies

```bash
npx nx graph
```

Opens an interactive dependency graph in your browser.

---

## 🐛 Troubleshooting

### Issue: Docker containers fail to start

**Solution:**
```bash
# Remove all containers and volumes
docker-compose down -v

# Rebuild
docker-compose up --build
```

### Issue: Port already in use

**Solution:**
```bash
# Check what's using the port (Windows)
netstat -ano | findstr :5432

# Kill the process
taskkill /PID <PID> /F

# Or change ports in docker-compose.yml
```

### Issue: Database migration errors

**Solution:**
```bash
# Reset database
npm run migration:revert:all

# Re-run migrations
npm run migration:run:all
```

### Issue: RabbitMQ connection refused

**Solution:**
```bash
# Restart RabbitMQ container
docker-compose restart rabbitmq

# Check logs
docker-compose logs rabbitmq
```

### Issue: gRPC method not implemented

**Solution:**
```bash
# Regenerate proto files
npx nx run shared:proto-gen

# Rebuild affected services
npx nx affected:build
```

### Issue: Supabase JWT validation fails

**Solution:**
- Verify `SUPABASE_JWT_SECRET` matches your Supabase project
- Check token expiration
- Ensure Bearer token format: `Authorization: Bearer <token>`

---

## 📚 Documentation

Comprehensive documentation is available in the `apps/docs/` directory:

- **[ARCHITECTURE.md](./apps/docs/ARCHITECTURE.md)** - Detailed system architecture
- **[REPORT.md](./apps/docs/REPORT.md)** - Project report with trade-offs analysis
- **[ADR/](./apps/docs/ADR/)** - Architectural Decision Records
  - ADR-001: RabbitMQ vs Kafka
  - ADR-002: Redis Geospatial for Driver Location
  - ADR-003: gRPC for Internal Communication
  - ADR-004: Supabase for Authentication
  - ADR-005: Database Per Service Pattern
  - ADR-006: Nx Monorepo Structure
- **[openapi.yaml](./apps/docs/openapi.yaml)** - OpenAPI 3.0 specification

---

## 👥 Team Members

**Course:** SE360 - Cloud-Native System Architecture  
**University:** University of Information Technology (UIT)  
**Class:** SE360.Q11  
**Semester:** 1st Semester, 2025-2026

| Name | Student ID | Responsibilities |
|------|------------|------------------|
| **Không Huỳnh Ngọc Hân** | 23520427 | Auth Service, User Service, Terraform, Docker Compose, Documentation |
| **Ngô Quang Tiến** | 23521574 | Project Init, Database Design, Driver Service, Trip Service |
| **Nguyễn Hữu Duy** | 23520374 | Notification Service, RabbitMQ Integration |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **NestJS** for the amazing framework
- **Nx** for monorepo management
- **Supabase** for authentication BaaS
- **Course Instructor** for guidance and support

---

## 📞 Contact

For questions or support, please reach out to:
- **Email**: 23520427@gm.uit.edu.vn
- **Repository**: https://github.com/quangtienngo661/uit-go-backend

---

**Built with ❤️ by UIT-Go Team**
