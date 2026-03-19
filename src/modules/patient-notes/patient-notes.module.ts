import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PatientNote, PatientNoteSchema } from './schemas/patient-note.schema';
import { PatientNotesService } from './patient-notes.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PatientNote.name, schema: PatientNoteSchema }]),
  ],
  providers: [PatientNotesService],
  exports: [PatientNotesService, MongooseModule],
})
export class PatientNotesModule {}
