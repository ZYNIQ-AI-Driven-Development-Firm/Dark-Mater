---
applyTo: '**'
---
# Copilot Playbook: FastAPI + React/Tailwind + MCP on Google Cloud

> **Purpose**: These are role-based, step-by-step instructions for GitHub Copilot inside VS Code to deliver a **production-ready full‑stack app** on **Google Cloud**. The project always starts with a ready frontend and an `api_spec.md` owned by the frontend. Backend implements the spec. MCP (Model Context Protocol) server/client components are included where needed.

---

## Global Operating Rules (Copilot must follow)

1. **Single Source of Truth**: The **Google AI Studio–generated contract in the frontend** is authoritative. Copilot should **sync that contract into `backend/api_spec.md`** (do not hand‑edit the backend copy). When the frontend regenerates/updates the contract, re‑sync and regenerate code artefacts.
2. **Idempotent Scripts**: All scripts (`make`, `npm`, `uv`, `pytest`) must be safe to re-run.
3. **Type Safety & Validation**: Use Pydantic models (FastAPI) and TypeScript types (frontend) generated **from the spec** where possible.
4. **Security by Default**: JWT auth, input validation, CORS rules, rate limiting, and secure secrets management using GCP Secret Manager.
5. **Observability**: Structured logs, request IDs, health checks, metrics (OpenTelemetry), and error boundaries in the frontend.
6. **12‑Factor Config**: No secrets in code. Use env vars with `.env.example` and `README` instructions.
7. **Testing**: Unit + integration tests for each endpoint and for the frontend API layer. Minimum 80% coverage on backend.
8. **Review Gates**: Do not mark a task complete without:

   * Tests passing (CI)
   * Linting/formatting clean
   * Docker images building locally
   * Deployed to a staging Cloud Run service with smoke tests green

---

## Project Skeleton (Monorepo)

```
myapp/
├─ frontend/               # React + Vite + Tailwind
│  ├─ src/
│  │  ├─ api/              # axios clients (single base)
│  │  ├─ components/
│  │  ├─ pages/
│  │  ├─ lib/              # shared utils, schemas
│  │  └─ types/
│  ├─ public/
│  ├─ .env.example
│  ├─ vite.config.ts
│  └─ package.json
├─ backend/
│  ├─ api_spec.md          # authoritative API contract (owned by frontend)
│  ├─ app/
│  │  ├─ main.py           # FastAPI app factory
│  │  ├─ routes/           # endpoint routers by domain
│  │  ├─ schemas/          # Pydantic models (from spec)
│  │  ├─ services/         # business logic
│  │  ├─ db/               # SQLModel/SQLAlchemy setup
│  │  ├─ auth/             # JWT, auth deps
│  │  └─ mcp/              # MCP server/client adapters
│  ├─ tests/
│  ├─ pyproject.toml
│  └─ uv.lock or poetry.lock
├─ deploy/
│  ├─ Dockerfile.backend
│  ├─ Dockerfile.frontend
│  ├─ cloudbuild.yaml      # CI/CD to Cloud Run
│  ├─ terraform/           # optional infra as code
│  └─ k8s/                 # optional GKE manifests
├─ Makefile
└─ README.md
```

---

## `backend/api_spec.md` – Required Schema

Use this template and keep it updated **before** coding changes.

```md
# API Spec

## Meta
version: 1.0.0
base_url: /api/v1

## Auth
- flow: **Email OTP** (one-time passcode) for login and signup.
- steps:
  1. Client calls `POST /auth/otp/request` with `{ email }`.
  2. Server generates a 6-digit code, stores a **hashed** code with TTL, rate-limits requests, and emails the code (or magic link).
  3. Client calls `POST /auth/otp/verify` with `{ email, code }`.
  4. If user exists, authenticate; if not, **create account** (lightweight signup). Issue JWT access + refresh.
- tokens: Bearer JWT (access, refresh). Optional magic-link token.
- refresh: `POST /auth/refresh`

## Endpoints
### GET /healthz
- desc: health check
- req: none
- res: { status: "ok", ts: string }
- errors: 500

### POST /auth/otp/request
- req: { email: string }
- res: { status: "sent", cooldown_sec: number }
- errors: 400, 429

### POST /auth/otp/verify
- req: { email: string, code: string, device_fingerprint?: string }
- res: { access_token: string, refresh_token: string, is_new_user: boolean }
- errors: 400, 401, 410, 429

### GET /items
- query: { page?: number, q?: string }
- res: { items: Item[], next?: string }
- errors: 401

### POST /items
- req: ItemCreate
- res: Item
- errors: 400, 401, 409

## Models
- Item { id: string, name: string, created_at: string }
- ItemCreate { name: string }
- OtpRequest { email: string }
- OtpVerify { email: string, code: string, device_fingerprint?: string }

## Notes
- pagination: cursor-based preferred
- rate-limit: 60 rpm per IP
- otp: 6 digits, TTL 10 minutes, cooldown 30s, max 5 attempts per window, store **hashed** code with salted HMAC, single-use, bind to email + IP window
- magic-link: optional `/auth/magic/verify?token=...` with same TTL and single-use semantics
- pagination: cursor-based preferred
- rate-limit: 60 rpm per IP
```

