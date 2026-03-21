import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { isValidObjectId, toObjectIdOrThrow, toObjectIdOrUndefined } from './objectid';

describe('objectid utils', () => {
  describe('isValidObjectId', () => {
    it('returns true for valid 24-char hex', () => {
      expect(isValidObjectId('507f1f77bcf86cd799439011')).toBe(true);
    });

    it('returns false for invalid length and invalid chars', () => {
      expect(isValidObjectId('507f1f77bcf86cd79943901')).toBe(false);
      expect(isValidObjectId('507f1f77bcf86cd7994390111')).toBe(false);
      expect(isValidObjectId('zz7f1f77bcf86cd799439011')).toBe(false);
    });

    it('returns false for non-string values', () => {
      expect(isValidObjectId(null)).toBe(false);
      expect(isValidObjectId(undefined)).toBe(false);
      expect(isValidObjectId(123)).toBe(false);
    });
  });

  describe('toObjectIdOrUndefined', () => {
    it('returns ObjectId for valid value', () => {
      const value = toObjectIdOrUndefined('507f1f77bcf86cd799439011');
      expect(value).toBeInstanceOf(Types.ObjectId);
      expect(value?.toString()).toBe('507f1f77bcf86cd799439011');
    });

    it('returns undefined for invalid value', () => {
      expect(toObjectIdOrUndefined('invalid')).toBeUndefined();
      expect(toObjectIdOrUndefined(undefined)).toBeUndefined();
      expect(toObjectIdOrUndefined('')).toBeUndefined();
    });
  });

  describe('toObjectIdOrThrow', () => {
    it('returns ObjectId for valid value', () => {
      const value = toObjectIdOrThrow('507f1f77bcf86cd799439011', 'patientId');
      expect(value).toBeInstanceOf(Types.ObjectId);
      expect(value.toString()).toBe('507f1f77bcf86cd799439011');
    });

    it('throws BadRequestException with field name for invalid value', () => {
      expect(() => toObjectIdOrThrow('bad-id', 'doctorId')).toThrow(BadRequestException);
      expect(() => toObjectIdOrThrow('bad-id', 'doctorId')).toThrow(
        'doctorId must be a valid MongoDB ObjectId (24 hex characters)',
      );
    });
  });
});
