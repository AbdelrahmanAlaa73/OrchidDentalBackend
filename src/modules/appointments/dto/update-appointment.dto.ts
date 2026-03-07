import { ApiPropertyOptional, IntersectionType, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { AppointmentStatus } from '../../../enums';
import { CreateAppointmentDto } from './create-appointment.dto';

class AppointmentStatusDto {
  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}

export class UpdateAppointmentDto extends IntersectionType(
  PartialType(CreateAppointmentDto),
  PartialType(AppointmentStatusDto),
) {}
