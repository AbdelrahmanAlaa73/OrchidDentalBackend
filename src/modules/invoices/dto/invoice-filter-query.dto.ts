import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class InvoiceFilterQueryDto {
  @ApiPropertyOptional({ description: 'Filter by patient ID.' })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({
    description: 'Filter by doctor ID. Omit to include invoices for all doctors (Owner/Admin only).',
  })
  @IsOptional()
  @IsString()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'Filter by invoice status (e.g. paid, unpaid, partial).' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Start date for filter (YYYY-MM-DD). Invoices created on or after this date.' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for filter (YYYY-MM-DD). Invoices created on or before this date. Use same as startDate for a single day.' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Include payments in each invoice object.' })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : value === 'true' || value === true))
  @IsBoolean()
  includePayments?: boolean;

  @ApiPropertyOptional({ description: 'Page number for pagination (1-based).', default: 1 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? parseInt(value, 10) : undefined))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page. Max 100.', default: 20 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? parseInt(value, 10) : undefined))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
