import { Controller, Get, Post, Body, Patch, Param, Query, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { ToothProceduresService } from '../tooth-procedures/tooth-procedures.service';
import { MedicalAlertsService } from '../medical-alerts/medical-alerts.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { CreateToothProcedureDto } from '../tooth-procedures/dto/create-tooth-procedure.dto';
import { CreateMedicalAlertDto } from '../medical-alerts/dto/create-medical-alert.dto';
import { PatientNotesService } from '../patient-notes/patient-notes.service';
import { CreatePatientNoteDto } from '../patient-notes/dto/create-patient-note.dto';
import { UpdatePatientNoteDto } from '../patient-notes/dto/update-patient-note.dto';
import { PrescriptionsService } from '../prescriptions/prescriptions.service';
import { CreatePrescriptionDto } from '../prescriptions/dto/create-prescription.dto';
import { UpdatePrescriptionDto } from '../prescriptions/dto/update-prescription.dto';
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
    private readonly patientNotesService: PatientNotesService,
    private readonly prescriptionsService: PrescriptionsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List patients with optional filters. Search supports one or more characters (name, nameAr, phone).' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name, nameAr, or phone; works with one or more letters' })
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

  @Get('birthday')
  @ApiOperation({ summary: 'List patients with birthdays; optional date filter (YYYY-MM-DD) for that month-day' })
  @ApiQuery({ name: 'date', required: false, description: 'Filter to birthdays on this date (e.g. today)' })
  getBirthdays(@Query('date') date?: string) {
    return this.patientsService.findBirthdays(date);
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

  @Get(':id/notes')
  @ApiOperation({ summary: 'List notes for patient (dental chart)' })
  getNotes(@Param('id') id: string) {
    return this.patientNotesService.findByPatient(id);
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Create a note for patient' })
  @ApiBody({ type: CreatePatientNoteDto })
  addNote(@Param('id') id: string, @Body() dto: CreatePatientNoteDto) {
    return this.patientNotesService.create(id, dto);
  }

  @Patch(':id/notes/:noteId')
  @ApiOperation({ summary: 'Update a patient note' })
  @ApiBody({ type: UpdatePatientNoteDto })
  updateNote(
    @Param('id') id: string,
    @Param('noteId') noteId: string,
    @Body() dto: UpdatePatientNoteDto,
  ) {
    return this.patientNotesService.update(id, noteId, dto);
  }

  @Delete(':id/notes/:noteId')
  @ApiOperation({ summary: 'Delete a patient note' })
  async removeNote(@Param('id') id: string, @Param('noteId') noteId: string) {
    await this.patientNotesService.remove(id, noteId);
  }

  @Get(':id/prescriptions')
  @ApiOperation({ summary: 'List prescriptions for patient' })
  getPrescriptions(@Param('id') id: string) {
    return this.prescriptionsService.findByPatient(id);
  }

  @Post(':id/prescriptions')
  @ApiOperation({ summary: 'Create a prescription for patient' })
  @ApiBody({ type: CreatePrescriptionDto })
  addPrescription(@Param('id') id: string, @Body() dto: CreatePrescriptionDto) {
    return this.prescriptionsService.create(id, dto);
  }

  @Get(':id/prescriptions/:prescriptionId')
  @ApiOperation({ summary: 'Get prescription by ID' })
  getPrescription(@Param('id') id: string, @Param('prescriptionId') prescriptionId: string) {
    return this.prescriptionsService.findOne(id, prescriptionId);
  }

  @Patch(':id/prescriptions/:prescriptionId')
  @ApiOperation({ summary: 'Update a prescription' })
  @ApiBody({ type: UpdatePrescriptionDto })
  updatePrescription(
    @Param('id') id: string,
    @Param('prescriptionId') prescriptionId: string,
    @Body() dto: UpdatePrescriptionDto,
  ) {
    return this.prescriptionsService.update(id, prescriptionId, dto);
  }

  @Delete(':id/prescriptions/:prescriptionId')
  @ApiOperation({ summary: 'Delete a prescription' })
  async removePrescription(@Param('id') id: string, @Param('prescriptionId') prescriptionId: string) {
    await this.prescriptionsService.remove(id, prescriptionId);
  }
}
