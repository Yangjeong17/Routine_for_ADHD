import type { Block, DayValue, Priority } from '../types';

export interface TimelineBlockProps {
  block: Block;
  dayValue: DayValue;
  top: number;        // 계산된 top 위치 (px)
  height: number;     // 계산된 높이 (px)
  width: string;      // 겹침 계산된 너비 (예: "50%")
  left: string;       // 겹침 계산된 좌측 오프셋 (예: "50%")
  isCompleted: boolean;
  onToggleCompletion: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateCategory: (category: string) => void;
  onUpdatePriority: (priority: Priority) => void;
  allCategories: string[];
}

/** 중요도 배지 스타일 */
const priorityStyles: Record<Priority, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

const priorityLabel: Record<Priority, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

/**
 * width 문자열(예: "50%", "33.333%")을 파싱하여
 * 부모 컨테이너 기준 실제 px 너비를 추정한다.
 * 80px 미만 여부 판단에 사용 (컬럼 최소 너비 80px 기준).
 */
function isNarrowBlock(width: string): boolean {
  // width가 퍼센트 값인 경우, 컬럼 최소 너비 80px 기준으로 판단
  // 예: "50%" → 80 * 0.5 = 40px < 80px → narrow
  // 예: "100%" → 80 * 1.0 = 80px → not narrow
  const match = width.match(/^([\d.]+)%$/);
  if (!match) return false;
  const percent = parseFloat(match[1]);
  // 컬럼 최소 너비 80px 기준으로 실제 렌더링 너비 추정
  const estimatedWidth = (percent / 100) * 80;
  return estimatedWidth < 80;
}

/**
 * TimelineBlock - 시간축 위에 배치되는 개별 루틴 블록
 *
 * - position: absolute로 top/height/width/left를 props로 받아 배치
 * - block.color를 배경색으로 적용 (opacity 조절하여 텍스트 가독성 확보)
 * - 높이 ≥ 40px: 제목, 시간, 카테고리, 중요도 모두 표시
 * - 높이 < 40px: 제목만 표시
 * - 짧은 블록(duration < 20분): 상하 6px Hit_Area 확장
 * - 너비 < 80px 시 제목만 표시
 */
export function TimelineBlock({
  block,
  top,
  height,
  width,
  left,
  isCompleted,
  onEdit,
  onDelete,
}: TimelineBlockProps) {
  const isShortBlock = block.duration_minutes < 20;
  const isTall = height >= 40;
  const isNarrow = isNarrowBlock(width);

  // 높이 ≥ 40px이고 너비가 충분하면 전체 정보 표시
  const showFullInfo = isTall && !isNarrow;

  return (
    <div
      className={`absolute rounded-md overflow-hidden cursor-pointer group transition-shadow hover:shadow-md ${
        isCompleted ? 'opacity-50' : ''
      }`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        width,
        left,
        backgroundColor: block.color,
        opacity: isCompleted ? 0.5 : 0.85,
        // 짧은 블록: 상하 6px Hit_Area 확장
        ...(isShortBlock && {
          paddingTop: '6px',
          paddingBottom: '6px',
          marginTop: '-6px',
          boxSizing: 'content-box',
        }),
      }}
      aria-label={`${block.title} 블록`}
    >
      {/* 내부 콘텐츠 래퍼 - 배경 위에 반투명 오버레이로 텍스트 가독성 확보 */}
      <div
        className="relative h-full w-full rounded-md px-1.5 py-1 flex flex-col justify-start overflow-hidden"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.4)',
        }}
      >
        {/* 상단: 제목 + 액션 버튼 */}
        <div className="flex items-start gap-0.5 min-w-0">
          <span
            className={`text-xs font-semibold truncate flex-1 text-gray-900 ${
              isCompleted ? 'line-through' : ''
            }`}
          >
            {block.title}
          </span>

          {/* 펜 아이콘 버튼 (수정 모달 진입) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="flex-shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-white/50 transition-opacity"
            aria-label={`${block.title} 수정`}
          >
            <svg
              className="w-3 h-3 text-gray-700"
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
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="flex-shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100/50 transition-opacity"
            aria-label={`${block.title} 삭제`}
          >
            <svg
              className="w-3 h-3 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 높이 ≥ 40px이고 너비 충분: 시간, 카테고리, 중요도 표시 */}
        {showFullInfo && (
          <>
            {/* 시간 */}
            <span className="text-[10px] text-gray-700 truncate mt-0.5">
              {block.start} - {block.end}
            </span>

            {/* 카테고리 */}
            {block.category && (
              <span className="text-[10px] text-gray-600 truncate">
                {block.category}
              </span>
            )}

            {/* 중요도 배지 */}
            <span
              className={`inline-block text-[10px] px-1 py-0.5 rounded mt-0.5 w-fit ${
                priorityStyles[block.priority]
              }`}
            >
              {priorityLabel[block.priority]}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
