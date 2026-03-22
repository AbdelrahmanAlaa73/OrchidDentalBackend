import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './schemas/user.schema';
import { Doctor } from '../doctors/schemas/doctor.schema';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UserRole } from '../../enums';
import { toObjectIdOrThrow } from '../../common/utils/objectid';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userModel
      .findOne({ email: dto.email.toLowerCase() })
      .select('+passwordHash')
      .lean();
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const token = this.jwtService.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
        doctorId: user.doctorId?.toString(),
      },
      { expiresIn: this.configService.get('jwt.expiresIn') || '7d' },
    );
    const doctor = user.doctorId
      ? await this.doctorModel
          .findById(user.doctorId)
          .select('name nameAr specialty color role isOwner')
          .lean()
      : null;
    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        doctorId: user.doctorId,
        avatar: user.avatar,
      },
      doctor: doctor ?? undefined,
    };
  }

  async getMe(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('-passwordHash')
      .populate('doctorId', 'name nameAr specialty color role isOwner')
      .lean();
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  async listUsers() {
    return this.userModel
      .find()
      .select('-passwordHash')
      .populate('doctorId', 'name nameAr specialty color role isOwner')
      .sort({ createdAt: -1 })
      .lean();
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.userModel.findOne({ email }).lean();
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    if (
      (dto.role === UserRole.Doctor || dto.role === UserRole.Assistant) &&
      dto.doctorId
    ) {
      const doctor = await this.doctorModel.findById(dto.doctorId).lean();
      if (!doctor) {
        throw new BadRequestException(
          'doctorId not found. Use GET /api/doctors to get valid doctor IDs. For admin/owner, omit doctorId.',
        );
      }
    }
    if (
      (dto.role === UserRole.Doctor || dto.role === UserRole.Assistant) &&
      !dto.doctorId
    ) {
      throw new BadRequestException('doctorId is required for doctor and assistant roles');
    }

    const rounds = this.configService.get<number>('bcryptRounds') ?? 10;
    const passwordHash = await bcrypt.hash(dto.password, rounds);

    const user = await this.userModel.create({
      name: dto.name.trim(),
      email,
      passwordHash,
      role: dto.role,
      doctorId: dto.doctorId ? toObjectIdOrThrow(dto.doctorId, 'doctorId') : undefined,
      permissions: [],
    });

    const token = this.jwtService.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
        doctorId: user.doctorId?.toString(),
      },
      { expiresIn: this.configService.get('jwt.expiresIn') || '7d' },
    );

    const doctor = user.doctorId
      ? await this.doctorModel
          .findById(user.doctorId)
          .select('name nameAr specialty color role isOwner')
          .lean()
      : null;

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        doctorId: user.doctorId,
        avatar: user.avatar,
      },
      doctor: doctor ?? undefined,
    };
  }

  async updateUser(userId: string, dto: UpdateUserDto) {
    const id = toObjectIdOrThrow(userId, 'id');
    const existingUser = await this.userModel.findById(id);
    if (!existingUser) throw new BadRequestException('User not found');

    if (dto.email) {
      const email = dto.email.toLowerCase().trim();
      const duplicate = await this.userModel.findOne({ email, _id: { $ne: id } }).lean();
      if (duplicate) throw new ConflictException('An account with this email already exists');
      existingUser.email = email;
    }
    if (dto.name !== undefined) existingUser.name = dto.name.trim();
    if (dto.role !== undefined) existingUser.role = dto.role;

    if ((existingUser.role === UserRole.Doctor || existingUser.role === UserRole.Assistant) && !dto.doctorId && !existingUser.doctorId) {
      throw new BadRequestException('doctorId is required for doctor and assistant roles');
    }
    if (dto.doctorId !== undefined) {
      if (dto.doctorId) {
        const doctor = await this.doctorModel.findById(dto.doctorId).lean();
        if (!doctor) {
          throw new BadRequestException('doctorId not found. Use GET /api/doctors to get valid doctor IDs.');
        }
        existingUser.doctorId = toObjectIdOrThrow(dto.doctorId, 'doctorId');
      } else {
        existingUser.doctorId = undefined;
      }
    }

    if ((existingUser.role === UserRole.Doctor || existingUser.role === UserRole.Assistant) && !existingUser.doctorId) {
      throw new BadRequestException('doctorId is required for doctor and assistant roles');
    }
    if (existingUser.role === UserRole.Owner || existingUser.role === UserRole.Admin) {
      existingUser.doctorId = undefined;
    }

    await existingUser.save();
    return this.userModel
      .findById(id)
      .select('-passwordHash')
      .populate('doctorId', 'name nameAr specialty color role isOwner')
      .lean();
  }

  async updateUserPassword(userId: string, dto: UpdateUserPasswordDto) {
    const id = toObjectIdOrThrow(userId, 'id');
    const user = await this.userModel.findById(id);
    if (!user) throw new BadRequestException('User not found');
    const rounds = this.configService.get<number>('bcryptRounds') ?? 10;
    user.passwordHash = await bcrypt.hash(dto.password, rounds);
    await user.save();
    return { message: 'Password updated successfully' };
  }

  async deleteUser(userId: string, currentUserId: string) {
    const id = toObjectIdOrThrow(userId, 'id');
    if (id.toString() === currentUserId) {
      throw new BadRequestException('You cannot delete your own account');
    }
    const deleted = await this.userModel.findByIdAndDelete(id).lean();
    if (!deleted) throw new BadRequestException('User not found');
    return { message: 'User deleted successfully' };
  }
}
