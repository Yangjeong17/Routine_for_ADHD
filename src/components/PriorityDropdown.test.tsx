import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PriorityDropdown from './PriorityDropdown';

describe('PriorityDropdown', () => {
  it('high, medium, low 세 가지 옵션을 제공한다', () => {
    const onChange = vi.fn();
    render(<PriorityDropdown value="medium" onChange={onChange} />);

    const select = screen.getByRole('combobox', { name: '중요도 선택' });
    const options = select.querySelectorAll('option');

    expect(options).toHaveLength(3);
    expect((options[0] as HTMLOptionElement).value).toBe('high');
    expect((options[1] as HTMLOptionElement).value).toBe('medium');
    expect((options[2] as HTMLOptionElement).value).toBe('low');
  });

  it('현재 value를 선택된 상태로 표시한다', () => {
    const onChange = vi.fn();
    render(<PriorityDropdown value="low" onChange={onChange} />);

    const select = screen.getByRole('combobox', { name: '중요도 선택' }) as HTMLSelectElement;
    expect(select.value).toBe('low');
  });

  it('선택 시 즉시 onChange를 호출한다', () => {
    const onChange = vi.fn();
    render(<PriorityDropdown value="medium" onChange={onChange} />);

    const select = screen.getByRole('combobox', { name: '중요도 선택' });
    fireEvent.change(select, { target: { value: 'high' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('high');
  });

  it('low로 변경 시 onChange에 low를 전달한다', () => {
    const onChange = vi.fn();
    render(<PriorityDropdown value="high" onChange={onChange} />);

    const select = screen.getByRole('combobox', { name: '중요도 선택' });
    fireEvent.change(select, { target: { value: 'low' } });

    expect(onChange).toHaveBeenCalledWith('low');
  });
});
