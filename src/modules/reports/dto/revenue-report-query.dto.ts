import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RevenueReportQueryDto {
  @ApiPropertyOptional({
    description:
      'Period preset: daily, week, month, semi_annual, year. Ignored if startDate/endDate provided. Response includes totalSubtotal (pre-discount) and totalRevenue / totalAfterDiscount (post-discount).',
  })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD). Omit to use period or default (last month).' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD). Omit to use period or default.' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by doctor ID. Omit to include all doctors.',
  })
  @IsOptional()
  @IsString()
  doctorId?: string;
}
