import { DateTime } from 'luxon';
import {
  getWorkdayDateFromUtc,
  getWorkdayRange,
  getWorkdayRangeFromDateRange,
} from './date-range.util';

describe('date-range utils', () => {
  const tz = 'Africa/Cairo';

  it('getWorkdayRange returns 24-hour UTC range', () => {
    const { start, end } = getWorkdayRange('2025-03-15', tz, 6);
    expect(start).toBeInstanceOf(Date);
    expect(end).toBeInstanceOf(Date);
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it('getWorkdayRange supports custom start hour', () => {
    const { start } = getWorkdayRange('2025-03-15', tz, 0);
    const local = DateTime.fromJSDate(start, { zone: 'utc' }).setZone(tz);
    expect(local.hour).toBe(0);
  });

  it('getWorkdayRangeFromDateRange supports same day and multi-day ranges', () => {
    const single = getWorkdayRangeFromDateRange('2025-03-15', '2025-03-15', tz, 6);
    expect(single.end.getTime() - single.start.getTime()).toBe(24 * 60 * 60 * 1000);

    const multi = getWorkdayRangeFromDateRange('2025-03-15', '2025-03-17', tz, 6);
    expect(multi.end.getTime() - multi.start.getTime()).toBe(3 * 24 * 60 * 60 * 1000);
  });

  it('getWorkdayDateFromUtc returns previous day before start hour', () => {
    const utc = DateTime.fromISO('2025-03-15T02:00:00Z').toJSDate();
    const date = getWorkdayDateFromUtc(utc, tz, 6);
    expect(date).toBe('2025-03-14');
  });

  it('getWorkdayDateFromUtc returns same day after start hour', () => {
    const utc = DateTime.fromISO('2025-03-15T06:00:00Z').toJSDate();
    const date = getWorkdayDateFromUtc(utc, tz, 6);
    expect(date).toBe('2025-03-15');
  });
});
