# proyecto-paginas-web — Backend API

REST API for the proyecto_paginas_web system.
Built with **Node.js**, **Express**, and **PostgreSQL**.

---

## Tech Stack

| Layer       | Technology           |
|-------------|----------------------|
| Runtime     | Node.js 20 LTS       |
| Framework   | Express              |
| Database    | PostgreSQL 16 (`pg`) |
| Auth        | bcrypt               |
| Environment | dotenv               |
| CORS        | cors                 |
| Dev server  | nodemon              |
| Container   | Docker + Compose     |

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
│   │   ├── cliente.controller.js
│   │   ├── entrenador.controller.js
│   │   ├── permiso.controller.js
│   │   ├── rol.controller.js
│   │   └── usuario.controller.js
│   ├── services/
│   │   ├── cliente.service.js
│   │   ├── entrenador.service.js
│   │   ├── permiso.service.js
│   │   ├── rol.service.js
│   │   └── usuario.service.js
│   ├── routes/
│   │   ├── cliente.routes.js
│   │   ├── entrenador.routes.js
│   │   ├── permiso.routes.js
│   │   ├── rol.routes.js
│   │   └── usuario.routes.js
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
Each layer has a single responsibility and only communicates with the layer directly below it.

```
HTTP Request
     │
     ▼
┌──────────┐
│  Routes  │  Defines endpoints, maps them to controller functions
└────┬─────┘
     │
     ▼
┌─────────────┐
│ Controllers │  Handles req/res, delegates business logic to service
└──────┬──────┘
       │
       ▼
┌──────────┐
│ Services │  Business logic + parameterized SQL via pg Pool
└────┬─────┘
     │
     ▼
┌──────────────┐
│  PostgreSQL  │
└──────────────┘
```

**Routes** (`src/routes/`)
Define URL paths and HTTP methods. No logic here.

**Controllers** (`src/controllers/`)
Receive `req`/`res`, call the service, send the response. All errors forwarded via `next(err)`.

**Services** (`src/services/`)
Own all business logic and SQL. Use parameterized queries to prevent SQL injection. Return plain data — no HTTP awareness.

**Config** (`src/config/db.js`)
Single shared `pg.Pool` instance configured from environment variables.

**Middleware** (`src/middleware/errorMiddleware.js`)
- `notFound` — 404 handler for unmatched routes.
- `errorHandler` — global JSON error responder. Includes stack trace outside production.

---

## Database Migrations

Files in `database/migrations/` are named with a numeric prefix to control execution order.

```
database/migrations/
├── 001_initial_schema.sql   # roles, permisos, rol_permisos, usuarios
└── 002_...sql               # next migration (add when needed)
```

**How it works:**
The Postgres Docker image auto-executes every `*.sql` file in `/docker-entrypoint-initdb.d/` on first startup (empty volume). `docker-compose.yml` mounts `./database/migrations` to that path, so migrations run in filename order automatically.

**Adding a migration:**
```bash
# 1. Create the file
touch database/migrations/002_clientes_entrenadores.sql

# 2. Wipe the volume and restart (WARNING: destroys existing data)
docker compose down -v
docker compose up --build
```

---

## Docker Setup

### Services

| Service | Container                    | Port | Description                         |
|---------|------------------------------|------|-------------------------------------|
| `db`    | `proyecto_paginas_web_db`    | 5432 | PostgreSQL 16                       |
| `api`   | `proyecto_paginas_web_api`   | 3000 | Node.js API with nodemon hot-reload |

### nodemon hot-reload

The `api` service mounts the project directory into `/app` in the container. Saving a file locally triggers nodemon to restart the Node process automatically — no rebuild needed.

`node_modules` is kept as a separate anonymous volume inside the container so macOS binaries don't conflict with the container's Linux binaries.

---

## Getting Started

### Docker Compose (recommended)

**Prerequisite:** Docker Desktop running.

```bash
# 1. Copy and configure environment
cp .env.example .env
# Set DB_PASSWORD. Leave DB_HOST=db for Docker.

# 2. Start everything
docker compose up --build

# 3. Stop
docker compose down

# 4. Full reset (wipes DB volume, reruns migrations)
docker compose down -v && docker compose up --build
```

API → `http://localhost:3000`
PostgreSQL → `localhost:5432`

### Local (without Docker)

**Prerequisites:** Node.js 20+ and a running PostgreSQL instance.

```bash
npm install
cp .env.example .env
# Set DB_HOST=localhost and your credentials

psql -U postgres -d proyecto_paginas_web -f database/migrations/001_initial_schema.sql

npm run dev
```

---

## API Endpoints

Base URL: `http://localhost:3000/api`

### Roles
| Method | Endpoint                  | Description               |
|--------|---------------------------|---------------------------|
| GET    | `/roles`                  | List all roles            |
| GET    | `/roles/:id`              | Get role by ID            |
| POST   | `/roles`                  | Create role               |
| PUT    | `/roles/:id`              | Update role               |
| PATCH  | `/roles/:id/estado`       | Toggle role active state  |
| PUT    | `/roles/:id/permisos`     | Assign permissions to role|

### Permisos
| Method | Endpoint          | Description            |
|--------|-------------------|------------------------|
| GET    | `/permisos`       | List all permissions   |
| GET    | `/permisos/:id`   | Get permission by ID   |

### Usuarios
| Method | Endpoint                    | Description             |
|--------|-----------------------------|-------------------------|
| GET    | `/usuarios`                 | List active users       |
| GET    | `/usuarios/:id`             | Get user by ID          |
| POST   | `/usuarios`                 | Create user             |
| PUT    | `/usuarios/:id`             | Update user             |
| PATCH  | `/usuarios/:id/estado`      | Toggle user active state|
| DELETE | `/usuarios/:id`             | Archive user            |

### Clientes
| Method | Endpoint                     | Description          |
|--------|------------------------------|----------------------|
| GET    | `/clientes`                  | List active clients  |
| GET    | `/clientes/:id`              | Get client by ID     |
| POST   | `/clientes`                  | Create client        |
| PUT    | `/clientes/:id`              | Update client        |
| PATCH  | `/clientes/:id/archivar`     | Archive client       |

### Entrenadores
| Method | Endpoint                        | Description            |
|--------|---------------------------------|------------------------|
| GET    | `/entrenadores`                 | List active trainers   |
| GET    | `/entrenadores/:id`             | Get trainer by ID      |
| POST   | `/entrenadores`                 | Create trainer         |
| PUT    | `/entrenadores/:id`             | Update trainer         |
| PATCH  | `/entrenadores/:id/archivar`    | Archive trainer        |

### Response shape

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "message": "...", "stack": "..." }
```

---

## Adding a New Resource

1. `src/services/[resource].service.js` — SQL queries
2. `src/controllers/[resource].controller.js` — req/res handling
3. `src/routes/[resource].routes.js` — endpoint definitions
4. Register in `src/app.js`:
   ```js
   app.use('/api/[resource]', require('./routes/[resource].routes'));
   ```
5. Add a migration if the resource needs a new table.
