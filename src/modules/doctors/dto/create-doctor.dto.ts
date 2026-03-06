import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { DoctorColor, DoctorRole } from '../../../enums';

export class CreateDoctorDto {
  @ApiProperty({ example: 'Dr. Ahmed Hassan' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'د. أحمد حسن' })
  @IsString()
  nameAr: string;

  @ApiProperty({ example: 'General Dentistry' })
  @IsString()
  specialty: string;

  @ApiProperty({ example: 'طب الأسنان العام' })
  @IsString()
  specialtyAr: string;

  @ApiProperty({ enum: DoctorColor })
  @IsEnum(DoctorColor)
  color: DoctorColor;

  @ApiProperty({ example: false })
  @IsBoolean()
  isOwner: boolean;

  @ApiProperty({ enum: DoctorRole })
  @IsEnum(DoctorRole)
  role: DoctorRole;

  @ApiPropertyOptional({ minimum: 0, maximum: 100, default: 20, description: 'Clinic share percentage. Must sum with doctorSharePercent to 100.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  clinicSharePercent?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100, default: 80, description: 'Doctor share percentage. Must sum with clinicSharePercent to 100.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  doctorSharePercent?: number;
}
