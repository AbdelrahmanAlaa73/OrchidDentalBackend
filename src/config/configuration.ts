export const configuration = () => ({
  port: parseInt(process.env.PORT || '5000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/orchid-dental',
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  clinicTimezone: process.env.CLINIC_TIMEZONE || 'Africa/Cairo',
  workdayStartHour: parseInt(process.env.WORKDAY_START_HOUR || '6', 10),
});

export type ConfigurationType = ReturnType<typeof configuration>;
