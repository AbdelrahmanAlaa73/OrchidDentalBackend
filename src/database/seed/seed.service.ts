import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClinicSettings } from '../../modules/settings/schemas/clinic-settings.schema';
import { ProcedurePricing } from '../../modules/procedure-pricing/schemas/procedure-pricing.schema';

const WORKING_HOURS: Record<string, { open: string; close: string; isOpen: boolean }> = {
  sunday: { open: '09:00', close: '17:00', isOpen: true },
  monday: { open: '09:00', close: '17:00', isOpen: true },
  tuesday: { open: '09:00', close: '17:00', isOpen: true },
  wednesday: { open: '09:00', close: '17:00', isOpen: true },
  thursday: { open: '09:00', close: '17:00', isOpen: true },
  friday: { open: '00:00', close: '00:00', isOpen: false },
  saturday: { open: '09:00', close: '14:00', isOpen: true },
};

const PROCEDURE_PRICINGS = [
  { procedure: 'Consultation', procedureAr: 'استشارة', basePrice: 200, doctorPercent: 100, clinicPercent: 0, maxDiscount: 10 },
  { procedure: 'Scaling & Polishing', procedureAr: 'تنظيف وتلميع', basePrice: 800, doctorPercent: 70, clinicPercent: 30, maxDiscount: 15 },
  { procedure: 'Composite Filling', procedureAr: 'حشو مركب', basePrice: 500, doctorPercent: 65, clinicPercent: 35, maxDiscount: 10 },
  { procedure: 'Root Canal Treatment', procedureAr: 'علاج الجذر', basePrice: 1500, doctorPercent: 70, clinicPercent: 30, maxDiscount: 5 },
  { procedure: 'Crown (Zirconia)', procedureAr: 'تاج زركونيا', basePrice: 2500, doctorPercent: 60, clinicPercent: 40, maxDiscount: 10 },
  { procedure: 'Extraction', procedureAr: 'خلع', basePrice: 400, doctorPercent: 80, clinicPercent: 20, maxDiscount: 0 },
  { procedure: 'Implant', procedureAr: 'زراعة', basePrice: 8000, doctorPercent: 50, clinicPercent: 50, maxDiscount: 5 },
  { procedure: 'Braces (Full)', procedureAr: 'تقويم كامل', basePrice: 15000, doctorPercent: 60, clinicPercent: 40, maxDiscount: 10 },
  { procedure: 'Braces Adjustment', procedureAr: 'ضبط تقويم', basePrice: 600, doctorPercent: 70, clinicPercent: 30, maxDiscount: 0 },
  { procedure: 'Teeth Whitening', procedureAr: 'تبييض الأسنان', basePrice: 2000, doctorPercent: 65, clinicPercent: 35, maxDiscount: 15 },
];

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectModel(ClinicSettings.name) private clinicSettingsModel: Model<ClinicSettings>,
    @InjectModel(ProcedurePricing.name) private procedurePricingModel: Model<ProcedurePricing>,
  ) {}

  async onModuleInit() {
    await this.seedIfNeeded();
  }

  async seedIfNeeded() {
    const existing = await this.clinicSettingsModel.findOne();
    if (existing) return;
    await this.clinicSettingsModel.create({
      name: 'Orchid Dental Clinic',
      nameAr: 'عيادة أوركيد للأسنان',
      address: '',
      phone: '',
      email: '',
      workingHours: WORKING_HOURS,
      appointmentDurations: [15, 30, 45, 60, 90],
      sterilizationBuffer: 10,
      clinicSharePercentage: 20,
      currency: 'EGP',
    });
    console.log('ClinicSettings seeded (first run)');
    if ((await this.procedurePricingModel.countDocuments()) === 0) {
      await this.procedurePricingModel.insertMany(PROCEDURE_PRICINGS);
      console.log('ProcedurePricing seeded');
    }
  }
}
