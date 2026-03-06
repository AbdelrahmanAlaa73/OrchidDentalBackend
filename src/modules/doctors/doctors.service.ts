import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Doctor } from './schemas/doctor.schema';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

function ensurePercentSum(clinic?: number, doctor?: number): { clinicSharePercent: number; doctorSharePercent: number } {
  const c = clinic ?? (doctor != null ? 100 - doctor : 20);
  const d = doctor ?? (clinic != null ? 100 - clinic : 80);
  if (c + d !== 100) {
    throw new BadRequestException('clinicSharePercent and doctorSharePercent must sum to 100');
  }
  return { clinicSharePercent: c, doctorSharePercent: d };
}

@Injectable()
export class DoctorsService {
  constructor(@InjectModel(Doctor.name) private doctorModel: Model<Doctor>) {}

  async findAll() {
    return this.doctorModel.find().lean();
  }

  async findOne(id: string) {
    const doc = await this.doctorModel.findById(id).lean();
    if (!doc) throw new NotFoundException('Doctor not found');
    return doc;
  }

  async create(dto: CreateDoctorDto) {
    const { clinicSharePercent, doctorSharePercent } = ensurePercentSum(dto.clinicSharePercent, dto.doctorSharePercent);
    const doc = await this.doctorModel.create({
      name: dto.name.trim(),
      nameAr: dto.nameAr.trim(),
      specialty: dto.specialty.trim(),
      specialtyAr: dto.specialtyAr.trim(),
      color: dto.color,
      isOwner: dto.isOwner,
      role: dto.role,
      clinicSharePercent,
      doctorSharePercent,
    });
    return doc.toObject();
  }

  async update(id: string, dto: UpdateDoctorDto) {
    const doc = await this.doctorModel.findById(id);
    if (!doc) throw new NotFoundException('Doctor not found');
    const clinic = dto.clinicSharePercent ?? (doc as { clinicSharePercent?: number }).clinicSharePercent ?? 20;
    const doctor = dto.doctorSharePercent ?? (doc as { doctorSharePercent?: number }).doctorSharePercent ?? 80;
    const { clinicSharePercent, doctorSharePercent } = ensurePercentSum(clinic, doctor);
    if (dto.name !== undefined) doc.name = dto.name.trim();
    if (dto.nameAr !== undefined) doc.nameAr = dto.nameAr.trim();
    if (dto.specialty !== undefined) doc.specialty = dto.specialty.trim();
    if (dto.specialtyAr !== undefined) doc.specialtyAr = dto.specialtyAr.trim();
    if (dto.color !== undefined) doc.color = dto.color;
    if (dto.isOwner !== undefined) doc.isOwner = dto.isOwner;
    if (dto.role !== undefined) doc.role = dto.role;
    doc.clinicSharePercent = clinicSharePercent;
    doc.doctorSharePercent = doctorSharePercent;
    await doc.save();
    return doc.toObject();
  }

  async remove(id: string) {
    const doc = await this.doctorModel.findById(id);
    if (!doc) throw new NotFoundException('Doctor not found');
    const doctorId = new Types.ObjectId(id);
    const [appointments, invoices, patients] = await Promise.all([
      this.doctorModel.db.collection('appointments').countDocuments({ doctorId }),
      this.doctorModel.db.collection('invoices').countDocuments({ doctorId }),
      this.doctorModel.db.collection('patients').countDocuments({ assignedDoctorId: doctorId }),
    ]);
    if (appointments > 0 || invoices > 0 || patients > 0) {
      throw new BadRequestException(
        'Cannot delete doctor: they have linked appointments, invoices, or assigned patients. Reassign or remove those first.',
      );
    }
    await this.doctorModel.findByIdAndDelete(id);
  }
}
