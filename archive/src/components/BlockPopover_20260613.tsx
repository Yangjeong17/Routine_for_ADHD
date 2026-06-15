import { useEffect, useRef, useState } from 'react';
import type { Block, DayValue, Priority } from '../types';
import { CategoryCombobox } from './CategoryCombobox';
import PriorityDropdown from './PriorityDropdown';

export interface BlockPopoverProps {
  block: Block;
  dayValue: DayValue;
  anchorRect: DOMRect;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateCategory: (category: string) => void;
  onUpdatePriority: (priority: Priority) => void;
  allCategories: string[];
  onClose: () => void;
}

/**
 * BlockPopover - 짧은/좁은 블록의 상세 정보 팝오버
 * hover(데스크톱) 또는 tap(모바일) 시 표시되며,
 * 시간, 카테고리, 중요도, 메모 등 상세 정보를 보여준다.
 * 펜 아이콘으로 수정 모달 진입, 삭제 버튼 포함.
 * 블록 외부 클릭 시 닫힘.
 */
export function BlockPopover({
  block,
  anchorRect,
  onEdit,
  onDelete,
  onUpdateCategory,
  onUpdatePriority,
  allCategories,
  onClose,
}: BlockPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  // anchorRect 기반으로 팝오버 위치 계산 (위 또는 아래)
  useEffect(() => {
    if (!popoverRef.current) return;

    const popoverHeight = popoverRef.current.offsetHeight;
    const popoverWidth = popoverRef.current.offsetWidth;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // 아래쪽 공간이 충분한지 확인
    const spaceBelow = viewportHeight - anchorRect.bottom;
    const spaceAbove = anchorRect.top;

    let top: number;
    if (spaceBelow >= popoverHeight + 8) {
      // 아래에 배치
      top = anchorRect.bottom + 8;
    } else if (spaceAbove >= popoverHeight + 8) {
      // 위에 배치
      top = anchorRect.top - popoverHeight - 8;
    } else {
      // 공간이 부족하면 아래에 배치 (스크롤 가능)
      top = anchorRect.bottom + 8;
    }

    // 좌측 위치: 앵커 중앙 기준, 뷰포트 벗어나지 않도록 조정
    let left = anchorRect.left + anchorRect.width / 2 - popoverWidth / 2;
    if (left < 8) left = 8;
    if (left + popoverWidth > viewportWidth - 8) {
      left = viewportWidth - popoverWidth - 8;
    }

    setPosition({ top, left });
  }, [anchorRect]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        // select 드롭다운의 옵션 클릭은 팝오버 외부로 판단하지 않음
        // (브라우저 네이티브 select는 document body에 렌더링되어 contains로 감지 불가)
        const target = event.target as HTMLElement;
        if (target.tagName === 'OPTION' || target.tagName === 'SELECT') return;
        onClose();
      }
    }

    // mousedown 대신 click으로 감지 - select onChange가 먼저 처리된 후 닫힘
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  // Escape 키로 닫기
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 중요도 라벨 매핑
  const priorityLabel: Record<Priority, string> = {
    urgent_important: '중요+긴급',
    not_urgent_important: '중요+비긴급',
    urgent_not_important: '비중요+긴급',
    not_urgent_not_important: '비중요+비긴급',
  };

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label={`${block.title} 상세 정보`}
      className="fixed z-[100] w-64 bg-white border border-gray-200 rounded-lg shadow-xl p-3 space-y-2"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {/* 헤더: 제목 + 수정/삭제 버튼 */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 truncate flex-1">
          {block.title}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          {/* 펜 아이콘 - 수정 모달 진입 */}
          <button
            type="button"
            onClick={onEdit}
            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            aria-label="블록 수정"
            title="수정"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
          {/* 삭제 버튼 */}
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            aria-label="블록 삭제"
            title="삭제"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 시간 정보 */}
      <div className="flex items-center gap-1.5 text-xs text-gray-600">
        <svg
          className="w-3.5 h-3.5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>
          {block.start} ~ {block.end} ({block.duration_minutes}분)
        </span>
      </div>

      {/* 카테고리 편집 */}
      <div className="space-y-1">
        <label className="text-xs text-gray-500 font-medium">카테고리</label>
        <CategoryCombobox
          value={block.category || ''}
          allCategories={allCategories}
          onChange={onUpdateCategory}
        />
      </div>

      {/* 중요도 편집 */}
      <div className="space-y-1">
        <label className="text-xs text-gray-500 font-medium">중요도</label>
        <div className="flex items-center gap-2">
          <PriorityDropdown
            value={block.priority}
            onChange={onUpdatePriority}
          />
          <span className="text-xs text-gray-500">
            {priorityLabel[block.priority]}
          </span>
        </div>
      </div>

      {/* 메모 (있을 경우만 표시) */}
      {block.notes && (
        <div className="space-y-1">
          <label className="text-xs text-gray-500 font-medium">메모</label>
          <p className="text-xs text-gray-700 bg-gray-50 rounded p-2 whitespace-pre-wrap break-words">
            {block.notes}
          </p>
        </div>
      )}
    </div>
  );
}
