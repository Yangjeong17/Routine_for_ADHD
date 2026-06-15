import { useRef, useEffect, useState } from 'react';
import type { DayData, DayValue, Block, CompletionRecords, CategoryColorMap } from '../types';
import { formatDate } from '../utils/weekUtils';
import { calculateBlockLayouts, type BlockLayout } from '../utils/overlapCalculator';
import { CurrentTimeIndicator } from './CurrentTimeIndicator';
import { TimelineBlock } from './TimelineBlock';

export const HOUR_HEIGHT = 60; // 1시간 = 60px
export const TOTAL_HEIGHT = HOUR_HEIGHT * 24; // 1440px
export const MIN_COLUMN_WIDTH = 80; // 최소 컬럼 너비 (px)

// --- Props 인터페이스 ---
export interface TimelineGridProps {
  days: DayData[];
  weekDates: Date[];
  selectedWeekStart: string;
  completionRecords: CompletionRecords;
  categoryColorMap?: CategoryColorMap;
  onToggleCompletion: (date: string, blockId: string) => void;
  onEditBlock: (dayValue: DayValue, block: Block) => void;
  onDeleteBlock: (dayValue: DayValue, blockId: string) => void;
  onAddBlock: (dayValue: DayValue) => void;
}

// --- 내부 컴포넌트: TimeLabels ---
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
 * 상단 고정 요일 헤더.
 * scrollLeft prop을 받아 본문 스크롤과 가로 위치를 동기화한다.
 */
function DayHeader({
  days,
  weekDates,
  scrollLeft,
  headerRef,
}: {
  days: DayData[];
  weekDates: Date[];
  scrollLeft: number;
  headerRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="z-20 bg-white border-b border-gray-200 flex-shrink-0 overflow-hidden">
      {/* scrollLeft를 직접 적용하여 본문과 동기화 */}
      <div
        ref={headerRef}
        className="flex"
        style={{
          minWidth: `${MIN_COLUMN_WIDTH * 7 + 56}px`,
          transform: `translateX(-${scrollLeft}px)`,
        }}
      >
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
                <div className="font-semibold text-sm text-gray-700">{dayData.label}</div>
                <div className="text-xs text-gray-500">{month}/{day}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// --- 내부 컴포넌트: GuideLines ---
function GuideLines() {
  const lines = Array.from({ length: 48 }, (_, i) => i);
  return (
    <div className="absolute inset-0 pointer-events-none">
      {lines.map((i) => (
        <div
          key={i}
          className={`absolute left-0 right-0 border-b ${i % 2 === 0 ? 'border-gray-200' : 'border-gray-100'}`}
          style={{ top: i * (HOUR_HEIGHT / 2) }}
        />
      ))}
    </div>
  );
}

// --- 현재 KST 시간(분) 계산 ---
function getKSTMinutes(): number {
  const now = new Date();
  return ((now.getUTCHours() * 60 + now.getUTCMinutes() + 9 * 60) % 1440 + 1440) % 1440;
}

// --- 내부 컴포넌트: DayColumnArea ---
function DayColumnArea({
  dayData,
  date,
  completionRecords,
  categoryColorMap,
  selectedWeekStart,
  onToggleCompletion,
  onEditBlock,
  onDeleteBlock,
}: {
  dayData: DayData;
  date: Date;
  completionRecords: CompletionRecords;
  categoryColorMap?: CategoryColorMap;
  selectedWeekStart: string;
  onToggleCompletion: (date: string, blockId: string) => void;
  onEditBlock: (dayValue: DayValue, block: Block) => void;
  onDeleteBlock: (dayValue: DayValue, blockId: string) => void;
}) {
  const dateStr = formatDate(date);
  const dayCompletionRecords = completionRecords[dateStr];

  // 현재 주에 표시할 블록 필터링
  const visibleBlocks = dayData.blocks.filter(block => {
    if (block.required) return true;
    if (!block.weekStart) return true;
    return block.weekStart === selectedWeekStart;
  });

  const layouts: BlockLayout[] = calculateBlockLayouts(visibleBlocks, TOTAL_HEIGHT);

  return (
    <div
      className="relative flex-1 border-l border-gray-100 first:border-l-0"
      style={{ minWidth: MIN_COLUMN_WIDTH, height: TOTAL_HEIGHT }}
    >
      {visibleBlocks.map((block, index) => {
        const layout = layouts[index];
        if (!layout) return null;

        const isCompleted = dayCompletionRecords?.[block.id] ?? false;
        const nowMin = getKSTMinutes();
        const [sh, sm] = block.start.split(':').map(Number);
        const [eh, em] = block.end.split(':').map(Number);
        const isCurrentBlock = nowMin >= sh * 60 + sm && nowMin < eh * 60 + em;

        return (
          <TimelineBlock
            key={block.id}
            block={block}
            dayValue={dayData.day}
            top={layout.top}
            height={layout.height}
            width={layout.width}
            left={layout.left}
            isCompleted={isCompleted}
            isCurrentBlock={isCurrentBlock}
            categoryColorMap={categoryColorMap}
            onToggleCompletion={() => onToggleCompletion(dateStr, block.id)}
            onEditBlock={onEditBlock}
            onDeleteBlock={() => onDeleteBlock(dayData.day, block.id)}
          />
        );
      })}
    </div>
  );
}

// --- 메인 컴포넌트: TimelineGrid ---
export function TimelineGrid({
  days,
  weekDates,
  selectedWeekStart,
  completionRecords,
  categoryColorMap,
  onToggleCompletion,
  onEditBlock,
  onDeleteBlock,
}: TimelineGridProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);

  // 초기 로드 시 06:00 위치로 스크롤
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 6 * HOUR_HEIGHT;
    }
  }, []);

  // 가로 스크롤 시 헤더 동기화
  function handleScroll() {
    if (scrollContainerRef.current) {
      setScrollLeft(scrollContainerRef.current.scrollLeft);
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* 상단 고정 헤더 - 가로 스크롤 동기화 */}
      <DayHeader
        days={days}
        weekDates={weekDates}
        scrollLeft={scrollLeft}
        headerRef={headerRef}
      />

      {/* 스크롤 가능한 타임라인 영역 */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-auto"
        onScroll={handleScroll}
      >
        <div className="flex" style={{ minWidth: `${MIN_COLUMN_WIDTH * 7 + 56}px` }}>
          <TimeLabels />
          <div className="relative flex flex-1">
            <GuideLines />
            <CurrentTimeIndicator totalHeight={TOTAL_HEIGHT} />
            {days.map((dayData, index) => (
              <DayColumnArea
                key={dayData.day}
                dayData={dayData}
                date={weekDates[index]}
                completionRecords={completionRecords}
                categoryColorMap={categoryColorMap}
                selectedWeekStart={selectedWeekStart}
                onToggleCompletion={onToggleCompletion}
                onEditBlock={onEditBlock}
                onDeleteBlock={onDeleteBlock}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}