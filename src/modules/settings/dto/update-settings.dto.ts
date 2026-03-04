import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsObject, IsArray, Min, Max } from 'class-validator';

export class WorkingHoursDayDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  open?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  close?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isOpen?: boolean;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  workingHours?: Record<string, WorkingHoursDayDto>;

  @ApiPropertyOptional({ example: [15, 30, 45, 60, 90] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  appointmentDurations?: number[];

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sterilizationBuffer?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  clinicSharePercentage?: number;

  @ApiPropertyOptional({ example: 'EGP' })
  @IsOptional()
  @IsString()
  currency?: string;
}
