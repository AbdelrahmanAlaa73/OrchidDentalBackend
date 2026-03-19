import { Controller, Get, Post, Body, Patch, Param, Query, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { DailyCloseoutsService } from './daily-closeouts.service';
import { CreateDailyCloseoutDto } from './dto/create-daily-closeout.dto';
import { UpdateDailyCloseoutDto } from './dto/update-daily-closeout.dto';
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
  getPreview(
    @Param('date') date: string,
    @CurrentUser() user?: CurrentUserPayload,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('method') method?: string,
  ) {
    const roleFilter = user
      ? { role: user.role as UserRole, userId: user.id, doctorId: user.doctorId }
      : undefined;
    return this.dailyCloseoutsService.getPreview(date, roleFilter, paymentMethod ?? method);
  }

  @Get(':date')
  @ApiOperation({ summary: 'Get daily closeout by date (includes payments and expenses breakdown like preview)' })
  getByDate(
    @Param('date') date: string,
    @CurrentUser() user?: CurrentUserPayload,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('method') method?: string,
  ): Promise<Record<string, unknown>> {
    const roleFilter = user
      ? { role: user.role as UserRole, userId: user.id, doctorId: user.doctorId }
      : undefined;
    return this.dailyCloseoutsService.getByDate(date, roleFilter, paymentMethod ?? method);
  }

  @Delete(':date')
  @ApiOperation({ summary: 'Delete daily closeout by date' })
  async removeByDate(@Param('date') date: string) {
    await this.dailyCloseoutsService.removeByDate(date);
  }

  @Patch(':date')
  @ApiOperation({ summary: 'Update daily closeout (amounts and/or refresh expense snapshot)' })
  @ApiBody({ type: UpdateDailyCloseoutDto })
  updateByDate(
    @Param('date') date: string,
    @Body() dto: UpdateDailyCloseoutDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const roleFilter = { role: user.role as UserRole, userId: user.id, doctorId: user.doctorId };
    return this.dailyCloseoutsService.updateByDate(date, dto, roleFilter);
  }

  @Post()
  @ApiOperation({ summary: 'Create daily closeout' })
  @ApiBody({ type: CreateDailyCloseoutDto })
  create(@Body() dto: CreateDailyCloseoutDto, @CurrentUser() user: CurrentUserPayload) {
    const roleFilter = { role: user.role as UserRole, userId: user.id, doctorId: user.doctorId };
    return this.dailyCloseoutsService.create(dto.date, user.id, roleFilter);
  }
}
