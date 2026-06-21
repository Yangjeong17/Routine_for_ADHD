**저장 경로 및 파일명: Docs\Trouble_Shooting\routine_adhd_UI버그수정_IssueLog_Session_3_20260612.md**

---

# Trouble Shooting Log - Session 3: UI 버그 수정 및 카드 리디자인

## 세션 개요

`step3_error_audit.md`에 기록된 3가지 미반영 기능(가져오기 버그, 중요도 표시, 완료 체크 UI)을 구현하는 과정에서 발생한 이슈 기록.

---

## 1. 해결 완료 (Resolved)

### 1.1 `TimelineBlock.tsx` 수정이 화면에 반영되지 않음

**발생 상황:**
- `TimelineBlock.tsx`를 카드 스타일로 전면 수정했으나 브라우저 화면에 전혀 반영되지 않음.
- Vite 개발 서버 재시작, 브라우저 강제 새로고침 후에도 동일.

**원인:**
- `TimelineGrid.tsx`의 `DayColumnArea` 컴포넌트가 `TimelineBlock`을 import하지 않고 인라인 `<div>`로 블록을 직접 렌더링하고 있었음.
- `TimelineBlock.tsx`는 어디서도 import되지 않는 dead code 상태였음.
- Session 2 트러블슈팅 문서(`[REVIEW_REQUIRED] 2.1`)에도 동일 내용이 이월 과제로 기록되어 있었으나 이번 세션 시작 시 미인지.

**해결 방법:**
- `TimelineBlock.tsx` 수정 방향을 포기하고, `TimelineGrid.tsx` 내부의 블록 렌더링 인라인 코드를 직접 수정.
- `TimelineGrid.tsx` 상단에 카테고리/중요도 색상 상수 추가:

```typescript
// 카테고리 배지 색상
const categoryColors: Record<string, string> = {
  업무: '#3B82F6', 개인: '#8B5CF6', 운동: '#10B981', 학습: '#F59E0B', 휴식: '#6B7280',
};
// 중요도 왼쪽 세로선 색상
const priorityBorderColor: Record<string, string> = {
  high: '#EF4444', medium: '#F97316', low: '#9CA3AF',
};
```

- `DayColumnArea`의 블록 렌더링 `<div>`를 카드 스타일로 교체:

```tsx
// 완료 상태 색상
const cardBg = isCompleted ? '#636363' : '#F5F5F5';
const cardBorder = isCompleted ? '#4B4B4B' : '#ECECEC';
const borderLeft = isCompleted ? '#5A5A5A' : (priorityBorderColor[block.priority] ?? '#9CA3AF');

// 중요도 세로선 + 카테고리 배지 + 제목 + 시간 구조
<div style={{ width: '4px', backgroundColor: borderLeft, borderRadius: '8px 0 0 8px' }} />
```

**영향 범위:** `TimelineGrid.tsx` - `DayColumnArea` 내부 블록 렌더링 전체 교체.

---

### 1.2 `npm run build` 실패 (10개 TypeScript 에러)

**발생 상황:**
- `npm run build` 실행 시 10개 에러 발생.

**주요 에러 목록:**
```
src/App.tsx:144:9 - error TS6133: 'allCategories' is declared but its value is never read.
src/components/ExportJsonPanel.test.tsx:89:5 - error TS2304: Cannot find name 'global'.
src/components/ImportPanel.test.tsx:74:67 - error TS2353: Object literal may only specify known properties, and 'error' does not exist in type '{ success: boolean; }'.
```

**원인:**
1. `tsconfig.app.json`의 `include: ["src"]` 설정이 테스트 파일(`*.test.tsx` 등)을 포함하고, `noUnusedLocals: true` 등 엄격한 규칙이 테스트 파일에도 적용됨.
2. `App.tsx`의 `allCategories` useMemo가 `TimelineGrid`에 전달되지 않아 미사용 변수 에러 발생.

**해결 방법:**

`tsconfig.app.json`에 `exclude` 패턴 추가:
```json
"exclude": [
  "src/**/*.test.ts",
  "src/**/*.test.tsx",
  "src/**/*.spec.ts",
  "src/**/*.spec.tsx",
  "src/**/*.property.test.ts",
  "src/**/*.property.test.tsx"
]
```

`App.tsx`에서 미사용 코드 제거:
```typescript
// 제거: allCategories useMemo 블록 전체
// 제거: import { useState, useMemo } → import { useState }
```

