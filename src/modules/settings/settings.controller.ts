import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../enums';

@ApiTags('Settings')
@ApiBearerAuth('JWT-auth')
@Controller('api/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Owner, UserRole.Admin)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get clinic settings' })
  get() {
    return this.settingsService.get();
  }

  @Patch()
  @ApiOperation({ summary: 'Update clinic settings' })
  update(@Body() body: Record<string, unknown>) {
    return this.settingsService.update(body);
  }
}
