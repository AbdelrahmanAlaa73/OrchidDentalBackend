import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

/** Check if string is a valid 24-char hex MongoDB ObjectId */
export function isValidObjectId(id: unknown): id is string {
  if (typeof id !== 'string' || id.length !== 24) return false;
  return /^[a-fA-F0-9]{24}$/.test(id);
}

/** Safely convert to ObjectId; returns undefined if invalid (for optional fields) */
export function toObjectIdOrUndefined(id: unknown): Types.ObjectId | undefined {
  if (!id || !isValidObjectId(id)) return undefined;
  return new Types.ObjectId(id);
}

/** Convert to ObjectId or throw BadRequestException (for required fields) */
export function toObjectIdOrThrow(id: unknown, fieldName = 'id'): Types.ObjectId {
  if (!id || !isValidObjectId(id)) {
    throw new BadRequestException(`${fieldName} must be a valid MongoDB ObjectId (24 hex characters)`);
  }
  return new Types.ObjectId(id);
}
