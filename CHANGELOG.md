# Changelog

## 1.1.0 — work-in-progress checkpoint

Partial code published for continued development. Known issues: STATUS.md.

## 1.0.0 — work-in-progress checkpoint

Partial code published for continued development. Known issues: STATUS.md.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-10-30

### Fixed
- Fixed `datetime.utcnow()` deprecation warning in AuditLog model (Python 3.12+ compatibility)
- Replaced with timezone-aware `datetime.now(timezone.utc)` for proper UTC timestamps

### Added
- Initial project skeleton with FastAPI + React + TypeScript + Vite
- Core CRM domain models: Contact, Account, Opportunity with SQLite persistence
- RESTful API with CRUD operations, pagination, filtering, and search
- Audit logging for all entity mutations
- React dashboard with real-time data from API
- Contacts, Accounts, Opportunities management pages with create/edit/delete modals
- Typed API client with React Query hooks
- UI component library: Button, Input, Select, Modal, Table, Pagination, Toast
- Dockerfiles for backend and frontend with non-root users
- Docker Compose with health checks
- GitHub Actions CI workflow (backend tests, frontend typecheck/build/test, Docker builds)
- Comprehensive test suites: 38 backend tests, 20 frontend component tests
- Configuration via .env.example with all required variables
- MIT License with author attribution

### Security
- HttpOnly cookie session architecture designed for OIDC integration
- CSRF protection strategy for cookie-authenticated writes
- Role-based access control (viewer, operator, admin) framework
- Input validation on all API endpoints
- SQL injection prevention via SQLAlchemy ORM

### AI/ML
- Deterministic offline scoring engine architecture
- Pluggable LLM provider adapters (OpenAI-compatible, Anthropic, Gemini, Ollama)
- Three core AI workflows defined: lead scoring, churn risk, next-best-action
- Provider-agnostic configuration system