import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../enums';

@ApiTags('Appointments')
@ApiBearerAuth('JWT-auth')
@Controller('api/appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Owner, UserRole.Doctor, UserRole.Assistant, UserRole.Admin)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List appointments with optional filters' })
  findAll(
    @Query('date') date?: string,
    @Query('doctorId') doctorId?: string,
    @Query('patientId') patientId?: string,
    @Query('status') status?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const doctorIdFilter = user?.role === UserRole.Doctor ? user?.doctorId : undefined;
    return this.appointmentsService.findAll({ date, doctorId, patientId, status }, doctorIdFilter);
  }

  @Post()
  @ApiOperation({ summary: 'Create an appointment' })
  create(@Body() body: Record<string, unknown>, @CurrentUser() user?: CurrentUserPayload) {
    if (user?.role === UserRole.Doctor && user?.doctorId) {
      const bodyDoctorId = body.doctorId?.toString?.() ?? body.doctorId;
      if (bodyDoctorId && bodyDoctorId !== user.doctorId) {
        throw new ForbiddenException('Doctors can only create appointments for themselves');
      }
      body = { ...body, doctorId: user.doctorId };
    }
    return this.appointmentsService.create(body as Parameters<AppointmentsService['create']>[0]);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update appointment by ID' })
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const doctorIdFilter = user?.role === UserRole.Doctor ? user?.doctorId : undefined;
    return this.appointmentsService.update(id, body, doctorIdFilter);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel appointment by ID' })
  cancel(@Param('id') id: string, @CurrentUser() user?: CurrentUserPayload) {
    const doctorIdFilter = user?.role === UserRole.Doctor ? user?.doctorId : undefined;
    return this.appointmentsService.cancel(id, doctorIdFilter);
  }
}
