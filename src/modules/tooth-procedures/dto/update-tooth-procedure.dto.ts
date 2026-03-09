import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateToothProcedureDto {
  @ApiPropertyOptional({ description: 'Note for this tooth procedure.' })
  @IsOptional()
  @IsString()
  notes?: string;
}
