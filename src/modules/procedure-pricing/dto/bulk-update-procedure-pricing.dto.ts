import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProcedurePricingItemDto } from './procedure-pricing-item.dto';

export class BulkUpdateProcedurePricingDto {
  @ApiProperty({ type: [ProcedurePricingItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProcedurePricingItemDto)
  items: ProcedurePricingItemDto[];
}
