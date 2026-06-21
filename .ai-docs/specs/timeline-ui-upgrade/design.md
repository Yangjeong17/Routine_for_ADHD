# Design Document

## Overview

타임라인 UI 업그레이드는 기존 카드 리스트 기반 주간 레이아웃을 Google Calendar 스타일의 시간축 그리드로 전환하고, 파일 기반 Import/Export 기능을 추가하며, 인라인 편집 기능을 개선하는 대규모 리팩토링이다. 기존 유틸리티 모듈(Parser, Pretty_Printer, Storage_Manager, weekUtils, idGenerator)의 인터페이스는 변경하지 않으며, UI 레이어와 파일 처리 레이어를 중심으로 변경한다.

## Architecture

### Component Hierarchy (변경 후)

```
App
├── Header (기존 유지, Export 다운로드 버튼 추가 연동)
├── WeekNavigation (기존 유지)
├── TimelineGrid (신규 - WeeklyScheduleView 대체)
│   ├── TimeLabels (신규 - 좌측 24시간 라벨)
│   ├── DayHeader (신규 - 상단 요일+날짜 고정 헤더)
│   ├── CurrentTimeIndicator (신규 - 빨간 수평선)
│   └── DayColumn (신규 - 시간축 기반 컬럼)
│       ├── TimelineBlock (신규 - 시간축 위 블록)
│       │   ├── EditIcon (펜 아이콘)
│       │   ├── CategoryCombobox (인라인 카테고리 편집)
│       │   └── PriorityDropdown (인라인 중요도 편집)
│       └── BlockPopover (신규 - 짧은/좁은 블록 상세 팝오버)
├── RoutineEditorModal (기존 개선 - 5분 단위 시간 선택)
├── ImportPanel (기존 JsonImportPanel 대체)
│   ├── FileDropZone (신규 - 드래그앤드롭 영역)
│   ├── FileSelectButton (신규 - 파일 선택 버튼)
│   └── TextPasteArea (기존 텍스트 붙여넣기 유지)
├── ExportJsonPanel (기존 개선 - 다운로드 버튼 추가)
└── OverwriteConfirmDialog (기존 유지)
```

### Data Flow

```
[파일 Import 흐름]
File (drag/drop/select) → FileParser → parseRoutineJson() → importRoutineData() → Storage_Manager

[텍스트 Import 흐름 - 기존 유지]
TextArea → parseRoutineJson() → importRoutineData() → Storage_Manager

[Export 흐름]
routineData → routineDataToJson() → JSON 파일 다운로드 / 클립보드 복사

[인라인 편집 흐름]
TimelineBlock → CategoryCombobox/PriorityDropdown → updateBlock() → Storage_Manager

[타임라인 렌더링 흐름]
routineData.days → overlapCalculator → TimelineBlock (top, height, width 계산) → 렌더링
```

## Components

### 1. TimelineGrid

**파일**: `src/components/TimelineGrid.tsx`

**역할**: 24시간 시간축 기반 주간 그리드 레이아웃의 최상위 컨테이너

**Props**:
```typescript
interface TimelineGridProps {
  days: DayData[];
  weekDates: Date[];
  completionRecords: CompletionRecords;
  onToggleCompletion: (date: string, blockId: string) => void;
  onEditBlock: (dayValue: DayValue, block: Block) => void;
  onDeleteBlock: (dayValue: DayValue, blockId: string) => void;
  onAddBlock: (dayValue: DayValue) => void;
  onUpdateBlock: (dayValue: DayValue, blockId: string, updates: Partial<Block>) => void;
}
```

**동작**:
- 좌측에 TimeLabels(00:00~23:00), 상단에 DayHeader(월~일) 배치
- 배경에 30분 단위 Guide_Line 수평선 렌더링
- 전체 높이 = 24시간 × HOUR_HEIGHT(px) 상수로 계산
- 초기 로드 시 06:00 위치로 스크롤 설정 (useEffect + scrollTop)
- 컬럼 최소 너비 80px, 부족 시 가로 스크롤 제공

**상수**:
```typescript
const HOUR_HEIGHT = 60; // 1시간 = 60px
const TOTAL_HEIGHT = HOUR_HEIGHT * 24; // 1440px
const MIN_COLUMN_WIDTH = 80; // 최소 컬럼 너비
```

### 2. TimeLabels

**파일**: `src/components/TimelineGrid.tsx` (내부 컴포넌트)

**역할**: 좌측 24시간 시간 라벨 (00:00~23:00)

