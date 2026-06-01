import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { routineDataToJson } from './prettyPrinter';
import { parseRoutineJson, timeToMinutes } from './parser';
import type { Block, DayData, DayValue, Priority, RoutineData } from '../types';

/**
 * Pretty Printer Property-Based Tests
 *
 * Property 1: Parser Round-Trip
 * 유효한 RoutineData를 Pretty_Printer로 JSON 문자열로 변환한 후
 * 다시 Parser로 파싱하면 원본과 동등한 RoutineData가 생성된다.
 *
 * **Validates: Requirements 8.1, 8.2**
 */

const DAY_LABELS: Record<DayValue, string> = {
  monday: '월요일',
  tuesday: '화요일',
  wednesday: '수요일',
  thursday: '목요일',
  friday: '금요일',
  saturday: '토요일',
  sunday: '일요일',
};

/**
 * 유효한 시간 쌍(start, end)을 생성하는 arbitrary
 * - start: 00:00 ~ 22:58 범위
 * - end: start보다 최소 1분 이상 큰 값 (최대 23:59)
 */
const validTimePairArbitrary: fc.Arbitrary<{ start: string; end: string; duration_minutes: number }> = fc
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
          duration_minutes: endMinutes - startMinutes,
        };
      });
  });

/**
 * 고유 ID를 가진 정규화된 Block을 생성하는 arbitrary
 * - 모든 필수 필드가 채워진 상태
 * - duration_minutes가 start/end 차이와 정확히 일치
 * - index를 사용하여 ID 고유성 보장
 */
function normalizedBlockArbitrary(idPrefix: string, blockIndex: number): fc.Arbitrary<Block> {
  return fc.record({
    timePair: validTimePairArbitrary,
    title: fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
    category: fc.option(fc.string({ minLength: 1, maxLength: 15 }).filter((s) => s.trim().length > 0), { nil: undefined }),
    priority: fc.constantFrom<Priority>('high', 'medium', 'low'),
    color: fc.tuple(
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
    ).map(([r, g, b]) => `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`),
    required: fc.boolean(),
    notes: fc.option(fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0), { nil: undefined }),
  }).map((rec) => {
    const block: Block = {
      id: `${idPrefix}-block-${blockIndex}`,
      title: rec.title,
      start: rec.timePair.start,
      end: rec.timePair.end,
      duration_minutes: rec.timePair.duration_minutes,
      priority: rec.priority,
      color: rec.color,
      required: rec.required,
    };
    if (rec.category !== undefined) {
      block.category = rec.category;
    }
    if (rec.notes !== undefined) {
      block.notes = rec.notes;
    }
    return block;
  });
}

/**
 * 정규화된 DayData를 생성하는 arbitrary
 * - 지정된 dayValue와 한국어 label 사용
 * - 0~3개의 블록, 각 블록은 고유 ID를 가짐
 */
function normalizedDayArbitrary(dayValue: DayValue, dayIndex: number): fc.Arbitrary<DayData> {
  // 0~3개의 블록을 생성하되, 각 블록에 고유 ID prefix 부여
  // 생성 후 start 시간 기준 오름차순 정렬 (parser의 정규화와 일치)
  return fc.integer({ min: 0, max: 3 }).chain((blockCount) => {
    if (blockCount === 0) {
      return fc.constant<DayData>({
        day: dayValue,
        label: DAY_LABELS[dayValue],
        blocks: [],
      });
    }
    const blockArbitraries = Array.from({ length: blockCount }, (_, i) =>
      normalizedBlockArbitrary(`day${dayIndex}`, i)
    );
    return fc.tuple(...(blockArbitraries as [fc.Arbitrary<Block>, ...fc.Arbitrary<Block>[]])).map((blocks) => {
      // start 시간 기준 오름차순 정렬 (Property 2: Time Sorting Invariant)
      const sortedBlocks = [...blocks].sort(
        (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)
      );
      return {
        day: dayValue,
        label: DAY_LABELS[dayValue],
        blocks: sortedBlocks,
      };
    });
  });
}

/**
 * 완전히 정규화된 RoutineData를 생성하는 arbitrary
 * - routine_name: 비어있지 않은 문자열
 * - days: 정확히 7개 (monday~sunday 순서)
 * - 모든 블록: 고유 ID, 올바른 duration_minutes, end > start
 * - 선택적 필드: version, timezone
 */
