import { useRef, useEffect, useState, useMemo } from 'react';
import type { DayData, DayValue, Block, CompletionRecords, Priority } from '../types';
import { formatDate } from '../utils/weekUtils';
import { calculateBlockLayouts, type BlockLayout } from '../utils/overlapCalculator';
import { BlockPopover } from './BlockPopover';

// --- 상수 ---
export const HOUR_HEIGHT = 60; // 1시간 = 60px
export const TOTAL_HEIGHT = HOUR_HEIGHT * 24; // 1440px
export const MIN_COLUMN_WIDTH = 80; // 최소 컬럼 너비 (px)

// --- Props 인터페이스 ---
export interface TimelineGridProps {
  days: DayData[];
  weekDates: Date[];
  completionRecords: CompletionRecords;
  onToggleCompletion: (date: string, blockId: string) => void;
  onEditBlock: (dayValue: DayValue, block: Block) => void;
  onDeleteBlock: (dayValue: DayValue, blockId: string) => void;
  onAddBlock: (dayValue: DayValue) => void;
  onUpdateBlock: (dayValue: DayValue, blockId: string, updates: Partial<Block>) => void;
}

// --- 내부 컴포넌트: TimeLabels ---
/**
 * 좌측 24시간 시간 라벨 (00:00~23:00)
 * 각 라벨의 top 위치 = index × HOUR_HEIGHT
 */
function TimeLabels() {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="relative w-14 flex-shrink-0" style={{ height: TOTAL_HEIGHT }}>
      {hours.map((hour) => (
        <div
          key={hour}
          className="absolute left-0 right-0 text-xs text-gray-500 text-right pr-2 -translate-y-1/2"
          style={{ top: hour * HOUR_HEIGHT }}
        >
          {String(hour).padStart(2, '0')}:00
        </div>
      ))}
    </div>
  );
}

// --- 내부 컴포넌트: DayHeader ---
/**
 * 상단 고정 요일 헤더 (월~일 + 날짜)
 * sticky position으로 스크롤 시에도 상단 고정
 */
