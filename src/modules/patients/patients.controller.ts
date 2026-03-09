import { Controller, Get, Post, Body, Patch, Param, Query, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { ToothProceduresService } from '../tooth-procedures/tooth-procedures.service';
import { MedicalAlertsService } from '../medical-alerts/medical-alerts.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { CreateToothProcedureDto } from '../tooth-procedures/dto/create-tooth-procedure.dto';
import { CreateMedicalAlertDto } from '../medical-alerts/dto/create-medical-alert.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../enums';

@ApiTags('Patients')
@ApiBearerAuth('JWT-auth')
@Controller('api/patients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Owner, UserRole.Doctor, UserRole.Assistant, UserRole.Admin)
export class PatientsController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly toothProceduresService: ToothProceduresService,
    private readonly medicalAlertsService: MedicalAlertsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List patients with optional filters' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'assignedDoctorId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @Query('search') search?: string,
    @Query('assignedDoctorId') assignedDoctorId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.patientsService.findAll({ search, assignedDoctorId, page, limit });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new patient' })
  @ApiBody({ type: CreatePatientDto })
  create(@Body() dto: CreatePatientDto) {
    return this.patientsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient by ID (includes appointments, invoices, dental treatments, alerts)' })
  @ApiParam({ name: 'id', description: 'Patient MongoDB ObjectId' })
  findOne(@Param('id') id: string): Promise<Record<string, unknown>> {
    return this.patientsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update patient by ID' })
  @ApiBody({ type: UpdatePatientDto })
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.patientsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete patient by ID (fails if patient has appointments or invoices)' })
  async remove(@Param('id') id: string) {
    await this.patientsService.remove(id);
  }

  @Get(':id/tooth-procedures')
  @ApiOperation({ summary: 'Get tooth procedures for patient' })
  getToothProcedures(@Param('id') id: string) {
    return this.toothProceduresService.findByPatient(id);
  }

  @Post(':id/tooth-procedures')
  @ApiOperation({ summary: 'Add tooth procedure for patient' })
  @ApiBody({ type: CreateToothProcedureDto })
  addToothProcedure(@Param('id') id: string, @Body() dto: CreateToothProcedureDto) {
    return this.toothProceduresService.create(id, dto);
  }

  @Get(':id/alerts')
  @ApiOperation({ summary: 'Get medical alerts for patient' })
  getAlerts(@Param('id') id: string) {
    return this.medicalAlertsService.findByPatient(id);
  }

  @Post(':id/alerts')
  @ApiOperation({ summary: 'Add medical alert for patient' })
  @ApiBody({ type: CreateMedicalAlertDto })
  addAlert(@Param('id') id: string, @Body() dto: CreateMedicalAlertDto) {
    return this.medicalAlertsService.create(id, dto);
  }
}
