import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MedicalAlertsService } from './medical-alerts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../enums';

@ApiTags('Medical Alerts')
@ApiBearerAuth('JWT-auth')
@Controller('api/medical-alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Owner, UserRole.Doctor, UserRole.Assistant, UserRole.Admin)
export class MedicalAlertsController {
  constructor(private readonly medicalAlertsService: MedicalAlertsService) {}

  @Delete(':id')
  @ApiOperation({ summary: 'Delete medical alert by ID' })
  async remove(@Param('id') id: string) {
    await this.medicalAlertsService.remove(id);
  }
}
