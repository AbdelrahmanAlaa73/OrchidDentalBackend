import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdatePatientNoteDto {
  @ApiPropertyOptional({ example: 'Updated note content.' })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Content cannot be empty' })
  content?: string;
}
