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
  onEditIconClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onDeleteBlock?: () => void;
}

// --- 중요도 왼쪽 세로선 색상 (아이젠하워 매트릭스) ---
const priorityBorderColor: Record<Priority, string> = {
  urgent_important: '#EF4444',
  not_urgent_important: '#22C55E',
  urgent_not_important: '#3B82F6',
  not_urgent_not_important: '#9CA3AF',
};

/**
 * TimelineBlock - 시간축 위에 배치되는 개별 루틴 블록
 *
 * - 카테고리 배지: 영문 카테고리는 한국어로 변환하여 표시
 * - 배지 색상: categoryColorMap(커스텀) > DEFAULT_CATEGORY_COLORS > 기본 회색
 * - 왼쪽 세로선: 중요도 색상 (아이젠하워 4단계)
 * - 완료 시: 카드 전체 #636363 계열로 어두워짐
 * - isCurrentBlock=true 시: z-index 10으로 앞으로 표시
 */
export function TimelineBlock({
  block,
  top,
  height,
  width,
  left,
  isCompleted,
  isCurrentBlock,
  categoryColorMap,
  onToggleCompletion,
  onEditIconClick,
  onDeleteBlock,
}: TimelineBlockProps) {
  const heightNum = typeof height === 'number' ? height : parseFloat(height);
  const isTall = heightNum >= 24;
  const showTime = heightNum >= 40;

  const cardBg = isCompleted ? '#636363' : '#F5F5F5';
  const cardBorder = isCompleted ? '#4B4B4B' : '#ECECEC';
  const titleColor = isCompleted ? '#C8C8C8' : '#111111';
  const timeColor = isCompleted ? '#A0A0A0' : '#555555';
  const badgeBg = isCompleted ? '#4A4A4A' : getBadgeColor(block.category, categoryColorMap);
  const borderLeft = isCompleted ? '#5A5A5A' : (priorityBorderColor[block.priority] ?? '#9CA3AF');

  // 카테고리 한국어 표시명
  const displayCategory = getCategoryDisplayName(block.category);

  return (
    <div
      className="absolute cursor-pointer group transition-shadow hover:shadow-md"
      style={{
        top: typeof top === 'number' ? `${top}px` : top,
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
      title={`클릭하여 완료 토글 | ${block.title} (${block.start}~${block.end})`}
      onClick={onToggleCompletion}
    >
      {/* 중요도 왼쪽 세로선 */}
      <div style={{ width: '4px', flexShrink: 0, backgroundColor: borderLeft, borderRadius: '8px 0 0 8px' }} />

      {/* 카드 내용 */}
      <div className="flex flex-col justify-start flex-1 min-w-0" style={{ padding: '4px 6px' }}>
        {/* 상단: 카테고리 배지 + 제목 + 수정 아이콘 */}
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
          <button
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/10"
            onClick={onEditIconClick}
            aria-label={`${block.title} 수정`}
            title="수정"
          >
            <svg className="w-3 h-3" style={{ color: isCompleted ? '#C8C8C8' : '#555' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          {onDeleteBlock && (
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
          )}
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
