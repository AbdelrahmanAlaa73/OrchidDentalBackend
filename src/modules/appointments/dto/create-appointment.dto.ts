import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { BillingMode } from '../../../enums';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'MongoDB ObjectId of patient' })
  @IsString()
  patientId: string;

  @ApiProperty({ description: 'MongoDB ObjectId of doctor' })
  @IsString()
  doctorId: string;

  @ApiProperty({ example: '2025-03-15' })
  @IsString()
  date: string;

  @ApiProperty({ example: '09:00', description: 'Start time HH:mm' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: 30, minimum: 10, maximum: 240 })
  @IsNumber()
  @Min(10)
  @Max(240)
  duration: number;

  @ApiPropertyOptional({ enum: BillingMode })
  @IsOptional()
  @IsEnum(BillingMode)
  billingMode?: BillingMode;

  @ApiPropertyOptional({ example: 'Consultation' })
  @IsOptional()
  @IsString()
  procedure?: string;

  @ApiPropertyOptional({ example: 'استشارة' })
  @IsOptional()
  @IsString()
  procedureAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sterilizationBuffer?: number;

  @ApiPropertyOptional({ minimum: 11, maximum: 48, description: 'FDI tooth number' })
  @IsOptional()
  @IsNumber()
  @Min(11)
  @Max(48)
  toothNumber?: number;
}