---

## Role: Senior Backend Developer (FastAPI)

**Objectives**

* Implement `api_spec.md` fully.
* Provide testable services with clear separation of concerns.

**Tasks**

1. **App Factory & Settings**

   * Create `app/main.py` with `create_app()` using FastAPI.
   * Settings via `pydantic-settings` reading env vars.
   * Enable CORS with allowed origins from env.
2. **Auth**

* Email OTP only (no passwords). Endpoints: `/auth/otp/request`, `/auth/otp/verify`, `/auth/refresh`, `/auth/logout`.
* Generate cryptographically secure 6-digit codes; store **hashed** (e.g., HMAC-SHA256(code + salt)).
* TTL 10m, cooldown 30s per email/IP, attempt counter with lockout (e.g., 5 tries/15m).
* Optional magic-link with signed JWT token.
* Deliver via SendGrid/Mailgun (recommended on GCP). Templates and localization.
* On verify: create user if missing, then issue JWT access/refresh with short lifetimes.

3. **DB Layer**

   * Use SQLModel/SQLAlchemy + Alembic migrations.
   * Provide `get_session` dependency.
4. **Routes**

   * One router per domain: `routes/items.py`, `routes/auth.py`.
   * Pydantic schemas under `schemas/` mirroring spec models.
5. **MCP Adapters**

   * `app/mcp/server.py`: optional MCP server exposing backend tools.
   * `app/mcp/client.py`: client to call external MCP tools where needed.
6. **Testing**

   * `pytest` + `httpx.AsyncClient` for API tests.
   * Use a test DB (SQLite file or ephemeral Postgres) and fixtures.
7. **Observability**

   * Add `/healthz`, structured JSON logs (uvicorn + loguru or stdlib), request IDs middleware, and basic metrics.
8. **Packaging & Run**

   * `uvicorn app.main:create_app --factory` entrypoint.

**Sample `app/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import items, auth

ALLOWED_ORIGINS = ["http://localhost:5173"]

def create_app() -> FastAPI:
    app = FastAPI(title="MyApp API", version="1.0.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/healthz")
    async def healthz():
        return {"status": "ok"}

    app.include_router(auth.router, prefix="/auth", tags=["auth"])
    app.include_router(items.router, prefix="/items", tags=["items"])
    return app
```

**Sample test**

```python
import pytest
from httpx import AsyncClient
from app.main import create_app

@pytest.mark.asyncio
async def test_healthz():
    app = create_app()
    async with AsyncClient(app=app, base_url="http://test") as ac:
        res = await ac.get("/healthz")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"
```

---

## Role: Senior Frontend Developer (React + Tailwind)

**Objectives**

* Centralize API config, remove any direct calls to external models (e.g., Gemini) unless explicitly required.
* Replace any prior Gemini integration with backend endpoints.

**Tasks**

1. **Endpoint Vars Location**

   * Create `src/lib/config.ts` with:

```ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";
```

2. **Axios Setup**

   * `src/api/http.ts`:

