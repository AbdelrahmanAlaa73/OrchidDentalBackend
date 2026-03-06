import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean, IsObject, Min, Max } from 'class-validator';
import { PatientGender } from '../../../enums';

export class CreatePatientDto {
  @ApiProperty({ example: 'Ahmed Mohamed' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'أحمد محمد', description: 'Arabic name' })
  @IsString()
  nameAr: string;

  @ApiProperty({ example: '+201001234567' })
  @IsString()
  phone: string;

  @ApiProperty({ enum: PatientGender, example: PatientGender.Male })
  @IsEnum(PatientGender)
  gender: PatientGender;

  @ApiPropertyOptional({ minimum: 0, maximum: 150 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(150)
  age?: number;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'MongoDB ObjectId of assigned doctor' })
  @IsOptional()
  @IsString()
  assignedDoctorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasCompletedOnboarding?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  job?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'e.g. { diabetes: true, allergies: false }' })
  @IsOptional()
  @IsObject()
  medicalConditions?: Record<string, boolean>;

  @ApiPropertyOptional({ description: 'e.g. { takingMedication: "yes", smoking: "no" }' })
  @IsOptional()
  @IsObject()
  questionnaire?: Record<string, string>;
}
