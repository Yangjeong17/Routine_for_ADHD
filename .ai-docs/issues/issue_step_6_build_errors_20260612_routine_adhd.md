**저장 경로 및 파일명: .ai-docs/issues/issue_step_6_build_errors_20260612_routine_adhd.md**

---

# Trouble Shooting Log - Step 6: 빌드 에러 및 타입 불일치

---

## 1. 해결 완료 (Resolved)

### 1.1 `onAddBlock` 미사용 변수 에러

**에러:**
```
src/components/TimelineGrid.tsx:242:3 - error TS6133: 'onAddBlock' is declared but its value is never read.
```

**원인:** 메인 컴포넌트에서 `onAddBlock`을 구조분해했으나 사용하지 않음.

**해결:** 언더스코어 prefix 적용:
```typescript
onAddBlock: _onAddBlock,
```

---

### 1.2 `getCategoryDisplayName` 미사용 import 에러

**에러:**
```
src/components/BlockPopover.tsx:3:1 - error TS6133: 'getCategoryDisplayName' is declared but its value is never read.
```

**원인:** `BlockPopover`에 `getCategoryDisplayName`을 import했으나 실제로 사용하지 않음. `BlockPopover`에서 `CategoryCombobox`를 사용하고 있고 변환은 `CategoryCombobox` 내부에서 처리되므로 불필요.

**해결:** import 제거:
```typescript
// 제거
import { getCategoryDisplayName } from '../utils/categoryUtils';
```

---

### 1.3 `useState`/`useMemo` import 누락으로 인한 빌드 실패

**원인:** `DayColumnArea`에서 `BlockPopover` 제거 시 `useState` import도 함께 제거했으나, 메인 컴포넌트(`TimelineGrid`)에서 `scrollLeft` 관리에 `useState`를 사용 중이었음. 또한 `useMemo`를 `DayColumnArea`에서만 쓰던 `allCategories` 계산에 사용했는데 이를 제거하면서 `useMemo`도 불필요해짐.

**해결:**
```typescript
// useMemo 제거, useState 유지
import { useRef, useEffect, useState } from 'react';
```

---

### 1.4 `TimelineBlock`에 `onDeleteBlock` prop 타입 미정의

**원인:** `TimelineGrid`에서 `TimelineBlock`에 `onDeleteBlock` prop을 전달했으나, `TimelineBlockProps` 인터페이스에 정의되어 있지 않아 타입 에러 발생.

**해결:** `TimelineBlockProps`에 선택적 prop으로 추가:
```typescript
export interface TimelineBlockProps {
  // ...기존 props...
  onDeleteBlock?: () => void;
}
```

함수 파라미터 및 삭제 버튼 UI도 추가:
```tsx
{onDeleteBlock && (
  <button
    className="flex-shrink-0 opacity-0 group-hover:opacity-100 ..."
    onClick={(e) => { e.stopPropagation(); onDeleteBlock(); }}
  >
    <svg className="w-3 h-3 text-red-400">...</svg>
  </button>
)}
```

---

### 1.5 `onUpdateBlock`이 메인 컴포넌트에서 구조분해됐으나 미사용

**원인:** `BlockPopover` 제거 후 `DayColumnArea`에 `onUpdateBlock`을 전달하지 않게 됐으나, 메인 컴포넌트에서 구조분해는 그대로 남아 `noUnusedLocals` 에러 발생 가능.

**해결:** 언더스코어 prefix 적용:
```typescript
onUpdateBlock: _onUpdateBlock,
```

---

## 2. 미해결 (Unresolved)

### [REVIEW_REQUIRED] 2.1 BlockPopover.tsx 및 관련 테스트 파일 dead code

**현재 상태:**
- `BlockPopover.tsx`, `BlockPopover.test.tsx`가 존재하나 어디서도 import되지 않음.
- `noUnusedLocals` 규칙이 테스트 파일을 exclude하므로 빌드는 통과하지만 코드베이스에 불필요한 파일이 남아있음.

**사용자 결정 필요:**
- 삭제 권장:
  ```bash
  rm src/components/BlockPopover.tsx
  rm src/components/BlockPopover.test.tsx
  ```
- 또는 향후 재사용 가능성이 있으면 `_archived/` 폴더로 이동.

---

### [REVIEW_REQUIRED] 2.2 CategoryCombobox에서 새 카테고리 입력 시 저장값이 표시명과 동일

**현재 상태:**
사용자가 직접 입력 모드에서 "새카테고리"를 타이핑하면 `onChange("새카테고리")`가 호출되어 저장됩니다. 그런데 기본 카테고리(`'휴식'`, `'운동'`)는 한글이 key이자 저장값이어서 문제없지만, 영문 key(`'rest'`)를 입력하면 저장값이 영문이고 표시도 영문이 됩니다.

**영향:** 사용자가 직접 입력 모드로 `rest`를 입력하면 `getCategoryDisplayName('rest')` = `'휴식'`으로 표시되지만, 드롭박스에서 선택한 경우와 달리 저장값이 `'rest'`(영문)로 남습니다. 기능적 문제는 없으나 일관성 측면에서 검토 필요.
