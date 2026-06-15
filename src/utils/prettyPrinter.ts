import type { RoutineData } from '../types';

/**
 * RoutineData를 2-space 들여쓰기의 JSON 문자열로 변환한다.
 * 출력된 JSON은 parseRoutineJson()으로 다시 파싱할 수 있는 형식이다.
 *
 * @param data - 변환할 RoutineData 객체
 * @returns 2-space 들여쓰기가 적용된 JSON 문자열
 */
export function routineDataToJson(data: RoutineData): string {
  return JSON.stringify(data, null, 2);
}
