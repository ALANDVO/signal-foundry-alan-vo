# Product development plan

Each round completes one feature or repair. Future items are planned, not implemented claims.

## Current round

project-skeleton

## Roadmap

### project-skeleton — FastAPI + React project skeleton with Docker

Status: done

Acceptance:
- Backend FastAPI app runs with health endpoint
- Frontend React + TypeScript + Vite app builds
- Docker compose starts both services
- Backend tests pass (pytest)
- Frontend tests pass (vitest)
- CI workflow defined

Implementation: `backend/app/main.py`, `backend/app/api/routes/health.py`, `backend/app/api/routes/contacts.py`, `backend/app/api/routes/accounts.py`, `backend/app/api/routes/opportunities.py`, `backend/app/models/contact.py`, `backend/app/models/account.py`, `backend/app/models/opportunity.py`, `backend/app/models/audit_log.py`, `backend/app/core/config.py`, `backend/app/core/database.py`, `backend/requirements.txt`, `backend/Dockerfile`, `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/pages/DashboardPage.tsx`, `frontend/src/pages/ContactsPage.tsx`, `frontend/src/pages/AccountsPage.tsx`, `frontend/src/pages/OpportunitiesPage.tsx`, `frontend/src/components/ui/Button.tsx`, `frontend/src/components/ui/Input.tsx`, `frontend/src/components/ui/Select.tsx`, `frontend/src/components/ui/Modal.tsx`, `frontend/src/components/ui/Table.tsx`, `frontend/src/components/ui/Pagination.tsx`, `frontend/src/components/Toast.tsx`, `frontend/src/components/Layout.tsx`, `frontend/src/api/client.ts`, `frontend/src/hooks/useApi.ts`, `frontend/src/types/api.ts`, `frontend/package.json`, `frontend/vite.config.ts`, `frontend/Dockerfile`, `frontend/nginx.conf`, `docker-compose.yaml`, `.github/workflows/ci.yml`

Tests: `backend/tests/test_health.py`, `backend/tests/test_contacts.py`, `backend/tests/test_accounts.py`, `backend/tests/test_opportunities.py`, `frontend/src/components/ui.test.tsx`

### core-crm-domain — Core CRM domain models and API

Status: done

Acceptance:
- Contact/Account/Opportunity models with SQLite persistence
- CRUD API endpoints with pagination/filtering
- Input validation and UTC timestamps
- Audit log for mutations

Implementation: `backend/app/models/contact.py`, `backend/app/models/account.py`, `backend/app/models/opportunity.py`, `backend/app/models/audit_log.py`, `backend/app/api/routes/contacts.py`, `backend/app/api/routes/accounts.py`, `backend/app/api/routes/opportunities.py`

Tests: `backend/tests/test_contacts.py`, `backend/tests/test_accounts.py`, `backend/tests/test_opportunities.py`

### auth-oidc-keycloak — OIDC authentication with Keycloak

Status: planned

Acceptance:
- Authorization code flow with PKCE
- HttpOnly cookie sessions with CSRF protection
- Role-based access control (viewer/operator/admin)
- Protected API endpoints
- Login/logout flows

### ai-workflow-engine — AI/ML workflow engine for CRM insights

Status: planned

Acceptance:
- Deterministic offline scoring algorithm
- LLM explanations opt-in with provider adapters
- Three complete workflows: lead scoring, churn risk, next-best-action
- Provider-agnostic configuration

### frontend-dashboard — React dashboard with CRM workflows

Status: done

Acceptance:
- Domain dashboard with real API data
- Create/import/search/detail/export workflows
- Loading/error/empty states
- Typed API client from backend routes

Implementation: `frontend/src/pages/DashboardPage.tsx`, `frontend/src/pages/ContactsPage.tsx`, `frontend/src/pages/AccountsPage.tsx`, `frontend/src/pages/OpportunitiesPage.tsx`, `frontend/src/hooks/useApi.ts`, `frontend/src/api/client.ts`

Tests: `frontend/src/components/ui.test.tsx`

