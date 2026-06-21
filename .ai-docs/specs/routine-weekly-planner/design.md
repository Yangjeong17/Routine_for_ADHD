# Design Document

## Overview

주간 루틴 플래너는 React + TypeScript + Vite + Tailwind CSS 기반의 SPA로, JSON 입력을 통해 주간 루틴을 시각화하고 관리하는 ADHD 사용자 대상 웹 애플리케이션이다. 완료 체크는 날짜 기반으로 Block 데이터와 분리하여 관리하며, 모든 데이터는 localStorage에 저장한다.

## Architecture

주간 루틴 플래너는 단일 페이지 애플리케이션(SPA)으로, 클라이언트 사이드에서 모든 로직을 처리한다. 데이터는 localStorage에 저장하며 서버 통신은 없다. React 컴포넌트 트리를 통해 상태를 관리하고, 유틸리티 모듈로 비즈니스 로직을 분리한다.

## Data Models

### TypeScript Type Definitions

```typescript
type DayValue = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
type Priority = "high" | "medium" | "low";

interface Block {
  id: string;
  title: string;
  category?: string;
  start: string;       // HH:mm
  end: string;         // HH:mm
  duration_minutes: number;
  priority: Priority;
  color: string;       // hex color
  required: boolean;
  notes?: string;
}

interface DayData {
  day: DayValue;
  label: string;
  blocks: Block[];
}

interface SleepInfo {
  target_bedtime: string;
  target_wakeup: string;
  flex_hours: number;
}

interface RoutineData {
  routine_name: string;
  version?: string;
  timezone?: string;
  sleep?: SleepInfo;
  days: DayData[];
}

type CompletionRecords = {
  [date: string]: {          // YYYY-MM-DD
    [blockId: string]: boolean;
  };
};
```

## Components and Interfaces

### Component Hierarchy

```
App
├── Header
│   ├── AppTitle
│   ├── RoutineName
│   ├── ImportButton → opens JsonImportPanel
│   ├── ExportButton → opens ExportJsonPanel
│   ├── SaveStatus
│   └── WeekNavigation (prev/next/today)
├── JsonImportPanel (modal/panel)
│   ├── TextArea
│   ├── ImportButton
│   └── ErrorDisplay
├── WeeklyScheduleView
│   └── DayColumn (×7)
│       ├── DayHeader (day name + date)
│       ├── AddBlockButton
│       └── RoutineBlock (×N)
│           ├── BlockTitle
│           ├── BlockTime
│           ├── CategoryBadge
│           ├── PriorityBadge
│           ├── CompletionCheckbox
│           ├── EditButton
│           └── DeleteButton
├── RoutineEditorModal
│   ├── TitleInput
│   ├── DaySelect
│   ├── StartTimeInput
│   ├── EndTimeInput
│   ├── CategoryInput
│   ├── PrioritySelect
│   ├── ColorPicker
│   ├── RequiredToggle
│   ├── NotesTextArea
│   ├── SaveButton
│   └── CancelButton
├── ExportJsonPanel (modal/panel)
│   ├── JsonDisplay
│   └── CopyButton
└── OverwriteConfirmDialog
```

### Data Flow

```
JSON Input → Parser (validate + normalize) → Routine_Data (state)
                                                    ↓
                                            Storage_Manager → localStorage
                                                    ↓
                                            WeeklyScheduleView (render)
                                                    ↓
                                            User Actions (add/edit/delete/complete)
                                                    ↓
                                            State Update → Storage_Manager → localStorage
```

### App State

```typescript
interface AppState {
  routineData: RoutineData | null;
  completionRecords: CompletionRecords;
  selectedWeekStart: Date;
  isImportPanelOpen: boolean;
  isExportPanelOpen: boolean;
  editingBlock: { block: Block; dayValue: DayValue } | null;
  isOverwriteDialogOpen: boolean;
  pendingImportData: RoutineData | null;
}
```

### localStorage Keys

| Key | Value Type | Description |
|-----|-----------|-------------|
| `routine-manager-current-routine` | `RoutineData` (JSON) | 루틴 데이터 |
| `routine-manager-completion-records` | `CompletionRecords` (JSON) | 날짜별 완료 기록 |

### Parser Module Interface (`src/utils/parser.ts`)

```typescript
type ParseResult = 
  | { success: true; data: RoutineData }
  | { success: false; error: string };

function parseRoutineJson(jsonString: string): ParseResult;
function validateBlock(block: unknown, dayLabel: string): string | null;
function normalizeRoutineData(data: RoutineData): RoutineData;
```

**Validation Order:**
1. JSON.parse 시도
2. routine_name 존재 확인
3. days 배열 확인
4. 각 day의 day 값 확인
5. 각 day의 blocks 배열 확인
6. 각 block의 필수 필드 확인 (title, start, end)
7. 시간 형식 확인 (HH:mm)
8. 시간 유효성 확인 (end > start)
9. priority 값 확인
10. 기본값 보정 (color, id, duration_minutes, priority)
11. 누락 요일 자동 생성
12. 중복 ID 보정

### Pretty Printer Module Interface (`src/utils/prettyPrinter.ts`)

```typescript
function routineDataToJson(data: RoutineData): string;
```

### Storage Manager Module Interface (`src/utils/storageManager.ts`)

```typescript
function saveRoutineData(data: RoutineData): void;
function loadRoutineData(): RoutineData | null;
function saveCompletionRecords(records: CompletionRecords): void;
function loadCompletionRecords(): CompletionRecords;
function clearAllData(): void;
```

### Week Utility Module Interface (`src/utils/weekUtils.ts`)

