import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BlockPopover } from './BlockPopover';
import type { Block, DayValue } from '../types';

describe('BlockPopover', () => {
  const mockBlock: Block = {
    id: 'block-1',
    title: '아침 운동',
    category: '운동',
    start: '06:00',
    end: '06:30',
    duration_minutes: 30,
    priority: 'high',
    color: '#3B82F6',
    required: true,
    notes: '스트레칭 포함',
  };

  const mockAnchorRect = new DOMRect(100, 200, 120, 40);

  const defaultProps = {
    block: mockBlock,
    dayValue: 'monday' as DayValue,
    anchorRect: mockAnchorRect,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onUpdateCategory: vi.fn(),
    onUpdatePriority: vi.fn(),
    allCategories: ['운동', '공부', '업무', '휴식'],
    onClose: vi.fn(),
  };

  it('블록 제목을 표시한다', () => {
    render(<BlockPopover {...defaultProps} />);
    expect(screen.getByText('아침 운동')).toBeDefined();
  });

  it('시간 정보를 표시한다', () => {
    render(<BlockPopover {...defaultProps} />);
    expect(screen.getByText('06:00 ~ 06:30 (30분)')).toBeDefined();
  });

  it('메모를 표시한다', () => {
    render(<BlockPopover {...defaultProps} />);
    expect(screen.getByText('스트레칭 포함')).toBeDefined();
  });

  it('메모가 없으면 메모 섹션을 표시하지 않는다', () => {
    const blockWithoutNotes = { ...mockBlock, notes: undefined };
    render(<BlockPopover {...defaultProps} block={blockWithoutNotes} />);
    expect(screen.queryByText('메모')).toBeNull();
  });

  it('펜 아이콘 클릭 시 onEdit을 호출한다', () => {
    const onEdit = vi.fn();
    render(<BlockPopover {...defaultProps} onEdit={onEdit} />);
    fireEvent.click(screen.getByLabelText('블록 수정'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('삭제 버튼 클릭 시 onDelete를 호출한다', () => {
    const onDelete = vi.fn();
    render(<BlockPopover {...defaultProps} onDelete={onDelete} />);
    fireEvent.click(screen.getByLabelText('블록 삭제'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('외부 클릭 시 onClose를 호출한다', () => {
    const onClose = vi.fn();
    render(<BlockPopover {...defaultProps} onClose={onClose} />);
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Escape 키 입력 시 onClose를 호출한다', () => {
    const onClose = vi.fn();
    render(<BlockPopover {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('CategoryCombobox를 렌더링한다', () => {
    render(<BlockPopover {...defaultProps} />);
    // CategoryCombobox는 aria-label="카테고리"인 combobox를 렌더링
    expect(screen.getByLabelText('카테고리')).toBeDefined();
  });

  it('PriorityDropdown을 렌더링한다', () => {
    render(<BlockPopover {...defaultProps} />);
    // PriorityDropdown은 select 요소를 렌더링
    const select = screen.getByLabelText('중요도 선택') as HTMLSelectElement;
    expect(select.value).toBe('high');
  });

  it('dialog role을 가진다', () => {
    render(<BlockPopover {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeDefined();
  });

  it('CategoryCombobox에서 카테고리 변경 시 onUpdateCategory를 호출한다', () => {
    const onUpdateCategory = vi.fn();
    render(<BlockPopover {...defaultProps} onUpdateCategory={onUpdateCategory} />);
    const input = screen.getByLabelText('카테고리') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '공부' } });
    expect(onUpdateCategory).toHaveBeenCalledWith('공부');
  });

  it('PriorityDropdown에서 중요도 변경 시 onUpdatePriority를 호출한다', () => {
    const onUpdatePriority = vi.fn();
    render(<BlockPopover {...defaultProps} onUpdatePriority={onUpdatePriority} />);
    const select = screen.getByLabelText('중요도 선택') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'low' } });
    expect(onUpdatePriority).toHaveBeenCalledWith('low');
  });
});
