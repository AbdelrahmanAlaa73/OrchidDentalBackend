import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean, IsObject, Min, Max } from 'class-validator';
import { PatientGender } from '../../../enums';

export class CreatePatientDto {
  @IsString()
  name: string;

  @IsString()
  nameAr: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(150)
  age?: number;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsEnum(PatientGender)
  gender: PatientGender;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  assignedDoctorId?: string;

  @IsOptional()
  @IsBoolean()
  hasCompletedOnboarding?: boolean;

  @IsOptional()
  @IsString()
  job?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsObject()
  medicalConditions?: Record<string, boolean>;

  @IsOptional()
  @IsObject()
  questionnaire?: Record<string, string>;
}