```typescript
function getMonday(date: Date): Date;
function getWeekDates(mondayDate: Date): Date[];
function formatDate(date: Date): string;  // YYYY-MM-DD
function addWeeks(date: Date, weeks: number): Date;
function getDayValueFromDate(date: Date): DayValue;
```

### ID Generator Module Interface (`src/utils/idGenerator.ts`)

```typescript
function generateId(): string;
function deduplicateIds(days: DayData[]): DayData[];
```

## Error Handling

- **Parser 오류**: 첫 번째 발견된 오류 메시지를 반환하고 파싱 중단. 사용자에게 한국어 오류 메시지 표시. JSON 형식 검증은 가져오기 버튼 클릭 시에만 수행하며 입력 중 실시간 검증은 하지 않는다. ID 재생성 실패 시 전체 JSON을 거부한다
- **모달 유효성**: 인라인 오류 메시지 표시, 저장 버튼 비활성화. 필수 필드 누락 및 시간 유효성 검증. 유효성 검증 실패 시에도 기존 blocks 배열에 대한 정렬은 수행한다. 모달 열기 실패 시 오류 메시지를 표시하고 재시도를 허용한다
- **localStorage 오류**: try-catch로 감싸고 실패 시 콘솔 경고. 데이터 손실 방지를 위해 저장 실패 시 사용자에게 알림. 한 종류의 데이터만 존재할 경우 존재하는 데이터를 불러오고 누락된 데이터는 빈/기본값으로 처리한다. 데이터가 존재하지만 로드 실패(손상)인 경우 샘플 데이터를 표시하지 않는다
- **클립보드 오류**: navigator.clipboard API 실패 시 폴백 처리 또는 오류 메시지 표시

## Testing Strategy

- **Property-Based Tests**: fast-check 라이브러리를 사용하여 Parser 라운드트립, ID 고유성, 시간 정렬, duration 일관성 등 핵심 불변 속성 검증
- **Unit Tests**: Vitest를 사용하여 각 유틸리티 모듈의 개별 함수 테스트
- **Integration Tests**: 전체 플로우 (JSON 가져오기 → 표시 → 수정 → 저장) 검증
- **Test Runner**: Vitest (Vite 네이티브 테스트 러너)

## Correctness Properties

### Property 1: Parser Round-Trip

**Validates: Requirements 8.1, 8.2**

**Type:** Round-trip property

**Description:** 유효한 RoutineData를 Pretty_Printer로 JSON 문자열로 변환한 후 다시 Parser로 파싱하면 원본과 동등한 RoutineData가 생성된다.

**Formal:** `∀ validRoutineData: parse(print(validRoutineData)) ≡ validRoutineData`

### Property 2: Time Sorting Invariant

**Validates: Requirements 10.2**

**Type:** Invariant

**Description:** 블록 추가, 수정, 가져오기 후 각 요일의 blocks 배열은 항상 start 시간 기준 오름차순으로 정렬되어 있다.

**Formal:** `∀ day ∈ days: ∀ i < j: day.blocks[i].start ≤ day.blocks[j].start`

### Property 3: ID Uniqueness Invariant

**Validates: Requirements 6.1**

**Type:** Invariant

**Description:** 모든 Block의 id는 전체 RoutineData 내에서 고유하다.

**Formal:** `∀ block_a, block_b ∈ allBlocks: block_a ≠ block_b → block_a.id ≠ block_b.id`

### Property 4: Duration Consistency

**Validates: Requirements 4.3**

**Type:** Invariant

**Description:** 파싱 후 모든 Block의 duration_minutes는 start와 end의 시간 차이(분)와 일치한다.

**Formal:** `∀ block ∈ allBlocks: block.duration_minutes = timeDiff(block.start, block.end)`

### Property 5: Seven Days Invariant

**Validates: Requirements 5.1, 10.1**

**Type:** Invariant

**Description:** 파싱 후 RoutineData의 days 배열은 항상 정확히 7개 요일을 포함한다.

**Formal:** `∀ routineData: routineData.days.length = 7 ∧ allDayValuesPresent(routineData.days)`

### Property 6: Completion Records Isolation

**Validates: Requirements 12.2**

**Type:** Invariant

**Description:** Block 데이터에는 completed 필드가 존재하지 않으며, 완료 상태는 CompletionRecords에만 저장된다.

**Formal:** `∀ block ∈ allBlocks: "completed" ∉ keys(block)`

### Property 7: Time Validity

**Validates: Requirements 3.1**

**Type:** Invariant

**Description:** 파싱 성공 후 모든 Block의 end 시간은 start 시간보다 크다.

**Formal:** `∀ block ∈ allBlocks: timeToMinutes(block.end) > timeToMinutes(block.start)`

## File Structure

```
src/
├── App.tsx
├── main.tsx
├── index.css
├── types/
│   └── index.ts              # 모든 타입 정의
├── utils/
│   ├── parser.ts             # JSON 파싱 및 유효성 검증
│   ├── prettyPrinter.ts      # RoutineData → JSON 변환
│   ├── storageManager.ts     # localStorage 관리
│   ├── weekUtils.ts          # 주간 날짜 계산
│   ├── idGenerator.ts        # ID 생성 및 중복 처리
│   └── sampleData.ts         # 샘플 루틴 데이터
├── components/
│   ├── Header.tsx
│   ├── WeekNavigation.tsx
│   ├── JsonImportPanel.tsx
│   ├── ExportJsonPanel.tsx
│   ├── WeeklyScheduleView.tsx
│   ├── DayColumn.tsx
│   ├── RoutineBlock.tsx
│   ├── RoutineEditorModal.tsx
│   └── OverwriteConfirmDialog.tsx
└── hooks/
    ├── useRoutineState.ts    # 루틴 상태 관리 커스텀 훅
    └── useWeekNavigation.ts  # 주 이동 로직 커스텀 훅
```
