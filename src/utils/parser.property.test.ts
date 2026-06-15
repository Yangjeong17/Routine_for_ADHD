import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { parseRoutineJson, timeToMinutes } from './parser';
import type { DayValue } from '../types';

/**
 * Parser Property-Based Tests
 *
 * 유효한 루틴 JSON을 생성하여 parseRoutineJson 함수의 불변 속성을 검증한다.
 * - Property 5: Seven Days Invariant (7개 요일 존재)
 * - Property 4: Duration Consistency (duration_minutes 일관성)
 * - Property 7: Time Validity (end > start)
 */

const DAY_VALUES: DayValue[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

/**
 * 유효한 시간 쌍(start, end)을 생성하는 arbitrary
 * - start: 00:00 ~ 22:59 범위
 * - end: start보다 최소 1분 이상 큰 값 (최대 23:59)
 */
const validTimePairArbitrary: fc.Arbitrary<{ start: string; end: string }> = fc
  .integer({ min: 0, max: 22 * 60 + 58 }) // start를 분 단위로 생성 (0 ~ 1378)
  .chain((startMinutes) => {
    // end는 start + 1분 ~ 23:59(1439분) 사이
    const maxEnd = 23 * 60 + 59; // 1439
    return fc
      .integer({ min: startMinutes + 1, max: maxEnd })
      .map((endMinutes) => {
        const startHour = Math.floor(startMinutes / 60);
        const startMin = startMinutes % 60;
        const endHour = Math.floor(endMinutes / 60);
        const endMin = endMinutes % 60;
        return {
          start: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
          end: `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`,
        };
      });
  });

/**
 * 유효한 Block JSON 객체를 생성하는 arbitrary
 * - title: 비어있지 않은 문자열
 * - start/end: 유효한 HH:mm 시간 쌍 (end > start)
 * - 선택적 필드: category, priority, color, id, notes
 */
const validBlockArbitrary: fc.Arbitrary<Record<string, unknown>> = fc.record({
  title: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
  timePair: validTimePairArbitrary,
  category: fc.option(fc.string({ minLength: 1, maxLength: 15 }), { nil: undefined }),
  priority: fc.option(fc.constantFrom('high', 'medium', 'low'), { nil: undefined }),
  color: fc.option(
    fc.tuple(
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
    ).map(([r, g, b]) => `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`),
    { nil: undefined },
  ),
  id: fc.option(fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0), { nil: undefined }),
  notes: fc.option(fc.string({ minLength: 0, maxLength: 50 }), { nil: undefined }),
}).map((rec) => {
  const block: Record<string, unknown> = {
    title: rec.title,
    start: rec.timePair.start,
    end: rec.timePair.end,
  };
  if (rec.category !== undefined) block.category = rec.category;
  if (rec.priority !== undefined) block.priority = rec.priority;
  if (rec.color !== undefined) block.color = rec.color;
  if (rec.id !== undefined) block.id = rec.id;
  if (rec.notes !== undefined) block.notes = rec.notes;
  return block;
});

/**
 * 유효한 Day JSON 객체를 생성하는 arbitrary
 * - day: 7개 DayValue 중 하나
 * - blocks: 0~3개의 유효한 블록 배열
 */
const validDayArbitrary: fc.Arbitrary<{ day: DayValue; blocks: Record<string, unknown>[] }> = fc.record({
  day: fc.constantFrom(...DAY_VALUES),
  blocks: fc.array(validBlockArbitrary, { minLength: 0, maxLength: 3 }),
});

/**
 * 유효한 루틴 JSON 문자열을 생성하는 arbitrary
 * - routine_name: 비어있지 않은 문자열
 * - days: 1~7개의 유효한 Day 배열 (중복 요일 제거)
 */
const validRoutineJsonArbitrary: fc.Arbitrary<string> = fc
  .record({
    routine_name: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
    days: fc.array(validDayArbitrary, { minLength: 1, maxLength: 7 }),
  })
  .map((routine) => {
    // 중복 요일 제거: 첫 번째 등장만 유지
    const seenDays = new Set<DayValue>();
    const uniqueDays = routine.days.filter((d) => {
      if (seenDays.has(d.day)) return false;
      seenDays.add(d.day);
      return true;
    });
    return JSON.stringify({
      routine_name: routine.routine_name,
      days: uniqueDays,
    });
  });

describe('Property 5: Seven Days Invariant', () => {
  /**
   * **Validates: Requirements 5.1, 10.1**
   *
   * 파싱 성공 후 days 배열은 항상 정확히 7개 요소를 가지며,
   * 7개의 모든 DayValue가 존재한다.
   * Formal: ∀ routineData: routineData.days.length = 7 ∧ allDayValuesPresent(routineData.days)
   */
  it('파싱 성공 후 항상 7개 요일이 존재한다', () => {
    fc.assert(
      fc.property(validRoutineJsonArbitrary, (jsonString) => {
        const result = parseRoutineJson(jsonString);

        // 파싱이 성공한 경우에만 검증
        if (!result.success) return true; // 파싱 실패는 이 속성의 관심사가 아님

        // days 배열이 정확히 7개인지 확인
        expect(result.data.days).toHaveLength(7);

        // 모든 7개 DayValue가 존재하는지 확인
        const dayValues = result.data.days.map((d) => d.day);
        for (const expectedDay of DAY_VALUES) {
          expect(dayValues).toContain(expectedDay);
        }
      }),
      { numRuns: 200 },
    );
  });
});

describe('Property 4: Duration Consistency', () => {
  /**
   * **Validates: Requirements 4.3**
   *
   * 파싱 성공 후 모든 Block의 duration_minutes는
   * start와 end의 시간 차이(분)와 일치한다.
   * Formal: ∀ block ∈ allBlocks: block.duration_minutes = timeDiff(block.start, block.end)
   */
  it('파싱 성공 후 모든 block의 duration_minutes가 start/end 차이와 일치한다', () => {
    fc.assert(
      fc.property(validRoutineJsonArbitrary, (jsonString) => {
        const result = parseRoutineJson(jsonString);

        // 파싱이 성공한 경우에만 검증
        if (!result.success) return true;

        // 모든 블록에 대해 duration_minutes 일관성 검증
        for (const day of result.data.days) {
          for (const block of day.blocks) {
            const expectedDuration = timeToMinutes(block.end) - timeToMinutes(block.start);
            expect(block.duration_minutes).toBe(expectedDuration);
          }
        }
      }),
      { numRuns: 200 },
    );
  });
});

describe('Property 7: Time Validity', () => {
  /**
   * **Validates: Requirements 3.1**
   *
   * 파싱 성공 후 모든 Block의 end 시간은 start 시간보다 크다.
   * Formal: ∀ block ∈ allBlocks: timeToMinutes(block.end) > timeToMinutes(block.start)
   */
  it('파싱 성공 후 모든 block의 end > start이다', () => {
    fc.assert(
      fc.property(validRoutineJsonArbitrary, (jsonString) => {
        const result = parseRoutineJson(jsonString);

        // 파싱이 성공한 경우에만 검증
        if (!result.success) return true;

        // 모든 블록에 대해 end > start 검증
        for (const day of result.data.days) {
          for (const block of day.blocks) {
            const startMinutes = timeToMinutes(block.start);
            const endMinutes = timeToMinutes(block.end);
            expect(endMinutes).toBeGreaterThan(startMinutes);
          }
        }
      }),
      { numRuns: 200 },
    );
  });
});
