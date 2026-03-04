import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class InvoiceItemDto {
  @ApiProperty({ example: 'Consultation fee' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'رسوم الاستشارة' })
  @IsString()
  descriptionAr: string;

  @ApiProperty({ example: 'Consultation' })
  @IsString()
  procedure: string;

  @ApiProperty({ example: 'استشارة' })
  @IsString()
  procedureAr: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 200, minimum: 0 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ minimum: 11, description: 'FDI tooth number' })
  @IsOptional()
  @IsNumber()
  @Min(11)
  toothNumber?: number;
}
