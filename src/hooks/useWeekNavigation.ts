import { useState, useCallback } from 'react';
import { getMonday, addWeeks } from '../utils/weekUtils';

/**
 * 주간 네비게이션 커스텀 훅
 * - selectedWeekStart: 현재 표시 중인 주의 월요일
 * - goToPrevWeek: 이전 주로 이동
 * - goToNextWeek: 다음 주로 이동
 * - goToToday: 현재 주의 월요일로 이동
 */
export function useWeekNavigation() {
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(
    () => getMonday(new Date())
  );

  const goToPrevWeek = useCallback(() => {
    setSelectedWeekStart((prev) => addWeeks(prev, -1));
  }, []);

  const goToNextWeek = useCallback(() => {
    setSelectedWeekStart((prev) => addWeeks(prev, 1));
  }, []);

  const goToToday = useCallback(() => {
    setSelectedWeekStart(getMonday(new Date()));
  }, []);

  return {
    selectedWeekStart,
    goToPrevWeek,
    goToNextWeek,
    goToToday,
  };
}
