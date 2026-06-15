import { describe, it, expect } from 'vitest';
import { parseRoutineJson, validateBlock, isValidTimeFormat, timeToMinutes, normalizeBlock, addMissingDays, DAY_LABELS } from './parser';

describe('parseRoutineJson - Task 3.1 기본 검증', () => {
  it('유효하지 않은 JSON 문자열이면 오류를 반환한다', () => {
    const result = parseRoutineJson('{ invalid json }');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('JSON 형식이 올바르지 않습니다');
    }
  });

  it('빈 문자열이면 오류를 반환한다', () => {
    const result = parseRoutineJson('');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('JSON 형식이 올바르지 않습니다');
    }
  });

  it('JSON이 배열이면 오류를 반환한다', () => {
    const result = parseRoutineJson('[]');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('JSON 형식이 올바르지 않습니다');
    }
  });

  it('routine_name이 없으면 오류를 반환한다', () => {
    const result = parseRoutineJson('{"days": []}');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('routine_name이 필요합니다');
    }
  });

  it('routine_name이 문자열이 아니면 오류를 반환한다', () => {
    const result = parseRoutineJson('{"routine_name": 123, "days": []}');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('routine_name이 필요합니다');
    }
  });

  it('days가 배열이 아니면 오류를 반환한다', () => {
    const result = parseRoutineJson('{"routine_name": "테스트", "days": "not array"}');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('days는 배열이어야 합니다');
    }
  });

  it('days가 없으면 오류를 반환한다', () => {
    const result = parseRoutineJson('{"routine_name": "테스트"}');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('days는 배열이어야 합니다');
    }
  });

  it('day 값이 유효하지 않으면 오류를 반환한다', () => {
    const json = JSON.stringify({
      routine_name: '테스트',
      days: [{ day: 'invalid_day', blocks: [] }],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('day는 monday~sunday 중 하나여야 합니다');
    }
  });

  it('blocks가 배열이 아니면 오류를 반환한다', () => {
    const json = JSON.stringify({
      routine_name: '테스트',
      days: [{ day: 'monday', blocks: 'not array' }],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('monday의 blocks 항목이 배열이 아닙니다');
    }
  });

  it('유효한 최소 JSON이면 성공을 반환한다', () => {
    const json = JSON.stringify({
      routine_name: '나의 루틴',
      days: [
        { day: 'monday', label: '월요일', blocks: [] },
        { day: 'tuesday', label: '화요일', blocks: [] },
      ],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.routine_name).toBe('나의 루틴');
      // Task 3.4: 누락 요일 자동 생성으로 항상 7개
      expect(result.data.days).toHaveLength(7);
      expect(result.data.days[0].day).toBe('monday');
      expect(result.data.days[1].day).toBe('tuesday');
    }
  });

  it('선택적 필드(version, timezone)가 있으면 포함한다', () => {
    const json = JSON.stringify({
      routine_name: '나의 루틴',
      version: '1.0',
      timezone: 'Asia/Seoul',
      days: [{ day: 'monday', label: '월요일', blocks: [] }],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe('1.0');
      expect(result.data.timezone).toBe('Asia/Seoul');
    }
  });

  it('label이 없으면 day 값을 label로 사용한다', () => {
    const json = JSON.stringify({
      routine_name: '나의 루틴',
      days: [{ day: 'monday', blocks: [] }],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.days[0].label).toBe('monday');
    }
  });

  it('첫 번째 오류만 반환한다 (여러 오류가 있을 때)', () => {
    // routine_name 없고 days도 없는 경우 → routine_name 오류가 먼저
    const result = parseRoutineJson('{"foo": "bar"}');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('routine_name이 필요합니다');
    }
  });
});

describe('isValidTimeFormat - 시간 형식 검증', () => {
  it('유효한 시간 형식을 허용한다', () => {
    expect(isValidTimeFormat('00:00')).toBe(true);
    expect(isValidTimeFormat('09:00')).toBe(true);
    expect(isValidTimeFormat('13:30')).toBe(true);
    expect(isValidTimeFormat('23:59')).toBe(true);
  });

  it('유효하지 않은 시간 형식을 거부한다', () => {
    expect(isValidTimeFormat('24:00')).toBe(false);
    expect(isValidTimeFormat('9:00')).toBe(false);
    expect(isValidTimeFormat('09:60')).toBe(false);
    expect(isValidTimeFormat('abc')).toBe(false);
    expect(isValidTimeFormat('')).toBe(false);
    expect(isValidTimeFormat('25:00')).toBe(false);
  });
});

