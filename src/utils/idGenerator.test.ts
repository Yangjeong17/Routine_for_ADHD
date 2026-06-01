import { describe, it, expect } from 'vitest';
import { generateId, deduplicateIds } from './idGenerator';
import type { DayData } from '../types';

describe('generateId', () => {
  it('문자열 ID를 반환한다', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('호출할 때마다 고유한 ID를 생성한다', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });
});

describe('deduplicateIds', () => {
  it('중복 ID가 없으면 원본과 동일한 구조를 반환한다', () => {
    const days: DayData[] = [
      {
        day: 'monday',
        label: '월요일',
        blocks: [
          { id: 'a', title: '블록1', start: '09:00', end: '10:00', duration_minutes: 60, priority: 'high', color: '#ff0000', required: true },
          { id: 'b', title: '블록2', start: '10:00', end: '11:00', duration_minutes: 60, priority: 'medium', color: '#00ff00', required: false },
        ],
      },
    ];

    const result = deduplicateIds(days);
    expect(result[0].blocks[0].id).toBe('a');
    expect(result[0].blocks[1].id).toBe('b');
  });

  it('중복 ID가 있으면 첫 번째는 유지하고 이후는 새 ID로 교체한다', () => {
    const days: DayData[] = [
      {
        day: 'monday',
        label: '월요일',
        blocks: [
          { id: 'dup', title: '블록1', start: '09:00', end: '10:00', duration_minutes: 60, priority: 'high', color: '#ff0000', required: true },
        ],
      },
      {
        day: 'tuesday',
        label: '화요일',
        blocks: [
          { id: 'dup', title: '블록2', start: '10:00', end: '11:00', duration_minutes: 60, priority: 'medium', color: '#00ff00', required: false },
        ],
      },
    ];

    const result = deduplicateIds(days);
    // 첫 번째 등장은 유지
    expect(result[0].blocks[0].id).toBe('dup');
    // 두 번째 등장은 새 ID로 교체
    expect(result[1].blocks[0].id).not.toBe('dup');
    expect(result[1].blocks[0].id.length).toBeGreaterThan(0);
  });

  it('원본 배열을 변경하지 않는다 (불변성)', () => {
    const days: DayData[] = [
      {
        day: 'monday',
        label: '월요일',
        blocks: [
          { id: 'dup', title: '블록1', start: '09:00', end: '10:00', duration_minutes: 60, priority: 'high', color: '#ff0000', required: true },
          { id: 'dup', title: '블록2', start: '11:00', end: '12:00', duration_minutes: 60, priority: 'low', color: '#0000ff', required: false },
        ],
      },
    ];

    deduplicateIds(days);
    // 원본은 변경되지 않아야 함
    expect(days[0].blocks[0].id).toBe('dup');
    expect(days[0].blocks[1].id).toBe('dup');
  });

  it('같은 요일 내 중복 ID도 처리한다', () => {
    const days: DayData[] = [
      {
        day: 'wednesday',
        label: '수요일',
        blocks: [
          { id: 'same', title: '블록1', start: '09:00', end: '10:00', duration_minutes: 60, priority: 'high', color: '#ff0000', required: true },
          { id: 'same', title: '블록2', start: '10:00', end: '11:00', duration_minutes: 60, priority: 'medium', color: '#00ff00', required: false },
          { id: 'same', title: '블록3', start: '11:00', end: '12:00', duration_minutes: 60, priority: 'low', color: '#0000ff', required: true },
        ],
      },
    ];

    const result = deduplicateIds(days);
    const ids = result[0].blocks.map((b) => b.id);
    // 첫 번째는 유지
    expect(ids[0]).toBe('same');
    // 나머지는 새 ID
    expect(ids[1]).not.toBe('same');
    expect(ids[2]).not.toBe('same');
    // 모든 ID가 고유
    expect(new Set(ids).size).toBe(3);
  });

  it('빈 days 배열을 처리한다', () => {
    const result = deduplicateIds([]);
    expect(result).toEqual([]);
  });

  it('빈 blocks 배열을 가진 day를 처리한다', () => {
    const days: DayData[] = [
      { day: 'friday', label: '금요일', blocks: [] },
    ];
    const result = deduplicateIds(days);
    expect(result[0].blocks).toEqual([]);
  });
});
