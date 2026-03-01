import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Doctors')
@ApiBearerAuth('JWT-auth')
@Controller('api/doctors')
@UseGuards(JwtAuthGuard)
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  @ApiOperation({ summary: 'List all doctors' })
  findAll() {
    return this.doctorsService.findAll();
  }
}
