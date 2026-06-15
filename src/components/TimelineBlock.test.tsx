import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimelineBlock } from './TimelineBlock';
import type { Block } from '../types';

const sampleBlock: Block = {
  id: 'test-001',
  title: '아침 운동',
  category: '운동',
  start: '07:00',
  end: '08:00',
  duration_minutes: 60,
  priority: 'urgent_important',
  color: '#10B981',
  required: true,
};

const defaultProps = {
  block: sampleBlock,
  dayValue: 'monday' as const,
  top: 420,
  height: 60,
  width: '100%',
  left: '0%',
  isCompleted: false,
  isCurrentBlock: false,
  allCategories: ['운동', '업무', '휴식'],
  onToggleCompletion: vi.fn(),
  onEditBlock: vi.fn(),
  onDeleteBlock: vi.fn(),
  onUpdateBlock: vi.fn(),
};

describe('TimelineBlock', () => {
  it('블록 제목을 렌더링한다', () => {
    render(<TimelineBlock {...defaultProps} />);
    expect(screen.getByText('아침 운동')).toBeDefined();
  });

  it('aria-label이 "제목 블록" 형식으로 설정된다', () => {
    render(<TimelineBlock {...defaultProps} />);
    expect(screen.getByLabelText('아침 운동 블록')).toBeDefined();
  });

  it('완료 상태일 때 배경색이 어두워진다 (#636363)', () => {
    render(<TimelineBlock {...defaultProps} isCompleted={true} />);
    const blockEl = screen.getByLabelText('아침 운동 블록') as HTMLElement;
    expect(blockEl.style.backgroundColor).toBe('rgb(99, 99, 99)'); // #636363
  });

  it('미완료 상태일 때 배경색이 #F5F5F5이다', () => {
    render(<TimelineBlock {...defaultProps} isCompleted={false} />);
    const blockEl = screen.getByLabelText('아침 운동 블록') as HTMLElement;
    expect(blockEl.style.backgroundColor).toBe('rgb(245, 245, 245)'); // #F5F5F5
  });

  it('완료 체크박스 클릭 시 onToggleCompletion을 호출한다', () => {
    const onToggle = vi.fn();
    render(<TimelineBlock {...defaultProps} onToggleCompletion={onToggle} />);
    const checkbox = screen.getByLabelText('아침 운동 완료 체크');
    fireEvent.click(checkbox);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('펜 아이콘(수정) 클릭 시 onEditBlock을 호출한다', () => {
    const onEdit = vi.fn();
    // group-hover를 강제로 보이게 하기 위해 opacity 스타일 무시
    render(<TimelineBlock {...defaultProps} onEditBlock={onEdit} />);
    const editBtn = screen.getByLabelText('아침 운동 수정');
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalledWith('monday', sampleBlock);
  });

  it('삭제 버튼 클릭 시 onDeleteBlock을 호출한다', () => {
    const onDelete = vi.fn();
    render(<TimelineBlock {...defaultProps} onDeleteBlock={onDelete} />);
    const deleteBtn = screen.getByLabelText('아침 운동 삭제');
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('isCurrentBlock=true 이면 z-index가 10이다', () => {
    render(<TimelineBlock {...defaultProps} isCurrentBlock={true} />);
    const blockEl = screen.getByLabelText('아침 운동 블록') as HTMLElement;
    expect(blockEl.style.zIndex).toBe('10');
  });

  it('height가 40px 미만이면 시간을 표시하지 않는다', () => {
    render(<TimelineBlock {...defaultProps} height={30} />);
    expect(screen.queryByText('07:00 - 08:00')).toBeNull();
  });

  it('height가 40px 이상이면 시간을 표시한다', () => {
    render(<TimelineBlock {...defaultProps} height={60} />);
    expect(screen.getByText('07:00 - 08:00')).toBeDefined();
  });

  it('블록 클릭 시 BlockPopover가 열린다', () => {
    render(<TimelineBlock {...defaultProps} />);
    const blockEl = screen.getByLabelText('아침 운동 블록');
    fireEvent.click(blockEl);
    expect(screen.getByRole('dialog')).toBeDefined();
  });
});