function DayHeader({ days, weekDates }: { days: DayData[]; weekDates: Date[] }) {
  return (
    <div className="sticky top-0 z-20 bg-white border-b border-gray-200 flex">
      {/* 시간 라벨 영역 빈 공간 */}
      <div className="w-14 flex-shrink-0" />
      {/* 요일 헤더들 */}
      <div className="flex flex-1">
        {days.map((dayData, index) => {
          const date = weekDates[index];
          const month = date ? String(date.getMonth() + 1).padStart(2, '0') : '';
          const day = date ? String(date.getDate()).padStart(2, '0') : '';

          return (
            <div
              key={dayData.day}
              className="flex-1 text-center py-2 border-l border-gray-100 first:border-l-0"
              style={{ minWidth: MIN_COLUMN_WIDTH }}
            >
              <div className="font-semibold text-sm text-gray-700">
                {dayData.label}
              </div>
              <div className="text-xs text-gray-500">
                {month}/{day}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- 내부 컴포넌트: GuideLines ---
/**
 * 30분 단위 Guide_Line 배경 수평선 렌더링
 * 48개의 수평선 (24시간 × 2)
 */
function GuideLines() {
  const lines = Array.from({ length: 48 }, (_, i) => i);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {lines.map((i) => (
        <div
          key={i}
          className={`absolute left-0 right-0 border-b ${
            i % 2 === 0 ? 'border-gray-200' : 'border-gray-100'
          }`}
          style={{ top: i * (HOUR_HEIGHT / 2) }}
        />
      ))}
    </div>
  );
}

// --- 내부 컴포넌트: DayColumnArea ---
/**
 * 각 요일 컬럼 영역
 * overlapCalculator를 호출하여 BlockLayout을 계산하고 블록을 렌더링한다.
 * hover/tap 시 BlockPopover를 표시하여 인라인 편집(카테고리, 중요도)을 지원한다.
 */
function DayColumnArea({
  dayData,
  date,
  completionRecords,
  onToggleCompletion: _onToggleCompletion,
  onEditBlock,
  onDeleteBlock,
  onAddBlock,
  onUpdateBlock,
  allCategories,
}: {
  dayData: DayData;
  date: Date;
  completionRecords: CompletionRecords;
  onToggleCompletion: (date: string, blockId: string) => void;
  onEditBlock: (dayValue: DayValue, block: Block) => void;
  onDeleteBlock: (dayValue: DayValue, blockId: string) => void;
  onAddBlock: (dayValue: DayValue) => void;
  onUpdateBlock: (dayValue: DayValue, blockId: string, updates: Partial<Block>) => void;
  allCategories: string[];
}) {
  const dateStr = formatDate(date);
  const dayCompletionRecords = completionRecords[dateStr];

  // BlockPopover 상태: 현재 표시 중인 블록과 앵커 위치
  const [popoverBlock, setPopoverBlock] = useState<Block | null>(null);
  const [popoverAnchorRect, setPopoverAnchorRect] = useState<DOMRect | null>(null);

  // overlapCalculator로 블록 레이아웃 계산
  const layouts: BlockLayout[] = calculateBlockLayouts(dayData.blocks, TOTAL_HEIGHT);

  // 블록 클릭/탭 시 BlockPopover 표시
  function handleBlockClick(block: Block, event: React.MouseEvent<HTMLDivElement>) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setPopoverBlock(block);
    setPopoverAnchorRect(rect);
  }

  // BlockPopover 닫기
  function handlePopoverClose() {
    setPopoverBlock(null);
    setPopoverAnchorRect(null);
  }

  // BlockPopover에서 수정 모달 진입
  function handlePopoverEdit() {
    if (popoverBlock) {
      onEditBlock(dayData.day, popoverBlock);
      handlePopoverClose();
    }
  }

  // BlockPopover에서 삭제
  function handlePopoverDelete() {
    if (popoverBlock) {
      onDeleteBlock(dayData.day, popoverBlock.id);
      handlePopoverClose();
    }
  }

  // BlockPopover에서 카테고리 인라인 편집 → updateBlock → Storage_Manager 저장
  function handlePopoverUpdateCategory(category: string) {
    if (popoverBlock) {
      onUpdateBlock(dayData.day, popoverBlock.id, { category });
    }
  }

  // BlockPopover에서 중요도 인라인 편집 → updateBlock → Storage_Manager 저장
  function handlePopoverUpdatePriority(priority: Priority) {
    if (popoverBlock) {
      onUpdateBlock(dayData.day, popoverBlock.id, { priority });
    }
  }

  return (
    <div
      className="relative flex-1 border-l border-gray-100 first:border-l-0"
      style={{ minWidth: MIN_COLUMN_WIDTH, height: TOTAL_HEIGHT }}
    >
      {/* 블록 렌더링 */}
      {dayData.blocks.map((block, index) => {
        const layout = layouts[index];
        if (!layout) return null;

        const isCompleted = dayCompletionRecords?.[block.id] ?? false;

        return (
          <div
            key={block.id}
            className="absolute rounded px-1 py-0.5 text-xs overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border border-white/30"
            style={{
              top: layout.top,
              height: layout.height,
              width: layout.width,
              left: layout.left,
              backgroundColor: block.color || '#3B82F6',
              opacity: isCompleted ? 0.5 : 0.85,
            }}
            title={`${block.title} (${block.start}~${block.end})`}
            onClick={(e) => handleBlockClick(block, e)}
          >
            <div className="text-white font-medium truncate leading-tight">
              {block.title}
            </div>
            {layout.height >= 40 && (
              <>
                <div className="text-white/80 truncate text-[10px]">
                  {block.start}~{block.end}
                </div>
                {block.category && (
                  <div className="text-white/70 truncate text-[10px]">
                    {block.category}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {/* BlockPopover - 블록 클릭/탭 시 상세 정보 및 인라인 편집 */}
      {popoverBlock && popoverAnchorRect && (
        <BlockPopover
          block={popoverBlock}
          dayValue={dayData.day}
          anchorRect={popoverAnchorRect}
          onEdit={handlePopoverEdit}
          onDelete={handlePopoverDelete}
          onUpdateCategory={handlePopoverUpdateCategory}
          onUpdatePriority={handlePopoverUpdatePriority}
          allCategories={allCategories}
          onClose={handlePopoverClose}
        />
      )}

      {/* 블록 추가 버튼 (하단) */}
      <button
        onClick={() => onAddBlock(dayData.day)}
        className="absolute bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center transition-colors"
        aria-label={`${dayData.label}에 블록 추가`}
      >
        +
      </button>
    </div>
  );
}

// --- 메인 컴포넌트: TimelineGrid ---
/**
 * 24시간 시간축 기반 주간 그리드 레이아웃의 최상위 컨테이너
 * - 좌측에 TimeLabels(00:00~23:00)
 * - 상단에 DayHeader(월~일) sticky 고정
 * - 배경에 30분 단위 Guide_Line 수평선
 * - 초기 로드 시 06:00 위치로 스크롤
 * - 컬럼 최소 80px, 부족 시 가로 스크롤
 */
export function TimelineGrid({
  days,
  weekDates,
  completionRecords,
  onToggleCompletion,
  onEditBlock,
  onDeleteBlock,
  onAddBlock,
  onUpdateBlock,
}: TimelineGridProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 초기 로드 시 06:00 위치로 스크롤
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollTo06 = 6 * HOUR_HEIGHT; // 06:00 = 360px
      scrollContainerRef.current.scrollTop = scrollTo06;
    }
  }, []);

  // 모든 블록에서 카테고리 수집 (중복 없이, 정렬)
  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    days.forEach(day => {
      day.blocks.forEach(block => {
        if (block.category) categories.add(block.category);
      });
    });
    return Array.from(categories).sort();
  }, [days]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* 상단 고정 헤더 */}
      <DayHeader days={days} weekDates={weekDates} />

      {/* 스크롤 가능한 타임라인 영역 */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-auto"
      >
        <div className="flex" style={{ minWidth: `${MIN_COLUMN_WIDTH * 7 + 56}px` }}>
          {/* 좌측 시간 라벨 */}
          <TimeLabels />

          {/* 요일 컬럼 영역 */}
          <div className="relative flex flex-1">
            {/* 배경 가이드라인 */}
            <GuideLines />

            {/* 각 요일 컬럼 */}
            {days.map((dayData, index) => (
              <DayColumnArea
                key={dayData.day}
                dayData={dayData}
                date={weekDates[index]}
                completionRecords={completionRecords}
                onToggleCompletion={onToggleCompletion}
                onEditBlock={onEditBlock}
                onDeleteBlock={onDeleteBlock}
                onAddBlock={onAddBlock}
                onUpdateBlock={onUpdateBlock}
                allCategories={allCategories}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
