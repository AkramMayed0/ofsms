# OFSMS - Orphan Family Support Management System

OFSMS is a comprehensive platform for managing orphan sponsorships, family support, and financial disbursements. It follows a monorepo structure with a Node.js/Express backend and a Next.js frontend.

## 🏗 Architecture & Tech Stack

### Monorepo Structure
- `apps/backend`: Node.js/Express API.
- `apps/frontend`: Next.js Web Application.
- `apps/infra`: Infrastructure configurations (Nginx).

### Backend (@ofsms/backend)
- **Framework:** Express.js
- **Database:** PostgreSQL (with `pg` and `pg-migrate` style migrations).
- **Authentication:** JWT (Access + Refresh tokens) with RBAC.
- **External Services & Local Development:**
  - **S3 Storage:** Production uses AWS S3; Local dev simulates uploads if `S3_BUCKET_NAME` is missing.
  - **Firebase:** FCM for notifications.
- **Key Libraries:** `exceljs`, `pdfkit`, `node-cron`, `express-validator`.

### Frontend (@ofsms/frontend)
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **Validation:** React Hook Form

## 🔐 Authentication & RBAC

### Roles
- `agent`: Field workers managing family data.
- `supervisor`: Oversees agents and approves reports/disbursements.
- `finance`: Manages financial releases and receipts.
- `gm`: General Manager with full oversight.
- `sponsor`: External users who sponsor orphans.

### Token Strategy
- **Access Token:** 30-minute expiry (resets on activity).
- **Refresh Token:** 7-day expiry (stored in `httpOnly` cookie).
- **Middleware:** `authenticate` and `authorize(...roles)` in `rbac.js`.

## 📂 Backend Module Structure
Modules in `src/modules` follow a Controller-Service-Route pattern:
- `*.routes.js`: Endpoints and RBAC.
- `*.controller.js`: Request handling.
- `*.service.js`: Business logic and DB queries.

## 🗄 Database Schema
Located in `apps/backend/src/db/migrations`:
- Core entities: `users`, `governorates`, `sponsors`, `orphans`, `families`, `disbursements`, `quran_reports`, `notifications`, `audit_logs`.

## 🛠 Workflows

### Seeding & Test Data
- **Test Users:** Use `node apps/backend/scripts/create-test-user.js` to create a GM account:
  - Email: `gm@ofsms.local`
  - Password: `Test@1234`
- **Other Scripts:** `apps/backend/scripts/` contains scripts for seeding data and testing flows.

### Development
- `npm run dev`: Starts both backend and frontend concurrently from the root.
- Backend: `nodemon src/index.js` (Port 4000)
- Frontend: `next dev` (Port 3000)

### Disbursement Flow
1. Drafted (Agent/Finance).
2. Supervisor Approval.
3. Finance Approval.
4. Released (Funds disbursed).

## 📝 Conventions
- **Language:** Backend comments and error messages are in Arabic.
- **API Responses:** Standardized `{ status: 'ok' }` or `{ error: 'message' }`.
- **Naming:** CamelCase for JS, snake_case for DB columns.
