**저장 경로 및 파일명: Docs\Trouble_Shooting\IssueLog_Session_5_헤더고정및리팩토링_20260612_routine_adhd.md**

---

# Trouble Shooting Log - Session 5: 미해결 항목 정리 및 UI 개선

## 세션 개요

Step 5 미해결 항목 및 Step 6 추가 구현 진행 중 발생한 이슈 기록.

---

## 1. 해결 완료 (Resolved)

### 1.1 `TimelineBlock.tsx` Dead Code — Session 2~4 3회 이월 후 최종 해결

**발생 상황:**
Session 2부터 `TimelineBlock.tsx`가 `TimelineGrid.tsx`에서 import되지 않아 수정 내용이 화면에 반영되지 않는 문제가 반복됨.

**원인:**
Session 2에서 `TimelineGrid` 구현 시 `TimelineBlock`이 아직 없어 인라인 `<div>`로 블록을 렌더링했고, 이후 `TimelineBlock` 컴포넌트가 생성됐으나 `TimelineGrid`를 다시 리팩토링하는 태스크가 없었음.

**해결 방법:**
`TimelineGrid.tsx`의 `DayColumnArea` 내부 인라인 블록 렌더링 코드 전체를 `TimelineBlock` 컴포넌트 호출로 교체:

```tsx
// 수정 전: 인라인 렌더링
return (
  <div key={block.id} className="absolute ..." style={{...}}>
    ...
  </div>
);

// 수정 후: TimelineBlock 컴포넌트 사용
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
    onToggleCompletion={() => handleBlockClick(block)}
    onEditIconClick={(e) => handleEditIconClick(block, e)}
  />
);
```

**영향 범위:** `src/components/TimelineBlock.tsx`, `src/components/TimelineGrid.tsx`

---

### 1.2 요일 헤더 가로 스크롤 시 컬럼과 어긋남

**발생 상황:**
Session 5에서 `DayHeader`를 스크롤 컨테이너 밖으로 분리하여 세로 고정은 해결했으나, 가로 스크롤 시 헤더와 타임라인 컬럼 위치가 어긋나는 문제 발생.

**원인:**
- 헤더는 스크롤 컨테이너 밖에 `overflow: hidden`으로 고정
- 타임라인 본문은 가로 스크롤 가능
- 두 영역이 독립적이어서 가로 스크롤 위치가 동기화되지 않음

**해결 방법:**
`scrollLeft` 상태를 추적하여 헤더에 `transform: translateX`로 동기화:

```tsx
// TimelineGrid 메인 컴포넌트
const [scrollLeft, setScrollLeft] = useState(0);

function handleScroll() {
  if (scrollContainerRef.current) {
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  }
}

// DayHeader에 scrollLeft 전달
<DayHeader
  days={days}
  weekDates={weekDates}
  scrollLeft={scrollLeft}
  headerRef={headerRef}
/>

// DayHeader 내부
<div
  style={{
    transform: `translateX(-${scrollLeft}px)`,
    minWidth: `${MIN_COLUMN_WIDTH * 7 + 56}px`,
  }}
>
  {/* 요일 헤더 내용 */}
</div>
```

**영향 범위:** `src/components/TimelineGrid.tsx` — `DayHeader` 컴포넌트, 메인 `TimelineGrid` 컴포넌트

---

### 1.3 카테고리 배지 색상 맵에 영문 카테고리 미등록

**발생 상황:**
`weekly_routine_2026-06-01.json` 등 영문 카테고리(`career`, `app_project`, `health` 등)를 사용하는 JSON 파일을 가져오면 배지가 모두 기본 파랑으로 표시됨.

**원인:**
`categoryColors` 맵이 한국어 5개(`업무`, `개인`, `운동`, `학습`, `휴식`)만 정의되어 있었음.

**해결 방법:**
`categoryUtils.ts` 공통 모듈 신설:

```typescript
export const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  // 한국어
  업무: '#3B82F6', 개인: '#8B5CF6', 운동: '#10B981', 학습: '#F59E0B', 휴식: '#6B7280',
  // 영문
  career: '#3B82F6', app_project: '#8B5CF6', health: '#10B981', fitness: '#10B981',
  meal: '#F59E0B', rest: '#6B7280', english: '#8B5CF6', study: '#F59E0B',
  cleaning: '#14B8A6', planning: '#64748B', drawing: '#EC4899',
  buffer: '#64748B', team_project: '#DC2626', conditional: '#DC2626',
};

export function getBadgeColor(category?: string, colorMap?: CategoryColorMap): string {
  if (!category) return '#6B7280';
  if (colorMap?.[category]) return colorMap[category]; // 커스텀 색상 우선
  return DEFAULT_CATEGORY_COLORS[category] ?? '#6B7280';
}
```

