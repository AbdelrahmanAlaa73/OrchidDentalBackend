import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ExpenseFilterQueryDto {
  @ApiPropertyOptional({ description: 'Filter by date (YYYY-MM-DD).' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Filter by creator user ID. Omit to include all expenses (Owner/Admin only).',
  })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Filter by expense category.' })
  @IsOptional()
  @IsString()
  category?: string;
}
