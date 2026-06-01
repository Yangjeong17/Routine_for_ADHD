import { useState, useEffect } from 'react';
import type { Block, DayValue, Priority } from '../types';

interface RoutineEditorModalProps {
  isOpen: boolean;
  editingBlock: { block: Block; dayValue: DayValue } | null;
  onSave: (
    dayValue: DayValue,
    blockData: Omit<Block, 'id' | 'duration_minutes'>,
    originalDayValue?: DayValue
  ) => void;
  onCancel: () => void;
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

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'high', label: '높음' },
  { value: 'medium', label: '보통' },
  { value: 'low', label: '낮음' },
];

/** HH:mm 형식인지 검증 */
function isValidTimeFormat(time: string): boolean {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(time);
}

/** 시간 문자열을 분 단위로 변환 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * 루틴 편집 모달 - 루틴 블록의 모든 속성을 편집한다.
 * editingBlock이 null이면 추가 모드(빈 폼), 있으면 수정 모드(기존 값 채움).
 */
export function RoutineEditorModal({
  isOpen,
  editingBlock,
  onSave,
  onCancel,
}: RoutineEditorModalProps) {
  // 폼 상태
  const [title, setTitle] = useState('');
  const [day, setDay] = useState<DayValue>('monday');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [color, setColor] = useState('#6B7280');
  const [required, setRequired] = useState(false);
  const [notes, setNotes] = useState('');

  // 오류 상태
  const [errors, setErrors] = useState<FormErrors>({});

  // 10.3: 추가/수정 모드 분기 - editingBlock 변경 시 폼 초기화
  useEffect(() => {
    if (editingBlock) {
      // 수정 모드: 기존 값 채움
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
    } else {
      // 추가 모드: 빈 폼으로 초기화
      setTitle('');
      setDay('monday');
      setStartTime('');
      setEndTime('');
      setCategory('');
      setPriority('medium');
      setColor('#6B7280');
      setRequired(false);
      setNotes('');
    }
    setErrors({});
  }, [editingBlock]);

  // 10.2: 폼 유효성 검증
  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!title.trim()) {
      newErrors.title = '제목을 입력해주세요';
    }

    if (!startTime.trim()) {
      newErrors.startTime = '시작 시간을 입력해주세요';
    } else if (!isValidTimeFormat(startTime)) {
      newErrors.startTime = '시간 형식이 올바르지 않습니다 (HH:mm)';
    }

    if (!endTime.trim()) {
      newErrors.endTime = '종료 시간을 입력해주세요';
    } else if (!isValidTimeFormat(endTime)) {
      newErrors.endTime = '시간 형식이 올바르지 않습니다 (HH:mm)';
    }

    // 시간 유효성: end > start
    if (
      startTime.trim() &&
      endTime.trim() &&
      isValidTimeFormat(startTime) &&
      isValidTimeFormat(endTime)
    ) {
      if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
        newErrors.time = '종료 시간은 시작 시간보다 늦어야 합니다';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // 10.4: 저장 버튼 동작
  function handleSave() {
    if (!validate()) return;

    const blockData: Omit<Block, 'id' | 'duration_minutes'> = {
      title: title.trim(),
      start: startTime,
      end: endTime,
      category: category.trim() || undefined,
      priority,
      color,
      required,
      notes: notes.trim() || undefined,
    };

    // 수정 모드에서 요일이 변경된 경우 원래 요일 전달
    const originalDayValue = editingBlock ? editingBlock.dayValue : undefined;
    onSave(day, blockData, originalDayValue);
  }

  // 10.4: 취소 버튼 동작
  function handleCancel() {
    onCancel();
  }

  // 모달이 닫혀있으면 렌더링하지 않음
  if (!isOpen) return null;

  const isEditMode = editingBlock !== null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleCancel}
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

        {/* 폼 */}
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
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.title && (
              <p className="text-xs text-red-500 mt-1">{errors.title}</p>
            )}
          </div>

          {/* 요일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              요일
            </label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value as DayValue)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DAY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 시작/종료 시간 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                시작 시간 <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                step="300"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.startTime ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startTime && (
                <p className="text-xs text-red-500 mt-1">{errors.startTime}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                종료 시간 <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                step="300"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.endTime ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endTime && (
                <p className="text-xs text-red-500 mt-1">{errors.endTime}</p>
              )}
            </div>
          </div>
          {/* 시간 유효성 오류 */}
          {errors.time && (
            <p className="text-xs text-red-500">{errors.time}</p>
          )}

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              카테고리
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="예: 운동, 공부, 업무"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 중요도 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              중요도
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 색상 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              색상
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <span className="text-sm text-gray-500">{color}</span>
            </div>
          </div>

          {/* 필수 여부 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="required-toggle"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 cursor-pointer"
            />
            <label
              htmlFor="required-toggle"
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              필수 루틴
            </label>
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              메모
            </label>
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
            onClick={handleCancel}
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
