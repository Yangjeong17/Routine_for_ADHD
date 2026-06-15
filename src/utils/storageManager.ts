import type { RoutineData, CompletionRecords, CategoryColorMap } from '../types';

const ROUTINE_DATA_KEY = 'routine-manager-current-routine';
const COMPLETION_RECORDS_KEY = 'routine-manager-completion-records';
const CATEGORY_COLOR_KEY = 'routine-manager-category-colors';

/**
 * RoutineData를 localStorage에 저장한다.
 * 저장 실패 시 콘솔 경고를 출력한다.
 */
export function saveRoutineData(data: RoutineData): void {
  try {
    const json = JSON.stringify(data);
    localStorage.setItem(ROUTINE_DATA_KEY, json);
  } catch (error) {
    console.warn('RoutineData 저장 실패:', error);
  }
}

/**
 * localStorage에서 RoutineData를 불러온다.
 * - 키가 존재하지 않으면 null 반환 (앱에서 샘플 데이터 표시)
 * - 키가 존재하지만 파싱 실패(손상)이면 null 반환 + 경고 로그
 *   (데이터가 존재했으므로 앱에서 샘플 데이터를 표시하지 않아야 함 — 호출자가 구분)
 */
export function loadRoutineData(): RoutineData | null {
  try {
    const raw = localStorage.getItem(ROUTINE_DATA_KEY);
    if (raw === null) {
      return null;
    }
    const parsed = JSON.parse(raw) as RoutineData;
    return parsed;
  } catch (error) {
    console.warn('RoutineData 로드 실패 (데이터 손상 가능):', error);
    return null;
  }
}

/**
 * CompletionRecords를 localStorage에 저장한다.
 * 저장 실패 시 콘솔 경고를 출력한다.
 */
export function saveCompletionRecords(records: CompletionRecords): void {
  try {
    const json = JSON.stringify(records);
    localStorage.setItem(COMPLETION_RECORDS_KEY, json);
  } catch (error) {
    console.warn('CompletionRecords 저장 실패:', error);
  }
}

/**
 * localStorage에서 CompletionRecords를 불러온다.
 * - 키가 존재하지 않거나 파싱 실패 시 빈 객체 반환
 */
export function loadCompletionRecords(): CompletionRecords {
  try {
    const raw = localStorage.getItem(COMPLETION_RECORDS_KEY);
    if (raw === null) {
      return {};
    }
    const parsed = JSON.parse(raw) as CompletionRecords;
    return parsed;
  } catch (error) {
    console.warn('CompletionRecords 로드 실패:', error);
    return {};
  }
}

/**
 * 모든 루틴 관련 데이터를 localStorage에서 삭제한다.
 */
export function clearAllData(): void {
  try {
    localStorage.removeItem(ROUTINE_DATA_KEY);
    localStorage.removeItem(COMPLETION_RECORDS_KEY);
    localStorage.removeItem(CATEGORY_COLOR_KEY);
  } catch (error) {
    console.warn('데이터 삭제 실패:', error);
  }
}

/**
 * 카테고리별 커스텀 색상 맵을 localStorage에 저장한다.
 */
export function saveCategoryColors(colors: CategoryColorMap): void {
  try {
    localStorage.setItem(CATEGORY_COLOR_KEY, JSON.stringify(colors));
  } catch (error) {
    console.warn('CategoryColors 저장 실패:', error);
  }
}

/**
 * localStorage에서 카테고리별 커스텀 색상 맵을 불러온다.
 * 없으면 빈 객체 반환.
 */
export function loadCategoryColors(): CategoryColorMap {
  try {
    const raw = localStorage.getItem(CATEGORY_COLOR_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CategoryColorMap;
  } catch (error) {
    console.warn('CategoryColors 로드 실패:', error);
    return {};
  }
}
