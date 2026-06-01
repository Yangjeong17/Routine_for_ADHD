import { describe, it, expect } from 'vitest';
import { getMonday, getWeekDates, formatDate, addWeeks, getDayValueFromDate } from './weekUtils';

describe('getMonday', () => {
  it('월요일을 입력하면 같은 날짜(자정)를 반환한다', () => {
    // 2024-01-08은 월요일
    const monday = new Date(2024, 0, 8, 15, 30);
    const result = getMonday(monday);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(8);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });

  it('수요일을 입력하면 해당 주 월요일을 반환한다', () => {
    // 2024-01-10은 수요일
    const wednesday = new Date(2024, 0, 10);
    const result = getMonday(wednesday);
    expect(result.getDate()).toBe(8);
  });

  it('일요일을 입력하면 이전 주 월요일을 반환한다', () => {
    // 2024-01-14는 일요일
    const sunday = new Date(2024, 0, 14);
    const result = getMonday(sunday);
    expect(result.getDate()).toBe(8);
  });

  it('토요일을 입력하면 해당 주 월요일을 반환한다', () => {
    // 2024-01-13은 토요일
    const saturday = new Date(2024, 0, 13);
    const result = getMonday(saturday);
    expect(result.getDate()).toBe(8);
  });

  it('원본 Date를 변경하지 않는다', () => {
    const original = new Date(2024, 0, 10, 12, 0);
    const originalTime = original.getTime();
    getMonday(original);
    expect(original.getTime()).toBe(originalTime);
  });
});

describe('getWeekDates', () => {
  it('7개의 Date 배열을 반환한다', () => {
    const monday = new Date(2024, 0, 8);
    const result = getWeekDates(monday);
    expect(result).toHaveLength(7);
  });

  it('월요일부터 일요일까지 순서대로 반환한다', () => {
    const monday = new Date(2024, 0, 8);
    const result = getWeekDates(monday);
    expect(result[0].getDate()).toBe(8);  // 월
    expect(result[1].getDate()).toBe(9);  // 화
    expect(result[2].getDate()).toBe(10); // 수
    expect(result[3].getDate()).toBe(11); // 목
    expect(result[4].getDate()).toBe(12); // 금
    expect(result[5].getDate()).toBe(13); // 토
    expect(result[6].getDate()).toBe(14); // 일
  });

  it('모든 날짜가 자정으로 설정된다', () => {
    const monday = new Date(2024, 0, 8, 10, 30);
    const result = getWeekDates(monday);
    for (const d of result) {
      expect(d.getHours()).toBe(0);
      expect(d.getMinutes()).toBe(0);
      expect(d.getSeconds()).toBe(0);
    }
  });

  it('월 경계를 넘는 경우도 올바르게 처리한다', () => {
    // 2024-01-29 월요일 → 일요일은 2024-02-04
    const monday = new Date(2024, 0, 29);
    const result = getWeekDates(monday);
    expect(result[6].getMonth()).toBe(1); // 2월
    expect(result[6].getDate()).toBe(4);
  });
});

describe('formatDate', () => {
  it('YYYY-MM-DD 형식으로 반환한다', () => {
    const date = new Date(2024, 0, 8);
    expect(formatDate(date)).toBe('2024-01-08');
  });

  it('월과 일이 한 자리일 때 0을 패딩한다', () => {
    const date = new Date(2024, 2, 5); // 3월 5일
    expect(formatDate(date)).toBe('2024-03-05');
  });

  it('12월 31일을 올바르게 포맷한다', () => {
    const date = new Date(2024, 11, 31);
    expect(formatDate(date)).toBe('2024-12-31');
  });
});

describe('addWeeks', () => {
  it('양수 주를 더한다', () => {
    const date = new Date(2024, 0, 8);
    const result = addWeeks(date, 1);
    expect(result.getDate()).toBe(15);
    expect(result.getMonth()).toBe(0);
  });

  it('음수 주를 빼면 이전 날짜를 반환한다', () => {
    const date = new Date(2024, 0, 15);
    const result = addWeeks(date, -1);
    expect(result.getDate()).toBe(8);
  });

  it('0주를 더하면 같은 날짜를 반환한다', () => {
    const date = new Date(2024, 0, 8);
    const result = addWeeks(date, 0);
    expect(result.getDate()).toBe(8);
  });

  it('원본 Date를 변경하지 않는다', () => {
    const original = new Date(2024, 0, 8);
    const originalTime = original.getTime();
    addWeeks(original, 2);
    expect(original.getTime()).toBe(originalTime);
  });

  it('월 경계를 넘는 경우도 올바르게 처리한다', () => {
    const date = new Date(2024, 0, 29);
    const result = addWeeks(date, 1);
    expect(result.getMonth()).toBe(1); // 2월
    expect(result.getDate()).toBe(5);
  });
});

describe('getDayValueFromDate', () => {
  it('월요일 Date를 "monday"로 변환한다', () => {
    const monday = new Date(2024, 0, 8); // 월요일
    expect(getDayValueFromDate(monday)).toBe('monday');
  });

  it('일요일 Date를 "sunday"로 변환한다', () => {
    const sunday = new Date(2024, 0, 14); // 일요일
    expect(getDayValueFromDate(sunday)).toBe('sunday');
  });

  it('모든 요일을 올바르게 변환한다', () => {
    // 2024-01-08(월) ~ 2024-01-14(일)
    const expected: string[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (let i = 0; i < 7; i++) {
      const date = new Date(2024, 0, 8 + i);
      expect(getDayValueFromDate(date)).toBe(expected[i]);
    }
  });
});
