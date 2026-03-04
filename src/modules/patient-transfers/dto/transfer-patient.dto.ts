import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class TransferPatientDto {
  @ApiProperty({ description: 'MongoDB ObjectId of target doctor' })
  @IsString()
  toDoctorId: string;

  @ApiProperty({ example: 'Patient requested different specialist' })
  @IsString()
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
