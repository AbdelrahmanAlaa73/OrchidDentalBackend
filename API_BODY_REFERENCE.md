# API Body Reference – POST/PATCH Endpoints

All POST and PATCH endpoints now use validated DTOs. The global `ValidationPipe` with `whitelist: true` strips any properties not defined in the DTO. Below is the expected body for each endpoint.

---

## Auth

### `POST /api/auth/register`
```json
{
  "email": "string",
  "password": "string",
  "name": "string",
  "nameAr": "string",
  "role": "owner" | "doctor" | "assistant" | "admin"
}
```

### `POST /api/auth/login`
```json
{
  "email": "string",
  "password": "string"
}
```

---

## Patients

### `POST /api/patients`
```json
{
  "name": "string",
  "nameAr": "string",
  "phone": "string",
  "gender": "male" | "female",
  "age": 0-150,
  "email": "string",
  "dateOfBirth": "string",
  "notes": "string",
  "assignedDoctorId": "string",
  "hasCompletedOnboarding": true | false,
  "job": "string",
  "address": "string",
  "medicalConditions": {},
  "questionnaire": {}
}
```
**Required:** `name`, `nameAr`, `phone`, `gender`

### `POST /api/patients/:id/tooth-procedures`
```json
{
  "doctorId": "string",
  "toothNumber": 11-48,
  "procedure": "string",
  "procedureAr": "string",
  "type": "filling" | "root_canal" | "crown" | "implant" | "extraction" | "cleaning" | "whitening",
  "price": 0,
  "date": "YYYY-MM-DD",
  "appointmentId": "string",
  "notes": "string",
  "currency": "string"
}
```
**Required:** `doctorId`, `toothNumber`, `procedure`, `procedureAr`, `type`, `price`, `date`

### `POST /api/patients/:id/alerts`
```json
{
  "type": "allergy" | "diabetes" | "heart_condition" | "blood_pressure" | "other",
  "description": "string",
  "severity": "low" | "medium" | "high"
}
```

### `POST /api/patients/:id/transfer`
```json
{
  "toDoctorId": "string",
  "reason": "string",
  "notes": "string"
}
```
**Required:** `toDoctorId`, `reason`

---

## Appointments

### `POST /api/appointments`
```json
{
  "patientId": "string",
  "doctorId": "string",
  "date": "YYYY-MM-DD",
  "startTime": "HH:mm",
  "duration": 10-240,
  "billingMode": "new" | "follow_up",
  "procedure": "string",
  "procedureAr": "string",
  "notes": "string",
  "sterilizationBuffer": 0,
  "toothNumber": 11-48
}
```
**Required:** `patientId`, `doctorId`, `date`, `startTime`, `duration`

---

## Invoices

### `POST /api/invoices`
```json
{
  "patientId": "string",
  "doctorId": "string",
  "items": [
    {
      "description": "string",
      "descriptionAr": "string",
      "procedure": "string",
      "procedureAr": "string",
      "quantity": 1,
      "unitPrice": 0,
      "toothNumber": 11-48
    }
  ],
  "discount": 0,
  "discountType": "percentage" | "fixed",
  "paid": 0,
  "paymentMethod": "string",
  "currency": "string",
  "dueDate": "string"
}
```
**Required:** `patientId`, `doctorId`, `items` (at least one item)

### `POST /api/invoices/:id/payments`
```json
{
  "amount": 0.01,
  "method": "cash" | "card" | "instapay"
}
```
**Required:** `amount`

---

## Waiting List

### `POST /api/waiting-list`
```json
{
  "patientId": "string",
  "preferredDate": "YYYY-MM-DD",
  "preferredTimeRange": "string",
  "urgency": "low" | "medium" | "high",
  "notes": "string",
  "duration": 10-240
}
```
**Required:** `patientId`, `preferredDate`

---

## Expenses

### `POST /api/expenses`
```json
{
  "category": "lab" | "materials" | "internet" | "coffee" | "waste" | "shipping" | "rent" | "utilities" | "mobile" | "other",
  "categoryAr": "string",
  "description": "string",
  "amount": 0.01,
  "date": "YYYY-MM-DD",
  "receiptUrl": "string",
  "currency": "string"
}
```
**Required:** `category`, `categoryAr`, `amount`, `date`

---

## Daily Closeouts

### `POST /api/daily-closeouts`
```json
{
  "date": "YYYY-MM-DD"
}
```

---

## Procedure Pricing

### `PATCH /api/procedure-pricing`
**Note:** Body must be wrapped in `items` array.
```json
{
  "items": [
    {
      "procedure": "string",
      "procedureAr": "string",
      "basePrice": 0,
      "doctorPercent": 0-100,
      "clinicPercent": 0-100,
      "maxDiscount": 0-100
    }
  ]
}
```

---

## Settings

### `PATCH /api/settings`
```json
{
  "name": "string",
  "nameAr": "string",
  "address": "string",
  "phone": "string",
  "email": "string",
  "workingHours": {},
  "appointmentDurations": [15, 30, 45, 60, 90],
  "sterilizationBuffer": 0,
  "clinicSharePercentage": 0-100,
  "currency": "string"
}
```
All fields optional.
