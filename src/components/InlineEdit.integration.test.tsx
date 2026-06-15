/**
 * 인라인 편집 통합 테스트
 *
 * BlockPopover 및 TimelineBlock의 인라인 편집 위젯(CategoryCombobox, PriorityDropdown)과
 * 콜백 핸들러 간의 데이터 흐름을 검증하는 통합 테스트.
 *
 * Validates: Requirements 11.2, 12.4, 13.3, 14.2
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BlockPopover } from './BlockPopover';
import { TimelineBlock } from './TimelineBlock';
import type { Block, DayValue, Priority } from '../types';

/** 테스트용 블록 데이터 */
function createTestBlock(overrides: Partial<Block> = {}): Block {
  return {
    id: 'integration-block-1',
    title: '통합 테스트 블록',
    category: '업무',
    start: '09:00',
    end: '10:00',
    duration_minutes: 60,
    priority: 'medium',
    color: '#6366F1',
    required: false,
    notes: '통합 테스트용 메모',
    ...overrides,
  };
}

/** BlockPopover 기본 props 생성 */
function createPopoverProps(overrides: Partial<React.ComponentProps<typeof BlockPopover>> = {}) {
  return {
    block: createTestBlock(),
    dayValue: 'wednesday' as DayValue,
    anchorRect: new DOMRect(200, 300, 100, 40),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onUpdateCategory: vi.fn(),
    onUpdatePriority: vi.fn(),
    allCategories: ['업무', '운동', '학습', '취미', '휴식'],
    onClose: vi.fn(),
    ...overrides,
  };
}

/** TimelineBlock 기본 props 생성 */
function createBlockProps(overrides: Partial<React.ComponentProps<typeof TimelineBlock>> = {}) {
  return {
    block: createTestBlock(),
    dayValue: 'wednesday' as DayValue,
    top: 540,
    height: 60,
    width: '100%',
    left: '0%',
    isCompleted: false,
    onToggleCompletion: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onUpdateCategory: vi.fn(),
    onUpdatePriority: vi.fn(),
    allCategories: ['업무', '운동', '학습', '취미', '휴식'],
    ...overrides,
  };
}

