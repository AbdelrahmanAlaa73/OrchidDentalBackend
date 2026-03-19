import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { toObjectIdOrThrow } from '../../common/utils/objectid';
import { PatientNote } from './schemas/patient-note.schema';
import { CreatePatientNoteDto } from './dto/create-patient-note.dto';
import { UpdatePatientNoteDto } from './dto/update-patient-note.dto';

@Injectable()
export class PatientNotesService {
  constructor(@InjectModel(PatientNote.name) private patientNoteModel: Model<PatientNote>) {}

  async findByPatient(patientId: string) {
    return this.patientNoteModel
      .find({ patientId: toObjectIdOrThrow(patientId, 'patientId') })
      .sort({ createdAt: -1 })
      .lean();
  }

  async create(patientId: string, dto: CreatePatientNoteDto) {
    const note = await this.patientNoteModel.create({
      patientId: toObjectIdOrThrow(patientId, 'patientId'),
      content: dto.content,
    });
    return note.toObject();
  }

  async update(patientId: string, noteId: string, dto: UpdatePatientNoteDto) {
    const note = await this.patientNoteModel.findOneAndUpdate(
      { _id: toObjectIdOrThrow(noteId, 'noteId'), patientId: toObjectIdOrThrow(patientId, 'patientId') },
      { $set: dto },
      { new: true },
    ).lean();
    if (!note) throw new NotFoundException('Patient note not found');
    return note;
  }

  async remove(patientId: string, noteId: string) {
    const deleted = await this.patientNoteModel.findOneAndDelete({
      _id: toObjectIdOrThrow(noteId, 'noteId'),
      patientId: toObjectIdOrThrow(patientId, 'patientId'),
    });
    if (!deleted) throw new NotFoundException('Patient note not found');
  }

  async deleteByPatient(patientId: string) {
    await this.patientNoteModel.deleteMany({ patientId: toObjectIdOrThrow(patientId, 'patientId') });
  }
}
