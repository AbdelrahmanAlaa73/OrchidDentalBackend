import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { WaitingUrgency } from '../../../enums';

export class CreateWaitingListItemDto {
  @ApiProperty({ description: 'MongoDB ObjectId of patient' })
  @IsString()
  patientId: string;

  @ApiProperty({ example: '2025-03-20' })
  @IsString()
  preferredDate: string;

  @ApiPropertyOptional({ example: '09:00-12:00' })
  @IsOptional()
  @IsString()
  preferredTimeRange?: string;

  @ApiPropertyOptional({ enum: WaitingUrgency })
  @IsOptional()
  @IsEnum(WaitingUrgency)
  urgency?: WaitingUrgency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ minimum: 10, maximum: 240 })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(240)
  duration?: number;
}
