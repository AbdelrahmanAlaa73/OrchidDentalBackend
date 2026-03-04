import { Controller, Get, Post, Body, Patch, Param, Query, Delete, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
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
  @ApiQuery({ name: 'date', required: false, example: '2025-03-15' })
  @ApiQuery({ name: 'doctorId', required: false })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['scheduled', 'completed', 'cancelled', 'no_show', 'in_progress'] })
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
  @ApiBody({ type: CreateAppointmentDto })
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user?: CurrentUserPayload) {
    if (user?.role === UserRole.Doctor && user?.doctorId) {
      if (dto.doctorId && dto.doctorId !== user.doctorId) {
        throw new ForbiddenException('Doctors can only create appointments for themselves');
      }
      dto = { ...dto, doctorId: user.doctorId };
    }
    return this.appointmentsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update appointment by ID' })
  @ApiParam({ name: 'id', description: 'Appointment MongoDB ObjectId' })
  @ApiBody({ type: UpdateAppointmentDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const doctorIdFilter = user?.role === UserRole.Doctor ? user?.doctorId : undefined;
    return this.appointmentsService.update(id, dto, doctorIdFilter);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel appointment by ID' })
  @ApiParam({ name: 'id', description: 'Appointment MongoDB ObjectId' })
  cancel(@Param('id') id: string, @CurrentUser() user?: CurrentUserPayload) {
    const doctorIdFilter = user?.role === UserRole.Doctor ? user?.doctorId : undefined;
    return this.appointmentsService.cancel(id, doctorIdFilter);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete appointment by ID (remove from calendar)' })
  @ApiParam({ name: 'id', description: 'Appointment MongoDB ObjectId' })
  remove(@Param('id') id: string, @CurrentUser() user?: CurrentUserPayload) {
    const doctorIdFilter = user?.role === UserRole.Doctor ? user?.doctorId : undefined;
    return this.appointmentsService.remove(id, doctorIdFilter);
  }
}
