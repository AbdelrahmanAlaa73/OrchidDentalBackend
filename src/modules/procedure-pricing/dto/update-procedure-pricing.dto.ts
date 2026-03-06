import { PartialType } from '@nestjs/swagger';
import { CreateProcedurePricingDto } from './create-procedure-pricing.dto';

export class UpdateProcedurePricingDto extends PartialType(CreateProcedurePricingDto) {}
