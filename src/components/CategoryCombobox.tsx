import { useState, useRef, useEffect } from 'react';
import { DEFAULT_CATEGORIES, getCategoryDisplayName } from '../utils/categoryUtils';

interface CategoryComboboxProps {
  value: string;          // 실제 저장값 (영문 또는 한글 key)
  allCategories: string[]; // 현재 루틴에 존재하는 카테고리 key 목록
  onChange: (category: string) => void; // 저장값(key)을 전달
}

/**
 * 카테고리 콤보박스
 * - 표시: 한국어 표시명 (getCategoryDisplayName 적용)
 * - 저장: 원본 key 값 유지
 * - 드롭박스: 기본 카테고리(한글) + 현재 루틴 카테고리 합산 (중복 제거)
 * - 새 카테고리 직접 입력 가능
 */
export function CategoryCombobox({
  value,
  allCategories,
  onChange,
}: CategoryComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 입력 필드에 표시할 텍스트: 표시명(한국어) 우선
  const [inputDisplay, setInputDisplay] = useState(() => {
    const display = getCategoryDisplayName(value);
    return display || value;
  });

  // 외부 value 변경 시 표시 텍스트 동기화 (한국어 표시명 적용)
  useEffect(() => {
    setInputDisplay(getCategoryDisplayName(value) || value);
  }, [value]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 드롭박스 목록: 기본 카테고리 + 현재 루틴 카테고리 합산 (표시명 기준 중복 제거)
  const dropdownItems: { key: string; display: string }[] = [];
  const seen = new Set<string>();

  // 기본 카테고리 (한글) 먼저
  DEFAULT_CATEGORIES.forEach(cat => {
    const display = getCategoryDisplayName(cat) || cat;
    if (!seen.has(display)) {
      seen.add(display);
      dropdownItems.push({ key: cat, display });
    }
  });

  // 현재 루틴에 있는 카테고리 추가
  allCategories.forEach(cat => {
    const display = getCategoryDisplayName(cat) || cat;
    if (!seen.has(display)) {
      seen.add(display);
      dropdownItems.push({ key: cat, display });
    }
  });

  // 입력 텍스트로 필터링
  const filteredItems = inputDisplay
    ? dropdownItems.filter(item =>
        item.display.toLowerCase().includes(inputDisplay.toLowerCase()) ||
        item.key.toLowerCase().includes(inputDisplay.toLowerCase())
      )
    : dropdownItems;

  // 텍스트 입력 변경 핸들러 - 사용자가 직접 타이핑
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const typed = e.target.value;
    setInputDisplay(typed);
    setIsOpen(true);
    // 타이핑 중에는 입력값을 그대로 저장 (새 카테고리 입력 지원)
    onChange(typed);
  }

  // 드롭박스에서 항목 선택 - key를 저장, display를 입력창에 표시
  function handleSelect(item: { key: string; display: string }) {
    setInputDisplay(item.display);
    setIsOpen(false);
    onChange(item.key);
  }

  function handleFocus() {
    setIsOpen(true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { setIsOpen(false); inputRef.current?.blur(); }
    else if (e.key === 'Enter') { setIsOpen(false); }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputDisplay}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder="카테고리 선택 또는 직접 입력"
        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white pr-6"
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
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d={isOpen ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
        </svg>
      </button>

      {/* 드롭다운 목록 */}
      {isOpen && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-40 overflow-y-auto bg-white border border-gray-200 rounded shadow-lg"
        >
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <li
                key={item.key}
                role="option"
                aria-selected={item.key === value}
                onClick={() => handleSelect(item)}
                className={`px-2 py-1.5 text-xs cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors ${
                  item.key === value ? 'bg-blue-50 text-blue-700 font-medium' : ''
                }`}
              >
                {item.display}
              </li>
            ))
          ) : (
            <li className="px-2 py-1.5 text-xs text-gray-400">
              "{inputDisplay}" 로 새 카테고리 추가
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
