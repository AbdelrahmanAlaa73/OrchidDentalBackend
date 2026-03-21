import { Controller, Get, Post, Body, UseGuards, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { Public, CurrentUser, type CurrentUserPayload, Roles } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../enums';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  async me(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getMe(user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Owner, UserRole.Admin)
  @Patch('users/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update user by ID (Owner/Admin only)' })
  @ApiBody({ type: UpdateUserDto })
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.authService.updateUser(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Owner, UserRole.Admin)
  @Patch('users/:id/password')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update user password by ID (Owner/Admin only)' })
  @ApiBody({ type: UpdateUserPasswordDto })
  async updateUserPassword(@Param('id') id: string, @Body() dto: UpdateUserPasswordDto) {
    return this.authService.updateUserPassword(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Owner, UserRole.Admin)
  @Delete('users/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete user by ID (Owner/Admin only)' })
  async deleteUser(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.authService.deleteUser(id, currentUser.id);
  }
}