// 주간 루틴 플래너 타입 정의

export type DayValue =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type Priority = "high" | "medium" | "low";

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
