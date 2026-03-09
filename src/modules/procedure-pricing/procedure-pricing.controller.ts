import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ProcedurePricingService } from './procedure-pricing.service';
import { BulkUpdateProcedurePricingDto } from './dto/bulk-update-procedure-pricing.dto';
import { CreateProcedurePricingDto } from './dto/create-procedure-pricing.dto';
import { UpdateProcedurePricingDto } from './dto/update-procedure-pricing.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, ProcedureCategory } from '../../enums';

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

  @Get('types')
  @ApiOperation({ summary: 'Get static procedure types (categories)' })
  getProcedureTypes() {
    return { procedureTypes: Object.values(ProcedureCategory) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one procedure price by ID' })
  findOne(@Param('id') id: string) {
    return this.procedurePricingService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.Owner, UserRole.Admin)
  @ApiOperation({ summary: 'Create a procedure price (Owner/Admin only)' })
  @ApiBody({ type: CreateProcedurePricingDto })
  create(@Body() dto: CreateProcedurePricingDto) {
    return this.procedurePricingService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Owner, UserRole.Admin)
  @ApiOperation({ summary: 'Update a procedure price by ID (Owner/Admin only)' })
  @ApiBody({ type: UpdateProcedurePricingDto })
  update(@Param('id') id: string, @Body() dto: UpdateProcedurePricingDto) {
    return this.procedurePricingService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Owner, UserRole.Admin)
  @ApiOperation({ summary: 'Delete a procedure price by ID (Owner/Admin only)' })
  async remove(@Param('id') id: string) {
    await this.procedurePricingService.remove(id);
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
