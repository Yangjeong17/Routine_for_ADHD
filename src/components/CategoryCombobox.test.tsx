import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryCombobox } from './CategoryCombobox';

describe('CategoryCombobox', () => {
  const defaultCategories = ['운동', '공부', '업무', '휴식'];

  it('현재 value를 입력 필드에 표시한다', () => {
    render(
      <CategoryCombobox
        value="운동"
        allCategories={defaultCategories}
        onChange={() => {}}
      />
    );
    const input = screen.getByRole('combobox') as HTMLInputElement;
    expect(input.value).toBe('운동');
  });

  it('포커스 시 드롭다운 목록을 표시한다', () => {
    render(
      <CategoryCombobox
        value=""
        allCategories={defaultCategories}
        onChange={() => {}}
      />
    );
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    expect(screen.getByRole('listbox')).toBeDefined();
    expect(screen.getAllByRole('option')).toHaveLength(4);
  });

  it('드롭다운에서 카테고리 선택 시 onChange를 호출한다', () => {
    const onChange = vi.fn();
    render(
      <CategoryCombobox
        value=""
        allCategories={defaultCategories}
        onChange={onChange}
      />
    );
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.click(screen.getByText('공부'));
    expect(onChange).toHaveBeenCalledWith('공부');
  });

  it('텍스트 입력 시 즉시 onChange를 호출한다', () => {
    const onChange = vi.fn();
    render(
      <CategoryCombobox
        value=""
        allCategories={defaultCategories}
        onChange={onChange}
      />
    );
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: '새카테고리' } });
    expect(onChange).toHaveBeenCalledWith('새카테고리');
  });

  it('입력값에 따라 카테고리 목록을 필터링한다', () => {
    render(
      <CategoryCombobox
        value=""
        allCategories={defaultCategories}
        onChange={() => {}}
      />
    );
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '운' } });
    expect(screen.getByText('운동')).toBeDefined();
    expect(screen.queryByText('공부')).toBeNull();
  });

  it('현재 value와 동일한 카테고리는 드롭다운에서 제외한다', () => {
    // '운'을 입력하면 '운동'이 필터링 결과에 나타나지만, 현재 inputValue와 동일한 항목은 제외
    render(
      <CategoryCombobox
        value=""
        allCategories={defaultCategories}
        onChange={() => {}}
      />
    );
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    // '운동'을 직접 입력하면 드롭다운에서 '운동'은 제외됨
    fireEvent.change(input, { target: { value: '운동' } });
    // '운동'과 정확히 일치하는 항목은 목록에서 제외
    const listbox = screen.queryByRole('listbox');
    if (listbox) {
      const options = screen.getAllByRole('option');
      const optionTexts = options.map((opt) => opt.textContent);
      expect(optionTexts).not.toContain('운동');
    } else {
      // 필터링 결과가 없으면 드롭다운 자체가 표시되지 않음 (정상)
      expect(listbox).toBeNull();
    }
  });

  it('Escape 키 입력 시 드롭다운을 닫는다', () => {
    render(
      <CategoryCombobox
        value=""
        allCategories={defaultCategories}
        onChange={() => {}}
      />
    );
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    expect(screen.getByRole('listbox')).toBeDefined();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('빈 카테고리 목록일 때 드롭다운을 표시하지 않는다', () => {
    render(
      <CategoryCombobox
        value=""
        allCategories={[]}
        onChange={() => {}}
      />
    );
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
