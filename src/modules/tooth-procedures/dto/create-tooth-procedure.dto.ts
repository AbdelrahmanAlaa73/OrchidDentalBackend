import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { ToothProcedureType } from '../../../enums';

export class CreateToothProcedureDto {
  @ApiProperty({ description: 'MongoDB ObjectId of doctor' })
  @IsString()
  doctorId: string;

  @ApiProperty({ example: 16, minimum: 11, maximum: 48, description: 'FDI tooth number' })
  @IsNumber()
  @Min(11)
  @Max(48)
  toothNumber: number;

  @ApiProperty({ example: 'Composite Filling' })
  @IsString()
  procedure: string;

  @ApiProperty({ example: 'حشوة كومبوزيت' })
  @IsString()
  procedureAr: string;

  @ApiProperty({ enum: ToothProcedureType })
  @IsEnum(ToothProcedureType)
  type: ToothProcedureType;

  @ApiProperty({ example: 500, minimum: 0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: '2025-03-15' })
  @IsString()
  date: string;

  @ApiPropertyOptional({ description: 'MongoDB ObjectId of appointment' })
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'EGP' })
  @IsOptional()
  @IsString()
  currency?: string;
}
