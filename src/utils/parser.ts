import type { Block, DayValue, Priority, RoutineData, DayData } from '../types';
import { generateId, deduplicateIds } from './idGenerator';

/**
 * 파싱 결과 타입
 * - success: true → 유효한 RoutineData 반환
 * - success: false → 오류 메시지 반환
 */
export type ParseResult =
  | { success: true; data: RoutineData }
  | { success: false; error: string };

/** 유효한 요일 값 목록 (월요일부터 일요일 순서) */
const VALID_DAYS: DayValue[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

/** DayValue → 한국어 라벨 매핑 */
export const DAY_LABELS: Record<DayValue, string> = {
  monday: '월요일',
  tuesday: '화요일',
  wednesday: '수요일',
  thursday: '목요일',
  friday: '금요일',
  saturday: '토요일',
  sunday: '일요일',
};

/** 유효한 priority 값 목록 */
const VALID_PRIORITIES: Priority[] = [
  'urgent_important',
  'not_urgent_important',
  'urgent_not_important',
  'not_urgent_not_important',
];

/**
 * 구버전 priority 값(high/medium/low)을 4단계 아이젠하워 값으로 변환한다.
 * 기존 JSON 파일과의 하위호환성을 유지하기 위해 사용.
 */
const LEGACY_PRIORITY_MAP: Record<string, Priority> = {
  high:   'urgent_important',
  medium: 'not_urgent_important',
  low:    'not_urgent_not_important',
};

/**
 * 시간 형식(HH:mm) 유효성 검증
 * @param time - 검증할 시간 문자열
 * @returns 유효한 HH:mm 형식이면 true
 */
export function isValidTimeFormat(time: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
}

/**
 * HH:mm 형식의 시간을 자정 기준 분(minutes)으로 변환
 * @param time - "HH:mm" 형식의 시간 문자열
 * @returns 자정부터의 분 수
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * 블록 유효성 검증
 * @param block - 검증할 블록 객체
 * @param _dayLabel - 해당 요일 라벨 (오류 메시지용)
 * @returns 오류 메시지 또는 null (유효한 경우)
 *
 * 검증 순서:
 * 1. title, start, end 필수 필드 존재 및 문자열 타입 확인
 * 2. start, end 시간 형식(HH:mm) 확인
 * 3. end > start 시간 검증 (자정 넘김은 유효하지 않음)
 * 4. priority가 제공된 경우 high/medium/low 중 하나인지 확인
 */
export function validateBlock(block: unknown, _dayLabel: string): string | null {
  if (typeof block !== 'object' || block === null || Array.isArray(block)) {
    return '각 block에는 title, start, end가 필요합니다';
  }

  const blockObj = block as Record<string, unknown>;

  // 1. title, start, end 필수 필드 확인
  if (
    !blockObj.title || typeof blockObj.title !== 'string' ||
    !blockObj.start || typeof blockObj.start !== 'string' ||
    !blockObj.end || typeof blockObj.end !== 'string'
  ) {
    return '각 block에는 title, start, end가 필요합니다';
  }

  // 2. 시간 형식 확인 (HH:mm)
  if (!isValidTimeFormat(blockObj.start as string) || !isValidTimeFormat(blockObj.end as string)) {
    return '시간 형식이 올바르지 않습니다. 예: 09:00';
  }

  // 3. end > start 시간 검증
  const startMinutes = timeToMinutes(blockObj.start as string);
  const endMinutes = timeToMinutes(blockObj.end as string);
  if (endMinutes <= startMinutes) {
    return '종료 시간은 시작 시간보다 늦어야 합니다';
  }

  // 4. priority 값 확인 (제공된 경우에만)
  // 구버전 high/medium/low 도 허용 (normalizeBlock에서 변환됨)
  if (blockObj.priority !== undefined && blockObj.priority !== null) {
    const p = blockObj.priority as string;
    const isNewFormat = VALID_PRIORITIES.includes(p as Priority);
    const isLegacyFormat = Object.keys(LEGACY_PRIORITY_MAP).includes(p);
    if (!isNewFormat && !isLegacyFormat) {
      return 'priority는 urgent_important, not_urgent_important, urgent_not_important, not_urgent_not_important 중 하나여야 합니다';
    }
  }

  return null;
}

/** 기본 색상 값 */
const DEFAULT_COLOR = '#6B7280';

/** 기본 priority 값 */
const DEFAULT_PRIORITY: Priority = 'not_urgent_important';

/**
 * 개별 블록에 기본값을 보정하여 완전한 Block 타입으로 변환한다.
 * - color: 없으면 "#6B7280"
 * - id: 없으면 generateId()로 자동 생성
 * - duration_minutes: start/end 기준으로 항상 재계산
 * - priority: 없으면 "not_urgent_important"
 * - required: 없으면 false
 *
 * @param block - 검증을 통과한 raw 블록 객체
 * @returns 정규화된 Block 객체
 */
export function normalizeBlock(block: Record<string, unknown>): Block {
  const start = block.start as string;
  const end = block.end as string;

  // duration_minutes는 항상 start/end 기준으로 재계산
  const durationMinutes = timeToMinutes(end) - timeToMinutes(start);

  const validPriorities: string[] = [
    'urgent_important',
    'not_urgent_important',
    'urgent_not_important',
    'not_urgent_not_important',
  ];

  return {
    id: (typeof block.id === 'string' && block.id.length > 0) ? block.id : generateId(),
    title: block.title as string,
    category: typeof block.category === 'string' ? block.category : undefined,
    start,
    end,
    duration_minutes: durationMinutes,
    priority: (() => {
      const p = block.priority as string | undefined;
      if (!p) return DEFAULT_PRIORITY;
      if (validPriorities.includes(p)) return p as Priority;
      if (LEGACY_PRIORITY_MAP[p]) return LEGACY_PRIORITY_MAP[p];
      return DEFAULT_PRIORITY;
    })(),
    color: (typeof block.color === 'string' && block.color.length > 0) ? block.color : DEFAULT_COLOR,
    required: typeof block.required === 'boolean' ? block.required : false,
    weekStart: typeof block.weekStart === 'string' ? block.weekStart : undefined,
    notes: typeof block.notes === 'string' ? block.notes : undefined,
  };
}

/**
 * 누락된 요일을 빈 blocks 배열로 자동 생성하여 7개 요일을 완성한다.
 * - 이미 존재하는 요일은 그대로 유지
 * - 누락된 요일은 빈 blocks 배열과 한국어 label로 생성
 * - 결과는 monday~sunday 순서로 정렬
 *
 * @param days - 현재 days 배열 (일부 요일이 누락될 수 있음)
 * @returns 7개 요일이 모두 포함된 DayData 배열
 */
export function addMissingDays(days: DayData[]): DayData[] {
  // 현재 존재하는 요일을 Map으로 관리 (빠른 조회)
  const existingDaysMap = new Map<DayValue, DayData>();
  for (const dayData of days) {
    existingDaysMap.set(dayData.day, dayData);
  }

  // VALID_DAYS 순서대로 7개 요일을 구성
  return VALID_DAYS.map((dayValue) => {
    if (existingDaysMap.has(dayValue)) {
      return existingDaysMap.get(dayValue)!;
    }
    // 누락된 요일: 빈 blocks 배열과 한국어 label로 생성
    return {
      day: dayValue,
      label: DAY_LABELS[dayValue],
      blocks: [],
    };
  });
}

/**
 * 루틴 데이터 정규화
 * - 기본값 보정 (Task 3.3)
 * - 누락 요일 자동 생성 (Task 3.4)
 * - 중복 ID 보정 (Task 3.5)
 * @param data - 정규화할 RoutineData
 * @returns 정규화된 RoutineData
 */
export function normalizeRoutineData(data: RoutineData): RoutineData {
  // Task 3.3: 각 블록에 기본값 보정 적용 + start 시간 기준 정렬
  const normalizedDays: DayData[] = data.days.map((dayData) => {
    const normalizedBlocks = dayData.blocks.map((block) =>
      normalizeBlock(block as unknown as Record<string, unknown>)
    );
    // 각 요일의 blocks를 start 시간 기준 오름차순 정렬
    normalizedBlocks.sort(
      (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)
    );
    return {
      ...dayData,
      blocks: normalizedBlocks,
    };
  });

  // Task 3.4: 누락 요일 자동 생성
  const completeDays = addMissingDays(normalizedDays);

  // Task 3.5: 중복 ID 보정
  const deduplicatedDays = deduplicateIds(completeDays);

  return {
    ...data,
    days: deduplicatedDays,
  };
}

/**
 * JSON 문자열을 파싱하여 RoutineData로 변환한다.
 *
 * 검증 순서:
 * 1. JSON.parse 시도 → 실패 시 "JSON 형식이 올바르지 않습니다"
 * 2. routine_name 존재 확인 → "routine_name이 필요합니다"
 * 3. days 배열 확인 → "days는 배열이어야 합니다"
 * 4. 각 day의 day 값 확인 → "day는 monday~sunday 중 하나여야 합니다"
 * 5. 각 day의 blocks 배열 확인 → "{day}의 blocks 항목이 배열이 아닙니다"
 * 6~12. (Task 3.2~3.5에서 추가 예정)
 *
 * @param jsonString - 파싱할 JSON 문자열
 * @returns ParseResult
 */
export function parseRoutineJson(jsonString: string): ParseResult {
  // 1. JSON.parse 시도
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { success: false, error: 'JSON 형식이 올바르지 않습니다' };
  }

  // parsed가 객체인지 확인
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { success: false, error: 'JSON 형식이 올바르지 않습니다' };
  }

  const obj = parsed as Record<string, unknown>;

  // 2. routine_name 존재 확인
  if (!obj.routine_name || typeof obj.routine_name !== 'string') {
    return { success: false, error: 'routine_name이 필요합니다' };
  }

  // 3. days 배열 확인
  if (!Array.isArray(obj.days)) {
    return { success: false, error: 'days는 배열이어야 합니다' };
  }

  // 4~5. 각 day 항목 검증
  const days = obj.days as unknown[];
  for (const dayItem of days) {
    if (typeof dayItem !== 'object' || dayItem === null || Array.isArray(dayItem)) {
      return { success: false, error: 'day는 monday~sunday 중 하나여야 합니다' };
    }

    const dayObj = dayItem as Record<string, unknown>;

    // 4. day 값이 유효한 DayValue인지 확인
    if (!VALID_DAYS.includes(dayObj.day as DayValue)) {
      return { success: false, error: 'day는 monday~sunday 중 하나여야 합니다' };
    }

    // 5. blocks가 배열인지 확인
    if (!Array.isArray(dayObj.blocks)) {
      return {
        success: false,
        error: `${dayObj.day}의 blocks 항목이 배열이 아닙니다`,
      };
    }

    // 6. 각 block 유효성 검증
    const blocks = dayObj.blocks as unknown[];
    for (const block of blocks) {
      const blockError = validateBlock(block, dayObj.day as string);
      if (blockError) {
        return { success: false, error: blockError };
      }
    }
  }

  // 기본 검증 통과 - 최소한의 RoutineData 구성
  const routineData: RoutineData = {
    routine_name: obj.routine_name as string,
    days: (obj.days as Record<string, unknown>[]).map((d) => ({
      day: d.day as DayValue,
      label: (d.label as string) || (d.day as string),
      blocks: (d.blocks as unknown[]) as DayData['blocks'],
    })),
  };

  // 선택적 필드 할당
  if (typeof obj.version === 'string') {
    routineData.version = obj.version;
  }
  if (typeof obj.timezone === 'string') {
    routineData.timezone = obj.timezone;
  }
  if (obj.sleep && typeof obj.sleep === 'object') {
    routineData.sleep = obj.sleep as RoutineData['sleep'];
  }

  // Task 3.2~3.5에서 추가 검증 및 정규화가 적용될 위치
  // Task 3.3: 기본값 보정 적용
  const normalizedData = normalizeRoutineData(routineData);

  return { success: true, data: normalizedData };
}