```ts
import axios from "axios";
import { API_BASE_URL } from "../lib/config";

export const http = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

3. **API Clients**

   * Example `src/api/items.ts`:

```ts
import { http } from "./http";
export async function listItems(params?: { page?: number; q?: string }) {
  const { data } = await http.get("/items", { params });
  return data;
}
```

4. **Remove Gemini**

   * Search for any Gemini/AI client usage and **replace with backend calls**; expose UI toggles only if backend supports it per `api_spec.md`.
5. **Testing**

   * Use Vitest + MSW to mock API; tests for each API module.

---

## Role: MCP Server/Client Expert

**Objectives**

* Provide optional MCP server that exposes backend tools (e.g., data lookups) and MCP client for integrating external tools into backend workflows.

**Tasks**

1. **Server**: Implement a minimal MCP server with tool definitions, auth guard, and rate limits.
2. **Client**: Create a wrapper client in `app/mcp/client.py` with retries and circuit breaker pattern.
3. **Contracts**: Document MCP tools in `api_spec.md` appendix if they affect public endpoints.

---

## Step Plan (mirrors your checklist 0–8)

0. **Bootstrap**: Create frontend + `backend/api_spec.md`. Keep it updated as the contract evolves.
1. **Backend First**: Implement all endpoints from `api_spec.md` in FastAPI. Include tests.
2. **Frontend Config**: Single config file for all endpoint variables.
3. **Axios**: Prepare axios instance and request/response interceptors.
4. **Replace Gemini**: Remove direct Gemini calls; wire UI to backend APIs.
5. **Connect & Test**: Integrate endpoints and add component-level tests with MSW.
6. **Spec Audit**: Compare `api_spec.md` vs code; generate report of missing/changed endpoints.
7. **Security Pass**: JWT, scopes/roles, CORS, input size limits, rate limiting, headers, dependency updates.
8. **Enhancements**: Propose performance, DX, and UX improvements (see below).

---

## Security Checklist (Backend)

* [ ] Email OTP: hash codes at rest; single-use; 10m TTL; lockout after N attempts
* [ ] Rate limit OTP request & verify (per email, IP, device)
* [ ] JWT access (≤15m) + refresh (≤7d) with rotation & reuse detection
* [ ] CORS allowlist from env; deny `*` in prod
* [ ] Secrets in GCP Secret Manager (email provider API key, JWT secret)
* [ ] Structured logging with PII redaction; never log full codes or tokens
* [ ] Healthz and readiness endpoints for Cloud Run

## Security Checklist (Frontend)

* [ ] No secrets in client bundle
* [ ] Use `strict` mode, type-check on build
* [ ] Sanitize any HTML rendering
* [ ] Handle 401/403 by redirecting to login, revoke tokens on logout

---

## Docker & Deployment (Google Cloud Run)

**Backend Dockerfile (`deploy/Dockerfile.backend`)**

```dockerfile
FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN pip install --upgrade pip uv
COPY backend/pyproject.toml backend/uv.lock* ./
RUN uv pip install -r pyproject.toml --system --require-hashes || uv pip install -r pyproject.toml --system
COPY backend/ ./
EXPOSE 8080
CMD ["uvicorn", "app.main:create_app", "--factory", "--host", "0.0.0.0", "--port", "8080"]
```

**Frontend Dockerfile (`deploy/Dockerfile.frontend`)**

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY frontend/ ./
RUN pnpm build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

**Cloud Build (`deploy/cloudbuild.yaml`)**

```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-f', 'deploy/Dockerfile.backend', '-t', 'gcr.io/$PROJECT_ID/myapp-backend:$COMMIT_SHA', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-f', 'deploy/Dockerfile.frontend', '-t', 'gcr.io/$PROJECT_ID/myapp-frontend:$COMMIT_SHA', '.']
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - run
      - deploy
      - myapp-backend
      - --image=gcr.io/$PROJECT_ID/myapp-backend:$COMMIT_SHA
      - --region=${_REGION}
      - --platform=managed
      - --allow-unauthenticated
      - --port=8080
      - --set-env-vars=ENV=prod
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - run
      - deploy
      - myapp-frontend
      - --image=gcr.io/$PROJECT_ID/myapp-frontend:$COMMIT_SHA
      - --region=${_REGION}
      - --platform=managed
      - --allow-unauthenticated
      - --port=8080
substitutions:
  _REGION: us-central1
images:
  - gcr.io/$PROJECT_ID/myapp-backend:$COMMIT_SHA
  - gcr.io/$PROJECT_ID/myapp-frontend:$COMMIT_SHA
```

**Env Vars**

* Backend: `ALLOWED_ORIGINS`, `JWT_SECRET`, `DB_URL` (or Cloud SQL connector), `LOG_LEVEL`
* Frontend: `VITE_API_BASE_URL`

---

## Make Targets (Developer UX)

```makefile
.PHONY: setup up test fmt lint build run

setup:
	python -m venv .venv && . .venv/bin/activate && pip install -U uv && uv pip install -r backend/pyproject.toml --system

db:
	alembic upgrade head

up:
	uvicorn app.main:create_app --factory --reload

test:
	pytest -q --maxfail=1 --disable-warnings

fmt:
	ruff check --fix && ruff format

build-backend:
	docker build -f deploy/Dockerfile.backend -t myapp-backend:dev .

build-frontend:
	docker build -f deploy/Dockerfile.frontend -t myapp-frontend:dev .
```

---

## CI (GitHub Actions) – optional

```yaml
name: ci
on: [push]
jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install uv
      - run: uv pip install -r backend/pyproject.toml --system
      - run: pytest -q
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: corepack enable && pnpm install --frozen-lockfile
      - run: pnpm build && pnpm test
