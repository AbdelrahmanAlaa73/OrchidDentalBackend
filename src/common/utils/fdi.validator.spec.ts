import { addMinutesToTime, validateFDITooth } from './fdi.validator';

describe('fdi.validator utils', () => {
  describe('validateFDITooth', () => {
    it('returns true for valid FDI teeth', () => {
      expect(validateFDITooth(11)).toBe(true);
      expect(validateFDITooth(18)).toBe(true);
      expect(validateFDITooth(21)).toBe(true);
      expect(validateFDITooth(31)).toBe(true);
      expect(validateFDITooth(48)).toBe(true);
    });

    it('returns false for invalid FDI teeth', () => {
      expect(validateFDITooth(10)).toBe(false);
      expect(validateFDITooth(19)).toBe(false);
      expect(validateFDITooth(0)).toBe(false);
      expect(validateFDITooth(99)).toBe(false);
    });
  });

  describe('addMinutesToTime', () => {
    it('adds minutes within the same hour', () => {
      expect(addMinutesToTime('09:00', 30)).toBe('09:30');
    });

    it('rolls over to next day', () => {
      expect(addMinutesToTime('23:45', 30)).toBe('00:15');
    });

    it('keeps same time with zero minutes', () => {
      expect(addMinutesToTime('12:00', 0)).toBe('12:00');
    });

    it('supports large minute values', () => {
      expect(addMinutesToTime('00:00', 1500)).toBe('01:00');
    });
  });
});
