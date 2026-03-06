import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClinicSettings } from '../../modules/settings/schemas/clinic-settings.schema';
import { ProcedurePricing } from '../../modules/procedure-pricing/schemas/procedure-pricing.schema';
import { Doctor } from '../../modules/doctors/schemas/doctor.schema';
import { DoctorColor, DoctorRole } from '../../enums';

const WORKING_HOURS: Record<string, { open: string; close: string; isOpen: boolean }> = {
  sunday: { open: '09:00', close: '17:00', isOpen: true },
  monday: { open: '09:00', close: '17:00', isOpen: true },
  tuesday: { open: '09:00', close: '17:00', isOpen: true },
  wednesday: { open: '09:00', close: '17:00', isOpen: true },
  thursday: { open: '09:00', close: '17:00', isOpen: true },
  friday: { open: '00:00', close: '00:00', isOpen: false },
  saturday: { open: '09:00', close: '14:00', isOpen: true },
};

const SEED_DOCTORS = [
  { name: 'Dr. Ahmed Hassan', nameAr: 'د. أحمد حسن', specialty: 'General Dentistry', specialtyAr: 'طب الأسنان العام', color: DoctorColor.Orchid, isOwner: true, role: DoctorRole.Owner, clinicSharePercent: 20, doctorSharePercent: 80 },
  { name: 'Dr. Sara Mohamed', nameAr: 'د. سارة محمد', specialty: 'Orthodontics', specialtyAr: 'تقويم الأسنان', color: DoctorColor.Emerald, isOwner: false, role: DoctorRole.Doctor, clinicSharePercent: 20, doctorSharePercent: 80 },
  { name: 'Dr. Omar Khalil', nameAr: 'د. عمر خليل', specialty: 'Oral Surgery', specialtyAr: 'جراحة الفم', color: DoctorColor.Amber, isOwner: false, role: DoctorRole.Doctor, clinicSharePercent: 20, doctorSharePercent: 80 },
];

const PROCEDURE_PRICINGS = [
  { procedure: 'Consultation', procedureAr: 'استشارة', basePrice: 200 },
  { procedure: 'Scaling & Polishing', procedureAr: 'تنظيف وتلميع', basePrice: 800 },
  { procedure: 'Composite Filling', procedureAr: 'حشو مركب', basePrice: 500 },
  { procedure: 'Root Canal Treatment', procedureAr: 'علاج الجذر', basePrice: 1500 },
  { procedure: 'Crown (Zirconia)', procedureAr: 'تاج زركونيا', basePrice: 2500 },
  { procedure: 'Extraction', procedureAr: 'خلع', basePrice: 400 },
  { procedure: 'Implant', procedureAr: 'زراعة', basePrice: 8000 },
  { procedure: 'Braces (Full)', procedureAr: 'تقويم كامل', basePrice: 15000 },
  { procedure: 'Braces Adjustment', procedureAr: 'ضبط تقويم', basePrice: 600 },
  { procedure: 'Teeth Whitening', procedureAr: 'تبييض الأسنان', basePrice: 2000 },
];

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectModel(ClinicSettings.name) private clinicSettingsModel: Model<ClinicSettings>,
    @InjectModel(ProcedurePricing.name) private procedurePricingModel: Model<ProcedurePricing>,
    @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,
  ) {}

  async onModuleInit() {
    await this.seedIfNeeded();
  }

  async seedIfNeeded() {
    const existing = await this.clinicSettingsModel.findOne();
    if (!existing) {
      await this.clinicSettingsModel.create({
        name: 'Orchid Dental Clinic',
        nameAr: 'عيادة أوركيد للأسنان',
        address: '',
        phone: '',
        email: '',
        workingHours: WORKING_HOURS,
        appointmentDurations: [15, 30, 45, 60, 90, 120],
        sterilizationBuffer: 10,
        clinicSharePercentage: 20,
        currency: 'EGP',
      });
      console.log('ClinicSettings seeded (first run)');
    }
    if ((await this.procedurePricingModel.countDocuments()) === 0) {
      await this.procedurePricingModel.insertMany(PROCEDURE_PRICINGS);
      console.log('ProcedurePricing seeded');
    }
    if ((await this.doctorModel.countDocuments()) === 0) {
      await this.doctorModel.insertMany(SEED_DOCTORS);
      console.log('Doctors seeded (use GET /api/doctors for IDs when registering doctor/assistant)');
    }
  }
}
