import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './schemas/user.schema';
import { Doctor } from '../doctors/schemas/doctor.schema';
import { LoginDto } from './dto/login.dto';

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
}
