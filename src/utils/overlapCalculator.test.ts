import { describe, it, expect } from 'vitest';
import {
  timeToMinutes,
  calculateTop,
  calculateHeight,
  calculateBlockLayouts,
} from './overlapCalculator';
import type { Block } from '../types';

// 테스트용 블록 생성 헬퍼
function makeBlock(overrides: Partial<Block> & { id: string; start: string; end: string; duration_minutes: number }): Block {
  return {
    title: 'Test Block',
    category: 'test',
    priority: 'medium',
    color: '#3B82F6',
    required: false,
    ...overrides,
  };
}

const TOTAL_HEIGHT = 1440; // 1분 = 1px로 계산이 직관적

describe('timeToMinutes', () => {
  it('00:00을 0으로 변환한다', () => {
    expect(timeToMinutes('00:00')).toBe(0);
  });

  it('12:30을 750으로 변환한다', () => {
    expect(timeToMinutes('12:30')).toBe(750);
  });

  it('23:59를 1439로 변환한다', () => {
    expect(timeToMinutes('23:59')).toBe(1439);
  });

  it('06:00을 360으로 변환한다', () => {
    expect(timeToMinutes('06:00')).toBe(360);
  });
});

describe('calculateTop', () => {
  it('00:00의 top은 0이다', () => {
    expect(calculateTop('00:00', TOTAL_HEIGHT)).toBe(0);
  });

  it('12:00의 top은 totalHeight의 절반이다', () => {
    expect(calculateTop('12:00', TOTAL_HEIGHT)).toBe(720);
  });

  it('06:00의 top은 (360/1440) × totalHeight이다', () => {
    expect(calculateTop('06:00', TOTAL_HEIGHT)).toBe(360);
  });

  it('23:59의 top은 (1439/1440) × totalHeight이다', () => {
    const expected = (1439 / 1440) * TOTAL_HEIGHT;
    expect(calculateTop('23:59', TOTAL_HEIGHT)).toBeCloseTo(expected);
  });
});

describe('calculateHeight', () => {
  it('60분 블록의 높이를 정확히 계산한다', () => {
    expect(calculateHeight(60, TOTAL_HEIGHT)).toBe(60);
  });

  it('30분 블록의 높이를 정확히 계산한다', () => {
    expect(calculateHeight(30, TOTAL_HEIGHT)).toBe(30);
  });

  it('5분 블록은 최소 높이(20분 분량)를 보장한다', () => {
    // 5분 → 5px이지만, 최소 높이 = max(20/1440 * 1440, 28) = max(20, 28) = 28
    expect(calculateHeight(5, TOTAL_HEIGHT)).toBe(28);
  });

  it('10분 블록은 최소 높이를 보장한다', () => {
    // 10분 → 10px이지만, 최소 높이 = 28
    expect(calculateHeight(10, TOTAL_HEIGHT)).toBe(28);
  });

  it('20분 블록은 최소 높이와 비교하여 큰 값을 사용한다', () => {
    // 20분 → 20px, 최소 높이 = max(20, 28) = 28
    expect(calculateHeight(20, TOTAL_HEIGHT)).toBe(28);
  });

  it('totalHeight가 작을 때도 최소 28px을 보장한다', () => {
    // totalHeight = 720일 때, 20분 분량 = (20/1440)*720 = 10px, 최소 = max(10, 28) = 28
    expect(calculateHeight(5, 720)).toBe(28);
  });
});

