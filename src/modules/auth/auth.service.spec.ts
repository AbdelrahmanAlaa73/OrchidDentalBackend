import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../enums';
import { Doctor } from '../doctors/schemas/doctor.schema';
import { AuthService } from './auth.service';
import { User } from './schemas/user.schema';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userModel: any;
  let doctorModel: any;
  let jwtService: JwtService;

  beforeEach(async () => {
    userModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };
    doctorModel = {
      findById: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(Doctor.name), useValue: doctorModel },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('token') } },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('7d') } },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    jwtService = moduleRef.get(JwtService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('returns token and user for valid credentials', async () => {
      const userId = new Types.ObjectId();
      const doctorId = new Types.ObjectId();
      const user = {
        _id: userId,
        email: 'test@clinic.com',
        name: 'Test',
        role: UserRole.Doctor,
        doctorId,
        avatar: 'a.png',
        passwordHash: 'hashed',
      };
      userModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(user),
        }),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      doctorModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ _id: doctorId, name: 'Dr' }),
        }),
      });

      const result = await service.login({ email: 'TEST@clinic.com', password: '12345678' });

      expect(jwtService.sign).toHaveBeenCalled();
      expect(result.token).toBe('token');
      expect(result.user.email).toBe('test@clinic.com');
      expect(result.doctor).toBeDefined();
    });

    it('throws UnauthorizedException when user is missing', async () => {
      userModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.login({ email: 'none@x.com', password: 'bad' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when password does not match', async () => {
      userModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            _id: new Types.ObjectId(),
            email: 'test@clinic.com',
            passwordHash: 'hashed',
          }),
        }),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login({ email: 'test@clinic.com', password: 'bad' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('register', () => {
    it('throws ConflictException when email already exists', async () => {
      userModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
      });

      await expect(
        service.register({
          name: 'A',
          email: 'a@a.com',
          password: '12345678',
          role: UserRole.Admin,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException when doctor role misses doctorId', async () => {
      userModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.register({
          name: 'A',
          email: 'a@a.com',
          password: '12345678',
          role: UserRole.Doctor,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteUser', () => {
    it('throws when deleting own account', async () => {
      const id = new Types.ObjectId().toString();
      await expect(service.deleteUser(id, id)).rejects.toThrow(BadRequestException);
    });

    it('throws when user not found', async () => {
      userModel.findByIdAndDelete.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });
      await expect(
        service.deleteUser(new Types.ObjectId().toString(), new Types.ObjectId().toString()),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