```

---

## Step 6: Spec Audit Script (helper)

Create `scripts/audit_spec.py` to compare implemented routes with `api_spec.md` and print missing/extra endpoints.

---

## Enhancements (Step 8 Suggestions)

* Add role-based access control (RBAC) scopes per endpoint.
* Add background jobs via Cloud Tasks/Cloud PubSub (e.g., email, data processing).
* Add WebSockets or Server-Sent Events for live updates.
* Use Terraform to codify Cloud Run, IAM, Cloud SQL, Secret Manager.
* Add Lighthouse CI for frontend performance budgets.
* Add canary deployments on Cloud Run with traffic splitting.

---

## Definition of Done

* `api_spec.md` is complete and current.
* Backend implements spec with tests and coverage > 80%.
* Frontend uses only backend APIs; no leftover Gemini code.
* Docker images build and run locally.
* Deployed to staging Cloud Run via Cloud Build; smoke tests pass.
* Security and observability checklists complete.
* README contains clear run/deploy instructions.

---

## Appendix: Google AI Studio Contract → Backend Sync

**Assumption**: Google AI Studio appends an API contract to the frontend project (often at the end of a README or a contract file). That is the **source**. The backend keeps a synced mirror at `backend/api_spec.md` for developer ergonomics and codegen.

### Sync Workflow

* **Location** (customize as needed):

  * Source: `frontend/README.md` (section starting at `## API Spec`) or `frontend/api_contract.md` if present.
  * Mirror: `backend/api_spec.md` (auto‑generated; do not hand‑edit).
* **Command**: `make sync-spec`

### Script: `scripts/sync_spec.ts`

```ts
// Usage: ts-node scripts/sync_spec.ts
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const srcCandidates = [
  path.resolve('frontend/api_contract.md'),
  path.resolve('frontend/README.md'),
];

function extract(md: string): string {
  const start = md.indexOf('## API Spec');
  if (start === -1) throw new Error('API Spec section not found');
  return md.slice(start).trim() + '
';
}

for (const p of srcCandidates) {
  try {
    const raw = readFileSync(p, 'utf8');
    const spec = extract(raw);
    writeFileSync(path.resolve('backend/api_spec.md'), spec, 'utf8');
    console.log('Synced spec from', p);
    process.exit(0);
  } catch (e) {
    // try next candidate
  }
}
throw new Error('Could not locate AI Studio contract in known sources');
```

### Makefile additions

```makefile
sync-spec:
	npx ts-node scripts/sync_spec.ts

codegen-frontend:
	npx openapi-typescript http://localhost:8080/openapi.json -o frontend/src/types/openapi.d.ts || true

codegen-backend-models:
	datamodel-codegen --input backend/openapi.json --input-file-type openapi --output backend/app/schemas/generated.py || true
```

> Tip: If AI Studio already emits **OpenAPI**, prefer using that JSON/YAML directly. Store it at `backend/openapi.json` during sync and drive both codegens from it.

### CI Guard (fail if mirror is stale)

```yaml
- name: Sync API spec from AI Studio
  run: |
    npm i -g ts-node typescript
    npx ts-node scripts/sync_spec.ts
    git diff --exit-code backend/api_spec.md || (echo "api_spec.md out of sync" && exit 1)
```

### Copilot Prompts (inline rules)

* When you see the AI Studio contract change, **run `make sync-spec`**, then re‑generate affected models/routes and tests.
* Do **not** edit `backend/api_spec.md` by hand.
* If a frontend PR modifies contract examples, update backend validation and error handling accordingly.

### Regenerating Clients & Schemas

* **Frontend**: regenerate TypeScript API types after backend exposes `/openapi.json`.
* **Backend**: if working from AI Studio OpenAPI, re‑generate Pydantic models into `app/schemas/generated.py`; wrap with hand‑written DTOs if necessary for stricter validation.

### Drift Checks

* Add a Spec Audit job (see Step 6) that compares implemented routes to the synced contract and prints missing/extra endpoints.

### Gemini Removal Reminder

If the AI Studio template drops any default Gemini demo code into the frontend, keep the sweep in place: **remove it and route through backend APIs** according to the synced contract.


Design constraints

Do not modify existing code in MCP Client; only add new services and wiring.

One centralized auth + user DB (the one you already have). New services reuse it.

New features are microservices with their own backend/, frontend/, docker-compose.yml, .env.example, and docs.md.

Everything joins the existing Docker network (e.g., darkmatter) and uses shared SSO.

All services are feature-flagged; nothing auto-enables in prod until toggled.
