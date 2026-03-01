import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { ToothProceduresService } from '../tooth-procedures/tooth-procedures.service';
import { MedicalAlertsService } from '../medical-alerts/medical-alerts.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
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
  create(@Body() dto: CreatePatientDto) {
    return this.patientsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient by ID' })
  findOne(@Param('id') id: string): Promise<Record<string, unknown>> {
    return this.patientsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update patient by ID' })
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.patientsService.update(id, dto);
  }

  @Get(':id/tooth-procedures')
  @ApiOperation({ summary: 'Get tooth procedures for patient' })
  getToothProcedures(@Param('id') id: string) {
    return this.toothProceduresService.findByPatient(id);
  }

  @Post(':id/tooth-procedures')
  @ApiOperation({ summary: 'Add tooth procedure for patient' })
  addToothProcedure(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.toothProceduresService.create(id, body);
  }

  @Get(':id/alerts')
  @ApiOperation({ summary: 'Get medical alerts for patient' })
  getAlerts(@Param('id') id: string) {
    return this.medicalAlertsService.findByPatient(id);
  }

  @Post(':id/alerts')
  @ApiOperation({ summary: 'Add medical alert for patient' })
  addAlert(@Param('id') id: string, @Body() body: { type: string; description: string; severity: string }) {
    return this.medicalAlertsService.create(id, body);
  }
}
