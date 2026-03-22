import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import { PrescriptionsService } from './prescriptions.service';
import { Prescription } from './schemas/prescription.schema';

function chainPopulatePopulateLean(result: unknown) {
  const lean = jest.fn().mockResolvedValue(result);
  return {
    populate: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({ lean }),
    }),
  };
}

describe('PrescriptionsService', () => {
  let service: PrescriptionsService;
  let prescriptionModel: any;

  beforeEach(async () => {
    prescriptionModel = {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOneAndDelete: jest.fn(),
      deleteMany: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PrescriptionsService,
        { provide: getModelToken(Prescription.name), useValue: prescriptionModel },
      ],
    }).compile();

    service = moduleRef.get(PrescriptionsService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByPatient', () => {
    it('returns sorted prescriptions for patient', async () => {
      const pid = new Types.ObjectId();
      const rows = [{ _id: new Types.ObjectId(), patientId: pid }];
      const q: { populate: jest.Mock; sort: jest.Mock } = {} as any;
      q.populate = jest.fn().mockReturnValue(q);
      q.sort = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(rows),
      });
      prescriptionModel.find.mockReturnValue(q);

      const result = await service.findByPatient(pid.toString());

      expect(prescriptionModel.find).toHaveBeenCalledWith({ patientId: pid });
      expect(result).toEqual(rows);
    });
  });

  describe('create', () => {
    it('creates and returns populated prescription', async () => {
      const patientId = new Types.ObjectId();
      const doctorId = new Types.ObjectId();
      const prescId = new Types.ObjectId();
      prescriptionModel.create.mockResolvedValue({ _id: prescId });
      prescriptionModel.findById.mockReturnValue(chainPopulatePopulateLean({ _id: prescId, medication: 'Med' }));

      const result = await service.create(patientId.toString(), {
        doctorId: doctorId.toString(),
        medication: 'Med',
        dosage: '1x',
        duration: '7d',
        datePrescribed: '2026-04-01',
      });

      expect(prescriptionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId,
          doctorId,
          medication: 'Med',
          status: 'active',
        }),
      );
      expect(result).toMatchObject({ medication: 'Med' });
    });

    it('throws BadRequestException for invalid appointmentId', async () => {
      await expect(
        service.create(new Types.ObjectId().toString(), {
          doctorId: new Types.ObjectId().toString(),
          medication: 'M',
          dosage: '1',
          duration: '1d',
          datePrescribed: '2026-04-01',
          appointmentId: 'not-a-valid-objectid',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when missing', async () => {
      prescriptionModel.findById.mockReturnValue(chainPopulatePopulateLean(null));

      await expect(service.findById(new Types.ObjectId().toString())).rejects.toThrow(NotFoundException);
    });

    it('returns prescription when found', async () => {
      const id = new Types.ObjectId();
      const doc = { _id: id, medication: 'A' };
      prescriptionModel.findById.mockReturnValue(chainPopulatePopulateLean(doc));

      const result = await service.findById(id.toString());

      expect(result).toEqual(doc);
    });

    it('returns prescription with priorPrescriptions when includeHistory true', async () => {
      const id = new Types.ObjectId();
      const patientId = new Types.ObjectId();
      const doc = {
        _id: id,
        patientId,
        datePrescribed: '2026-04-02',
        medication: 'Amox',
        createdAt: new Date('2026-04-02T12:00:00Z'),
      };
      const priors = [{ _id: new Types.ObjectId(), datePrescribed: '2026-04-01' }];

      prescriptionModel.findById.mockReturnValue(chainPopulatePopulateLean(doc));
      const hq: { populate: jest.Mock; sort: jest.Mock } = {} as any;
      hq.populate = jest.fn().mockReturnValue(hq);
      hq.sort = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(priors),
      });
      prescriptionModel.find.mockReturnValue(hq);

      const result = (await service.findById(id.toString(), true)) as {
        prescription: unknown;
        priorPrescriptions: unknown[];
      };

      expect(result.prescription).toEqual(doc);
      expect(result.priorPrescriptions).toEqual(priors);
    });
  });

  describe('getPriorPrescriptions', () => {
    it('throws when prescription id not found', async () => {
      prescriptionModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

      await expect(service.getPriorPrescriptions(new Types.ObjectId().toString())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('queries prior rows with sameMedication filter', async () => {
      const id = new Types.ObjectId();
      const patientId = new Types.ObjectId();
      const current = {
        _id: id,
        patientId,
        datePrescribed: '2026-04-02',
        medication: 'Amoxicillin',
        createdAt: new Date(),
      };
      prescriptionModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(current) });
      const priorList = [{ _id: new Types.ObjectId() }];
      const fq: { populate: jest.Mock; sort: jest.Mock } = {} as any;
      fq.populate = jest.fn().mockReturnValue(fq);
      fq.sort = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(priorList),
      });
      prescriptionModel.find.mockReturnValue(fq);

      const result = await service.getPriorPrescriptions(id.toString(), { sameMedication: true });

      expect(prescriptionModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId,
          medication: expect.any(RegExp),
        }),
      );
      expect(result).toEqual(priorList);
    });
  });

  describe('updateById / removeById', () => {
    it('updateById throws when not found', async () => {
      prescriptionModel.findByIdAndUpdate.mockReturnValue(chainPopulatePopulateLean(null));

      await expect(service.updateById(new Types.ObjectId().toString(), { notes: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('removeById throws when not found', async () => {
      prescriptionModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.removeById(new Types.ObjectId().toString())).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne (nested patient path)', () => {
    it('throws NotFoundException when no match', async () => {
      prescriptionModel.findOne.mockReturnValue(chainPopulatePopulateLean(null));

      await expect(
        service.findOne(new Types.ObjectId().toString(), new Types.ObjectId().toString()),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns prescription when found', async () => {
      const row = { _id: new Types.ObjectId(), medication: 'Z' };
      prescriptionModel.findOne.mockReturnValue(chainPopulatePopulateLean(row));

      const result = await service.findOne(new Types.ObjectId().toString(), row._id.toString());

      expect(result).toEqual(row);
    });
  });
});