describe('timeToMinutes - 시간을 분으로 변환', () => {
  it('00:00은 0분이다', () => {
    expect(timeToMinutes('00:00')).toBe(0);
  });

  it('01:00은 60분이다', () => {
    expect(timeToMinutes('01:00')).toBe(60);
  });

  it('09:30은 570분이다', () => {
    expect(timeToMinutes('09:30')).toBe(570);
  });

  it('23:59는 1439분이다', () => {
    expect(timeToMinutes('23:59')).toBe(1439);
  });
});

describe('validateBlock - Block 유효성 검증', () => {
  it('유효한 블록은 null을 반환한다', () => {
    const block = { title: '운동', start: '09:00', end: '10:00' };
    expect(validateBlock(block, 'monday')).toBeNull();
  });

  it('title이 없으면 오류를 반환한다', () => {
    const block = { start: '09:00', end: '10:00' };
    expect(validateBlock(block, 'monday')).toBe('각 block에는 title, start, end가 필요합니다');
  });

  it('start가 없으면 오류를 반환한다', () => {
    const block = { title: '운동', end: '10:00' };
    expect(validateBlock(block, 'monday')).toBe('각 block에는 title, start, end가 필요합니다');
  });

  it('end가 없으면 오류를 반환한다', () => {
    const block = { title: '운동', start: '09:00' };
    expect(validateBlock(block, 'monday')).toBe('각 block에는 title, start, end가 필요합니다');
  });

  it('title이 문자열이 아니면 오류를 반환한다', () => {
    const block = { title: 123, start: '09:00', end: '10:00' };
    expect(validateBlock(block, 'monday')).toBe('각 block에는 title, start, end가 필요합니다');
  });

  it('start가 유효하지 않은 시간 형식이면 오류를 반환한다', () => {
    const block = { title: '운동', start: '9:00', end: '10:00' };
    expect(validateBlock(block, 'monday')).toBe('시간 형식이 올바르지 않습니다. 예: 09:00');
  });

  it('end가 유효하지 않은 시간 형식이면 오류를 반환한다', () => {
    const block = { title: '운동', start: '09:00', end: '25:00' };
    expect(validateBlock(block, 'monday')).toBe('시간 형식이 올바르지 않습니다. 예: 09:00');
  });

  it('end가 start보다 빠르면 오류를 반환한다 (자정 넘김)', () => {
    const block = { title: '운동', start: '23:00', end: '01:00' };
    expect(validateBlock(block, 'monday')).toBe('종료 시간은 시작 시간보다 늦어야 합니다');
  });

  it('end가 start와 같으면 오류를 반환한다', () => {
    const block = { title: '운동', start: '09:00', end: '09:00' };
    expect(validateBlock(block, 'monday')).toBe('종료 시간은 시작 시간보다 늦어야 합니다');
  });

  it('유효하지 않은 priority 값이면 오류를 반환한다', () => {
    const block = { title: '운동', start: '09:00', end: '10:00', priority: 'urgent' };
    expect(validateBlock(block, 'monday')).toBe('priority는 high, medium, low 중 하나여야 합니다');
  });

  it('유효한 priority 값은 허용한다', () => {
    expect(validateBlock({ title: '운동', start: '09:00', end: '10:00', priority: 'high' }, 'monday')).toBeNull();
    expect(validateBlock({ title: '운동', start: '09:00', end: '10:00', priority: 'medium' }, 'monday')).toBeNull();
    expect(validateBlock({ title: '운동', start: '09:00', end: '10:00', priority: 'low' }, 'monday')).toBeNull();
  });

  it('priority가 없으면 오류 없이 통과한다', () => {
    const block = { title: '운동', start: '09:00', end: '10:00' };
    expect(validateBlock(block, 'monday')).toBeNull();
  });

  it('block이 null이면 오류를 반환한다', () => {
    expect(validateBlock(null, 'monday')).toBe('각 block에는 title, start, end가 필요합니다');
  });

  it('block이 배열이면 오류를 반환한다', () => {
    expect(validateBlock([], 'monday')).toBe('각 block에는 title, start, end가 필요합니다');
  });
});

