import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ToothProceduresService } from './tooth-procedures.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../enums';

@ApiTags('Tooth Procedures')
@ApiBearerAuth('JWT-auth')
@Controller('api/tooth-procedures')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Owner, UserRole.Doctor, UserRole.Assistant, UserRole.Admin)
export class ToothProceduresController {
  constructor(private readonly toothProceduresService: ToothProceduresService) {}

  @Delete(':id')
  @ApiOperation({ summary: 'Delete tooth procedure by ID' })
  async remove(@Param('id') id: string) {
    await this.toothProceduresService.remove(id);
  }
}
