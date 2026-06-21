**저장 경로 및 파일명: Docs\Trouble_Shooting\routine_adhd_Priority타입전환및완료체크_IssueLog_Session_4_20260612.md**

---

# Trouble Shooting Log - Session 4: 아이젠하워 중요도 전환 및 완료 체크

## 세션 개요

`Priority` 타입을 3단계에서 아이젠하워 4단계로 전환하고, 완료 체크 인터랙션을 구현하는 과정에서 발생한 이슈 기록.

---

## 1. 해결 완료 (Resolved)

### 1.1 Priority 타입 변경 후 빌드 에러 32개

**발생 상황:**
`npm run build` 실행 시 32개 에러 발생.

**주요 에러 내용:**
```
src/components/RoutineEditorModal.tsx:67:54 - error TS2345:
  Argument of type '"medium"' is not assignable to parameter of type 'Priority | (() => Priority)'.

src/components/TimelineBlock.tsx:38:3 - error TS2353:
  Object literal may only specify known properties, and 'high' does not exist in type 'Record<Priority, string>'.

src/utils/sampleData.ts:25:11 - error TS2322:
  Type '"high"' is not assignable to type 'Priority'.
  (동일 패턴 29개)
```

**원인:**
`types/index.ts`의 `Priority` 타입은 4단계로 변경했으나, 아래 3곳에 구 priority 값이 잔존:
1. `src/utils/sampleData.ts` - 블록 29개에 `"high"`, `"medium"`, `"low"` 직접 사용
2. `src/components/RoutineEditorModal.tsx` - `useState<Priority>('medium')` 초기값
3. `src/components/TimelineBlock.tsx` - `priorityBorderColor` 객체 키가 `high/medium/low`

**해결 방법:**

`sampleData.ts` - 파일 전체 재작성 (블록별 아이젠하워 기준 재분류):
- 핵심 업무, 프로젝트 → `urgent_important`
- 운동, 학습, 회고 → `not_urgent_important`
- 식사, 청소, 미팅 → `urgent_not_important`
- 휴식, 자유 시간 → `not_urgent_not_important`

`RoutineEditorModal.tsx`:
```typescript
// 수정 전
const [priority, setPriority] = useState<Priority>('medium');
// 수정 후
const [priority, setPriority] = useState<Priority>('not_urgent_important');
```

`TimelineBlock.tsx`:
```typescript
// 수정 전
const priorityBorderColor: Record<Priority, string> = {
  high: '#EF4444', medium: '#F97316', low: '#9CA3AF',
};
// 수정 후
const priorityBorderColor: Record<Priority, string> = {
  urgent_important: '#EF4444',
  not_urgent_important: '#22C55E',
  urgent_not_important: '#3B82F6',
  not_urgent_not_important: '#9CA3AF',
};
```

**참고:** `sampleData.ts`의 priority 일괄 치환을 PowerShell 명령으로 시도:
```powershell
$file = Get-Content "...\sampleData.ts" -Raw
$file = $file -replace 'priority: "high"', 'priority: "urgent_important"'
Set-Content "...\sampleData.ts" $file
```
WSL bash 환경에서 PowerShell 문법이 실행되지 않아 실패 → 파일 전체 재작성으로 우회.

**영향 범위:** `src/utils/sampleData.ts`, `src/components/RoutineEditorModal.tsx`, `src/components/TimelineBlock.tsx`

---

### 1.2 완료 체크 버튼 없음 — `onToggleCompletion` 미연결

**발생 상황:**
카드를 클릭해도 완료 상태가 변경되지 않음. 체크할 수 있는 버튼 자체가 없음.

**원인:**
`TimelineGrid.tsx`의 `DayColumnArea` 컴포넌트 파라미터 선언부에서 `onToggleCompletion`이 언더스코어 prefix로 처리되어 함수 본체에서 완전히 무시되고 있었음:

