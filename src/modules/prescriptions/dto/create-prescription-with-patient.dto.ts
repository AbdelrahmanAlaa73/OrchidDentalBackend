import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { CreatePrescriptionDto } from './create-prescription.dto';

/** Body for POST /api/prescriptions (includes patientId). */
export class CreatePrescriptionWithPatientDto extends CreatePrescriptionDto {
  @ApiProperty({ description: 'MongoDB ObjectId of patient' })
  @IsString()
  patientId: string;
}
