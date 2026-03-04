import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { PatientTransfersService } from './patient-transfers.service';
import { TransferPatientDto } from './dto/transfer-patient.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../enums';

@ApiTags('Patient Transfers')
@ApiBearerAuth('JWT-auth')
@Controller('api/patients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Owner, UserRole.Doctor, UserRole.Assistant, UserRole.Admin)
export class PatientTransfersController {
  constructor(private readonly patientTransfersService: PatientTransfersService) {}

  @Post(':id/transfer')
  @ApiOperation({ summary: 'Transfer patient to another doctor' })
  @ApiBody({ type: TransferPatientDto })
  transfer(
    @Param('id') id: string,
    @Body() dto: TransferPatientDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.patientTransfersService.transfer(id, dto.toDoctorId, dto.reason, dto.notes, user.id);
  }

  @Get(':id/transfers')
  @ApiOperation({ summary: 'Get transfer history for patient' })
  findByPatient(@Param('id') id: string) {
    return this.patientTransfersService.findByPatient(id);
  }
}
