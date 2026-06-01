import { describe, it, expect } from 'vitest';
import { routineDataToJson } from './prettyPrinter';
import type { RoutineData } from '../types';

describe('routineDataToJson', () => {
  it('최소한의 RoutineData를 유효한 JSON 문자열로 변환한다', () => {
    const data: RoutineData = {
      routine_name: '테스트 루틴',
      days: [],
    };

    const result = routineDataToJson(data);

    expect(() => JSON.parse(result)).not.toThrow();
    const parsed = JSON.parse(result);
    expect(parsed.routine_name).toBe('테스트 루틴');
    expect(parsed.days).toEqual([]);
  });

  it('2-space 들여쓰기가 적용된다', () => {
    const data: RoutineData = {
      routine_name: '루틴',
      days: [],
    };

    const result = routineDataToJson(data);

    // 2-space 들여쓰기 확인: "  " 패턴이 존재해야 함
    expect(result).toContain('  "routine_name"');
  });

  it('선택적 필드(version, timezone, sleep)가 포함된다', () => {
    const data: RoutineData = {
      routine_name: '전체 루틴',
      version: '1.0',
      timezone: 'Asia/Seoul',
      sleep: {
        target_bedtime: '23:00',
        target_wakeup: '07:00',
        flex_hours: 1,
      },
      days: [],
    };

    const result = routineDataToJson(data);
    const parsed = JSON.parse(result);

    expect(parsed.version).toBe('1.0');
    expect(parsed.timezone).toBe('Asia/Seoul');
    expect(parsed.sleep).toEqual({
      target_bedtime: '23:00',
      target_wakeup: '07:00',
      flex_hours: 1,
    });
  });

  it('블록 데이터가 모든 필드를 포함하여 출력된다', () => {
    const data: RoutineData = {
      routine_name: '블록 테스트',
      days: [
        {
          day: 'monday',
          label: '월요일',
          blocks: [
            {
              id: 'block-1',
              title: '아침 운동',
              category: '건강',
              start: '07:00',
              end: '08:00',
              duration_minutes: 60,
              priority: 'high',
              color: '#FF0000',
              required: true,
              notes: '스트레칭 포함',
            },
          ],
        },
      ],
    };

    const result = routineDataToJson(data);
    const parsed = JSON.parse(result);

    const block = parsed.days[0].blocks[0];
    expect(block.id).toBe('block-1');
    expect(block.title).toBe('아침 운동');
    expect(block.category).toBe('건강');
    expect(block.start).toBe('07:00');
    expect(block.end).toBe('08:00');
    expect(block.duration_minutes).toBe(60);
    expect(block.priority).toBe('high');
    expect(block.color).toBe('#FF0000');
    expect(block.required).toBe(true);
    expect(block.notes).toBe('스트레칭 포함');
  });

  it('선택적 블록 필드(category, notes)가 없으면 출력에 포함되지 않는다', () => {
    const data: RoutineData = {
      routine_name: '선택 필드 테스트',
      days: [
        {
          day: 'tuesday',
          label: '화요일',
          blocks: [
            {
              id: 'block-2',
              title: '점심',
              start: '12:00',
              end: '13:00',
              duration_minutes: 60,
              priority: 'medium',
              color: '#6B7280',
              required: false,
            },
          ],
        },
      ],
    };

    const result = routineDataToJson(data);
    const parsed = JSON.parse(result);

    const block = parsed.days[0].blocks[0];
    expect(block.category).toBeUndefined();
    expect(block.notes).toBeUndefined();
  });

  it('parseRoutineJson으로 다시 파싱할 수 있는 형식을 출력한다', async () => {
    const { parseRoutineJson } = await import('./parser');

    const data: RoutineData = {
      routine_name: '라운드트립 테스트',
      version: '2.0',
      timezone: 'Asia/Seoul',
      days: [
        {
          day: 'monday',
          label: '월요일',
          blocks: [
            {
              id: 'rt-1',
              title: '회의',
              start: '09:00',
              end: '10:00',
              duration_minutes: 60,
              priority: 'high',
              color: '#3B82F6',
              required: true,
            },
          ],
        },
        { day: 'tuesday', label: '화요일', blocks: [] },
        { day: 'wednesday', label: '수요일', blocks: [] },
        { day: 'thursday', label: '목요일', blocks: [] },
        { day: 'friday', label: '금요일', blocks: [] },
        { day: 'saturday', label: '토요일', blocks: [] },
        { day: 'sunday', label: '일요일', blocks: [] },
      ],
    };

    const json = routineDataToJson(data);
    const result = parseRoutineJson(json);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.routine_name).toBe('라운드트립 테스트');
      expect(result.data.days).toHaveLength(7);
      expect(result.data.days[0].blocks[0].title).toBe('회의');
    }
  });
});
