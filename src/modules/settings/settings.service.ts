import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClinicSettings } from './schemas/clinic-settings.schema';

@Injectable()
export class SettingsService {
  constructor(@InjectModel(ClinicSettings.name) private clinicSettingsModel: Model<ClinicSettings>) {}

  async get() {
    const settings = await this.clinicSettingsModel.findOne().lean();
    if (!settings) throw new NotFoundException('Clinic settings not found. Run seed.');
    return settings;
  }

  async update(body: Record<string, unknown>) {
    const settings = await this.clinicSettingsModel.findOneAndUpdate({}, { $set: body }, { new: true }).lean();
    if (!settings) throw new NotFoundException('Clinic settings not found. Run seed.');
    return settings;
  }
}
