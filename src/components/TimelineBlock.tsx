import type { Block, DayValue, Priority, CategoryColorMap } from '../types';
import { getCategoryDisplayName, getBadgeColor } from '../utils/categoryUtils';

export interface TimelineBlockProps {
  block: Block;
  dayValue: DayValue;
  top: number | string;
  height: number | string;
  width: string;
  left: string;
  isCompleted: boolean;
  isCurrentBlock: boolean;
  categoryColorMap?: CategoryColorMap;
  onToggleCompletion: () => void;
  /** 펜 아이콘 클릭 → 수정 모달 열기 */
  onEditBlock: (dayValue: DayValue, block: Block) => void;
  /** 삭제 버튼 클릭 */
  onDeleteBlock: () => void;
}

// 중요도 왼쪽 세로선 색상 (아이젠하워 4단계)
const priorityBorderColor: Record<Priority, string> = {
  urgent_important:         '#EF4444', // 빨강
  not_urgent_important:     '#22C55E', // 초록
  urgent_not_important:     '#3B82F6', // 파랑
  not_urgent_not_important: '#9CA3AF', // 회색
};

/**
 * TimelineBlock
 * - 카드 클릭 → 완료 토글
 * - 펜 아이콘 클릭 → 수정 모달
 * - X 버튼 클릭 → 삭제
 */
export function TimelineBlock({
  block,
  dayValue,
  top,
  height,
  width,
  left,
  isCompleted,
  isCurrentBlock,
  categoryColorMap,
  onToggleCompletion,
  onEditBlock,
  onDeleteBlock,
}: TimelineBlockProps) {
  const heightNum = typeof height === 'number' ? height : parseFloat(height);
  const isTall   = heightNum >= 24;
  const showTime = heightNum >= 40;

  const cardBg     = isCompleted ? '#636363' : '#F5F5F5';
  const cardBorder = isCompleted ? '#4B4B4B' : '#ECECEC';
  const titleColor = isCompleted ? '#C8C8C8' : '#111111';
  const timeColor  = isCompleted ? '#A0A0A0' : '#555555';
  const badgeBg    = isCompleted ? '#4A4A4A' : getBadgeColor(block.category, categoryColorMap);
  const borderLeft = isCompleted
    ? '#5A5A5A'
    : (priorityBorderColor[block.priority] ?? '#9CA3AF');

  const displayCategory = getCategoryDisplayName(block.category);

  return (
    <div
      aria-label={`${block.title} 블록`}
      className="absolute cursor-pointer group transition-shadow hover:shadow-md"
      style={{
        top:    typeof top    === 'number' ? `${top}px`    : top,
        height: typeof height === 'number' ? `${height}px` : height,
        width,
        left,
        borderRadius: '8px',
        overflow: 'hidden',
        border: `1px solid ${cardBorder}`,
        backgroundColor: cardBg,
        display: 'flex',
        flexDirection: 'row',
        zIndex: isCurrentBlock ? 10 : 1,
      }}
      onClick={onToggleCompletion}
    >
      {/* 중요도 왼쪽 세로선 */}
      <div style={{ width: '4px', flexShrink: 0, backgroundColor: borderLeft, borderRadius: '8px 0 0 8px' }} />

      {/* 카드 내용 */}
      <div className="flex flex-col justify-start flex-1 min-w-0" style={{ padding: '4px 6px' }}>
        {/* 상단: 카테고리 배지 + 제목 + 액션 버튼 */}
        <div className="flex items-center gap-1 min-w-0">
          {displayCategory && isTall && (
            <span
              className="flex-shrink-0 text-white font-bold"
              style={{
                backgroundColor: badgeBg,
                borderRadius: '6px',
                fontSize: '9px',
                padding: '2px 5px',
                lineHeight: '1.4',
                whiteSpace: 'nowrap',
              }}
            >
              {displayCategory}
            </span>
          )}
          <span
            className="text-xs font-semibold truncate flex-1"
            style={{ color: titleColor, textDecoration: isCompleted ? 'line-through' : 'none' }}
          >
            {block.title}
          </span>

          {/* 펜 아이콘 - 수정 모달 열기 */}
          <button
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/10"
            onClick={(e) => { e.stopPropagation(); onEditBlock(dayValue, block); }}
            aria-label={`${block.title} 수정`}
            title="수정"
          >
            <svg className="w-3 h-3" style={{ color: isCompleted ? '#C8C8C8' : '#555' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>

          {/* 삭제 버튼 */}
          <button
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-100/60"
            onClick={(e) => { e.stopPropagation(); onDeleteBlock(); }}
            aria-label={`${block.title} 삭제`}
            title="삭제"
          >
            <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {showTime && (
          <span className="text-[10px] truncate mt-0.5" style={{ color: timeColor }}>
            {block.start} - {block.end}
          </span>
        )}
      </div>
    </div>
  );
}
