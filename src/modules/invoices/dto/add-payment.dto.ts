import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AddPaymentDto {
  @ApiProperty({ example: 100, minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'cash', description: 'cash | card | instapay' })
  @IsOptional()
  @IsString()
  method?: string;
}
