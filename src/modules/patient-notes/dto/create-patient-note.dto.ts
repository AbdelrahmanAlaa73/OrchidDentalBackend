import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreatePatientNoteDto {
  @ApiProperty({ example: 'Patient prefers morning appointments.', description: 'Note content (for dental chart or general)' })
  @IsString()
  @MinLength(1, { message: 'Content cannot be empty' })
  content: string;
}
