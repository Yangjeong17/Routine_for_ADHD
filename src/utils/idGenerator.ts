import type { DayData } from '../types';

/**
 * 고유한 문자열 ID를 생성한다.
 * crypto.randomUUID()를 사용하며, 지원하지 않는 환경에서는
 * Date.now() + 랜덤 문자열 조합으로 폴백한다.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // 폴백: 타임스탬프 + 랜덤 문자열
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * days 배열 내 모든 블록의 ID 중복을 제거한다.
 * 첫 번째 등장한 ID는 유지하고, 이후 중복된 ID는 새로운 고유 ID로 교체한다.
 * 원본 배열을 변경하지 않고 새 배열을 반환한다 (불변성).
 */
export function deduplicateIds(days: DayData[]): DayData[] {
  const seenIds = new Set<string>();

  return days.map((dayData) => ({
    ...dayData,
    blocks: dayData.blocks.map((block) => {
      if (seenIds.has(block.id)) {
        // 중복 ID 발견 - 새 ID로 교체
        const newId = generateId();
        seenIds.add(newId);
        return { ...block, id: newId };
      }
      seenIds.add(block.id);
      return block;
    }),
  }));
}
