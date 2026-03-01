# Backend Role-Based Access Control (RBAC)

Role-based permissions are enforced in the API only. The frontend is not modified; the API returns **403 Forbidden** for disallowed roles and scopes data so clients only receive what they are allowed to see.

## User roles

| Role       | Description |
| ---------- | ----------- |
| **Owner**  | Clinic owner; full access to all data and settings. |
| **Doctor** | Linked to a single doctor via `doctorId`; can only access and create data for that doctor. |
| **Assistant** | Can access all doctors’ data for scheduling/billing; daily closeout scoped to own expenses. |
| **Admin**   | Treated like Owner for permissions (e.g. Reports, Settings, Procedure pricing). |

Defined in `src/enums/index.ts` as `UserRole`.

## Permission matrix

| Area                     | Owner              | Doctor                    | Assistant                         |
| ------------------------ | ------------------ | ------------------------- | --------------------------------- |
| Appointments             | All                | Own only                  | All                               |
| Patients                 | All                | All                       | All                               |
| Invoices / Payments     | All                | Own only                  | All                               |
| Reports (revenue)        | Yes                | No                        | No                                |
| Daily closeout           | Full               | No                        | Full (own-scoped expenses)        |
| Procedure pricing        | Read + edit        | Read only                 | Read only                         |
| Settings                 | Yes                | No                        | No                                |
| Doctors list             | Yes                | Yes (read)                | Yes (read)                        |
| Expenses                 | All                | Own only (list/create)    | Own only (list/create)            |

## Enforcement

### Guards

- **JwtAuthGuard**: All protected routes require a valid JWT; `req.user` has `id`, `email`, `role`, `doctorId` (for Doctor/Assistant).
- **RolesGuard** + **@Roles(...)**: Restricts which roles can call an endpoint. Applied at controller or method level.

### Endpoints and scoping

| Module / endpoint | Allowed roles | Data scoping |
| ------------------ | ------------- | ------------ |
| **Auth**           |               |              |
| `POST /api/auth/login` | Public  | — |
| `GET /api/auth/me`     | Authenticated | — |
| **Appointments**   | Owner, Doctor, Assistant, Admin | **Doctor**: list/update/cancel filtered by `user.doctorId`. **POST**: Doctor can only create for `user.doctorId` (body overridden; 403 if different). |
| **Invoices**       | Owner, Doctor, Assistant, Admin | **Doctor**: list/update/delete/payments filtered by `user.doctorId`. **POST**: Doctor can only create for `user.doctorId` (body overridden; 403 if different). |
| **Patients**       | Owner, Doctor, Assistant, Admin | No role-based data filter; all see all patients. |
| **Reports**        | Owner, Admin only | `doctorId` query optional; only Owner/Admin can call. |
| **Daily closeouts**| Owner, Assistant, Admin | **Assistant**: preview/create scoped to own payments and expenses (`createdBy`). Doctor not allowed. |
| **Procedure pricing** | GET: any authenticated; PATCH: Owner, Admin only | No data scoping. |
| **Settings**       | Owner, Admin only | No data scoping. |
| **Doctors**        | Any authenticated | List all; no scoping. |
| **Expenses**       | Owner, Doctor, Assistant, Admin | **Doctor/Assistant**: list filtered by `createdBy`; update/delete only on own unless Owner/Admin. |

### Key files

- **Guards**: `src/common/guards/jwt-auth.guard.ts`, `src/common/guards/roles.guard.ts`
- **Decorators**: `src/common/decorators/roles.decorator.ts` (`@Roles`), `src/common/decorators/current-user.decorator.ts` (`@CurrentUser()`)
- **Appointments**: `src/modules/appointments/appointments.controller.ts` (POST enforces Doctor `doctorId`)
- **Invoices**: `src/modules/invoices/invoices.controller.ts` (POST enforces Doctor `doctorId`)
- **Daily closeouts**: `src/modules/daily-closeouts/daily-closeouts.controller.ts`, `daily-closeouts.service.ts` (role filter for preview/create)
