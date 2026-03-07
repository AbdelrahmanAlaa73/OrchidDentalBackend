import { Controller, Get, Post, Body, Patch, Param, Query, Delete, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { InvoiceFilterQueryDto } from './dto/invoice-filter-query.dto';
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
  findAll(@Query() query: InvoiceFilterQueryDto, @CurrentUser() user?: CurrentUserPayload) {
    const doctorIdFilter = user?.role === UserRole.Doctor ? user?.doctorId : undefined;
    return this.invoicesService.findAll(query, doctorIdFilter);
  }

  @Post()
  @ApiOperation({ summary: 'Create an invoice' })
  @ApiBody({ type: CreateInvoiceDto })
  create(@Body() dto: CreateInvoiceDto, @CurrentUser() user?: CurrentUserPayload) {
    if (user?.role === UserRole.Doctor && user?.doctorId) {
      if (dto.doctorId && dto.doctorId !== user.doctorId) {
        throw new ForbiddenException('Doctors can only create invoices for themselves');
      }
      dto = { ...dto, doctorId: user.doctorId };
    }
    return this.invoicesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update invoice by ID' })
  @ApiBody({ type: UpdateInvoiceDto })
  update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto, @CurrentUser() user?: CurrentUserPayload) {
    const doctorIdFilter = user?.role === UserRole.Doctor ? user?.doctorId : undefined;
    return this.invoicesService.update(id, dto, doctorIdFilter);
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
  @ApiBody({ type: AddPaymentDto })
  addPayment(@Param('id') id: string, @Body() dto: AddPaymentDto, @CurrentUser() user?: CurrentUserPayload) {
    const doctorIdFilter = user?.role === UserRole.Doctor ? user?.doctorId : undefined;
    return this.invoicesService.addPayment(id, dto.amount, dto.method ?? 'cash', doctorIdFilter);
  }
}
