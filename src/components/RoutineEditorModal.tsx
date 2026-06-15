import { useState, useEffect } from 'react';
import type { Block, DayValue, Priority, CategoryColorMap } from '../types';
import { getBadgeColor, DEFAULT_CATEGORIES, getCategoryDisplayName } from '../utils/categoryUtils';
import { CategoryCombobox } from './CategoryCombobox';

interface RoutineEditorModalProps {
  isOpen: boolean;
  editingBlock: { block: Block; dayValue: DayValue } | null;
  onSave: (
    dayValue: DayValue,
    blockData: Omit<Block, 'id' | 'duration_minutes'>,
    originalDayValue?: DayValue
  ) => void;
  onCancel: () => void;
  categoryColorMap?: CategoryColorMap;
  onCategoryColorChange?: (category: string, color: string) => void;
  allCategories?: string[];
}

interface FormErrors {
  title?: string;
  startTime?: string;
  endTime?: string;
  time?: string;
}

const DAY_OPTIONS: { value: DayValue; label: string }[] = [
  { value: 'monday', label: '월요일' },
  { value: 'tuesday', label: '화요일' },
  { value: 'wednesday', label: '수요일' },
  { value: 'thursday', label: '목요일' },
  { value: 'friday', label: '금요일' },
  { value: 'saturday', label: '토요일' },
  { value: 'sunday', label: '일요일' },
];

/** 중요도별 세로선 색상 */
const PRIORITY_BORDER_COLOR: Record<Priority, string> = {
  urgent_important: '#EF4444',
  not_urgent_important: '#22C55E',
  urgent_not_important: '#3B82F6',
  not_urgent_not_important: '#9CA3AF',
};

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'urgent_important', label: '🔴 중요+긴급' },
  { value: 'not_urgent_important', label: '🟢 중요+비긴급' },
  { value: 'urgent_not_important', label: '🔵 비중요+긴급' },
  { value: 'not_urgent_not_important', label: '⚪ 비중요+비긴급' },
];

