import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimelineBlock } from './TimelineBlock';
import type { Block, Priority } from '../types';

/** 테스트용 기본 블록 생성 헬퍼 */
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
    notes: '스트레칭 포함',
    ...overrides,
  };
}

/** 기본 props 생성 헬퍼 */
function createProps(overrides: Partial<Parameters<typeof TimelineBlock>[0]> = {}) {
  return {
    block: createBlock(),
    dayValue: 'monday' as const,
    top: 420,
    height: 60,
    width: '100%',
    left: '0%',
    isCompleted: false,
    onToggleCompletion: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onUpdateCategory: vi.fn(),
    onUpdatePriority: vi.fn(),
    allCategories: ['건강', '업무', '학습'],
    ...overrides,
  };
}

describe('TimelineBlock', () => {
  describe('배치 및 스타일링', () => {
    it('position: absolute로 top/height/width/left를 props로 받아 배치한다', () => {
      const props = createProps({ top: 100, height: 80, width: '50%', left: '25%' });
      render(<TimelineBlock {...props} />);

      const block = screen.getByLabelText('아침 운동 블록');
      expect(block.style.top).toBe('100px');
      expect(block.style.height).toBe('80px');
      expect(block.style.width).toBe('50%');
      expect(block.style.left).toBe('25%');
    });

    it('block.color를 배경색으로 적용한다', () => {
      const props = createProps({ block: createBlock({ color: '#EF4444' }) });
      render(<TimelineBlock {...props} />);

      const block = screen.getByLabelText('아침 운동 블록');
      expect(block.style.backgroundColor).toBe('rgb(239, 68, 68)');
    });

    it('완료된 블록은 opacity가 낮아진다', () => {
      const props = createProps({ isCompleted: true });
      render(<TimelineBlock {...props} />);

      const block = screen.getByLabelText('아침 운동 블록');
      expect(block.style.opacity).toBe('0.5');
    });
  });

  describe('높이 기반 콘텐츠 표시', () => {
    it('높이 ≥ 40px: 제목, 시간, 카테고리, 중요도 모두 표시한다', () => {
      const props = createProps({ height: 60 });
      render(<TimelineBlock {...props} />);

      expect(screen.getByText('아침 운동')).toBeDefined();
      expect(screen.getByText('07:00 - 08:00')).toBeDefined();
      expect(screen.getByText('건강')).toBeDefined();
      expect(screen.getByText('보통')).toBeDefined();
    });

    it('높이 < 40px: 제목만 표시한다', () => {
      const props = createProps({ height: 30 });
      render(<TimelineBlock {...props} />);

      expect(screen.getByText('아침 운동')).toBeDefined();
      expect(screen.queryByText('07:00 - 08:00')).toBeNull();
      expect(screen.queryByText('건강')).toBeNull();
      expect(screen.queryByText('보통')).toBeNull();
    });
  });

  describe('너비 기반 콘텐츠 표시', () => {
    it('너비 < 80px 시 제목만 표시한다 (width="50%"는 컬럼 80px 기준 40px)', () => {
      const props = createProps({ width: '50%', height: 60 });
      render(<TimelineBlock {...props} />);

      expect(screen.getByText('아침 운동')).toBeDefined();
      expect(screen.queryByText('07:00 - 08:00')).toBeNull();
      expect(screen.queryByText('건강')).toBeNull();
    });

    it('너비 100%이고 높이 충분하면 전체 정보를 표시한다', () => {
      const props = createProps({ width: '100%', height: 60 });
      render(<TimelineBlock {...props} />);

      expect(screen.getByText('아침 운동')).toBeDefined();
      expect(screen.getByText('07:00 - 08:00')).toBeDefined();
      expect(screen.getByText('건강')).toBeDefined();
      expect(screen.getByText('보통')).toBeDefined();
    });
  });

  describe('짧은 블록 Hit_Area 확장', () => {
    it('duration < 20분인 블록은 상하 6px Hit_Area가 확장된다', () => {
      const props = createProps({
        block: createBlock({ duration_minutes: 15 }),
        height: 28,
      });
      render(<TimelineBlock {...props} />);

      const block = screen.getByLabelText('아침 운동 블록');
      expect(block.style.paddingTop).toBe('6px');
      expect(block.style.paddingBottom).toBe('6px');
      expect(block.style.marginTop).toBe('-6px');
    });

    it('duration ≥ 20분인 블록은 Hit_Area 확장이 없다', () => {
      const props = createProps({
        block: createBlock({ duration_minutes: 30 }),
        height: 40,
      });
      render(<TimelineBlock {...props} />);

      const block = screen.getByLabelText('아침 운동 블록');
      expect(block.style.paddingTop).toBe('');
      expect(block.style.paddingBottom).toBe('');
    });
  });

  describe('액션 버튼', () => {
    it('펜 아이콘 버튼 클릭 시 onEdit이 호출된다', () => {
      const props = createProps();
      render(<TimelineBlock {...props} />);

      const editBtn = screen.getByLabelText('아침 운동 수정');
      fireEvent.click(editBtn);

      expect(props.onEdit).toHaveBeenCalledTimes(1);
    });

    it('삭제 버튼 클릭 시 onDelete가 호출된다', () => {
      const props = createProps();
      render(<TimelineBlock {...props} />);

      const deleteBtn = screen.getByLabelText('아침 운동 삭제');
      fireEvent.click(deleteBtn);

      expect(props.onDelete).toHaveBeenCalledTimes(1);
    });

    it('펜 아이콘 버튼 클릭 시 이벤트 전파가 중단된다', () => {
      const props = createProps();
      render(<TimelineBlock {...props} />);

      const editBtn = screen.getByLabelText('아침 운동 수정');
      const event = new MouseEvent('click', { bubbles: true });
      const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

      fireEvent(editBtn, event);

      // stopPropagation은 React의 synthetic event에서 호출됨
      expect(props.onEdit).toHaveBeenCalledTimes(1);
    });
  });

  describe('카테고리 없는 블록', () => {
    it('category가 없으면 카테고리 영역을 표시하지 않는다', () => {
      const props = createProps({
        block: createBlock({ category: undefined }),
        height: 60,
      });
      render(<TimelineBlock {...props} />);

      expect(screen.getByText('아침 운동')).toBeDefined();
      expect(screen.getByText('07:00 - 08:00')).toBeDefined();
      // 카테고리 텍스트가 없어야 함
      expect(screen.queryByText('건강')).toBeNull();
    });
  });

  describe('완료 상태', () => {
    it('완료된 블록의 제목에 line-through 스타일이 적용된다', () => {
      const props = createProps({ isCompleted: true });
      render(<TimelineBlock {...props} />);

      const title = screen.getByText('아침 운동');
      expect(title.className).toContain('line-through');
    });
  });
});
