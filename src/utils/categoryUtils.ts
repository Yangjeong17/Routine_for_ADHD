import type { CategoryColorMap } from '../types';

/**
 * 앱 기본 카테고리 목록 (한글, 순서 유지)
 * 드롭박스에 항상 표시되는 기준 목록.
 */
export const DEFAULT_CATEGORIES: string[] = [
  '휴식',
  '업무',
  '식사',
  '운동',
  '약속',
  '루틴',
];

/**
 * 카테고리 영문 → 한국어 표시명 변환 맵
 * 추후 언어 설정 추가 시 이 맵을 교체하면 됨
 */
export const CATEGORY_DISPLAY_NAME: Record<string, string> = {
  // 영문 키 → 한국어
  career: '취준',
  app_project: '앱개발',
  health: '건강',
  fitness: '운동',
  meal: '식사',
  rest: '휴식',
  english: '영어',
  study: '학습',
  cleaning: '청소',
  planning: '계획',
  drawing: '그림',
  buffer: '버퍼',
  team_project: '팀프로젝트',
  conditional: '조건부',
  // 한국어 키는 그대로 반환
  업무: '업무',
  개인: '개인',
  운동: '운동',
  학습: '학습',
  휴식: '휴식',
};

/**
 * 카테고리 키를 한국어 표시명으로 변환한다.
 * 매핑에 없으면 원본 값을 그대로 반환.
 */
export function getCategoryDisplayName(category?: string): string {
  if (!category) return '';
  return CATEGORY_DISPLAY_NAME[category] ?? category;
}

/**
 * 기본 카테고리 배지 색상 맵 (한국어 + 영문)
 */
export const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  업무: '#3B82F6', 개인: '#8B5CF6', 운동: '#10B981', 학습: '#F59E0B', 휴식: '#6B7280',
  career: '#3B82F6', app_project: '#8B5CF6', health: '#10B981', fitness: '#10B981',
  meal: '#F59E0B', rest: '#6B7280', english: '#8B5CF6', study: '#F59E0B',
  cleaning: '#14B8A6', planning: '#64748B', drawing: '#EC4899',
  buffer: '#64748B', team_project: '#DC2626', conditional: '#DC2626',
};

/**
 * 카테고리 배지 색상을 반환한다.
 * 사용자 커스텀 색상(categoryColorMap)이 있으면 우선 적용한다.
 */
export function getBadgeColor(category?: string, colorMap?: CategoryColorMap): string {
  if (!category) return '#6B7280';
  if (colorMap?.[category]) return colorMap[category];
  return DEFAULT_CATEGORY_COLORS[category] ?? '#6B7280';
}
