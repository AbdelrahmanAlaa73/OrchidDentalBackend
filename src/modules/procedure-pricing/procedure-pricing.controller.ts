import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ProcedurePricingService } from './procedure-pricing.service';
import { BulkUpdateProcedurePricingDto } from './dto/bulk-update-procedure-pricing.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../enums';

@ApiTags('Procedure Pricing')
@ApiBearerAuth('JWT-auth')
@Controller('api/procedure-pricing')
@UseGuards(JwtAuthGuard)
export class ProcedurePricingController {
  constructor(private readonly procedurePricingService: ProcedurePricingService) {}

  @Get()
  @ApiOperation({ summary: 'List all procedure prices' })
  findAll() {
    return this.procedurePricingService.findAll();
  }

  @Patch()
  @UseGuards(RolesGuard)
  @Roles(UserRole.Owner, UserRole.Admin)
  @ApiOperation({ summary: 'Bulk update procedure prices (Owner/Admin only)' })
  @ApiBody({ type: BulkUpdateProcedurePricingDto })
  bulkUpdate(@Body() dto: BulkUpdateProcedurePricingDto) {
    return this.procedurePricingService.bulkUpdate(dto.items);
  }
}
