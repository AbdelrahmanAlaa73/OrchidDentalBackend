import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators';
import { UserRole } from '../../enums';

@ApiTags('Doctors')
@ApiBearerAuth('JWT-auth')
@Controller('api/doctors')
@UseGuards(JwtAuthGuard)
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all doctors (public, for registration form)' })
  findAll() {
    return this.doctorsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one doctor by ID' })
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.Owner, UserRole.Admin)
  @ApiOperation({ summary: 'Create a doctor (Owner/Admin only)' })
  @ApiBody({ type: CreateDoctorDto })
  create(@Body() dto: CreateDoctorDto) {
    return this.doctorsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Owner, UserRole.Admin)
  @ApiOperation({ summary: 'Update a doctor by ID (Owner/Admin only)' })
  @ApiBody({ type: UpdateDoctorDto })
  update(@Param('id') id: string, @Body() dto: UpdateDoctorDto) {
    return this.doctorsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Owner, UserRole.Admin)
  @ApiOperation({ summary: 'Remove a doctor (Owner/Admin only)' })
  async remove(@Param('id') id: string) {
    await this.doctorsService.remove(id);
  }
}
