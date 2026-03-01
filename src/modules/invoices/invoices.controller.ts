import { Controller, Get, Post, Body, Patch, Param, Query, Delete, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../enums';

@ApiTags('Invoices')
@ApiBearerAuth('JWT-auth')
@Controller('api/invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Owner, UserRole.Doctor, UserRole.Assistant, UserRole.Admin)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'List invoices with optional filters' })
  findAll(
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('status') status?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const doctorIdFilter = user?.role === UserRole.Doctor ? user?.doctorId : undefined;
    return this.invoicesService.findAll({ patientId, doctorId, status }, doctorIdFilter);
  }

  @Post()
  @ApiOperation({ summary: 'Create an invoice' })
  create(@Body() body: Record<string, unknown>, @CurrentUser() user?: CurrentUserPayload) {
    if (user?.role === UserRole.Doctor && user?.doctorId) {
      const bodyDoctorId = body.doctorId?.toString?.() ?? body.doctorId;
      if (bodyDoctorId && bodyDoctorId !== user.doctorId) {
        throw new ForbiddenException('Doctors can only create invoices for themselves');
      }
      body = { ...body, doctorId: user.doctorId };
    }
    return this.invoicesService.create(body as Parameters<InvoicesService['create']>[0]);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update invoice by ID' })
  update(@Param('id') id: string, @Body() body: Record<string, unknown>, @CurrentUser() user?: CurrentUserPayload) {
    const doctorIdFilter = user?.role === UserRole.Doctor ? user?.doctorId : undefined;
    return this.invoicesService.update(id, body, doctorIdFilter);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete invoice by ID' })
  async remove(@Param('id') id: string, @CurrentUser() user?: CurrentUserPayload) {
    const doctorIdFilter = user?.role === UserRole.Doctor ? user?.doctorId : undefined;
    await this.invoicesService.remove(id, doctorIdFilter);
  }

  @Get(':id/payments')
  @ApiOperation({ summary: 'List payments for invoice' })
  listPayments(@Param('id') id: string, @CurrentUser() user?: CurrentUserPayload) {
    const doctorIdFilter = user?.role === UserRole.Doctor ? user?.doctorId : undefined;
    return this.invoicesService.listPayments(id, doctorIdFilter);
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Add payment to invoice' })
  addPayment(@Param('id') id: string, @Body() body: { amount: number; method?: string }, @CurrentUser() user?: CurrentUserPayload) {
    const doctorIdFilter = user?.role === UserRole.Doctor ? user?.doctorId : undefined;
    return this.invoicesService.addPayment(id, body.amount, body.method ?? 'cash', doctorIdFilter);
  }
}
