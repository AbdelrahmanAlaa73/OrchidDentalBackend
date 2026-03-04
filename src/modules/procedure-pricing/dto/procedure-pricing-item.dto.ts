import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class ProcedurePricingItemDto {
  @ApiProperty({ example: 'Consultation' })
  @IsString()
  procedure: string;

  @ApiProperty({ example: 'استشارة' })
  @IsString()
  procedureAr: string;

  @ApiProperty({ example: 200, minimum: 0 })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiProperty({ example: 70, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  doctorPercent: number;

  @ApiProperty({ example: 30, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  clinicPercent: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxDiscount?: number;
}
