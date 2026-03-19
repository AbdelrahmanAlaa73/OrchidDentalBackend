import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreatePrescriptionDto {
  @ApiProperty({ description: 'MongoDB ObjectId of doctor who prescribed' })
  @IsString()
  doctorId: string;

  @ApiPropertyOptional({ description: 'MongoDB ObjectId of appointment if linked' })
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @ApiProperty({ example: 'Amoxicillin 500mg', description: 'Medication name' })
  @IsString()
  medication: string;

  @ApiPropertyOptional({ example: '500mg' })
  @IsOptional()
  @IsString()
  strength?: string;

  @ApiPropertyOptional({ example: 'capsule', description: 'e.g. tablet, syrup, capsule' })
  @IsOptional()
  @IsString()
  form?: string;

  @ApiProperty({ example: '1 tablet twice daily', description: 'Dosage instructions' })
  @IsString()
  dosage: string;

  @ApiProperty({ example: '7 days', description: 'Duration of treatment' })
  @IsString()
  duration: string;

  @ApiProperty({ example: '2025-03-18', description: 'Date prescribed (YYYY-MM-DD)' })
  @IsString()
  datePrescribed: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'active', description: 'active | completed' })
  @IsOptional()
  @IsString()
  status?: string;
}