**동작**:
- 1시간 단위로 "00:00", "01:00", ..., "23:00" 텍스트 표시
- 각 라벨의 top 위치 = index × HOUR_HEIGHT

### 3. DayHeader

**파일**: `src/components/TimelineGrid.tsx` (내부 컴포넌트)

**역할**: 상단 고정 요일 헤더 (월~일 + 날짜)

**동작**:
- sticky position으로 스크롤 시에도 상단 고정
- 요일 이름(월, 화, ..., 일)과 실제 날짜(MM/DD) 함께 표시

### 4. CurrentTimeIndicator

**파일**: `src/components/CurrentTimeIndicator.tsx`

**역할**: 한국 시간(KST) 기준 현재 시간 빨간 수평선

**동작**:
- `Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul' })` 또는 직접 UTC+9 계산으로 KST 시간 획득
- top 위치 = (현재시간_분 / 1440) × TOTAL_HEIGHT
- 1분마다 setInterval로 위치 업데이트
- 전체 그리드 너비에 걸쳐 표시 (width: 100%)
- 빨간색(#EF4444) 실선, z-index로 블록 위에 표시

### 5. TimelineBlock

**파일**: `src/components/TimelineBlock.tsx`

**역할**: 시간축 위에 배치되는 개별 루틴 블록

**Props**:
```typescript
interface TimelineBlockProps {
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
```

**동작**:
- position: absolute, top/height/width/left를 props로 받아 배치
- block.color를 배경색으로 적용 (opacity 조절하여 텍스트 가독성 확보)
- 높이 ≥ 40px: 제목, 시간, 카테고리, 중요도 모두 표시
- 높이 < 40px: 제목만 표시
- 최소 표시 높이: max(20분 분량 px, 28px)
- 펜 아이콘 버튼으로 수정 모달 진입
- 삭제 버튼 제공
- 짧은 블록(duration < 20분): 상하 6px Hit_Area 확장 (padding 또는 ::before/::after)

### 6. BlockPopover

**파일**: `src/components/BlockPopover.tsx`

**역할**: 짧은/좁은 블록의 상세 정보 팝오버

**Props**:
```typescript
interface BlockPopoverProps {
  block: Block;
  dayValue: DayValue;
  anchorRect: DOMRect;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateCategory: (category: string) => void;
  onUpdatePriority: (priority: Priority) => void;
  allCategories: string[];
  onClose: () => void;
}
```

**동작**:
- hover(데스크톱) 또는 tap(모바일) 시 표시
- 시간, 카테고리, 중요도, 메모 등 상세 정보 표시
- 펜 아이콘으로 수정 모달 진입 가능
- CategoryCombobox, PriorityDropdown, 삭제 버튼 포함
- 블록 외부 클릭 시 닫힘

### 7. CategoryCombobox

**파일**: `src/components/CategoryCombobox.tsx`

**역할**: 기존 카테고리 선택 + 새 카테고리 입력 콤보박스

**Props**:
```typescript
interface CategoryComboboxProps {
  value: string;
  allCategories: string[];
  onChange: (category: string) => void;
}
```

**동작**:
- 현재 routineData의 모든 블록에서 사용 중인 category 값을 중복 없이 수집하여 드롭다운 목록 제공
- 텍스트 입력 필드에서 새 카테고리 직접 입력 가능
- 선택/입력 시 즉시 onChange 호출 → updateBlock → Storage_Manager 저장

### 8. PriorityDropdown

**파일**: `src/components/PriorityDropdown.tsx`

**역할**: 중요도(high/medium/low) 선택 드롭다운

**Props**:
```typescript
interface PriorityDropdownProps {
  value: Priority;
  onChange: (priority: Priority) => void;
}
```

**동작**:
- high, medium, low 세 가지 옵션 제공
- 선택 시 즉시 onChange 호출 → updateBlock → Storage_Manager 저장

### 9. ImportPanel (기존 JsonImportPanel 대체)

**파일**: `src/components/ImportPanel.tsx`

**역할**: 파일 드래그앤드롭, 파일 선택, 텍스트 붙여넣기를 통합한 가져오기 패널

**Props**:
```typescript
interface ImportPanelProps {
  isOpen: boolean;
  onImport: (jsonString: string) => { success: boolean; error?: string };
  onClose: () => void;
}
```

**동작**:
- 탭 UI로 "파일" / "텍스트" 섹션 분리
- 파일 탭: FileDropZone + FileSelectButton
- 텍스트 탭: 기존 텍스트 붙여넣기 영역 유지
- 파일 처리 시 FileParser 모듈 호출

**내부 상태**:
```typescript
const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
const [isDragOver, setIsDragOver] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### 10. FileDropZone

**파일**: `src/components/ImportPanel.tsx` (내부 컴포넌트)

**역할**: 파일 드래그앤드롭 영역

**동작**:
- onDragEnter/onDragOver: isDragOver = true → 시각적 하이라이트 (테두리 파란색, 배경 연파란)
- onDragLeave: isDragOver = false → 하이라이트 제거
- onDrop: 첫 번째 파일만 처리, 10MB 초과 시 오류 메시지
- 여러 파일 드롭 시 첫 번째만 처리

### 11. ExportJsonPanel (기존 개선)

**파일**: `src/components/ExportJsonPanel.tsx`

**변경사항**:
- "다운로드" 버튼 추가 (기존 "복사" 버튼 유지)
- 다운로드 시 파일명: `{routine_name}_{YYYYMMDD}.json`
- routine_name의 파일명 사용 불가 문자(/, \, :, *, ?, ", <, >, |)를 밑줄(_)로 치환
- Blob + URL.createObjectURL + <a> 태그 click으로 다운로드 구현

**추가 Props**:
```typescript
interface ExportJsonPanelProps {
  isOpen: boolean;
  jsonContent: string;
  routineName: string;  // 추가: 파일명 생성용
  onClose: () => void;
}
```

### 12. RoutineEditorModal (기존 개선)

**파일**: `src/components/RoutineEditorModal.tsx`

**변경사항**:
- 시간 입력 `<input type="time">` 에 `step="300"` (5분 = 300초) 속성 추가
- 이를 통해 5분 단위 시간 선택 가능

## Utilities

### 13. FileParser

**파일**: `src/utils/fileParser.ts`

**역할**: 파일 확장자별 파싱 전략을 관리하는 모듈

**인터페이스**:
```typescript
/** 파일 파싱 결과 */
export type FileParseResult =
  | { success: true; jsonString: string }
  | { success: false; error: string };

/** 확장자별 파싱 함수 타입 */
export type ParserFunction = (content: string) => FileParseResult;

/** 파일을 읽고 파싱하는 메인 함수 */
export function parseFile(file: File): Promise<FileParseResult>;

/** 확장자별 파싱 함수 레지스트리 (확장 가능 구조) */
export const parsers: Record<string, ParserFunction>;
```

**동작**:
- 파일 확장자 추출 후 parsers 레지스트리에서 해당 파서 함수 조회
- `.json`: 내용을 직접 JSON.parse 시도, 성공 시 jsonString 반환
- `.txt`: 내용을 텍스트로 읽은 후 JSON.parse 시도, 실패 시 "지원하지 않는 텍스트 형식입니다" 오류
- 미지원 확장자: "현재 .json과 .txt 파일만 지원합니다." 오류
- BOM(Byte Order Mark, U+FEFF) 제거 처리: content.replace(/^﻿/, '')
- 파일 읽기: FileReader API (readAsText)

### 14. overlapCalculator

**파일**: `src/utils/overlapCalculator.ts`

**역할**: 같은 요일 내 블록 겹침을 감지하고 너비/위치를 계산하는 유틸리티

**인터페이스**:
```typescript
/** 블록 배치 정보 */
export interface BlockLayout {
  blockId: string;
  top: number;       // px
  height: number;    // px
  width: string;     // 예: "50%"
  left: string;      // 예: "0%"
}

/** 블록 배열에 대해 겹침을 계산하여 레이아웃 정보 반환 */
export function calculateBlockLayouts(blocks: Block[], totalHeight: number): BlockLayout[];
```

**겹침 판정 로직**:
- 두 블록 A, B가 겹침: A.start < B.end AND B.start < A.end (시간을 분으로 변환하여 비교)
- 겹치지 않음: A.end ≤ B.start OR B.end ≤ A.start

**레이아웃 계산**:
1. 블록들을 start 시간 기준 정렬
2. 겹침 그룹(overlap group) 구성: 연속적으로 겹치는 블록들을 하나의 그룹으로 묶음
3. 그룹 내 N개 블록: 각 블록 width = (100/N)%, left = (index × 100/N)%
4. top = (startMinutes / 1440) × totalHeight
5. height = max((durationMinutes / 1440) × totalHeight, 28px) — 최소 높이 보장

### 15. blockPositionCalculator

**파일**: `src/utils/overlapCalculator.ts` (같은 파일 내)

**역할**: 개별 블록의 top/height 계산

**공식**:
```typescript
function calculateTop(startTime: string, totalHeight: number): number {
  const minutes = timeToMinutes(startTime);
  return (minutes / 1440) * totalHeight;
}

function calculateHeight(durationMinutes: number, totalHeight: number): number {
  const calculated = (durationMinutes / 1440) * totalHeight;
  const minHeight = Math.max((20 / 1440) * totalHeight, 28);
  return Math.max(calculated, minHeight);
}
```

## State Changes

### App.tsx 변경사항

1. `WeeklyScheduleView` → `TimelineGrid` 교체
2. `JsonImportPanel` → `ImportPanel` 교체
3. `ExportJsonPanel`에 `routineName` prop 추가
4. `handleUpdateBlockInline` 핸들러 추가 (인라인 편집용)
5. `allCategories` 계산 로직 추가 (모든 블록의 category 수집)

```typescript
// 모든 블록에서 카테고리 수집
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

// 인라인 편집 핸들러
function handleUpdateBlockInline(dayValue: DayValue, blockId: string, updates: Partial<Block>) {
  updateBlock(dayValue, blockId, updates);
}
```

### useRoutineState 훅 - 변경 없음

기존 `addBlock`, `updateBlock`, `deleteBlock`, `importRoutineData` 인터페이스를 그대로 사용한다. 인라인 편집은 기존 `updateBlock`을 통해 처리한다.

## Styling Strategy

- 기존 Tailwind CSS 유지
- TimelineGrid: CSS Grid 또는 Flexbox + absolute positioning 조합
- 블록 배치: position: absolute (top, height, width, left 계산값 적용)
- 반응형: 컬럼 최소 80px, 부족 시 overflow-x-auto로 가로 스크롤
- Guide_Line: border-bottom 또는 background-image로 30분 단위 수평선
- Current_Time_Indicator: position: absolute, width: 100%, border-top: 2px solid #EF4444

## File Structure (신규/변경 파일)

```
src/
├── components/
│   ├── TimelineGrid.tsx          (신규)
│   ├── TimelineBlock.tsx         (신규)
│   ├── BlockPopover.tsx          (신규)
│   ├── CurrentTimeIndicator.tsx  (신규)
│   ├── CategoryCombobox.tsx      (신규)
│   ├── PriorityDropdown.tsx      (신규)
│   ├── ImportPanel.tsx           (신규 - JsonImportPanel 대체)
│   ├── ExportJsonPanel.tsx       (수정 - 다운로드 버튼 추가)
│   ├── RoutineEditorModal.tsx    (수정 - 5분 단위 step)
│   ├── Header.tsx                (기존 유지)
│   ├── WeekNavigation.tsx        (기존 유지)
│   └── OverwriteConfirmDialog.tsx (기존 유지)
├── utils/
│   ├── fileParser.ts             (신규)
│   ├── overlapCalculator.ts      (신규)
│   ├── parser.ts                 (기존 유지 - 인터페이스 변경 없음)
│   ├── prettyPrinter.ts          (기존 유지)
│   ├── storageManager.ts         (기존 유지)
│   ├── weekUtils.ts              (기존 유지)
│   └── idGenerator.ts            (기존 유지)
├── hooks/
│   ├── useRoutineState.ts        (기존 유지)
│   └── useWeekNavigation.ts      (기존 유지)
├── types/
│   └── index.ts                  (기존 유지)
└── App.tsx                       (수정)
```

## Deleted/Deprecated Files

- `src/components/WeeklyScheduleView.tsx` → TimelineGrid로 대체 (삭제)
- `src/components/DayColumn.tsx` → TimelineGrid 내부로 통합 (삭제)
- `src/components/RoutineBlock.tsx` → TimelineBlock으로 대체 (삭제)
- `src/components/JsonImportPanel.tsx` → ImportPanel로 대체 (삭제)

## Constraints

1. 기존 유틸리티 모듈(Parser, Pretty_Printer, Storage_Manager, weekUtils, idGenerator)의 인터페이스를 변경하지 않는다
2. 드래그 편집(요일 이동, 시간 변경, 드래그 삭제, 모바일 터치)은 구현하지 않는다
3. localStorage 기반 데이터 저장 로직을 변경하지 않는다
4. React 19 + Vite + Tailwind CSS + Vitest + fast-check 기술 스택 유지
5. 외부 라이브러리 추가 없이 구현 (기존 의존성만 사용)