**영향 범위:** `tsconfig.app.json`, `src/App.tsx`.

---

### 1.3 가져오기 버튼 클릭 시 흰 화면 전환 (React Crash)

**발생 상황:**
- 메인 화면에서 "가져오기" 버튼 클릭 즉시 화면 전체가 흰 화면으로 전환됨.
- 새로고침 없이는 복구 불가.

**초기 잘못된 진단:**
- `ImportPanel`과 `OverwriteConfirmDialog`의 z-index 충돌로 인한 렌더링 문제로 추정 → `App.tsx`의 `handleImport` 로직에서 `setIsImportPanelOpen(false)`를 명시적으로 추가했으나 효과 없음.
- Vite HMR 캐시 문제 추정 → 서버 재시작으로 해결 시도했으나 동일.

**실제 원인:**
브라우저 콘솔 에러 메시지로 원인 확정:
```
React has detected a change in the order of Hooks called by ImportPanel.
Previous render: 1.useState 2.useState 3.useState 4.useState 5.useRef 6.undefined
Next render:     1.useState 2.useState 3.useState 4.useState 5.useRef 6.useCallback

Uncaught Error: Rendered more hooks than during the previous render.
at ImportPanel (ImportPanel.tsx:67:27)
```

`ImportPanel.tsx`에서 `useCallback` 4개가 `if (!isOpen) return null` **이후**에 선언되어 있었음.
- 첫 렌더링(`isOpen=false`): `useState` × 4, `useRef` × 1 호출 후 `return null` → `useCallback` 미실행 (Hook 6개)
- 두 번째 렌더링(`isOpen=true`): `useState` × 4, `useRef` × 1 호출 후 `return null` 건너뜀 → `useCallback` × 4 실행 (Hook 10개)
- Hook 호출 개수 불일치 → React crash.

**해결 방법:**
`ImportPanel.tsx`에서 모든 `useCallback`을 `if (!isOpen) return null` **앞**으로 이동:

```typescript
// 수정 전 (잘못된 구조)
export function ImportPanel(...) {
  useState(...) × 4
  useRef(...)
  if (!isOpen) return null;  // ← 여기서 조기 반환
  // ...일반 함수들...
  useCallback(...)  // ← Hook이 조건부 return 뒤에 있음 (Rules of Hooks 위반)
  useCallback(...)
  useCallback(...)
  useCallback(...)
}

// 수정 후 (올바른 구조)
export function ImportPanel(...) {
  useState(...) × 4
  useRef(...)
  // 일반 함수 선언 (handleClose, handleFile)
  useCallback(...) × 4  // ← 모든 Hook을 return null 앞으로 이동
  if (!isOpen) return null;  // ← 모든 Hook 호출 완료 후 조기 반환
  // ...나머지 일반 함수들...
}
```

**영향 범위:** `src/components/ImportPanel.tsx` - Hook 선언 순서 재정렬.

---

## 2. 미해결 (Unresolved)

### [REVIEW_REQUIRED] 2.1 `TimelineBlock.tsx` Dead Code 상태

**현재 상태:**
- `src/components/TimelineBlock.tsx`가 이번 세션에서 수정됐으나 `TimelineGrid.tsx`에서 import되지 않아 실제 렌더링에 관여하지 않는 dead code 상태.
- 블록 렌더링 로직이 `TimelineGrid.tsx` 내부에 인라인으로 중복 구현되어 있음.

**사용자 확인 필요 사항:**
- (a) `TimelineBlock.tsx` 파일 삭제 후 `TimelineGrid.tsx` 인라인 코드 유지.
- (b) `TimelineGrid.tsx`에서 `TimelineBlock` 컴포넌트를 import하여 사용하도록 리팩토링 (코드 재사용성 향상).

---

### [REVIEW_REQUIRED] 2.2 `CurrentTimeIndicator` 미통합 (Session 2 이월)

**현재 상태:**
- `src/components/CurrentTimeIndicator.tsx`가 존재하나 `App.tsx` 및 `TimelineGrid.tsx` 어디서도 렌더링되지 않음.
- Session 2 이월 이슈로, 이번 세션에서도 미처리.

**사용자 확인 필요 사항:**
- `TimelineGrid.tsx`의 스크롤 영역 내부에 `<CurrentTimeIndicator totalHeight={TOTAL_HEIGHT} />`를 추가할지 결정.
- 추가 위치: `GuideLines` 컴포넌트 바로 아래, `DayColumnArea`들과 같은 레벨.
