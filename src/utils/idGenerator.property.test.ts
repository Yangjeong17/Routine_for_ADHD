import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { deduplicateIds } from './idGenerator';
import type { DayData, DayValue, Block } from '../types';

/**
 * Property 3: ID Uniqueness Invariant
 * Validates: Requirements 6.1
 *
 * deduplicateIds(days) 호출 후 모든 Block의 id는 전체 데이터 내에서 고유하다.
 * Formal: ∀ block_a, block_b ∈ allBlocks: block_a ≠ block_b → block_a.id ≠ block_b.id
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

const DAY_LABELS: Record<DayValue, string> = {
  monday: '월요일',
  tuesday: '화요일',
  wednesday: '수요일',
  thursday: '목요일',
  friday: '금요일',
  saturday: '토요일',
  sunday: '일요일',
};

// 작은 ID 풀을 사용하여 중복 확률을 높인다
const ID_POOL = ['id-1', 'id-2', 'id-3', 'id-4', 'id-5'];

// Block arbitrary: 작은 ID 풀에서 선택하여 중복 가능성을 높임
const blockArbitrary: fc.Arbitrary<Block> = fc.record({
  id: fc.constantFrom(...ID_POOL),
  title: fc.string({ minLength: 1, maxLength: 20 }),
  start: fc.constantFrom('08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00'),
  end: fc.constantFrom('09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'),
  duration_minutes: fc.constantFrom(30, 60, 90, 120),
  priority: fc.constantFrom('high', 'medium', 'low') as fc.Arbitrary<'high' | 'medium' | 'low'>,
  color: fc.constantFrom('#ff0000', '#00ff00', '#0000ff', '#ffff00'),
  required: fc.boolean(),
});

// DayData arbitrary: 0~5개의 블록을 가진 하루 데이터
const dayDataArbitrary: fc.Arbitrary<DayData> = fc.tuple(
  fc.constantFrom(...DAY_VALUES),
  fc.array(blockArbitrary, { minLength: 0, maxLength: 5 }),
).map(([day, blocks]) => ({
  day,
  label: DAY_LABELS[day],
  blocks,
}));

// DayData[] arbitrary: 1~7일의 데이터
const daysArbitrary: fc.Arbitrary<DayData[]> = fc.array(dayDataArbitrary, {
  minLength: 1,
  maxLength: 7,
});

describe('Property 3: ID Uniqueness Invariant', () => {
  /**
   * **Validates: Requirements 6.1**
   *
   * deduplicateIds 호출 후 모든 블록 ID가 고유한지 검증한다.
   * 작은 ID 풀을 사용하여 입력에 중복 ID가 포함될 확률을 높이고,
   * 함수 실행 후 모든 ID가 고유함을 보장한다.
   */
  it('deduplicateIds 후 모든 블록 ID는 고유하다', () => {
    fc.assert(
      fc.property(daysArbitrary, (days) => {
        const result = deduplicateIds(days);

        // 결과에서 모든 블록 ID를 수집
        const allIds: string[] = [];
        for (const day of result) {
          for (const block of day.blocks) {
            allIds.push(block.id);
          }
        }

        // Set을 사용하여 고유성 검증
        const uniqueIds = new Set(allIds);
        expect(uniqueIds.size).toBe(allIds.length);
      }),
      { numRuns: 200 },
    );
  });
});
