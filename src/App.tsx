import { useState, useMemo } from 'react';
import type { Block, DayValue, RoutineData } from './types';
import { useRoutineState } from './hooks/useRoutineState';
import { useWeekNavigation } from './hooks/useWeekNavigation';
import { getWeekDates } from './utils/weekUtils';
import { parseRoutineJson } from './utils/parser';
import { routineDataToJson } from './utils/prettyPrinter';
import Header from './components/Header';
import WeekNavigation from './components/WeekNavigation';
import { TimelineGrid } from './components/TimelineGrid';
import { RoutineEditorModal } from './components/RoutineEditorModal';
import { ImportPanel } from './components/ImportPanel';
import { ExportJsonPanel } from './components/ExportJsonPanel';
import { OverwriteConfirmDialog } from './components/OverwriteConfirmDialog';

/**
 * 메인 App 컴포넌트
 * - useRoutineState, useWeekNavigation 훅 연결
 * - 모든 컴포넌트 조합
 * - 앱 시작 시 localStorage에서 데이터 로드, 없으면 샘플 데이터 표시
 */
function App() {
  // 루틴 상태 관리 훅
  const {
    routineData,
    completionRecords,
    saveStatus,
    importRoutineData,
    addBlock,
    updateBlock,
    deleteBlock,
    toggleCompletion,
  } = useRoutineState();

  // 주간 네비게이션 훅
  const { selectedWeekStart, goToPrevWeek, goToNextWeek, goToToday } =
    useWeekNavigation();

  // 로컬 UI 상태
  const [isImportPanelOpen, setIsImportPanelOpen] = useState(false);
  const [isExportPanelOpen, setIsExportPanelOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<{
    block: Block;
    dayValue: DayValue;
  } | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isOverwriteDialogOpen, setIsOverwriteDialogOpen] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<RoutineData | null>(
    null
  );

  // --- 핸들러 ---

  /**
   * JSON 가져오기 처리
   * - 파싱 성공 시: 기존 데이터가 있으면 덮어쓰기 확인, 없으면 바로 가져오기
   */
  function handleImport(jsonString: string): { success: boolean; error?: string } {
    const result = parseRoutineJson(jsonString);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    // 기존 데이터가 있으면 덮어쓰기 확인 다이얼로그 표시
    if (routineData) {
      setPendingImportData(result.data);
      setIsOverwriteDialogOpen(true);
      // 패널은 열어둔 채로 다이얼로그 표시 (성공으로 반환하여 패널 닫기)
      return { success: true };
    }

    // 기존 데이터가 없으면 바로 가져오기
    importRoutineData(result.data);
    return { success: true };
  }

  /** 덮어쓰기 확인 */
  function handleOverwriteConfirm() {
    if (pendingImportData) {
      importRoutineData(pendingImportData);
    }
    setIsOverwriteDialogOpen(false);
    setPendingImportData(null);
  }

  /** 덮어쓰기 취소 */
  function handleOverwriteCancel() {
    setIsOverwriteDialogOpen(false);
    setPendingImportData(null);
  }

  /**
   * 블록 저장 (추가 또는 수정)
   * - editingBlock이 있으면 수정 모드
   * - 없으면 추가 모드
   */
  function handleSaveBlock(
    dayValue: DayValue,
    blockData: Omit<Block, 'id' | 'duration_minutes'>,
    _originalDayValue?: DayValue
  ) {
    if (editingBlock) {
      // 수정 모드: 요일 변경 여부 확인
      const newDayValue =
        dayValue !== editingBlock.dayValue ? dayValue : undefined;
      updateBlock(editingBlock.dayValue, editingBlock.block.id, blockData, newDayValue);
    } else {
      // 추가 모드
      addBlock(dayValue, blockData);
    }
    setIsEditorOpen(false);
    setEditingBlock(null);
  }

  /** 블록 수정 모달 열기 */
  function handleEditBlock(dayValue: DayValue, block: Block) {
    setEditingBlock({ block, dayValue });
    setIsEditorOpen(true);
  }

  /** 새 블록 추가 모달 열기 */
  function handleAddBlock(_dayValue: DayValue) {
    setEditingBlock(null);
    setIsEditorOpen(true);
  }

  /** 블록 삭제 */
  function handleDeleteBlock(dayValue: DayValue, blockId: string) {
    deleteBlock(dayValue, blockId);
  }

  /** 에디터 모달 취소/닫기 */
  function handleEditorCancel() {
    setIsEditorOpen(false);
    setEditingBlock(null);
  }

  /** 인라인 편집용 블록 업데이트 핸들러 (카테고리, 중요도 등) */
  function handleUpdateBlockInline(dayValue: DayValue, blockId: string, updates: Partial<Block>) {
    updateBlock(dayValue, blockId, updates);
  }

  // 모든 블록에서 카테고리 수집 (중복 없이, 정렬)
  const allCategories = useMemo(() => {
    if (!routineData) return [];
    const categories = new Set<string>();
    routineData.days.forEach(day => {
      day.blocks.forEach(block => {
        if (block.category) categories.add(block.category);
      });
    });
    return Array.from(categories).sort();
  }, [routineData]);

  // --- 렌더링 ---

  // 데이터 로딩 중 (초기 상태)
  if (!routineData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500 text-sm">데이터를 불러오는 중...</p>
      </div>
    );
  }

  const weekDates = getWeekDates(selectedWeekStart);
  const exportJson = routineDataToJson(routineData);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* 고정 헤더 */}
      <div className="sticky top-0 z-40">
        <Header
          routineName={routineData.routine_name}
          saveStatus={saveStatus}
          onImportClick={() => setIsImportPanelOpen(true)}
          onExportClick={() => setIsExportPanelOpen(true)}
        />
        <WeekNavigation
          selectedWeekStart={selectedWeekStart}
          onPrevWeek={goToPrevWeek}
          onNextWeek={goToNextWeek}
          onToday={goToToday}
        />
      </div>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 px-4 py-4 overflow-hidden">
        <TimelineGrid
          days={routineData.days}
          weekDates={weekDates}
          completionRecords={completionRecords}
          onToggleCompletion={toggleCompletion}
          onEditBlock={handleEditBlock}
          onDeleteBlock={handleDeleteBlock}
          onAddBlock={handleAddBlock}
          onUpdateBlock={handleUpdateBlockInline}
        />
      </main>

      {/* 모달/패널 */}
      <RoutineEditorModal
        isOpen={isEditorOpen}
        editingBlock={editingBlock}
        onSave={handleSaveBlock}
        onCancel={handleEditorCancel}
      />

      <ImportPanel
        isOpen={isImportPanelOpen}
        onImport={handleImport}
        onClose={() => setIsImportPanelOpen(false)}
      />

      <ExportJsonPanel
        isOpen={isExportPanelOpen}
        jsonContent={exportJson}
        routineName={routineData.routine_name}
        onClose={() => setIsExportPanelOpen(false)}
      />

      <OverwriteConfirmDialog
        isOpen={isOverwriteDialogOpen}
        onConfirm={handleOverwriteConfirm}
        onCancel={handleOverwriteCancel}
      />
    </div>
  );
}

export default App;
