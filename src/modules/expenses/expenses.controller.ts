import { Controller, Get, Post, Body, Patch, Param, Query, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../enums';

@ApiTags('Expenses')
@ApiBearerAuth('JWT-auth')
@Controller('api/expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Owner, UserRole.Doctor, UserRole.Assistant, UserRole.Admin)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @ApiOperation({ summary: 'List expenses with optional filters' })
  findAll(
    @Query('date') date?: string,
    @Query('createdBy') createdBy?: string,
    @Query('category') category?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const userId = (user?.role === UserRole.Doctor || user?.role === UserRole.Assistant) ? user?.id : undefined;
    return this.expensesService.findAll({ date, createdBy, category }, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create an expense' })
  create(@Body() body: Record<string, unknown>, @CurrentUser() user?: CurrentUserPayload) {
    return this.expensesService.create(body, user!.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update expense by ID' })
  update(@Param('id') id: string, @Body() body: Record<string, unknown>, @CurrentUser() user?: CurrentUserPayload) {
    const isOwnerOrAdmin = user?.role === UserRole.Owner || user?.role === UserRole.Admin;
    return this.expensesService.update(id, body, user!.id, isOwnerOrAdmin);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete expense by ID' })
  async remove(@Param('id') id: string, @CurrentUser() user?: CurrentUserPayload) {
    const isOwnerOrAdmin = user?.role === UserRole.Owner || user?.role === UserRole.Admin;
    await this.expensesService.remove(id, user!.id, isOwnerOrAdmin);
  }
}
