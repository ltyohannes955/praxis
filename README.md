# PRAXIS

AI-powered planning application that generates personalized learning and development plans using Ollama. Built with a modern monorepo architecture.

## Features

- **AI Plan Generation** - Generate structured plans from natural language prompts using Ollama
- **Task Management** - Auto-generated tasks with XP values for gamification
- **User Authentication** - Secure JWT-based authentication with refresh tokens
- **Dark/Light Theme** - System preference detection with manual toggle
- **Real-time Updates** - Background job processing with BullMQ
- **Responsive Design** - Mobile-first approach with elegant typography

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 18, Redux Toolkit |
| **Backend** | Express.js, JWT Authentication |
| **Database** | PostgreSQL with Prisma ORM |
| **Queue** | BullMQ with Redis |
| **AI** | Ollama (local LLM inference) |
| **Build** | Turborepo, pnpm |

## Project Structure

```
PRAXIS/
├── apps/
│   ├── api/          # Express REST API (port 5000)
│   ├── web/          # Next.js frontend (port 3000)
│   └── worker/       # BullMQ background workers
├── packages/
│   ├── database/     # Prisma schema and client
│   ├── ai/           # Ollama AI service
│   └── shared/       # Shared utilities, schemas, types
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

## Prerequisites

- Node.js 18+
- pnpm 9+
- Docker & Docker Compose
- Ollama (for local AI inference)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/praxis.git
cd praxis
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://praxis:praxis@localhost:5432/praxis` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for JWT signing | *Required* |
| `OLLAMA_BASE_URL` | Ollama API endpoint | `http://localhost:11434` |
| `AI_MODEL` | Ollama model to use | `mistral` |
| `PORT` | API server port | `5000` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |

### 4. Start infrastructure services

```bash
pnpm docker:up
```

This starts PostgreSQL, Redis, and Ollama containers.

### 5. Run database migrations

```bash
pnpm db:migrate
```

### 6. Pull Ollama model

```bash
docker exec -it praxis-ollama ollama pull mistral
```

### 7. Start development servers

```bash
pnpm dev
```

- **Frontend**: http://localhost:3000
- **API**: http://localhost:5000

## Docker Deployment

Build and run all services:

```bash
pnpm docker:build
pnpm docker:up
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps for production |
| `pnpm lint` | Run ESLint across all apps |
| `pnpm test` | Run tests across all apps |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:migrate` | Run database migrations |
| `pnpm docker:up` | Start Docker containers |
| `pnpm docker:down` | Stop Docker containers |

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/signup/email` | Create new account |
| `POST` | `/api/v1/auth/signin/email` | Sign in to account |
| `POST` | `/api/v1/auth/logout` | Sign out |
| `GET` | `/api/v1/auth/me` | Get current user |
| `POST` | `/api/v1/auth/refresh` | Refresh access token |

### Plans

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/plans` | List all plans (paginated) |
| `GET` | `/api/v1/plans/:id` | Get plan by ID |
| `POST` | `/api/v1/plans` | Create a plan |
| `POST` | `/api/v1/plans/generate` | Generate plan with AI |
| `PUT` | `/api/v1/plans/:id` | Update a plan |
| `DELETE` | `/api/v1/plans/:id` | Delete a plan |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/tasks` | List all tasks |
| `GET` | `/api/v1/tasks/:id` | Get task by ID |
| `PUT` | `/api/v1/tasks/:id` | Update a task |
| `DELETE` | `/api/v1/tasks/:id` | Delete a task |

## Background Jobs

| Queue | Description |
|-------|-------------|
| `plan-generation` | Generates plans from prompts using AI |
| `xp-recalculation` | Recalculates user XP totals |
| `task-regeneration` | Regenerates individual tasks |

## Development

### Database Schema

```
User
├── id: String (cuid)
├── email: String (unique)
├── name: String?
├── password: String
├── plans: Plan[]
├── refreshTokens: RefreshToken[]
└── timestamps

Plan
├── id: String (cuid)
├── title: String
├── description: String?
├── content: Json?
├── status: Enum (PENDING, PROCESSING, COMPLETED, FAILED)
├── xpEarned: Int
├── tasks: Task[]
└── timestamps

Task
├── id: String (cuid)
├── title: String
├── description: String?
├── content: Json?
├── status: Enum
├── order: Int
├── xpValue: Int
├── planId: String
└── timestamps

RefreshToken
├── id: String (cuid)
├── token: String (hashed)
├── expires: DateTime
├── userId: String
└── timestamps
```

### Adding a new package

```bash
mkdir packages/my-package
cd packages/my-package
pnpm init
```

Update `pnpm-workspace.yaml` if needed.

## License

MIT
