export enum DoctorRole {
  Owner = 'owner',
  Doctor = 'doctor',
  Assistant = 'assistant',
}

export enum DoctorColor {
  Charcoal = 'charcoal',
  Orchid = 'orchid',
  Emerald = 'emerald',
  Amber = 'amber',
}

export enum UserRole {
  Owner = 'owner',
  Doctor = 'doctor',
  Assistant = 'assistant',
  Admin = 'admin',
}

export enum PatientGender {
  Male = 'male',
  Female = 'female',
}

export enum AlertType {
  Allergy = 'allergy',
  Diabetes = 'diabetes',
  HeartCondition = 'heart_condition',
  BloodPressure = 'blood_pressure',
  Other = 'other',
}

export enum AlertSeverity {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

export enum AppointmentStatus {
  Scheduled = 'scheduled',
  Completed = 'completed',
  Cancelled = 'cancelled',
  NoShow = 'no_show',
  InProgress = 'in_progress',
}

export enum BillingMode {
  New = 'new',
  FollowUp = 'follow_up',
}

export enum InvoiceStatus {
  Paid = 'paid',
  Partial = 'partial',
  Unpaid = 'unpaid',
}

export enum DiscountType {
  Percentage = 'percentage',
  Fixed = 'fixed',
}

export enum PaymentMethod {
  Cash = 'cash',
  Card = 'card',
  VodafoneCash = 'vodafone_cash',
  Instapay = 'instapay',
}

export enum ExpenseCategory {
  Lab = 'lab',
  Materials = 'materials',
  Internet = 'internet',
  Coffee = 'coffee',
  Waste = 'waste',
  Shipping = 'shipping',
  Rent = 'rent',
  Utilities = 'utilities',
  Mobile = 'mobile',
  Other = 'other',
}

export enum WaitingUrgency {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

export enum ToothProcedureType {
  Filling = 'filling',
  RootCanal = 'root_canal',
  Crown = 'crown',
  Implant = 'implant',
  Extraction = 'extraction',
  Cleaning = 'cleaning',
  Whitening = 'whitening',
}

export enum ProcedureCategory {
  Diagnostic = 'diagnostic',
  Preventive = 'preventive',
  Restorative = 'restorative',
  Endodontic = 'endodontic',
  Prosthetic = 'prosthetic',
  Surgical = 'surgical',
  Orthodontic = 'orthodontic',
  Cosmetic = 'cosmetic',
  Other = 'other',
}
