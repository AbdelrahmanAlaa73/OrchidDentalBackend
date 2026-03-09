import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, IsBoolean } from 'class-validator';

export class UpdateDailyCloseoutDto {
  @ApiPropertyOptional({ description: 'Cash collected amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cashCollected?: number;

  @ApiPropertyOptional({ description: 'Card collected amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cardCollected?: number;

  @ApiPropertyOptional({ description: 'Transfer collected amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  transferCollected?: number;

  @ApiPropertyOptional({ description: 'Total collected amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalCollected?: number;

  @ApiPropertyOptional({ description: 'Total expenses amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalExpenses?: number;

  @ApiPropertyOptional({ description: 'Final balance (totalCollected - totalExpenses)' })
  @IsOptional()
  @IsNumber()
  finalBalance?: number;

  @ApiPropertyOptional({ description: 'If true, re-fetch expenses for this date and update expense snapshot' })
  @IsOptional()
  @IsBoolean()
  refreshExpenseSnapshot?: boolean;
}