const normalizedRoutineDataArbitrary: fc.Arbitrary<RoutineData> = fc.record({
  routine_name: fc.string({ minLength: 1, maxLength: 25 }).filter((s) => s.trim().length > 0),
  version: fc.option(fc.string({ minLength: 1, maxLength: 10 }).filter((s) => s.trim().length > 0), { nil: undefined }),
  timezone: fc.option(fc.constantFrom('Asia/Seoul', 'UTC', 'America/New_York'), { nil: undefined }),
  days: fc.tuple(
    normalizedDayArbitrary('monday', 0),
    normalizedDayArbitrary('tuesday', 1),
    normalizedDayArbitrary('wednesday', 2),
    normalizedDayArbitrary('thursday', 3),
    normalizedDayArbitrary('friday', 4),
    normalizedDayArbitrary('saturday', 5),
    normalizedDayArbitrary('sunday', 6),
  ),
}).map((rec) => {
  const data: RoutineData = {
    routine_name: rec.routine_name,
    days: rec.days as unknown as DayData[],
  };
  if (rec.version !== undefined) data.version = rec.version;
  if (rec.timezone !== undefined) data.timezone = rec.timezone;
  return data;
});

describe('Property 1: Parser Round-Trip', () => {
  /**
   * **Validates: Requirements 8.1, 8.2**
   *
   * 유효한 RoutineData를 Pretty_Printer로 JSON 문자열로 변환한 후
   * 다시 Parser로 파싱하면 원본과 동등한 RoutineData가 생성된다.
   *
   * Formal: ∀ validRoutineData: parse(print(validRoutineData)) ≡ validRoutineData
   */
  it('parse(print(data)) ≡ data: 라운드트립 동등성이 성립한다', () => {
    fc.assert(
      fc.property(normalizedRoutineDataArbitrary, (originalData) => {
        // Step 1: RoutineData → JSON 문자열
        const jsonString = routineDataToJson(originalData);

        // Step 2: JSON 문자열 → ParseResult
        const parseResult = parseRoutineJson(jsonString);

        // 파싱이 반드시 성공해야 함
        expect(parseResult.success).toBe(true);
        if (!parseResult.success) return;

        const parsedData = parseResult.data;

        // Step 3: 동등성 검증

        // routine_name 일치
        expect(parsedData.routine_name).toBe(originalData.routine_name);

        // 선택적 필드 일치
        expect(parsedData.version).toBe(originalData.version);
        expect(parsedData.timezone).toBe(originalData.timezone);

        // days 배열 길이 일치 (둘 다 7개)
        expect(parsedData.days).toHaveLength(7);

        // 각 요일별 블록 비교
        for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
          const originalDay = originalData.days[dayIdx];
          const parsedDay = parsedData.days[dayIdx];

          // day 값과 label 일치
          expect(parsedDay.day).toBe(originalDay.day);
          expect(parsedDay.label).toBe(originalDay.label);

          // 블록 수 일치
          expect(parsedDay.blocks).toHaveLength(originalDay.blocks.length);

          // 각 블록의 필드 비교
          for (let blockIdx = 0; blockIdx < originalDay.blocks.length; blockIdx++) {
            const originalBlock = originalDay.blocks[blockIdx];
            const parsedBlock = parsedDay.blocks[blockIdx];

            expect(parsedBlock.id).toBe(originalBlock.id);
            expect(parsedBlock.title).toBe(originalBlock.title);
            expect(parsedBlock.start).toBe(originalBlock.start);
            expect(parsedBlock.end).toBe(originalBlock.end);
            expect(parsedBlock.duration_minutes).toBe(originalBlock.duration_minutes);
            expect(parsedBlock.priority).toBe(originalBlock.priority);
            expect(parsedBlock.color).toBe(originalBlock.color);
            expect(parsedBlock.required).toBe(originalBlock.required);
            expect(parsedBlock.category).toBe(originalBlock.category);
            expect(parsedBlock.notes).toBe(originalBlock.notes);
          }
        }
      }),
      { numRuns: 200 },
    );
  });
});