**영향 범위:** `src/utils/categoryUtils.ts` 신규 생성, `TimelineBlock.tsx`, `RoutineEditorModal.tsx`에서 import

---

### 1.4 중요도 변경이 메인 화면에 반영되지 않던 문제

**발생 상황:**
`RoutineEditorModal`에서 중요도를 변경하고 저장해도 타임라인 카드의 세로선 색상이 바뀌지 않음.

**원인 분석:**
코드 흐름 추적 결과:
- `RoutineEditorModal` → `handleSave` → `blockData` 조립 → `onSave(day, blockData)` 호출 → `App.tsx`의 `handleSaveBlock` → `updateBlock` 호출
- `priority` 필드는 `blockData`에 명시적으로 포함됨 → 저장 로직은 정상
- `TimelineBlock`의 `priorityBorderColor` 맵 키가 구 `high/medium/low`였음 → Session 4에서 4단계로 교체 완료

**현재 상태:** Session 4에서 타입 교체와 함께 해결됨. Session 5에서 `RoutineEditorModal`에 중요도 색상 프리뷰를 추가하여 사용자가 현재 세로선 색상을 직관적으로 확인할 수 있도록 개선.

```tsx
// 중요도 선택 옆 세로선 색상 프리뷰
<div className="flex items-center gap-2">
  <div
    className="w-1 h-8 rounded-full flex-shrink-0"
    style={{ backgroundColor: PRIORITY_BORDER_COLOR[priority] }}
  />
  <select value={priority} onChange={...}>...</select>
</div>
```

---

## 2. 미해결 (Unresolved)

### [REVIEW_REQUIRED] 2.1 빌드 최종 성공 여부 미확인

**현재 상태:**
세션 종료 시점에 `npm run build`를 실행하지 못함. 여러 파일을 동시에 수정했으므로 타입 에러가 있을 수 있음.

**확인 방법:**
```bash
cd ~/Base/Dev/mini_project/Routine_for_adhd
npm run build
```

**예상 잠재 에러:**
- `TimelineGrid.tsx`에서 `onAddBlock`을 props에 선언했으나 `DayColumnArea`에는 전달하지 않는 구조 → `TimelineGridProps`에는 유지, `DayColumnArea` 내부에서는 제거됨. 타입 체계상 문제없으나 확인 필요.
- `RoutineEditorModal.tsx`에서 `getBadgeColor`, `DEFAULT_CATEGORY_COLORS`를 `categoryUtils.ts`에서 import — 경로 정확성 확인 필요.

---

### [REVIEW_REQUIRED] 2.2 드래그 편집 (Step 5 미구현)

**현재 상태:**
`Step5_unsolved_and_add.md`에 명시된 드래그 편집이 구현되지 않음.

**미구현 이유:**
- 요일 간 드래그 이동, 시간 변경 드래그, 모바일 터치 지원을 포함하면 작업량이 크고 기존 `overlapCalculator`, `useRoutineState` 로직에 대한 깊은 이해가 필요함
- 별도 Spec 작성 후 체계적으로 진행하는 것이 안전함

**사용자 결정 필요:**
- `.kiro/specs/` 폴더에 드래그 편집 Spec을 새로 작성할지 결정
- 지원 범위 결정: 마우스 드래그만 / 터치 포함 여부

---

### [REVIEW_REQUIRED] 2.3 언어 설정 (영문/한국어 토글) 미구현

**현재 상태:**
`step6_detailed.md`에 "추후 언어 선택 기능 예정"으로 명시됨. `categoryUtils.ts`에 `CATEGORY_DISPLAY_NAME` 맵이 준비되어 있음.

**구현 방향:**
```typescript
// getCategoryDisplayName 확장 예시
export function getCategoryDisplayName(category?: string, lang: 'ko' | 'en' = 'ko'): string {
  if (!category) return '';
  if (lang === 'en') return category; // 영문은 원본 그대로
  return CATEGORY_DISPLAY_NAME[category] ?? category;
}
```

App.tsx에 언어 상태 추가 후 `categoryColorMap`과 함께 `TimelineBlock`에 전달하면 됨.
