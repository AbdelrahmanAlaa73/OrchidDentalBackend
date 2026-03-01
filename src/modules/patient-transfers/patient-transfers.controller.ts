import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PatientTransfersService } from './patient-transfers.service';
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
  transfer(
    @Param('id') id: string,
    @Body() body: { toDoctorId: string; reason: string; notes?: string },
    @CurrentUser() user: { id: string },
  ) {
    return this.patientTransfersService.transfer(id, body.toDoctorId, body.reason, body.notes, user.id);
  }

  @Get(':id/transfers')
  @ApiOperation({ summary: 'Get transfer history for patient' })
  findByPatient(@Param('id') id: string) {
    return this.patientTransfersService.findByPatient(id);
  }
}
