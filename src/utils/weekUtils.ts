import type { DayValue } from '../types';

/**
 * 주어진 날짜가 속한 주의 월요일을 반환한다.
 * 주는 월요일부터 시작한다. 일요일인 경우 이전 주 월요일을 반환한다.
 */
export function getMonday(date: Date): Date {
  const d = new Date(date);
  const dayOfWeek = d.getDay(); // 0=일, 1=월, ..., 6=토
  // 월요일까지의 차이 계산 (일요일은 6일 전이 월요일)
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 월요일 날짜를 받아 월~일 7일간의 Date 배열을 반환한다.
 */
export function getWeekDates(mondayDate: Date): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mondayDate);
    d.setDate(mondayDate.getDate() + i);
    d.setHours(0, 0, 0, 0);
    dates.push(d);
  }
  return dates;
}

/**
 * Date를 "YYYY-MM-DD" 형식 문자열로 변환한다.
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 주어진 날짜에 weeks만큼 주를 더한(또는 뺀) 새 Date를 반환한다.
 */
export function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

/**
 * Date의 요일을 DayValue 타입 문자열로 변환한다.
 */
export function getDayValueFromDate(date: Date): DayValue {
  const dayMap: DayValue[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return dayMap[date.getDay()];
}
