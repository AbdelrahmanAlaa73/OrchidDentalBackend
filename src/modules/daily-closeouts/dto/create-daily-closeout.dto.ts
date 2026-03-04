import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateDailyCloseoutDto {
  @ApiProperty({ example: '2025-03-15' })
  @IsString()
  date: string;
}