```typescript
// 문제 코드
function DayColumnArea({
  ...
  onToggleCompletion: _onToggleCompletion,  // ← 언더스코어로 무시
  ...
}) {
  // _onToggleCompletion은 어디서도 호출되지 않음
  // 카드 onClick은 BlockPopover를 여는 용도로만 사용됨
}
```

추가로 카드 렌더링에 완료 상태를 토글하는 인터랙션 자체가 구현되어 있지 않았음.

**해결 방법:**

`DayColumnArea` 파라미터에서 언더스코어 제거:
```typescript
// 수정 전
onToggleCompletion: _onToggleCompletion,
// 수정 후
onToggleCompletion,
```

카드 클릭/수정 인터랙션 분리:
- **카드 전체 클릭** → 완료 토글 (`onToggleCompletion(dateStr, block.id)` 호출)
- **hover 시 펜 아이콘 노출** → 클릭 시 `BlockPopover` 열기 (수정/삭제/카테고리/중요도 인라인 편집)

```typescript
// 카드 클릭 핸들러
function handleBlockClick(block: Block) {
  onToggleCompletion(dateStr, block.id);
}

// 수정 아이콘 클릭 핸들러
function handleEditIconClick(block: Block, event: React.MouseEvent<HTMLButtonElement>) {
  event.stopPropagation(); // 카드 클릭(완료 토글) 이벤트 버블링 차단
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  setPopoverBlock(block);
  setPopoverAnchorRect(rect);
}
```

카드 JSX 변경:
```tsx
// onClick: 완료 토글
<div onClick={() => handleBlockClick(block)} ...>
  ...
  {/* hover 시 표시되는 수정 아이콘 */}
  <button
    className="opacity-0 group-hover:opacity-100 ..."
    onClick={(e) => handleEditIconClick(block, e)}
  >
    <svg>...</svg>  {/* 펜 아이콘 */}
  </button>
</div>
```

**영향 범위:** `src/components/TimelineGrid.tsx` - `DayColumnArea` 전체 인터랙션 구조 변경.

---

## 2. 미해결 (Unresolved)

### [REVIEW_REQUIRED] 2.1 기존 JSON 파일 priority 호환성

**현재 상태:**
- `weekly_routine_2026-06-01.json` 등 기존 파일은 `priority: "high"/"medium"/"low"` 값을 사용.
- 가져오기 시 `normalizeBlock`의 폴백 로직에 의해 모두 `not_urgent_important`(초록 세로선)로 변환됨.
- 앱이 크래시하지는 않으나 중요도 색상이 의도와 다르게 표시됨.

**사용자 확인 필요 사항:**
- `json_generation_prompt_guide.md`의 프롬프트를 사용하여 새 JSON 파일을 생성하고 교체.
- 또는 기존 JSON 파일의 priority 값을 수동으로 4단계 값으로 수정.

---

### [REVIEW_REQUIRED] 2.2 `CurrentTimeIndicator` 미통합 (Session 2 이월)

**현재 상태:**
- `src/components/CurrentTimeIndicator.tsx` 컴포넌트가 존재하나 어디서도 렌더링되지 않음.
- Session 2부터 3회 연속 이월.

**사용자 확인 필요 사항:**
- `TimelineGrid.tsx`의 스크롤 영역 내부에 아래 코드를 추가:
```tsx
import { CurrentTimeIndicator } from './CurrentTimeIndicator';
// GuideLines 아래에 삽입
<CurrentTimeIndicator totalHeight={TOTAL_HEIGHT} />
```

---

### [REVIEW_REQUIRED] 2.3 `TimelineBlock.tsx` Dead Code (Session 2 이월)

**현재 상태:**
- `src/components/TimelineBlock.tsx`가 `TimelineGrid.tsx`에서 import되지 않아 실제 렌더링에 관여하지 않음.
- Session 3, 4에서 해당 파일을 수정했으나 실제 화면에는 반영되지 않음.

**사용자 확인 필요 사항:**
- (a) `TimelineBlock.tsx` 파일 삭제
- (b) `TimelineGrid.tsx`에서 import하여 인라인 렌더링 코드 대체 (리팩토링)