describe('parseRoutineJson - Task 3.2 Block 유효성 검증 통합', () => {
  it('block에 title이 없으면 오류를 반환한다', () => {
    const json = JSON.stringify({
      routine_name: '테스트',
      days: [{ day: 'monday', blocks: [{ start: '09:00', end: '10:00' }] }],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('각 block에는 title, start, end가 필요합니다');
    }
  });

  it('block의 시간 형식이 잘못되면 오류를 반환한다', () => {
    const json = JSON.stringify({
      routine_name: '테스트',
      days: [{ day: 'monday', blocks: [{ title: '운동', start: '9:00', end: '10:00' }] }],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('시간 형식이 올바르지 않습니다. 예: 09:00');
    }
  });

  it('block의 end가 start보다 빠르면 오류를 반환한다', () => {
    const json = JSON.stringify({
      routine_name: '테스트',
      days: [{ day: 'monday', blocks: [{ title: '운동', start: '10:00', end: '09:00' }] }],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('종료 시간은 시작 시간보다 늦어야 합니다');
    }
  });

  it('block의 priority가 유효하지 않으면 오류를 반환한다', () => {
    const json = JSON.stringify({
      routine_name: '테스트',
      days: [{ day: 'monday', blocks: [{ title: '운동', start: '09:00', end: '10:00', priority: 'critical' }] }],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('priority는 high, medium, low 중 하나여야 합니다');
    }
  });

  it('유효한 block이 있으면 성공을 반환한다', () => {
    const json = JSON.stringify({
      routine_name: '테스트',
      days: [{ day: 'monday', label: '월요일', blocks: [{ title: '운동', start: '09:00', end: '10:00', priority: 'high' }] }],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(true);
  });

  it('여러 오류가 있을 때 첫 번째 오류만 반환한다', () => {
    const json = JSON.stringify({
      routine_name: '테스트',
      days: [{
        day: 'monday',
        blocks: [
          { start: '09:00', end: '10:00' }, // title 없음
          { title: '운동', start: '25:00', end: '10:00' }, // 시간 형식 오류
        ],
      }],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('각 block에는 title, start, end가 필요합니다');
    }
  });
});

describe('normalizeBlock - Task 3.3 기본값 보정', () => {
  it('color가 없으면 기본값 "#6B7280"을 부여한다', () => {
    const block = { title: '운동', start: '09:00', end: '10:00' };
    const result = normalizeBlock(block);
    expect(result.color).toBe('#6B7280');
  });

  it('color가 있으면 그대로 유지한다', () => {
    const block = { title: '운동', start: '09:00', end: '10:00', color: '#FF0000' };
    const result = normalizeBlock(block);
    expect(result.color).toBe('#FF0000');
  });

  it('id가 없으면 자동 생성한다', () => {
    const block = { title: '운동', start: '09:00', end: '10:00' };
    const result = normalizeBlock(block);
    expect(result.id).toBeDefined();
    expect(result.id.length).toBeGreaterThan(0);
  });

  it('id가 있으면 그대로 유지한다', () => {
    const block = { title: '운동', start: '09:00', end: '10:00', id: 'my-custom-id' };
    const result = normalizeBlock(block);
    expect(result.id).toBe('my-custom-id');
  });

  it('duration_minutes를 start/end 기준으로 계산한다', () => {
    const block = { title: '운동', start: '09:00', end: '10:30' };
    const result = normalizeBlock(block);
    expect(result.duration_minutes).toBe(90);
  });

  it('duration_minutes가 잘못된 값이어도 start/end 기준으로 재계산한다', () => {
    const block = { title: '운동', start: '09:00', end: '10:00', duration_minutes: 999 };
    const result = normalizeBlock(block);
    expect(result.duration_minutes).toBe(60);
  });

  it('priority가 없으면 기본값 "medium"을 부여한다', () => {
    const block = { title: '운동', start: '09:00', end: '10:00' };
    const result = normalizeBlock(block);
    expect(result.priority).toBe('medium');
  });

  it('priority가 있으면 그대로 유지한다', () => {
    const block = { title: '운동', start: '09:00', end: '10:00', priority: 'high' };
    const result = normalizeBlock(block);
    expect(result.priority).toBe('high');
  });

  it('required가 없으면 기본값 false를 부여한다', () => {
    const block = { title: '운동', start: '09:00', end: '10:00' };
    const result = normalizeBlock(block);
    expect(result.required).toBe(false);
  });

  it('required가 true이면 그대로 유지한다', () => {
    const block = { title: '운동', start: '09:00', end: '10:00', required: true };
    const result = normalizeBlock(block);
    expect(result.required).toBe(true);
  });

  it('category가 있으면 유지한다', () => {
    const block = { title: '운동', start: '09:00', end: '10:00', category: '건강' };
    const result = normalizeBlock(block);
    expect(result.category).toBe('건강');
  });

  it('notes가 있으면 유지한다', () => {
    const block = { title: '운동', start: '09:00', end: '10:00', notes: '메모' };
    const result = normalizeBlock(block);
    expect(result.notes).toBe('메모');
  });
});

describe('parseRoutineJson - Task 3.3 기본값 보정 통합', () => {
  it('블록에 선택적 필드가 없어도 기본값이 보정되어 성공한다', () => {
    const json = JSON.stringify({
      routine_name: '테스트 루틴',
      days: [{
        day: 'monday',
        label: '월요일',
        blocks: [{ title: '운동', start: '09:00', end: '10:00' }],
      }],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(true);
    if (result.success) {
      const block = result.data.days[0].blocks[0];
      expect(block.id).toBeDefined();
      expect(block.id.length).toBeGreaterThan(0);
      expect(block.color).toBe('#6B7280');
      expect(block.priority).toBe('medium');
      expect(block.duration_minutes).toBe(60);
      expect(block.required).toBe(false);
    }
  });

  it('블록에 모든 필드가 있으면 그대로 유지한다', () => {
    const json = JSON.stringify({
      routine_name: '테스트 루틴',
      days: [{
        day: 'monday',
        label: '월요일',
        blocks: [{
          id: 'block-1',
          title: '운동',
          start: '09:00',
          end: '10:30',
          color: '#FF5733',
          priority: 'high',
          required: true,
          category: '건강',
          notes: '아침 운동',
        }],
      }],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(true);
    if (result.success) {
      const block = result.data.days[0].blocks[0];
      expect(block.id).toBe('block-1');
      expect(block.color).toBe('#FF5733');
      expect(block.priority).toBe('high');
      expect(block.duration_minutes).toBe(90);
      expect(block.required).toBe(true);
      expect(block.category).toBe('건강');
      expect(block.notes).toBe('아침 운동');
    }
  });

  it('duration_minutes가 start/end와 불일치하면 재계산한다', () => {
    const json = JSON.stringify({
      routine_name: '테스트 루틴',
      days: [{
        day: 'tuesday',
        label: '화요일',
        blocks: [{
          title: '공부',
          start: '14:00',
          end: '16:30',
          duration_minutes: 100, // 실제는 150분
        }],
      }],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(true);
    if (result.success) {
      const tuesday = result.data.days.find(d => d.day === 'tuesday')!;
      expect(tuesday.blocks[0].duration_minutes).toBe(150);
    }
  });
});

describe('addMissingDays - Task 3.4 누락 요일 자동 생성', () => {
  it('빈 배열이면 7개 요일을 모두 생성한다', () => {
    const result = addMissingDays([]);
    expect(result).toHaveLength(7);
    expect(result[0].day).toBe('monday');
    expect(result[1].day).toBe('tuesday');
    expect(result[2].day).toBe('wednesday');
    expect(result[3].day).toBe('thursday');
    expect(result[4].day).toBe('friday');
    expect(result[5].day).toBe('saturday');
    expect(result[6].day).toBe('sunday');
  });

  it('누락된 요일에 빈 blocks 배열을 부여한다', () => {
    const result = addMissingDays([]);
    for (const dayData of result) {
      expect(dayData.blocks).toEqual([]);
    }
  });

  it('누락된 요일에 한국어 label을 부여한다', () => {
    const result = addMissingDays([]);
    expect(result[0].label).toBe('월요일');
    expect(result[1].label).toBe('화요일');
    expect(result[2].label).toBe('수요일');
    expect(result[3].label).toBe('목요일');
    expect(result[4].label).toBe('금요일');
    expect(result[5].label).toBe('토요일');
    expect(result[6].label).toBe('일요일');
  });

  it('이미 존재하는 요일은 그대로 유지한다', () => {
    const existingDay = {
      day: 'wednesday' as const,
      label: '수요일 커스텀',
      blocks: [{ id: 'b1', title: '운동', start: '09:00', end: '10:00', duration_minutes: 60, priority: 'high' as const, color: '#FF0000', required: true }],
    };
    const result = addMissingDays([existingDay]);
    expect(result).toHaveLength(7);
    // 수요일은 기존 데이터 유지
    const wednesday = result.find(d => d.day === 'wednesday')!;
    expect(wednesday.label).toBe('수요일 커스텀');
    expect(wednesday.blocks).toHaveLength(1);
    expect(wednesday.blocks[0].title).toBe('운동');
  });

  it('일부 요일만 있으면 나머지를 자동 생성한다', () => {
    const days = [
      { day: 'monday' as const, label: '월요일', blocks: [] },
      { day: 'friday' as const, label: '금요일', blocks: [] },
    ];
    const result = addMissingDays(days);
    expect(result).toHaveLength(7);
    // 존재하는 요일 확인
    expect(result[0].day).toBe('monday');
    expect(result[4].day).toBe('friday');
    // 자동 생성된 요일 확인
    expect(result[1].day).toBe('tuesday');
    expect(result[1].label).toBe('화요일');
    expect(result[1].blocks).toEqual([]);
  });

  it('7개 요일이 모두 있으면 그대로 반환한다', () => {
    const allDays = [
      { day: 'monday' as const, label: '월', blocks: [] },
      { day: 'tuesday' as const, label: '화', blocks: [] },
      { day: 'wednesday' as const, label: '수', blocks: [] },
      { day: 'thursday' as const, label: '목', blocks: [] },
      { day: 'friday' as const, label: '금', blocks: [] },
      { day: 'saturday' as const, label: '토', blocks: [] },
      { day: 'sunday' as const, label: '일', blocks: [] },
    ];
    const result = addMissingDays(allDays);
    expect(result).toHaveLength(7);
    // 기존 label 유지 확인
    expect(result[0].label).toBe('월');
    expect(result[6].label).toBe('일');
  });

  it('결과는 항상 monday~sunday 순서로 정렬된다', () => {
    // 순서가 뒤바뀐 입력
    const days = [
      { day: 'sunday' as const, label: '일요일', blocks: [] },
      { day: 'wednesday' as const, label: '수요일', blocks: [] },
      { day: 'monday' as const, label: '월요일', blocks: [] },
    ];
    const result = addMissingDays(days);
    expect(result[0].day).toBe('monday');
    expect(result[1].day).toBe('tuesday');
    expect(result[2].day).toBe('wednesday');
    expect(result[3].day).toBe('thursday');
    expect(result[4].day).toBe('friday');
    expect(result[5].day).toBe('saturday');
    expect(result[6].day).toBe('sunday');
  });
});

describe('DAY_LABELS - 한국어 라벨 매핑', () => {
  it('모든 7개 요일에 대한 한국어 라벨이 정의되어 있다', () => {
    expect(DAY_LABELS.monday).toBe('월요일');
    expect(DAY_LABELS.tuesday).toBe('화요일');
    expect(DAY_LABELS.wednesday).toBe('수요일');
    expect(DAY_LABELS.thursday).toBe('목요일');
    expect(DAY_LABELS.friday).toBe('금요일');
    expect(DAY_LABELS.saturday).toBe('토요일');
    expect(DAY_LABELS.sunday).toBe('일요일');
  });
});

describe('parseRoutineJson - Task 3.4 누락 요일 자동 생성 통합', () => {
  it('일부 요일만 있는 JSON을 파싱하면 7개 요일이 모두 포함된다', () => {
    const json = JSON.stringify({
      routine_name: '테스트 루틴',
      days: [
        { day: 'monday', label: '월요일', blocks: [{ title: '운동', start: '09:00', end: '10:00' }] },
        { day: 'wednesday', label: '수요일', blocks: [] },
      ],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.days).toHaveLength(7);
      // 존재하는 요일 확인
      const monday = result.data.days.find(d => d.day === 'monday')!;
      expect(monday.blocks).toHaveLength(1);
      expect(monday.blocks[0].title).toBe('운동');
      // 자동 생성된 요일 확인
      const tuesday = result.data.days.find(d => d.day === 'tuesday')!;
      expect(tuesday.label).toBe('화요일');
      expect(tuesday.blocks).toEqual([]);
    }
  });

  it('빈 days 배열이면 7개 요일이 모두 자동 생성된다', () => {
    const json = JSON.stringify({
      routine_name: '빈 루틴',
      days: [],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.days).toHaveLength(7);
      expect(result.data.days[0].day).toBe('monday');
      expect(result.data.days[0].label).toBe('월요일');
      expect(result.data.days[6].day).toBe('sunday');
      expect(result.data.days[6].label).toBe('일요일');
    }
  });

  it('자동 생성된 요일의 순서가 monday~sunday이다', () => {
    const json = JSON.stringify({
      routine_name: '순서 테스트',
      days: [
        { day: 'friday', label: '금요일', blocks: [] },
      ],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(true);
    if (result.success) {
      const dayOrder = result.data.days.map(d => d.day);
      expect(dayOrder).toEqual(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
    }
  });
});

describe('parseRoutineJson - Task 3.5 중복 ID 보정 통합', () => {
  it('같은 요일 내 중복 ID가 있으면 고유한 ID로 보정한다', () => {
    const json = JSON.stringify({
      routine_name: '중복 ID 테스트',
      days: [{
        day: 'monday',
        label: '월요일',
        blocks: [
          { id: 'dup-id', title: '운동', start: '09:00', end: '10:00' },
          { id: 'dup-id', title: '공부', start: '10:00', end: '11:00' },
        ],
      }],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(true);
    if (result.success) {
      const monday = result.data.days.find(d => d.day === 'monday')!;
      // 첫 번째 블록은 원래 ID 유지
      expect(monday.blocks[0].id).toBe('dup-id');
      // 두 번째 블록은 새 ID로 교체
      expect(monday.blocks[1].id).not.toBe('dup-id');
      expect(monday.blocks[1].id.length).toBeGreaterThan(0);
    }
  });

  it('다른 요일 간 중복 ID가 있으면 고유한 ID로 보정한다', () => {
    const json = JSON.stringify({
      routine_name: '요일 간 중복 ID 테스트',
      days: [
        {
          day: 'monday',
          label: '월요일',
          blocks: [{ id: 'shared-id', title: '운동', start: '09:00', end: '10:00' }],
        },
        {
          day: 'tuesday',
          label: '화요일',
          blocks: [{ id: 'shared-id', title: '공부', start: '14:00', end: '15:00' }],
        },
      ],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(true);
    if (result.success) {
      const monday = result.data.days.find(d => d.day === 'monday')!;
      const tuesday = result.data.days.find(d => d.day === 'tuesday')!;
      // 첫 번째 등장은 유지, 두 번째 등장은 새 ID
      expect(monday.blocks[0].id).toBe('shared-id');
      expect(tuesday.blocks[0].id).not.toBe('shared-id');
      expect(tuesday.blocks[0].id.length).toBeGreaterThan(0);
    }
  });

  it('중복 ID가 없으면 모든 ID가 그대로 유지된다', () => {
    const json = JSON.stringify({
      routine_name: '고유 ID 테스트',
      days: [{
        day: 'monday',
        label: '월요일',
        blocks: [
          { id: 'unique-1', title: '운동', start: '09:00', end: '10:00' },
          { id: 'unique-2', title: '공부', start: '10:00', end: '11:00' },
        ],
      }],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(true);
    if (result.success) {
      const monday = result.data.days.find(d => d.day === 'monday')!;
      expect(monday.blocks[0].id).toBe('unique-1');
      expect(monday.blocks[1].id).toBe('unique-2');
    }
  });

  it('보정 후 모든 블록의 ID가 고유하다', () => {
    const json = JSON.stringify({
      routine_name: '전체 고유성 테스트',
      days: [
        {
          day: 'monday',
          label: '월요일',
          blocks: [
            { id: 'dup', title: '블록1', start: '09:00', end: '10:00' },
            { id: 'dup', title: '블록2', start: '10:00', end: '11:00' },
          ],
        },
        {
          day: 'tuesday',
          label: '화요일',
          blocks: [
            { id: 'dup', title: '블록3', start: '09:00', end: '10:00' },
          ],
        },
      ],
    });
    const result = parseRoutineJson(json);
    expect(result.success).toBe(true);
    if (result.success) {
      // 모든 블록의 ID를 수집
      const allIds = result.data.days.flatMap(d => d.blocks.map(b => b.id));
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    }
  });
});
