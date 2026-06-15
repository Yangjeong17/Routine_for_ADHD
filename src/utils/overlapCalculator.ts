import type { Block } from '../types';

/**
 * 블록 배치 정보 인터페이스
 * 타임라인 그리드 위에서 블록의 위치와 크기를 나타낸다.
 */
export interface BlockLayout {
  blockId: string;
  top: number;       // px
  height: number;    // px
  width: string;     // 예: "50%"
  left: string;      // 예: "0%"
}

/**
 * "HH:mm" 형식의 시간 문자열을 분(minutes)으로 변환한다.
 * @param time - "HH:mm" 형식 문자열
 * @returns 0~1439 범위의 분 값
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * 블록의 시작 시간을 기준으로 top 위치(px)를 계산한다.
 * 공식: (startMinutes / 1440) × totalHeight
 * @param startTime - "HH:mm" 형식의 시작 시간
 * @param totalHeight - 그리드 전체 높이 (px)
 * @returns top 위치 (px)
 */
export function calculateTop(startTime: string, totalHeight: number): number {
  const minutes = timeToMinutes(startTime);
  return (minutes / 1440) * totalHeight;
}

/**
 * 블록의 duration을 기준으로 높이(px)를 계산한다.
 * 최소 높이: max(20분 분량 px, 28px)를 보장한다.
 * @param durationMinutes - 블록의 지속 시간 (분)
 * @param totalHeight - 그리드 전체 높이 (px)
 * @returns 높이 (px)
 */
export function calculateHeight(durationMinutes: number, totalHeight: number): number {
  const calculated = (durationMinutes / 1440) * totalHeight;
  const minHeight = Math.max((20 / 1440) * totalHeight, 28);
  return Math.max(calculated, minHeight);
}

/**
 * 두 블록이 시간적으로 겹치는지 판정한다.
 * 겹침 조건: A.start < B.end AND B.start < A.end
 * @param aStart - 블록 A의 시작 시간 (분)
 * @param aEnd - 블록 A의 종료 시간 (분)
 * @param bStart - 블록 B의 시작 시간 (분)
 * @param bEnd - 블록 B의 종료 시간 (분)
 * @returns 겹치면 true
 */
function isOverlapping(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * 블록 배열에 대해 겹침을 계산하여 레이아웃 정보를 반환한다.
 *
 * 알고리즘:
 * 1. 블록들을 start 시간 기준 정렬
 * 2. 겹침 그룹(overlap group) 구성: 연속적으로 겹치는 블록들을 하나의 그룹으로 묶음
 * 3. 그룹 내 N개 블록: 각 블록 width = (100/N)%, left = (index × 100/N)%
 * 4. top = (startMinutes / 1440) × totalHeight
 * 5. height = max((durationMinutes / 1440) × totalHeight, 28px) — 최소 높이 보장
 *
 * @param blocks - 같은 요일의 블록 배열
 * @param totalHeight - 그리드 전체 높이 (px)
 * @returns 각 블록의 레이아웃 정보 배열
 */
export function calculateBlockLayouts(blocks: Block[], totalHeight: number): BlockLayout[] {
  if (blocks.length === 0) return [];

  // 시작 시간 기준 정렬 (원본 배열 변경 방지)
  const sorted = [...blocks].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

  // 겹침 그룹 구성
  const groups: Block[][] = [];
  let currentGroup: Block[] = [sorted[0]];
  let groupEnd = timeToMinutes(sorted[0].start) + sorted[0].duration_minutes;

  for (let i = 1; i < sorted.length; i++) {
    const block = sorted[i];
    const blockStart = timeToMinutes(block.start);
    const blockEnd = blockStart + block.duration_minutes;

    // 현재 그룹의 최대 종료 시간과 비교하여 겹침 판정
    if (isOverlapping(blockStart, blockEnd, timeToMinutes(currentGroup[0].start), groupEnd)) {
      currentGroup.push(block);
      groupEnd = Math.max(groupEnd, blockEnd);
    } else {
      groups.push(currentGroup);
      currentGroup = [block];
      groupEnd = blockEnd;
    }
  }
  groups.push(currentGroup);

  // 레이아웃 계산 (결과를 원래 블록 순서와 무관하게 blockId로 매핑)
  const layoutMap = new Map<string, BlockLayout>();

  for (const group of groups) {
    const n = group.length;
    group.forEach((block, index) => {
      const top = calculateTop(block.start, totalHeight);
      const height = calculateHeight(block.duration_minutes, totalHeight);
      const width = `${100 / n}%`;
      const left = `${(index * 100) / n}%`;

      layoutMap.set(block.id, { blockId: block.id, top, height, width, left });
    });
  }

  // 원래 blocks 배열 순서대로 결과 반환
  return blocks.map((block) => layoutMap.get(block.id)!);
}
