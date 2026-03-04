import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum } from 'class-validator';
import { AlertType, AlertSeverity } from '../../../enums';

export class CreateMedicalAlertDto {
  @ApiProperty({ enum: AlertType })
  @IsEnum(AlertType)
  type: AlertType;

  @ApiProperty({ example: 'Allergic to penicillin' })
  @IsString()
  description: string;

  @ApiProperty({ enum: AlertSeverity })
  @IsEnum(AlertSeverity)
  severity: AlertSeverity;
}
