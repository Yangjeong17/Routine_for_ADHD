// 주간 루틴 플래너 타입 정의

export type DayValue =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type Priority =
  | "urgent_important"
  | "not_urgent_important"
  | "urgent_not_important"
  | "not_urgent_not_important";

export interface Block {
  id: string;
  title: string;
  category?: string;
  start: string; // HH:mm
  end: string; // HH:mm
  duration_minutes: number;
  priority: Priority;
  color: string; // hex color
  required: boolean;
  weekStart?: string; // YYYY-MM-DD (required=false 일 때 생성된 주 기록, 해당 주에만 표시)
  notes?: string;
}

export interface DayData {
  day: DayValue;
  label: string;
  blocks: Block[];
}

export interface SleepInfo {
  target_bedtime: string;
  target_wakeup: string;
  flex_hours: number;
}

export interface RoutineData {
  routine_name: string;
  version?: string;
  timezone?: string;
  sleep?: SleepInfo;
  days: DayData[];
}

export type CompletionRecords = {
  [date: string]: {
    // YYYY-MM-DD
    [blockId: string]: boolean;
  };
};

/** 카테고리별 커스텀 색상 맵 (카테고리명 → hex 색상) */
export type CategoryColorMap = Record<string, string>;

export interface AppState {
  routineData: RoutineData | null;
  completionRecords: CompletionRecords;
  selectedWeekStart: Date;
  isImportPanelOpen: boolean;
  isExportPanelOpen: boolean;
  editingBlock: { block: Block; dayValue: DayValue } | null;
  isOverwriteDialogOpen: boolean;
  pendingImportData: RoutineData | null;
}