describe('calculateBlockLayouts', () => {
  it('빈 배열에 대해 빈 배열을 반환한다', () => {
    expect(calculateBlockLayouts([], TOTAL_HEIGHT)).toEqual([]);
  });

  it('겹치지 않는 블록들은 각각 100% 너비를 가진다', () => {
    const blocks: Block[] = [
      makeBlock({ id: '1', start: '08:00', end: '09:00', duration_minutes: 60 }),
      makeBlock({ id: '2', start: '10:00', end: '11:00', duration_minutes: 60 }),
      makeBlock({ id: '3', start: '14:00', end: '15:00', duration_minutes: 60 }),
    ];

    const layouts = calculateBlockLayouts(blocks, TOTAL_HEIGHT);

    expect(layouts).toHaveLength(3);
    layouts.forEach((layout) => {
      expect(layout.width).toBe('100%');
      expect(layout.left).toBe('0%');
    });
  });

  it('2개 겹치는 블록은 각각 50% 너비로 나란히 배치된다', () => {
    const blocks: Block[] = [
      makeBlock({ id: '1', start: '09:00', end: '10:00', duration_minutes: 60 }),
      makeBlock({ id: '2', start: '09:30', end: '10:30', duration_minutes: 60 }),
    ];

    const layouts = calculateBlockLayouts(blocks, TOTAL_HEIGHT);

    expect(layouts).toHaveLength(2);
    expect(layouts[0].width).toBe('50%');
    expect(layouts[0].left).toBe('0%');
    expect(layouts[1].width).toBe('50%');
    expect(layouts[1].left).toBe('50%');
  });

  it('3개 겹치는 블록은 각각 33.33% 너비로 배치된다', () => {
    const blocks: Block[] = [
      makeBlock({ id: '1', start: '09:00', end: '10:00', duration_minutes: 60 }),
      makeBlock({ id: '2', start: '09:15', end: '10:15', duration_minutes: 60 }),
      makeBlock({ id: '3', start: '09:30', end: '10:30', duration_minutes: 60 }),
    ];

    const layouts = calculateBlockLayouts(blocks, TOTAL_HEIGHT);

    expect(layouts).toHaveLength(3);
    const expectedWidth = `${100 / 3}%`;
    layouts.forEach((layout, index) => {
      expect(layout.width).toBe(expectedWidth);
      expect(layout.left).toBe(`${(index * 100) / 3}%`);
    });
  });

  it('top 위치가 시작 시간에 비례하여 계산된다', () => {
    const blocks: Block[] = [
      makeBlock({ id: '1', start: '06:00', end: '07:00', duration_minutes: 60 }),
    ];

    const layouts = calculateBlockLayouts(blocks, TOTAL_HEIGHT);

    expect(layouts[0].top).toBe(360); // 6시간 × 60분 = 360분 → 360px
  });

  it('height가 duration에 비례하여 계산된다', () => {
    const blocks: Block[] = [
      makeBlock({ id: '1', start: '08:00', end: '09:30', duration_minutes: 90 }),
    ];

    const layouts = calculateBlockLayouts(blocks, TOTAL_HEIGHT);

    expect(layouts[0].height).toBe(90); // 90분 → 90px (totalHeight=1440일 때)
  });

  it('짧은 블록은 최소 높이를 보장한다', () => {
    const blocks: Block[] = [
      makeBlock({ id: '1', start: '08:00', end: '08:05', duration_minutes: 5 }),
    ];

    const layouts = calculateBlockLayouts(blocks, TOTAL_HEIGHT);

    expect(layouts[0].height).toBe(28); // 최소 높이 보장
  });

  it('겹침 그룹이 여러 개일 때 각 그룹이 독립적으로 계산된다', () => {
    const blocks: Block[] = [
      // 그룹 1: 겹침
      makeBlock({ id: '1', start: '08:00', end: '09:00', duration_minutes: 60 }),
      makeBlock({ id: '2', start: '08:30', end: '09:30', duration_minutes: 60 }),
      // 그룹 2: 독립
      makeBlock({ id: '3', start: '14:00', end: '15:00', duration_minutes: 60 }),
    ];

    const layouts = calculateBlockLayouts(blocks, TOTAL_HEIGHT);

    // 그룹 1: 50% 너비
    expect(layouts[0].width).toBe('50%');
    expect(layouts[1].width).toBe('50%');
    // 그룹 2: 100% 너비
    expect(layouts[2].width).toBe('100%');
    expect(layouts[2].left).toBe('0%');
  });

  it('원래 배열 순서대로 결과를 반환한다', () => {
    const blocks: Block[] = [
      makeBlock({ id: 'late', start: '14:00', end: '15:00', duration_minutes: 60 }),
      makeBlock({ id: 'early', start: '08:00', end: '09:00', duration_minutes: 60 }),
    ];

    const layouts = calculateBlockLayouts(blocks, TOTAL_HEIGHT);

    expect(layouts[0].blockId).toBe('late');
    expect(layouts[1].blockId).toBe('early');
  });

  it('경계값: 블록 A의 end와 블록 B의 start가 같으면 겹치지 않는다', () => {
    const blocks: Block[] = [
      makeBlock({ id: '1', start: '08:00', end: '09:00', duration_minutes: 60 }),
      makeBlock({ id: '2', start: '09:00', end: '10:00', duration_minutes: 60 }),
    ];

    const layouts = calculateBlockLayouts(blocks, TOTAL_HEIGHT);

    // 겹치지 않으므로 각각 100% 너비
    expect(layouts[0].width).toBe('100%');
    expect(layouts[1].width).toBe('100%');
  });

  it('겹침 그룹 내 너비 합이 100%를 초과하지 않는다', () => {
    const blocks: Block[] = [
      makeBlock({ id: '1', start: '09:00', end: '10:00', duration_minutes: 60 }),
      makeBlock({ id: '2', start: '09:00', end: '10:00', duration_minutes: 60 }),
      makeBlock({ id: '3', start: '09:00', end: '10:00', duration_minutes: 60 }),
      makeBlock({ id: '4', start: '09:00', end: '10:00', duration_minutes: 60 }),
    ];

    const layouts = calculateBlockLayouts(blocks, TOTAL_HEIGHT);

    // 4개 블록 → 각 25%
    const totalWidth = layouts.reduce((sum, l) => sum + parseFloat(l.width), 0);
    expect(totalWidth).toBeCloseTo(100);
  });

  it('경계값: 00:00 시작 블록의 top은 0이다', () => {
    const blocks: Block[] = [
      makeBlock({ id: '1', start: '00:00', end: '01:00', duration_minutes: 60 }),
    ];

    const layouts = calculateBlockLayouts(blocks, TOTAL_HEIGHT);

    expect(layouts[0].top).toBe(0);
    expect(layouts[0].height).toBe(60);
    expect(layouts[0].width).toBe('100%');
  });

  it('경계값: 23:00~23:59 블록이 올바른 위치에 배치된다', () => {
    const blocks: Block[] = [
      makeBlock({ id: '1', start: '23:00', end: '23:59', duration_minutes: 59 }),
    ];

    const layouts = calculateBlockLayouts(blocks, TOTAL_HEIGHT);

    // 23:00 = 1380분 → top = (1380/1440) * 1440 = 1380
    expect(layouts[0].top).toBe(1380);
    // 59분 → height = 59px (최소 높이 28보다 큼)
    expect(layouts[0].height).toBe(59);
  });

  it('경계값: 00:00~23:59 하루 전체 블록이 올바르게 계산된다', () => {
    const blocks: Block[] = [
      makeBlock({ id: '1', start: '00:00', end: '23:59', duration_minutes: 1439 }),
    ];

    const layouts = calculateBlockLayouts(blocks, TOTAL_HEIGHT);

    expect(layouts[0].top).toBe(0);
    // 1439분 → (1439/1440) * 1440 ≈ 1439
    expect(layouts[0].height).toBeCloseTo(1439, 0);
    expect(layouts[0].width).toBe('100%');
  });

  it('경계값: 00:00 시작 블록과 23:00 시작 블록이 겹치지 않는다', () => {
    const blocks: Block[] = [
      makeBlock({ id: '1', start: '00:00', end: '01:00', duration_minutes: 60 }),
      makeBlock({ id: '2', start: '23:00', end: '23:59', duration_minutes: 59 }),
    ];

    const layouts = calculateBlockLayouts(blocks, TOTAL_HEIGHT);

    // 겹치지 않으므로 각각 100% 너비
    expect(layouts[0].width).toBe('100%');
    expect(layouts[1].width).toBe('100%');
    expect(layouts[0].top).toBe(0);
    expect(layouts[1].top).toBe(1380);
  });
});
