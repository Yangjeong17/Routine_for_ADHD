import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimelineGrid, HOUR_HEIGHT, TOTAL_HEIGHT } from './TimelineGrid';
import type { DayData, Block, CompletionRecords, DayValue, Priority } from '../types';

// --- 테스트 헬퍼 ---

/** 테스트용 블록 생성 */
function createBlock(overrides: Partial<Block> = {}): Block {
  return {
    id: 'block-1',
    title: '아침 운동',
    category: '건강',
    start: '07:00',
    end: '08:00',
    duration_minutes: 60,
    priority: 'medium' as Priority,
    color: '#3B82F6',
    required: true,
    notes: '',
    ...overrides,
  };
}

/** 테스트용 DayData 배열 생성 (7일) */
function createDays(mondayBlocks: Block[] = []): DayData[] {
  const dayValues: { day: DayValue; label: string }[] = [
    { day: 'monday', label: '월' },
    { day: 'tuesday', label: '화' },
    { day: 'wednesday', label: '수' },
    { day: 'thursday', label: '목' },
    { day: 'friday', label: '금' },
    { day: 'saturday', label: '토' },
    { day: 'sunday', label: '일' },
  ];

  return dayValues.map((d, index) => ({
    day: d.day,
    label: d.label,
    blocks: index === 0 ? mondayBlocks : [],
  }));
}

/** 테스트용 weekDates 생성 (2025-01-06 ~ 2025-01-12) */
function createWeekDates(): Date[] {
  return Array.from({ length: 7 }, (_, i) => new Date(2025, 0, 6 + i));
}

/** 기본 props 생성 */
function createProps(overrides: Partial<Parameters<typeof TimelineGrid>[0]> = {}) {
  return {
    days: createDays(),
    weekDates: createWeekDates(),
    completionRecords: {} as CompletionRecords,
    onToggleCompletion: vi.fn(),
    onEditBlock: vi.fn(),
    onDeleteBlock: vi.fn(),
    onAddBlock: vi.fn(),
    onUpdateBlock: vi.fn(),
    ...overrides,
  };
}

