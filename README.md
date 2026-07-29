# ElectroStock-BE

REST API backend for the ElectroStock inventory management system.
Built with **Node.js**, **Express**, and **PostgreSQL**.

---

## Tech Stack

| Layer       | Technology          |
|-------------|---------------------|
| Runtime     | Node.js 20 LTS      |
| Framework   | Express             |
| Database    | PostgreSQL 16 (`pg`)|
| Environment | dotenv              |
| CORS        | cors                |
| Dev server  | nodemon             |
| Container   | Docker + Compose    |

---

## Project Structure

```
.
├── database/
│   ├── migrations/
│   │   └── 001_initial_schema.sql   # Runs automatically on first DB startup
│   └── seeds/                       # Seed scripts (future use)
├── src/
│   ├── config/
│   │   └── db.js                    # PostgreSQL connection pool
│   ├── controllers/
│   │   └── product.controller.js
│   ├── services/
│   │   └── product.service.js
│   ├── routes/
│   │   └── product.routes.js
│   ├── middleware/
│   │   └── errorMiddleware.js       # 404 + global error handler
│   ├── app.js                       # Express app setup (middleware, routes)
│   └── server.js                    # Entry point — starts the HTTP server
├── .env                             # Local environment variables (git-ignored)
├── .env.example                     # Env template (safe to commit)
├── .dockerignore
├── docker-compose.yml
├── Dockerfile
└── package.json
```

---

## Architecture

The codebase follows a **3-layer architecture**: Routes → Controllers → Services.
Each layer has a single responsibility and communicates only with the layer directly below it.

```
HTTP Request
     │
     ▼
┌──────────┐
│  Routes  │  Defines endpoints and maps them to controller functions
└────┬─────┘
     │
     ▼
┌─────────────┐
│ Controllers │  Handles req/res, validates input, delegates to service
└──────┬──────┘
       │
       ▼
┌──────────┐
│ Services │  Contains business logic, executes parameterized SQL via pg Pool
└────┬─────┘
     │
     ▼
┌──────────────┐
│  PostgreSQL  │  Database
└──────────────┘
```

### Layer responsibilities

**Routes** (`src/routes/`)
Define the URL paths and HTTP methods. Each route maps to exactly one controller function. No logic lives here.

**Controllers** (`src/controllers/`)
Receive `req` and `res`. Extract parameters, call the appropriate service method, and send the HTTP response. All `try/catch` error forwarding happens here via `next(err)`.

**Services** (`src/services/`)
Own all business logic and database interaction. Use the shared `pg` Pool from `src/config/db.js` with parameterized queries to prevent SQL injection. Return plain data objects — no awareness of HTTP.

**Config** (`src/config/db.js`)
Creates and exports a single shared `pg.Pool` instance, configured from environment variables.

**Middleware** (`src/middleware/`)
- `notFound` — catches any request that didn't match a route and forwards a 404 error.
- `errorHandler` — global error responder; returns JSON with `success: false`, the error message, and the stack trace in non-production environments.

---

## Database Migrations

Migration files live in `database/migrations/` and are named with a numeric prefix to control execution order.

```
database/migrations/
└── 001_initial_schema.sql   ← first migration, runs on DB init
```

**How it works:**
PostgreSQL's official Docker image automatically executes every `*.sql` file found in `/docker-entrypoint-initdb.d/` on the very first startup (when the data volume is empty). The `docker-compose.yml` mounts `./database/migrations` to that path, so all migration files run in filename order.

**Adding a new migration:**
Create the next numbered file and restart the DB container with a fresh volume:

```bash
# Create the file
touch database/migrations/002_add_categories.sql

# Rebuild with a clean volume (WARNING: destroys existing data)
docker compose down -v
docker compose up --build
```

---

## Docker Setup

### Services

| Service | Container             | Port  | Description                        |
|---------|-----------------------|-------|------------------------------------|
| `db`    | `electrostock_db`     | 5432  | PostgreSQL 16                      |
| `api`   | `electrostock_api`    | 3000  | Node.js API with nodemon hot-reload|

### How nodemon hot-reload works in Docker

The `api` service mounts the entire project directory into `/app` inside the container. When you save a file locally, nodemon detects the change and restarts the Node process automatically — no rebuild required.

The `node_modules` directory is kept as an anonymous volume inside the container so your local `node_modules` (macOS binaries) don't overwrite the container's Linux binaries.

---

## Getting Started

### Option A — Docker Compose (recommended)

**Prerequisites:** Docker Desktop running.

```bash
# 1. Copy and configure environment
cp .env.example .env
# Edit .env — set your DB_PASSWORD. Leave DB_HOST=db for Docker.

# 2. Build and start all services
docker compose up --build

# 3. Stop all services
docker compose down

# 4. Stop and delete the database volume (full reset)
docker compose down -v
```

The API will be available at `http://localhost:3000`.
PostgreSQL will be available at `localhost:5432`.

### Option B — Local (without Docker)

**Prerequisites:** Node.js 20+ and a local PostgreSQL instance.

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure environment
cp .env.example .env
# Edit .env — set DB_HOST=localhost and your credentials

# 3. Run migrations manually against your local DB
psql -U postgres -d proyecto_paginas_web -f database/migrations/001_initial_schema.sql

# 4. Start dev server
npm run dev
```

---

## API Endpoints

Base URL: `http://localhost:3000/api`

| Method | Endpoint          | Description          |
|--------|-------------------|----------------------|
| GET    | `/products`       | List all products    |
| GET    | `/products/:id`   | Get product by ID    |
| POST   | `/products`       | Create a product     |
| PUT    | `/products/:id`   | Update a product     |
| DELETE | `/products/:id`   | Delete a product     |

### Response shape

All endpoints return a consistent JSON envelope:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "message": "...", "stack": "..." }
```

---

## Adding a New Resource

Each new resource follows the same pattern:

1. `src/routes/[resource].routes.js` — define endpoints
2. `src/controllers/[resource].controller.js` — handle req/res
3. `src/services/[resource].service.js` — SQL queries
4. Register the router in `src/app.js`:
   ```js
   app.use('/api/[resource]', require('./routes/[resource].routes'));
   ```
