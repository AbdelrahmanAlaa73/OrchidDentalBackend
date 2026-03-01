import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProcedurePricingService } from './procedure-pricing.service';
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
  bulkUpdate(@Body() body: Array<Record<string, unknown>>) {
    return this.procedurePricingService.bulkUpdate(body as Parameters<ProcedurePricingService['bulkUpdate']>[0]);
  }
}
