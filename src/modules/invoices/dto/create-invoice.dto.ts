import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DiscountType } from '../../../enums';
import { InvoiceItemDto } from './invoice-item.dto';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'MongoDB ObjectId of patient' })
  @IsString()
  patientId: string;

  @ApiProperty({ description: 'MongoDB ObjectId of doctor' })
  @IsString()
  doctorId: string;

  @ApiProperty({ type: [InvoiceItemDto], description: 'At least one item required' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ enum: DiscountType })
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paid?: number;

  @ApiPropertyOptional({ example: 'cash', description: 'cash | card | instapay' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'EGP' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: '2025-04-15' })
  @IsOptional()
  @IsString()
  dueDate?: string;
}
