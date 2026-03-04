# Orchid Dental – Frontend Integration Guide

This guide helps the frontend team replace local state (AppContext, localStorage) with backend API calls. **All business logic lives in the backend.** The frontend should only:

1. Call the API
2. Store the response in state
3. Display data and handle loading/error states

---

## Base URL & Auth

- **Base URL:** `http://localhost:5000/api` (or your deployed URL)
- **Auth:** JWT Bearer token
- **Swagger:** `http://localhost:5000/api/docs` – interactive API docs

### Login Flow

```
POST /api/auth/login
Body: { "email": "user@clinic.com", "password": "password" }
Response: { "access_token": "eyJ...", "user": { ... } }

→ Store access_token (e.g. localStorage or state)
→ Add header to all requests: Authorization: Bearer <access_token>
```

### Register (Admin/Owner only)

```
POST /api/auth/register
Body: { "name", "email", "password", "role", "doctorId?" }
```

---

## Frontend Action → Backend Endpoint Mapping

### Auth

| Frontend Action | Backend Endpoint |
|----------------|------------------|
| Login | `POST /api/auth/login` |
| Register | `POST /api/auth/register` |
| Get current user | `GET /api/auth/me` (with Bearer token) |

---

### Doctors

| Frontend Action | Backend Endpoint |
|----------------|------------------|
| List doctors | `GET /api/doctors` |

---

### Patients

| Frontend Action | Backend Endpoint |
|----------------|------------------|
| List patients | `GET /api/patients?search=&assignedDoctorId=&page=1&limit=20` |
| Create patient | `POST /api/patients` |
| Get patient (full profile) | `GET /api/patients/:id` |
| Update patient | `PATCH /api/patients/:id` |
| Add tooth procedure | `POST /api/patients/:id/tooth-procedures` |
| Add medical alert | `POST /api/patients/:id/alerts` |
| Transfer patient | `POST /api/patients/:id/transfer` |
| Get tooth procedures | `GET /api/patients/:id/tooth-procedures` |
| Get medical alerts | `GET /api/patients/:id/alerts` |
| Delete medical alert | `DELETE /api/medical-alerts/:id` |
| Delete tooth procedure | `DELETE /api/tooth-procedures/:id` |

**Create patient body:** See Swagger schema. Required: `name`, `nameAr`, `phone`, `gender`.

---

### Appointments

| Frontend Action | Backend Endpoint |
|----------------|------------------|
| List appointments | `GET /api/appointments?date=&doctorId=&patientId=&status=` |
| Create appointment | `POST /api/appointments` |
| Update appointment | `PATCH /api/appointments/:id` |
| Cancel appointment | `PATCH /api/appointments/:id/cancel` |
| Delete appointment | `DELETE /api/appointments/:id` |

**Create appointment body:** Required: `patientId`, `doctorId`, `date`, `startTime`, `duration`.

---

### Invoices

| Frontend Action | Backend Endpoint |
|----------------|------------------|
| List invoices | `GET /api/invoices?patientId=&doctorId=&status=` |
| Create invoice | `POST /api/invoices` |
| Update invoice | `PATCH /api/invoices/:id` |
| Delete invoice | `DELETE /api/invoices/:id` |
| List payments | `GET /api/invoices/:id/payments` |
| Add payment | `POST /api/invoices/:id/payments` |

**Create invoice body:** Required: `patientId`, `doctorId`, `items[]` (each: description, descriptionAr, procedure, procedureAr, quantity, unitPrice).

---

### Waiting List

| Frontend Action | Backend Endpoint |
|----------------|------------------|
| List waiting list | `GET /api/waiting-list` |
| Add to waiting list | `POST /api/waiting-list` |
| Remove from waiting list | `DELETE /api/waiting-list/:id` |

**Create body:** Required: `patientId`, `preferredDate`.

---

### Expenses

| Frontend Action | Backend Endpoint |
|----------------|------------------|
| List expenses | `GET /api/expenses?date=&category=` |
| Create expense | `POST /api/expenses` |
| Update expense | `PATCH /api/expenses/:id` |
| Delete expense | `DELETE /api/expenses/:id` |

**Create body:** Required: `category`, `categoryAr`, `amount`, `date`.

---

### Daily Closeouts

| Frontend Action | Backend Endpoint |
|----------------|------------------|
| List closeouts | `GET /api/daily-closeouts` |
| Preview for date | `GET /api/daily-closeouts/preview/:date` |
| Get by date | `GET /api/daily-closeouts/:date` |
| Create closeout | `POST /api/daily-closeouts` |

**Create body:** `{ "date": "2025-03-15" }`

---

### Procedure Pricing

| Frontend Action | Backend Endpoint |
|----------------|------------------|
| List prices | `GET /api/procedure-pricing` |
| Bulk update | `PATCH /api/procedure-pricing` |

**Bulk update body:** `{ "items": [ { "procedure", "procedureAr", "basePrice", "doctorPercent", "clinicPercent", "maxDiscount?" } ] }`

---

### Settings

| Frontend Action | Backend Endpoint |
|----------------|------------------|
| Get settings | `GET /api/settings` |
| Update settings | `PATCH /api/settings` |

---

### Reports

| Frontend Action | Backend Endpoint |
|----------------|------------------|
| Revenue report | `GET /api/reports/revenue?from=&to=` |

---

## Response Shapes

- **List endpoints:** Return arrays or `{ items, total, page, limit }` for paginated results.
- **Single resource:** Returns the object (patient, appointment, etc.).
- **Patient detail (`GET /api/patients/:id`):** Returns patient plus `appointments`, `invoices`, `toothProcedures`, `medicalAlerts`, `dentalTreatments`.
- **IDs:** MongoDB ObjectIds as strings (e.g. `"507f1f77bcf86cd799439011"`).

---

## Error Handling

- **401:** Missing or invalid token → redirect to login.
- **403:** Forbidden (e.g. doctor accessing another doctor’s data).
- **404:** Resource not found.
- **400:** Validation error – body includes `message` and often `errors` array.

---

## CORS

CORS is enabled. Configure your frontend base URL if needed (e.g. for production).

---

## Suggested Frontend Changes

1. **API client:** Create a shared client (e.g. axios/fetch) with base URL and `Authorization` header.
2. **Replace dispatch:** Instead of `dispatch({ type: 'ADD_PATIENT', payload })`, call `POST /api/patients` and then `dispatch` with the API response.
3. **Initial load:** On app load, fetch doctors, patients, appointments, etc. from the API instead of mock data.
4. **Optimistic updates:** Optional – update UI before API response, then revert on error.
5. **Loading/error states:** Show spinners and error messages for API calls.

---

## Swagger

Open `http://localhost:5000/api/docs` to:

- See all endpoints
- View request/response schemas
- Try requests with “Try it out”
- Authorize with your JWT token
