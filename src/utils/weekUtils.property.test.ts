import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { getMonday, getWeekDates } from './weekUtils';

/**
 * Property-Based Tests for weekUtils
 *
 * getWeekDates와 getMonday 함수의 핵심 불변 속성을 검증한다.
 * - getWeekDates는 항상 정확히 7개의 날짜를 반환한다
 * - getWeekDates의 첫 번째 날짜는 항상 월요일이다
 * - getWeekDates가 반환하는 날짜들은 연속적이다 (각 날짜는 이전 날짜의 정확히 1일 후)
 * - getMonday는 임의의 날짜에 대해 항상 월요일을 반환한다
 */

// 임의의 유효한 Date 생성: 2000-01-01 ~ 2099-12-31 범위
// noInvalidDate 옵션으로 NaN Date를 제외한다
const dateArbitrary = fc.date({
  min: new Date(2000, 0, 1),
  max: new Date(2099, 11, 31),
  noInvalidDate: true,
});

describe('weekUtils Property Tests', () => {
  describe('getWeekDates properties', () => {
    /**
     * **Validates: Requirements 5.1, 10.1**
     *
     * Property 1: getWeekDates는 항상 정확히 7개의 날짜를 반환한다.
     */
    it('항상 정확히 7개의 날짜를 반환한다', () => {
      fc.assert(
        fc.property(dateArbitrary, (date) => {
          const monday = getMonday(date);
          const weekDates = getWeekDates(monday);
          expect(weekDates).toHaveLength(7);
        }),
        { numRuns: 200 },
      );
    });

    /**
     * **Validates: Requirements 5.1, 10.1**
     *
     * Property 2: getWeekDates의 첫 번째 날짜는 항상 월요일이다 (getDay() === 1).
     */
    it('첫 번째 날짜는 항상 월요일이다', () => {
      fc.assert(
        fc.property(dateArbitrary, (date) => {
          const monday = getMonday(date);
          const weekDates = getWeekDates(monday);
          expect(weekDates[0].getDay()).toBe(1);
        }),
        { numRuns: 200 },
      );
    });

    /**
     * **Validates: Requirements 5.1, 10.1**
     *
     * Property 3: getWeekDates가 반환하는 날짜들은 연속적이다.
     * 각 날짜는 이전 날짜의 정확히 1일(86400000ms) 후이다.
     */
    it('반환된 날짜들은 연속적이다 (각 날짜는 이전 날짜의 정확히 1일 후)', () => {
      fc.assert(
        fc.property(dateArbitrary, (date) => {
          const monday = getMonday(date);
          const weekDates = getWeekDates(monday);

          for (let i = 1; i < weekDates.length; i++) {
            const diffMs = weekDates[i].getTime() - weekDates[i - 1].getTime();
            // 정확히 24시간 차이 (86400000ms)
            expect(diffMs).toBe(24 * 60 * 60 * 1000);
          }
        }),
        { numRuns: 200 },
      );
    });
  });

  describe('getMonday properties', () => {
    /**
     * **Validates: Requirements 5.1, 10.1**
     *
     * Property 4: 임의의 날짜에 대해 getMonday는 항상 월요일을 반환한다 (getDay() === 1).
     */
    it('임의의 날짜에 대해 항상 월요일을 반환한다', () => {
      fc.assert(
        fc.property(dateArbitrary, (date) => {
          const monday = getMonday(date);
          expect(monday.getDay()).toBe(1);
        }),
        { numRuns: 200 },
      );
    });
  });
});
