import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WaitingListService } from './waiting-list.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../enums';

@ApiTags('Waiting List')
@ApiBearerAuth('JWT-auth')
@Controller('api/waiting-list')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Owner, UserRole.Doctor, UserRole.Assistant, UserRole.Admin)
export class WaitingListController {
  constructor(private readonly waitingListService: WaitingListService) {}

  @Get()
  @ApiOperation({ summary: 'List all waiting list entries' })
  findAll() {
    return this.waitingListService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Add entry to waiting list' })
  create(@Body() body: Record<string, unknown>) {
    return this.waitingListService.create(body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove entry from waiting list' })
  async remove(@Param('id') id: string) {
    await this.waitingListService.remove(id);
  }
}
