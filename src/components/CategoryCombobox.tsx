import { useState, useRef, useEffect } from 'react';

interface CategoryComboboxProps {
  value: string;
  allCategories: string[];
  onChange: (category: string) => void;
}

/**
 * 카테고리 콤보박스 - 기존 카테고리 선택 + 새 카테고리 입력
 * 드롭다운에서 기존 카테고리를 선택하거나, 텍스트 필드에 새 카테고리를 직접 입력할 수 있다.
 * 선택/입력 시 즉시 onChange를 호출한다.
 */
export function CategoryCombobox({
  value,
  allCategories,
  onChange,
}: CategoryComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 외부 value prop 변경 시 내부 inputValue 동기화
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 입력값에 따라 필터링된 카테고리 목록
  const filteredCategories = allCategories.filter(
    (cat) =>
      cat.toLowerCase().includes(inputValue.toLowerCase()) &&
      cat !== inputValue
  );

  // 텍스트 입력 변경 핸들러
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    onChange(newValue);
  }

  // 드롭다운 항목 선택 핸들러
  function handleSelect(category: string) {
    setInputValue(category);
    setIsOpen(false);
    onChange(category);
  }

  // 입력 필드 포커스 시 드롭다운 열기
  function handleFocus() {
    setIsOpen(true);
  }

  // 키보드 이벤트 처리
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter') {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* 텍스트 입력 필드 */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder="카테고리 선택 또는 입력"
        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
        aria-label="카테고리"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        role="combobox"
        autoComplete="off"
      />

      {/* 드롭다운 토글 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"
        aria-label="카테고리 목록 열기"
        tabIndex={-1}
      >
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={isOpen ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}
          />
        </svg>
      </button>

      {/* 드롭다운 목록 */}
      {isOpen && filteredCategories.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-32 overflow-y-auto bg-white border border-gray-200 rounded shadow-lg"
        >
          {filteredCategories.map((category) => (
            <li
              key={category}
              role="option"
              aria-selected={category === value}
              onClick={() => handleSelect(category)}
              className="px-2 py-1 text-xs cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              {category}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
