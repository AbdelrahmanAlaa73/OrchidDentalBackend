# Orchid Dental Backend (NestJS)

Dental clinic management system API built with **NestJS**, **MongoDB (Mongoose)**, **JWT**, and **bcrypt**.

## Project structure (design patterns)

```
src/
├── main.ts                    # Bootstrap, global ValidationPipe, exception filter
├── app.module.ts              # Root module, Config + Mongoose + feature modules
├── config/                    # Configuration (env-based)
│   ├── configuration.ts
│   └── index.ts
├── enums/                     # Shared enums (DoctorRole, UserRole, InvoiceStatus, etc.)
│   └── index.ts
├── common/                    # Shared cross-cutting concerns
│   ├── decorators/            # @CurrentUser(), @Public(), @Roles()
│   ├── guards/                # JwtAuthGuard, RolesGuard
│   ├── filters/               # AllExceptionsFilter (HTTP error handling)
│   └── utils/                 # FDI tooth validator, addMinutesToTime
├── database/
│   └── seed/                  # Seed on startup (ClinicSettings, ProcedurePricing)
│       ├── seed.module.ts
│       └── seed.service.ts
└── modules/                   # Feature modules (one per domain)
    ├── auth/                  # Login, /me, JWT strategy
    │   ├── schemas/           # User schema
    │   ├── dto/               # LoginDto
    │   ├── strategies/        # JWT passport strategy
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   └── auth.module.ts
    ├── doctors/
    ├── patients/
    ├── appointments/
    ├── invoices/              # Invoice + InvoicePayment + InvoiceItem schemas
    ├── expenses/
    ├── daily-closeouts/
    ├── waiting-list/
    ├── tooth-procedures/
    ├── medical-alerts/
    ├── patient-transfers/
    ├── settings/              # ClinicSettings singleton
    ├── procedure-pricing/
    └── reports/               # Revenue report (aggregations)
```

Each feature module follows:

- **schemas/** – Mongoose schemas (`@Schema()`, `SchemaFactory.createForClass()`)
- **dto/** – Request DTOs with `class-validator`
- **\*.controller.ts** – HTTP endpoints, guards, decorators
- **\*.service.ts** – Business logic, DB access
- **\*.module.ts** – `MongooseModule.forFeature()`, exports

## Setup

1. Copy `.env.example` to `.env` and set `MONGODB_URI`, `JWT_SECRET`.
2. `npm install`
3. `npm run start:dev` – runs the API and seeds DB if empty.

## Scripts

- `npm run build` – Compile to `dist/`
- `npm run start` – Run compiled app
- `npm run start:dev` – Run in watch mode

## API base

All API routes are under `/api/` (e.g. `/api/auth/login`, `/api/patients`, `/api/appointments`, …).  
Auth: `POST /api/auth/login` with `{ "email", "password" }`; then send `Authorization: Bearer <token>`.