function isValidTimeFormat(time: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function RoutineEditorModal({
  isOpen,
  editingBlock,
  onSave,
  onCancel,
  categoryColorMap,
  onCategoryColorChange,
  allCategories = [],
}: RoutineEditorModalProps) {
  const [title, setTitle] = useState('');
  const [day, setDay] = useState<DayValue>('monday');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<Priority>('not_urgent_important');
  const [color, setColor] = useState('#6B7280');
  const [required, setRequired] = useState(false);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  // 카테고리 편집 모드: 'select'(버튼 선택) | 'input'(텍스트 직접 입력)
  const [categoryEditMode, setCategoryEditMode] = useState<'select' | 'input'>('select');
  // 카테고리 색상 (로컬 미리보기용)
  const [localCategoryColor, setLocalCategoryColor] = useState('');

  useEffect(() => {
    if (editingBlock) {
      const { block, dayValue } = editingBlock;
      setTitle(block.title);
      setDay(dayValue);
      setStartTime(block.start);
      setEndTime(block.end);
      setCategory(block.category || '');
      setPriority(block.priority);
      setColor(block.color);
      setRequired(block.required);
      setNotes(block.notes || '');
      // 카테고리 색상 초기값: 커스텀 맵 > 기본 색상
      const cat = block.category || '';
      setLocalCategoryColor(getBadgeColor(cat, categoryColorMap));
    } else {
      setTitle('');
      setDay('monday');
      setStartTime('');
      setEndTime('');
      setCategory('');
      setPriority('not_urgent_important');
      setColor('#6B7280');
      setRequired(false);
      setNotes('');
      setLocalCategoryColor('');
    }
    setCategoryEditMode('select');
    setErrors({});
  }, [editingBlock, categoryColorMap]);

  // 카테고리 변경 시 색상도 즉시 갱신
  function handleCategoryChange(val: string) {
    setCategory(val);
    setLocalCategoryColor(getBadgeColor(val.trim(), categoryColorMap));
  }

  // 카테고리 버튼 선택
  function handleCategorySelect(cat: string) {
    setCategory(cat);
    setLocalCategoryColor(getBadgeColor(cat, categoryColorMap));
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!title.trim()) newErrors.title = '제목을 입력해주세요';
    if (!startTime.trim()) newErrors.startTime = '시작 시간을 입력해주세요';
    else if (!isValidTimeFormat(startTime)) newErrors.startTime = '시간 형식이 올바르지 않습니다 (HH:mm)';
    if (!endTime.trim()) newErrors.endTime = '종료 시간을 입력해주세요';
    else if (!isValidTimeFormat(endTime)) newErrors.endTime = '시간 형식이 올바르지 않습니다 (HH:mm)';
    if (startTime.trim() && endTime.trim() && isValidTimeFormat(startTime) && isValidTimeFormat(endTime)) {
      if (timeToMinutes(endTime) <= timeToMinutes(startTime))
        newErrors.time = '종료 시간은 시작 시간보다 늦어야 합니다';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSave() {
    if (!validate()) return;

    const trimmedCategory = category.trim();

    // 카테고리가 있고 색상이 있으면 항상 전역 저장 (변경 여부 무관)
    if (trimmedCategory && localCategoryColor && onCategoryColorChange) {
      onCategoryColorChange(trimmedCategory, localCategoryColor);
    }

    const blockData: Omit<Block, 'id' | 'duration_minutes'> = {
      title: title.trim(),
      start: startTime,
      end: endTime,
      category: trimmedCategory || undefined,
      priority,
      color: localCategoryColor || color,
      required,
      notes: notes.trim() || undefined,
    };

    const originalDayValue = editingBlock ? editingBlock.dayValue : undefined;
    onSave(day, blockData, originalDayValue);
  }

  if (!isOpen) return null;

  const isEditMode = editingBlock !== null;
  const priorityColor = PRIORITY_BORDER_COLOR[priority];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {isEditMode ? '루틴 블록 수정' : '새 루틴 블록 추가'}
          </h2>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="루틴 제목을 입력하세요"
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* 요일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">요일</label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value as DayValue)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DAY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* 시간 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                시작 시간 <span className="text-red-500">*</span>
              </label>
              <input
                type="time" step="300" value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.startTime ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.startTime && <p className="text-xs text-red-500 mt-1">{errors.startTime}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                종료 시간 <span className="text-red-500">*</span>
              </label>
              <input
                type="time" step="300" value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.endTime ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.endTime && <p className="text-xs text-red-500 mt-1">{errors.endTime}</p>}
            </div>
          </div>
          {errors.time && <p className="text-xs text-red-500">{errors.time}</p>}

          {/* 카테고리 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">카테고리</label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setCategoryEditMode('select')}
                  className={`px-2 py-0.5 text-xs rounded transition-colors ${categoryEditMode === 'select' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  선택
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryEditMode('input')}
                  className={`px-2 py-0.5 text-xs rounded transition-colors ${categoryEditMode === 'input' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  직접 입력
                </button>
              </div>
            </div>

            {categoryEditMode === 'select' ? (
              /* 버튼 선택 모드 */
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {/* 기본 카테고리 버튼 */}
                  {DEFAULT_CATEGORIES.map(cat => {
                    const isSelected = category === cat;
                    const catColor = getBadgeColor(cat, categoryColorMap);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleCategorySelect(cat)}
                        className={`px-3 py-1 text-xs rounded-full border-2 transition-all font-medium ${
                          isSelected
                            ? 'text-white border-transparent'
                            : 'text-gray-600 border-gray-200 bg-white hover:border-gray-400'
                        }`}
                        style={isSelected ? { backgroundColor: catColor, borderColor: catColor } : {}}
                      >
                        {getCategoryDisplayName(cat) || cat}
                      </button>
                    );
                  })}
                  {/* 루틴에 있는 추가 카테고리 */}
                  {allCategories
                    .filter(cat => !DEFAULT_CATEGORIES.includes(cat))
                    .map(cat => {
                      const isSelected = category === cat;
                      const catColor = getBadgeColor(cat, categoryColorMap);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleCategorySelect(cat)}
                          className={`px-3 py-1 text-xs rounded-full border-2 transition-all font-medium ${
                            isSelected
                              ? 'text-white border-transparent'
                              : 'text-gray-600 border-gray-200 bg-white hover:border-gray-400'
                          }`}
                          style={isSelected ? { backgroundColor: catColor, borderColor: catColor } : {}}
                        >
                          {getCategoryDisplayName(cat) || cat}
                        </button>
                      );
                    })}
                  {/* 선택 해제 */}
                  {category && (
                    <button
                      type="button"
                      onClick={() => handleCategorySelect('')}
                      className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600 rounded-full border border-dashed border-gray-300"
                    >
                      해제
                    </button>
                  )}
                </div>
                {/* 선택된 카테고리 색상 편집 */}
                {category && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-gray-500">배지 색상:</span>
                    <input
                      type="color"
                      value={localCategoryColor || '#6B7280'}
                      onChange={(e) => setLocalCategoryColor(e.target.value)}
                      className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0.5"
                      title="카테고리 배지 색상 (저장 시 이 카테고리 전체에 적용)"
                    />
                    <span
                      className="px-2 py-0.5 text-xs text-white rounded-full font-medium"
                      style={{ backgroundColor: localCategoryColor || '#6B7280' }}
                    >
                      {getCategoryDisplayName(category) || category}
                    </span>
                    <span className="text-xs text-gray-400">미리보기</span>
                  </div>
                )}
              </div>
            ) : (
              /* 직접 입력 모드 */
              <div className="space-y-2">
                <CategoryCombobox
                  value={category}
                  allCategories={allCategories}
                  onChange={handleCategoryChange}
                />
                {category && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">배지 색상:</span>
                    <input
                      type="color"
                      value={localCategoryColor || '#6B7280'}
                      onChange={(e) => setLocalCategoryColor(e.target.value)}
                      className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0.5"
                    />
                    <span
                      className="px-2 py-0.5 text-xs text-white rounded-full font-medium"
                      style={{ backgroundColor: localCategoryColor || '#6B7280' }}
                    >
                      {getCategoryDisplayName(category) || category}
                    </span>
                  </div>
                )}
                <p className="text-xs text-gray-400">
                  배지 색상은 저장 시 이 카테고리의 모든 일정에 적용됩니다
                </p>
              </div>
            )}
          </div>

          {/* 중요도 + 색상 프리뷰 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">중요도</label>
            <div className="flex items-center gap-2">
              {/* 현재 중요도 색상 프리뷰 (왼쪽 세로선) */}
              <div
                className="w-1 h-8 rounded-full flex-shrink-0"
                style={{ backgroundColor: priorityColor }}
              />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              세로선 색상: 빨강(중요+긴급) / 초록(중요+비긴급) / 파랑(비중요+긴급) / 회색(비중요+비긴급)
            </p>
          </div>

          {/* 필수 여부 */}
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="required-toggle"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 cursor-pointer mt-0.5"
            />
            <div>
              <label htmlFor="required-toggle" className="text-sm font-medium text-gray-700 cursor-pointer">
                필수 루틴 (매주 반복)
              </label>
              <p className="text-xs text-gray-400 mt-0.5">
                체크 시 매주 표시 · 미체크 시 이번 주에만 표시 (일회성)
              </p>
            </div>
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="추가 메모를 입력하세요"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            {isEditMode ? '수정' : '추가'}
          </button>
        </div>
      </div>
    </div>
  );
}
