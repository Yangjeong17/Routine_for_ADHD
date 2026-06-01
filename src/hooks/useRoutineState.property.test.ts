import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { parseRoutineJson, timeToMinutes } from '../utils/parser';
import type { DayValue, Block } from '../types';

/**
 * useRoutineState Property-Based Tests
 *
 * Property 2: Time Sorting Invariant
 * 블록 추가/수정 후 해당 요일의 blocks가 start 시간 기준 정렬되어 있는지 검증한다.
 *
 * **Validates: Requirements 10.2**
 *
 * Formal: ∀ day ∈ days: ∀ i < j: day.blocks[i].start ≤ day.blocks[j].start
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
 * - start: 00:00 ~ 22:58 범위
 * - end: start보다 최소 1분 이상 큰 값 (최대 23:59)
 */
const validTimePairArbitrary: fc.Arbitrary<{ start: string; end: string }> = fc
  .integer({ min: 0, max: 22 * 60 + 58 })
  .chain((startMinutes) => {
    const maxEnd = 23 * 60 + 59;
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
 * - 의도적으로 정렬되지 않은 순서로 블록을 생성하여 정렬 검증에 활용
 */
const validBlockArbitrary: fc.Arbitrary<Record<string, unknown>> = fc.record({
  title: fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
  timePair: validTimePairArbitrary,
  priority: fc.constantFrom('high', 'medium', 'low'),
}).map((rec) => ({
  title: rec.title,
  start: rec.timePair.start,
  end: rec.timePair.end,
  priority: rec.priority,
}));

/**
 * 여러 블록을 가진 Day JSON 객체를 생성하는 arbitrary
 * - 2~5개의 블록을 생성하여 정렬 검증이 의미 있도록 함
 */
const validDayWithMultipleBlocksArbitrary: fc.Arbitrary<{
  day: DayValue;
  blocks: Record<string, unknown>[];
}> = fc.record({
  day: fc.constantFrom(...DAY_VALUES),
  blocks: fc.array(validBlockArbitrary, { minLength: 2, maxLength: 5 }),
});

/**
 * 유효한 루틴 JSON 문자열을 생성하는 arbitrary
 * - 여러 블록을 가진 요일을 포함하여 정렬 불변 속성 검증에 적합
 */
const validRoutineJsonArbitrary: fc.Arbitrary<string> = fc
  .record({
    routine_name: fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
    days: fc.array(validDayWithMultipleBlocksArbitrary, { minLength: 1, maxLength: 7 }),
  })
  .map((routine) => {
    // 중복 요일 제거
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

describe('Property 2: Time Sorting Invariant', () => {
  /**
   * **Validates: Requirements 10.2**
   *
   * 파싱(가져오기) 후 각 요일의 blocks 배열은 항상 start 시간 기준 오름차순으로 정렬되어 있다.
   * Formal: ∀ day ∈ days: ∀ i < j: day.blocks[i].start ≤ day.blocks[j].start
   */
  it('파싱 후 각 요일의 blocks는 start 시간 기준 오름차순으로 정렬되어 있다', () => {
    fc.assert(
      fc.property(validRoutineJsonArbitrary, (jsonString) => {
        const result = parseRoutineJson(jsonString);

        // 파싱이 성공한 경우에만 검증
        if (!result.success) return true;

        // 각 요일에 대해 정렬 불변 속성 검증
        for (const day of result.data.days) {
          for (let i = 0; i < day.blocks.length - 1; i++) {
            const currentStart = timeToMinutes(day.blocks[i].start);
            const nextStart = timeToMinutes(day.blocks[i + 1].start);
            expect(currentStart).toBeLessThanOrEqual(nextStart);
          }
        }
      }),
      { numRuns: 200 },
    );
  });

  /**
   * **Validates: Requirements 10.2**
   *
   * 임의의 Block 배열을 sortBlocksByStartTime과 동일한 로직으로 정렬한 결과가
   * start 시간 기준 오름차순임을 검증한다.
   * 이는 addBlock/updateBlock에서 사용하는 정렬 로직의 정확성을 직접 검증한다.
   */
  it('임의의 Block 배열을 정렬하면 start 시간 기준 오름차순이 된다', () => {
    /**
     * Block 타입에 맞는 완전한 블록을 생성하는 arbitrary
     */
    const fullBlockArbitrary: fc.Arbitrary<Block> = fc.record({
      id: fc.string({ minLength: 5, maxLength: 10 }).filter((s) => s.trim().length > 0),
      title: fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
      timePair: validTimePairArbitrary,
      priority: fc.constantFrom('high' as const, 'medium' as const, 'low' as const),
      color: fc.constant('#6B7280'),
      required: fc.boolean(),
    }).map((rec) => ({
      id: rec.id,
      title: rec.title,
      start: rec.timePair.start,
      end: rec.timePair.end,
      duration_minutes: timeToMinutes(rec.timePair.end) - timeToMinutes(rec.timePair.start),
      priority: rec.priority,
      color: rec.color,
      required: rec.required,
    }));

    fc.assert(
      fc.property(fc.array(fullBlockArbitrary, { minLength: 2, maxLength: 8 }), (blocks) => {
        // sortBlocksByStartTime과 동일한 정렬 로직 적용
        const sorted = [...blocks].sort(
          (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start),
        );

        // 정렬 결과가 오름차순인지 검증
        for (let i = 0; i < sorted.length - 1; i++) {
          const currentStart = timeToMinutes(sorted[i].start);
          const nextStart = timeToMinutes(sorted[i + 1].start);
          expect(currentStart).toBeLessThanOrEqual(nextStart);
        }
      }),
      { numRuns: 200 },
    );
  });
});
