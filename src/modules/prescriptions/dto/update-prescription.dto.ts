import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdatePrescriptionDto {
  @ApiPropertyOptional({ example: 'Amoxicillin 500mg' })
  @IsOptional()
  @IsString()
  medication?: string;

  @ApiPropertyOptional({ example: '500mg' })
  @IsOptional()
  @IsString()
  strength?: string;

  @ApiPropertyOptional({ example: 'capsule' })
  @IsOptional()
  @IsString()
  form?: string;

  @ApiPropertyOptional({ example: '1 tablet twice daily' })
  @IsOptional()
  @IsString()
  dosage?: string;

  @ApiPropertyOptional({ example: '7 days' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({ example: '2025-03-18' })
  @IsOptional()
  @IsString()
  datePrescribed?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'completed' })
  @IsOptional()
  @IsString()
  status?: string;
}
