import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionWithPatientDto } from './dto/create-prescription-with-patient.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../enums';

@ApiTags('Prescriptions')
@ApiBearerAuth('JWT-auth')
@Controller('api/prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Owner, UserRole.Doctor, UserRole.Assistant, UserRole.Admin)
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'List prescriptions for a patient' })
  @ApiQuery({ name: 'patientId', required: true, description: 'Patient MongoDB ObjectId' })
  findAll(@Query('patientId') patientId?: string) {
    if (!patientId?.trim()) {
      throw new BadRequestException('Query parameter patientId is required');
    }
    return this.prescriptionsService.findByPatient(patientId.trim());
  }

  @Post()
  @ApiOperation({ summary: 'Create a prescription (patientId in body)' })
  @ApiBody({ type: CreatePrescriptionWithPatientDto })
  create(@Body() dto: CreatePrescriptionWithPatientDto) {
    const { patientId, ...body } = dto;
    return this.prescriptionsService.create(patientId, body);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Prior prescriptions for the same patient (before this one)' })
  @ApiParam({ name: 'id', description: 'Prescription MongoDB ObjectId' })
  @ApiQuery({
    name: 'sameMedication',
    required: false,
    description: 'If true, only prior rows with the same medication name (case-insensitive)',
  })
  getHistory(@Param('id') id: string, @Query('sameMedication') sameMedication?: string) {
    const same = sameMedication === 'true' || sameMedication === '1';
    return this.prescriptionsService.getPriorPrescriptions(id, { sameMedication: same });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get prescription by ID',
    description:
      'Use includeHistory=true to return { prescription, priorPrescriptions } (same patient, earlier dates).',
  })
  @ApiParam({ name: 'id', description: 'Prescription MongoDB ObjectId' })
  @ApiQuery({ name: 'includeHistory', required: false })
  findOne(@Param('id') id: string, @Query('includeHistory') includeHistory?: string) {
    const include = includeHistory === 'true' || includeHistory === '1';
    return this.prescriptionsService.findById(id, include);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update prescription by ID' })
  @ApiParam({ name: 'id', description: 'Prescription MongoDB ObjectId' })
  @ApiBody({ type: UpdatePrescriptionDto })
  update(@Param('id') id: string, @Body() dto: UpdatePrescriptionDto) {
    return this.prescriptionsService.updateById(id, dto);
  }

  @Delete(':id')  
  @ApiOperation({ summary: 'Delete prescription by ID' })
  @ApiParam({ name: 'id', description: 'Prescription MongoDB ObjectId' })
  async remove(@Param('id') id: string) {
    await this.prescriptionsService.removeById(id);
  }
}
