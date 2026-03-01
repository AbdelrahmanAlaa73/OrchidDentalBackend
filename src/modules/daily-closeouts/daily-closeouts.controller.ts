import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DailyCloseoutsService } from './daily-closeouts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../enums';

@ApiTags('Daily Closeouts')
@ApiBearerAuth('JWT-auth')
@Controller('api/daily-closeouts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Owner, UserRole.Assistant, UserRole.Admin)
export class DailyCloseoutsController {
  constructor(private readonly dailyCloseoutsService: DailyCloseoutsService) {}

  @Get()
  @ApiOperation({ summary: 'List daily closeouts with optional date filter' })
  findAll(@Query('date') date?: string) {
    return this.dailyCloseoutsService.findAll(date);
  }

  @Get('preview/:date')
  @ApiOperation({ summary: 'Preview payments and expenses for a date (includes dummy entries for unpaid invoices created that day)' })
  getPreview(@Param('date') date: string, @CurrentUser() user?: CurrentUserPayload) {
    const roleFilter = user
      ? { role: user.role as UserRole, userId: user.id, doctorId: user.doctorId }
      : undefined;
    return this.dailyCloseoutsService.getPreview(date, roleFilter);
  }

  @Get(':date')
  @ApiOperation({ summary: 'Get daily closeout by date' })
  getByDate(@Param('date') date: string) {
    return this.dailyCloseoutsService.getByDate(date);
  }

  @Post()
  @ApiOperation({ summary: 'Create daily closeout' })
  create(@Body() body: { date: string }, @CurrentUser() user: CurrentUserPayload) {
    const roleFilter = { role: user.role as UserRole, userId: user.id, doctorId: user.doctorId };
    return this.dailyCloseoutsService.create(body.date, user.id, roleFilter);
  }
}
