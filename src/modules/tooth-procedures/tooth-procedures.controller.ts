import { Controller, Patch, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ToothProceduresService } from './tooth-procedures.service';
import { UpdateToothProcedureDto } from './dto/update-tooth-procedure.dto';
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

  @Patch(':id')
  @ApiOperation({ summary: 'Update tooth procedure (e.g. add or edit note)' })
  @ApiBody({ type: UpdateToothProcedureDto })
  update(@Param('id') id: string, @Body() dto: UpdateToothProcedureDto) {
    return this.toothProceduresService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete tooth procedure by ID' })
  async remove(@Param('id') id: string) {
    await this.toothProceduresService.remove(id);
  }
}
