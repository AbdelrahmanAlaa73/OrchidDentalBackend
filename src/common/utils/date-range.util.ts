import { DateTime } from 'luxon';

/**
 * Returns the workday range for a given date in the clinic's timezone.
 * A workday runs from WORKDAY_START_HOUR (default 6) AM to the same hour next day (exclusive).
 * E.g. for date "2025-03-15" and start 6: workday is 6:00 AM Mar 15 – 5:59:59.999 AM Mar 16 local.
 *
 * @param date - YYYY-MM-DD string (interpreted in clinic TZ)
 * @param tz - IANA timezone (e.g. Africa/Cairo)
 * @param startHour - Hour of day (0-23) when workday starts, default 6
 */
export function getWorkdayRange(
  date: string,
  tz: string,
  startHour: number = 6,
): { start: Date; end: Date } {
  const startLocal = DateTime.fromISO(date, { zone: tz }).set({ hour: startHour, minute: 0, second: 0, millisecond: 0 });
  const endLocal = startLocal.plus({ days: 1 });
  return {
    start: startLocal.toUTC().toJSDate(),
    end: endLocal.toUTC().toJSDate(),
  };
}

/**
 * Returns the workday-adjusted UTC range for a date range.
 * First day: from startHour on startDate (local). Last day: up to startHour on the day after endDate (exclusive).
 *
 * @param startDate - YYYY-MM-DD
 * @param endDate - YYYY-MM-DD
 * @param tz - IANA timezone
 * @param startHour - Workday start hour (default 6)
 */
export function getWorkdayRangeFromDateRange(
  startDate: string,
  endDate: string,
  tz: string,
  startHour: number = 6,
): { start: Date; end: Date } {
  const startLocal = DateTime.fromISO(startDate, { zone: tz }).set({
    hour: startHour,
    minute: 0,
    second: 0,
    millisecond: 0,
  });
  const endLocal = DateTime.fromISO(endDate, { zone: tz })
    .plus({ days: 1 })
    .set({ hour: startHour, minute: 0, second: 0, millisecond: 0 });
  return {
    start: startLocal.toUTC().toJSDate(),
    end: endLocal.toUTC().toJSDate(),
  };
}

/**
 * Given a UTC timestamp, returns the workday date (YYYY-MM-DD) in the clinic timezone.
 * The "date" is the local calendar date at the given startHour boundary.
 *
 * @param utcDate - A Date (UTC)
 * @param tz - IANA timezone
 * @param startHour - Workday start hour (default 6)
 */
export function getWorkdayDateFromUtc(utcDate: Date, tz: string, startHour: number = 6): string {
  const dt = DateTime.fromJSDate(utcDate, { zone: 'utc' }).setZone(tz);
  const localDate = dt.toISODate();
  if (!localDate) return dt.toFormat('yyyy-MM-dd');
  const dayStart = DateTime.fromISO(localDate, { zone: tz }).set({
    hour: startHour,
    minute: 0,
    second: 0,
    millisecond: 0,
  });
  if (dt < dayStart) {
    const prev = DateTime.fromISO(localDate, { zone: tz }).minus({ days: 1 });
    return prev.toFormat('yyyy-MM-dd');
  }
  return localDate;
}