describe('TimelineGrid 통합 테스트', () => {
  beforeEach(() => {
    // scrollTop setter를 모킹하기 위해 Element.prototype.scrollTop을 설정
    Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
      configurable: true,
      writable: true,
      value: 0,
    });
  });

  describe('블록 올바른 위치 렌더링 (Req 7.1, 7.2)', () => {
    it('블록이 start 시간 기준으로 올바른 top 위치에 렌더링된다', () => {
      // 07:00 시작 블록 → top = (7*60 / 1440) * 1440 = 420px
      const block = createBlock({ start: '07:00', end: '08:00', duration_minutes: 60 });
      const days = createDays([block]);
      const props = createProps({ days });

      render(<TimelineGrid {...props} />);

      // 블록 요소 찾기 - title 속성으로 검색
      const blockEl = screen.getByTitle('아침 운동 (07:00~08:00)');
      expect(blockEl).toBeDefined();

      // top 위치 확인: (420 / 1440) * 1440 = 420
      const expectedTop = (7 * 60 / 1440) * TOTAL_HEIGHT;
      expect(blockEl.style.top).toBe(`${expectedTop}px`);
    });

    it('블록의 height가 duration_minutes 기준으로 올바르게 계산된다', () => {
      // 60분 블록 → height = (60 / 1440) * 1440 = 60px
      const block = createBlock({ start: '09:00', end: '10:00', duration_minutes: 60 });
      const days = createDays([block]);
      const props = createProps({ days });

      render(<TimelineGrid {...props} />);

      const blockEl = screen.getByTitle('아침 운동 (09:00~10:00)');
      const expectedHeight = (60 / 1440) * TOTAL_HEIGHT;
      expect(blockEl.style.height).toBe(`${expectedHeight}px`);
    });

    it('5분 단위 정밀도로 블록 위치가 계산된다', () => {
      // 07:35 시작 → top = (7*60+35) / 1440 * 1440 = 455px
      const block = createBlock({
        id: 'block-precise',
        title: '정밀 블록',
        start: '07:35',
        end: '08:05',
        duration_minutes: 30,
      });
      const days = createDays([block]);
      const props = createProps({ days });

      render(<TimelineGrid {...props} />);

      const blockEl = screen.getByTitle('정밀 블록 (07:35~08:05)');
      const expectedTop = ((7 * 60 + 35) / 1440) * TOTAL_HEIGHT;
      expect(blockEl.style.top).toBe(`${expectedTop}px`);
    });
  });

  describe('겹침 블록 나란히 배치 (Req 10.1, 10.2, 10.3)', () => {
    it('2개 겹치는 블록이 각각 50% 너비로 나란히 배치된다', () => {
      const blockA = createBlock({
        id: 'block-a',
        title: '블록A',
        start: '09:00',
        end: '10:00',
        duration_minutes: 60,
      });
      const blockB = createBlock({
        id: 'block-b',
        title: '블록B',
        start: '09:30',
        end: '10:30',
        duration_minutes: 60,
      });
      const days = createDays([blockA, blockB]);
      const props = createProps({ days });

      render(<TimelineGrid {...props} />);

      const elA = screen.getByTitle('블록A (09:00~10:00)');
      const elB = screen.getByTitle('블록B (09:30~10:30)');

      // 2개 겹침 → 각각 50% 너비
      expect(elA.style.width).toBe('50%');
      expect(elB.style.width).toBe('50%');

      // left 위치: 첫 번째 0%, 두 번째 50%
      expect(elA.style.left).toBe('0%');
      expect(elB.style.left).toBe('50%');
    });

    it('3개 겹치는 블록이 각각 33.33% 너비로 나란히 배치된다', () => {
      const blockA = createBlock({
        id: 'block-a',
        title: '블록A',
        start: '09:00',
        end: '10:00',
        duration_minutes: 60,
      });
      const blockB = createBlock({
        id: 'block-b',
        title: '블록B',
        start: '09:30',
        end: '10:30',
        duration_minutes: 60,
      });
      const blockC = createBlock({
        id: 'block-c',
        title: '블록C',
        start: '09:45',
        end: '10:45',
        duration_minutes: 60,
      });
      const days = createDays([blockA, blockB, blockC]);
      const props = createProps({ days });

      render(<TimelineGrid {...props} />);

      const elA = screen.getByTitle('블록A (09:00~10:00)');
      const elB = screen.getByTitle('블록B (09:30~10:30)');
      const elC = screen.getByTitle('블록C (09:45~10:45)');

      // 3개 겹침 → 각각 100/3 ≈ 33.3333% 너비
      const expectedWidth = `${100 / 3}%`;
      expect(elA.style.width).toBe(expectedWidth);
      expect(elB.style.width).toBe(expectedWidth);
      expect(elC.style.width).toBe(expectedWidth);

      // left 위치: 0%, 33.33%, 66.67%
      expect(elA.style.left).toBe('0%');
      expect(elB.style.left).toBe(`${(1 * 100) / 3}%`);
      expect(elC.style.left).toBe(`${(2 * 100) / 3}%`);
    });

    it('겹치지 않는 블록은 각각 100% 너비로 배치된다', () => {
      const blockA = createBlock({
        id: 'block-a',
        title: '블록A',
        start: '08:00',
        end: '09:00',
        duration_minutes: 60,
      });
      const blockB = createBlock({
        id: 'block-b',
        title: '블록B',
        start: '10:00',
        end: '11:00',
        duration_minutes: 60,
      });
      const days = createDays([blockA, blockB]);
      const props = createProps({ days });

      render(<TimelineGrid {...props} />);

      const elA = screen.getByTitle('블록A (08:00~09:00)');
      const elB = screen.getByTitle('블록B (10:00~11:00)');

      expect(elA.style.width).toBe('100%');
      expect(elB.style.width).toBe('100%');
      expect(elA.style.left).toBe('0%');
      expect(elB.style.left).toBe('0%');
    });
  });

  describe('초기 스크롤 위치 06:00 (Req 6.5)', () => {
    it('초기 로드 시 scrollTop이 06:00 위치(360px)로 설정된다', () => {
      const props = createProps();
      const scrollTopSetter = vi.fn();

      // scrollTop setter를 스파이로 설정
      Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
        configurable: true,
        set: scrollTopSetter,
        get: () => 0,
      });

      render(<TimelineGrid {...props} />);

      // 06:00 = 6 * HOUR_HEIGHT = 6 * 60 = 360px
      const expectedScroll = 6 * HOUR_HEIGHT;
      expect(scrollTopSetter).toHaveBeenCalledWith(expectedScroll);
    });
  });

  describe('가이드라인 렌더링', () => {
    it('30분 단위 가이드라인이 48개 렌더링된다', () => {
      const props = createProps();
      const { container } = render(<TimelineGrid {...props} />);

      // GuideLines는 pointer-events-none 컨테이너 내부에 렌더링됨
      const guideContainer = container.querySelector('.pointer-events-none');
      const guideLines = guideContainer?.querySelectorAll('.border-b');

      // 48개의 가이드라인 (24시간 × 2)
      expect(guideLines?.length).toBe(48);
    });

    it('정시 가이드라인은 border-gray-200 스타일을 가진다', () => {
      const props = createProps();
      const { container } = render(<TimelineGrid {...props} />);

      const guideContainer = container.querySelector('.pointer-events-none');
      const hourLines = guideContainer?.querySelectorAll('.border-b.border-gray-200');
      // 짝수 인덱스(0, 2, 4, ..., 46) → 24개
      expect(hourLines?.length).toBe(24);
    });

    it('30분 가이드라인은 border-gray-100 스타일을 가진다', () => {
      const props = createProps();
      const { container } = render(<TimelineGrid {...props} />);

      const guideContainer = container.querySelector('.pointer-events-none');
      const halfLines = guideContainer?.querySelectorAll('.border-b.border-gray-100');
      // 홀수 인덱스(1, 3, 5, ..., 47) → 24개
      expect(halfLines?.length).toBe(24);
    });
  });

  describe('DayHeader 렌더링', () => {
    it('7개 요일 헤더가 렌더링된다', () => {
      const props = createProps();
      render(<TimelineGrid {...props} />);

      expect(screen.getByText('월')).toBeDefined();
      expect(screen.getByText('화')).toBeDefined();
      expect(screen.getByText('수')).toBeDefined();
      expect(screen.getByText('목')).toBeDefined();
      expect(screen.getByText('금')).toBeDefined();
      expect(screen.getByText('토')).toBeDefined();
      expect(screen.getByText('일')).toBeDefined();
    });

    it('요일 헤더에 날짜가 MM/DD 형식으로 표시된다', () => {
      const props = createProps();
      render(<TimelineGrid {...props} />);

      // 2025-01-06 (월) ~ 2025-01-12 (일)
      expect(screen.getByText('01/06')).toBeDefined();
      expect(screen.getByText('01/07')).toBeDefined();
      expect(screen.getByText('01/12')).toBeDefined();
    });
  });

  describe('TimeLabels 렌더링', () => {
    it('24시간 시간 라벨이 렌더링된다', () => {
      const props = createProps();
      render(<TimelineGrid {...props} />);

      expect(screen.getByText('00:00')).toBeDefined();
      expect(screen.getByText('06:00')).toBeDefined();
      expect(screen.getByText('12:00')).toBeDefined();
      expect(screen.getByText('23:00')).toBeDefined();
    });
  });
});
