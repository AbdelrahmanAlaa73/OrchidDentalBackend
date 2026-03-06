import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ToothProcedureType } from '../../../enums';

export class CreateProcedurePricingDto {
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

  @ApiPropertyOptional({ enum: ToothProcedureType })
  @IsOptional()
  @IsEnum(ToothProcedureType)
  type?: ToothProcedureType;
}
