import { formatDate } from '../utils/weekUtils';

interface WeekNavigationProps {
  selectedWeekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}

/**
 * 주간 네비게이션: 현재 주 날짜 범위 표시, 이전/다음/오늘 버튼
 */
export default function WeekNavigation({
  selectedWeekStart,
  onPrevWeek,
  onNextWeek,
  onToday,
}: WeekNavigationProps) {
  const weekEnd = new Date(selectedWeekStart);
  weekEnd.setDate(selectedWeekStart.getDate() + 6);

  const rangeText = `${formatDate(selectedWeekStart)} ~ ${formatDate(weekEnd)}`;

  return (
    <nav className="flex items-center justify-center gap-3 px-4 py-2 bg-gray-50 border-b border-gray-200">
      <button
        type="button"
        onClick={onPrevWeek}
        className="px-2 py-1 text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
        aria-label="이전 주"
      >
        ←
      </button>

      <span className="text-sm font-medium text-gray-800 min-w-[200px] text-center">
        {rangeText}
      </span>

      <button
        type="button"
        onClick={onNextWeek}
        className="px-2 py-1 text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
        aria-label="다음 주"
      >
        →
      </button>

      <button
        type="button"
        onClick={onToday}
        className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
      >
        오늘
      </button>
    </nav>
  );
}
