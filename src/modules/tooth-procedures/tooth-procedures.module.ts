import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ToothProcedure, ToothProcedureSchema } from './schemas/tooth-procedure.schema';
import { ToothProceduresService } from './tooth-procedures.service';
import { ToothProceduresController } from './tooth-procedures.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: ToothProcedure.name, schema: ToothProcedureSchema }])],
  controllers: [ToothProceduresController],
  providers: [ToothProceduresService],
  exports: [ToothProceduresService, MongooseModule],
})
export class ToothProceduresModule {}
