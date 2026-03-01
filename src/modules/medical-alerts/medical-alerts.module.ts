import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicalAlert, MedicalAlertSchema } from './schemas/medical-alert.schema';
import { MedicalAlertsService } from './medical-alerts.service';
import { MedicalAlertsController } from './medical-alerts.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: MedicalAlert.name, schema: MedicalAlertSchema }])],
  controllers: [MedicalAlertsController],
  providers: [MedicalAlertsService],
  exports: [MedicalAlertsService, MongooseModule],
})
export class MedicalAlertsModule {}
