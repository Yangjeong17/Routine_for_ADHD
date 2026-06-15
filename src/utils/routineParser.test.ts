import { describe, it, expect } from 'vitest';
import { parseRoutineJson } from './routineParser';

const validJson = JSON.stringify({
  routine_name: '테스트 루틴',
  days: [
    {
      day: 'monday',
      label: '월요일',
      blocks: [
        {
          id: 'block-001',
          title: '아침 운동',
          start: '07:00',
          end: '08:00',
          priority: 'urgent_important',
          color: '#10B981',
          required: true,
        },
      ],
    },
  ],
});

describe('parseRoutineJson', () => {
  it('유효한 JSON을 파싱한다', () => {
    const result = parseRoutineJson(validJson);
    expect(result.success).toBe(true);
  });

  it('routine_name이 없으면 실패한다', () => {
    const json = JSON.stringify({ days: [] });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(false);
    expect(result.error).toContain('routine_name');
  });

  it('days가 없으면 실패한다', () => {
    const json = JSON.stringify({ routine_name: '루틴' });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(false);
  });

  it('잘못된 요일 값이면 실패한다', () => {
    const json = JSON.stringify({
      routine_name: '루틴',
      days: [{ day: 'invalid', label: '잘못된요일', blocks: [] }],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(false);
  });

  it('start >= end 이면 실패한다', () => {
    const json = JSON.stringify({
      routine_name: '루틴',
      days: [
        {
          day: 'monday',
          label: '월요일',
          blocks: [{ title: '운동', start: '09:00', end: '08:00' }],
        },
      ],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(false);
    expect(result.error).toContain('종료 시간');
  });

  // 🆕 레거시 priority 하위호환 테스트
  it('구버전 priority "high"를 urgent_important로 변환한다', () => {
    const json = JSON.stringify({
      routine_name: '레거시 루틴',
      days: [
        {
          day: 'monday',
          label: '월요일',
          blocks: [
            { title: '운동', start: '07:00', end: '08:00', priority: 'high' },
          ],
        },
      ],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(true);
    expect(result.data?.days[0].blocks[0].priority).toBe('urgent_important');
  });

  it('구버전 priority "medium"을 not_urgent_important로 변환한다', () => {
    const json = JSON.stringify({
      routine_name: '레거시 루틴',
      days: [
        {
          day: 'monday',
          label: '월요일',
          blocks: [
            { title: '운동', start: '07:00', end: '08:00', priority: 'medium' },
          ],
        },
      ],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(true);
    expect(result.data?.days[0].blocks[0].priority).toBe('not_urgent_important');
  });

  it('구버전 priority "low"를 not_urgent_not_important로 변환한다', () => {
    const json = JSON.stringify({
      routine_name: '레거시 루틴',
      days: [
        {
          day: 'monday',
          label: '월요일',
          blocks: [
            { title: '운동', start: '07:00', end: '08:00', priority: 'low' },
          ],
        },
      ],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(true);
    expect(result.data?.days[0].blocks[0].priority).toBe('not_urgent_not_important');
  });

  it('완전히 잘못된 priority 값이면 실패한다', () => {
    const json = JSON.stringify({
      routine_name: '루틴',
      days: [
        {
          day: 'monday',
          label: '월요일',
          blocks: [
            { title: '운동', start: '07:00', end: '08:00', priority: 'critical' },
          ],
        },
      ],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(false);
    expect(result.error).toContain('priority');
  });

  it('누락된 요일을 빈 blocks로 자동 생성한다 (7개 컬럼)', () => {
    const json = JSON.stringify({
      routine_name: '루틴',
      days: [{ day: 'monday', label: '월요일', blocks: [] }],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(true);
    expect(result.data?.days).toHaveLength(7);
  });

  it('중복 id를 고유한 값으로 재생성한다', () => {
    const json = JSON.stringify({
      routine_name: '루틴',
      days: [
        {
          day: 'monday',
          label: '월요일',
          blocks: [
            { id: 'dup', title: '운동', start: '07:00', end: '08:00' },
            { id: 'dup', title: '독서', start: '09:00', end: '10:00' },
          ],
        },
      ],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(true);
    const ids = result.data!.days[0].blocks.map((b) => b.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('color가 없으면 기본 색상을 부여한다', () => {
    const json = JSON.stringify({
      routine_name: '루틴',
      days: [
        {
          day: 'monday',
          label: '월요일',
          blocks: [{ title: '운동', start: '07:00', end: '08:00' }],
        },
      ],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(true);
    expect(result.data?.days[0].blocks[0].color).toBeTruthy();
  });
});