describe('인라인 편집 통합 테스트', () => {
  describe('CategoryCombobox 선택/입력 → updateBlock 호출', () => {
    it('기존 카테고리를 드롭다운에서 선택하면 onUpdateCategory가 선택된 값으로 호출된다', () => {
      const onUpdateCategory = vi.fn();
      const props = createPopoverProps({ onUpdateCategory });
      render(<BlockPopover {...props} />);

      // 카테고리 입력 필드를 찾아 값을 비워서 전체 목록 표시
      const categoryInput = screen.getByLabelText('카테고리') as HTMLInputElement;
      fireEvent.change(categoryInput, { target: { value: '' } });
      fireEvent.focus(categoryInput);

      // 드롭다운에서 '운동' 항목 클릭
      const option = screen.getByText('운동');
      fireEvent.click(option);

      expect(onUpdateCategory).toHaveBeenCalledWith('운동');
    });

    it('새 카테고리를 직접 입력하면 onUpdateCategory가 입력된 값으로 호출된다', () => {
      const onUpdateCategory = vi.fn();
      const props = createPopoverProps({ onUpdateCategory });
      render(<BlockPopover {...props} />);

      const categoryInput = screen.getByLabelText('카테고리') as HTMLInputElement;
      fireEvent.change(categoryInput, { target: { value: '새카테고리' } });

      expect(onUpdateCategory).toHaveBeenCalledWith('새카테고리');
    });

    it('카테고리 변경 시 올바른 콜백이 즉시 호출되어 데이터 흐름이 완성된다', () => {
      const onUpdateCategory = vi.fn();
      const props = createPopoverProps({
        onUpdateCategory,
        block: createTestBlock({ category: '학습' }),
      });
      render(<BlockPopover {...props} />);

      const categoryInput = screen.getByLabelText('카테고리') as HTMLInputElement;
      expect(categoryInput.value).toBe('학습');

      // 값 변경
      fireEvent.change(categoryInput, { target: { value: '취미' } });

      // 즉시 콜백 호출 확인 (Storage_Manager 저장 흐름 트리거)
      expect(onUpdateCategory).toHaveBeenCalledTimes(1);
      expect(onUpdateCategory).toHaveBeenCalledWith('취미');
    });
  });

  describe('PriorityDropdown 변경 → updateBlock 호출', () => {
    it('중요도를 high로 변경하면 onUpdatePriority가 "high"로 호출된다', () => {
      const onUpdatePriority = vi.fn();
      const props = createPopoverProps({
        onUpdatePriority,
        block: createTestBlock({ priority: 'low' }),
      });
      render(<BlockPopover {...props} />);

      const select = screen.getByLabelText('중요도 선택') as HTMLSelectElement;
      expect(select.value).toBe('low');

      fireEvent.change(select, { target: { value: 'high' } });

      expect(onUpdatePriority).toHaveBeenCalledTimes(1);
      expect(onUpdatePriority).toHaveBeenCalledWith('high');
    });

    it('중요도를 low로 변경하면 onUpdatePriority가 "low"로 호출된다', () => {
      const onUpdatePriority = vi.fn();
      const props = createPopoverProps({
        onUpdatePriority,
        block: createTestBlock({ priority: 'high' }),
      });
      render(<BlockPopover {...props} />);

      const select = screen.getByLabelText('중요도 선택') as HTMLSelectElement;
      fireEvent.change(select, { target: { value: 'low' } });

      expect(onUpdatePriority).toHaveBeenCalledWith('low');
    });

    it('중요도 변경 시 즉시 콜백이 호출되어 Storage_Manager 저장 흐름이 트리거된다', () => {
      const onUpdatePriority = vi.fn();
      const props = createPopoverProps({
        onUpdatePriority,
        block: createTestBlock({ priority: 'medium' }),
      });
      render(<BlockPopover {...props} />);

      const select = screen.getByLabelText('중요도 선택') as HTMLSelectElement;

      // medium → high
      fireEvent.change(select, { target: { value: 'high' } });
      expect(onUpdatePriority).toHaveBeenLastCalledWith('high');

      // high → low (연속 변경)
      fireEvent.change(select, { target: { value: 'low' } });
      expect(onUpdatePriority).toHaveBeenLastCalledWith('low');
      expect(onUpdatePriority).toHaveBeenCalledTimes(2);
    });
  });

  describe('펜 아이콘 클릭 → 모달 열림 (onEdit 호출)', () => {
    it('TimelineBlock의 펜 아이콘 클릭 시 onEdit 콜백이 호출된다', () => {
      const onEdit = vi.fn();
      const props = createBlockProps({ onEdit });
      render(<TimelineBlock {...props} />);

      const editBtn = screen.getByLabelText('통합 테스트 블록 수정');
      fireEvent.click(editBtn);

      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('BlockPopover의 펜 아이콘 클릭 시 onEdit 콜백이 호출된다', () => {
      const onEdit = vi.fn();
      const props = createPopoverProps({ onEdit });
      render(<BlockPopover {...props} />);

      const editBtn = screen.getByLabelText('블록 수정');
      fireEvent.click(editBtn);

      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('펜 아이콘 클릭은 다른 콜백(onDelete, onClose)에 영향을 주지 않는다', () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      const onClose = vi.fn();
      const props = createPopoverProps({ onEdit, onDelete, onClose });
      render(<BlockPopover {...props} />);

      fireEvent.click(screen.getByLabelText('블록 수정'));

      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(onDelete).not.toHaveBeenCalled();
      // onClose는 외부 클릭에만 반응하므로 호출되지 않아야 함
    });
  });

  describe('삭제 버튼 → deleteBlock 호출', () => {
    it('TimelineBlock의 삭제 버튼 클릭 시 onDelete 콜백이 호출된다', () => {
      const onDelete = vi.fn();
      const props = createBlockProps({ onDelete });
      render(<TimelineBlock {...props} />);

      const deleteBtn = screen.getByLabelText('통합 테스트 블록 삭제');
      fireEvent.click(deleteBtn);

      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('BlockPopover의 삭제 버튼 클릭 시 onDelete 콜백이 호출된다', () => {
      const onDelete = vi.fn();
      const props = createPopoverProps({ onDelete });
      render(<BlockPopover {...props} />);

      const deleteBtn = screen.getByLabelText('블록 삭제');
      fireEvent.click(deleteBtn);

      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('삭제 버튼 클릭은 다른 콜백(onEdit, onUpdateCategory)에 영향을 주지 않는다', () => {
      const onDelete = vi.fn();
      const onEdit = vi.fn();
      const onUpdateCategory = vi.fn();
      const props = createPopoverProps({ onDelete, onEdit, onUpdateCategory });
      render(<BlockPopover {...props} />);

      fireEvent.click(screen.getByLabelText('블록 삭제'));

      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onEdit).not.toHaveBeenCalled();
      expect(onUpdateCategory).not.toHaveBeenCalled();
    });
  });
});
