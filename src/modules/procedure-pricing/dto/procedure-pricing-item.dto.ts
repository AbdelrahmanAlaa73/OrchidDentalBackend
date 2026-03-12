import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ProcedureCategory } from '../../../enums';

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

  @ApiPropertyOptional({
    enum: ProcedureCategory,
    description: 'Static procedure type: diagnostic, preventive, restorative, endodontic, prosthetic, surgical, orthodontic, cosmetic, other',
  })
  @IsOptional()
  @IsEnum(ProcedureCategory)
  procedureType?: ProcedureCategory;
}
