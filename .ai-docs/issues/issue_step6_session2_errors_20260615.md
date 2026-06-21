# Issue Report — AI 코드 수정 작업 품질 결함
**저장 경로: Docs/Issues/issue_ai_codefix_20260615.md**
**작성일: 2026-06-15**
**심각도: High — 134개 빌드 에러 발생, 수동 수정 필요**
**영향 범위: 수정 파일 8개 전체**

---

## 개요

2026-06-15 세션에서 AI가 수행한 코드 수정 작업 결과물(`fixed_src/` 내 8개 파일)을 실제 프로젝트에 적용했을 때 **134개의 빌드 에러**가 발생했다. 수정 로직 자체(priority 변환, props 통일 등)는 의도대로 반영됐으나, 파일을 실제로 컴파일 가능한 상태로 만들지 못했다. 개발자가 직접 모든 import를 수동으로 복구해야 했다.

---

## 결함 목록

### ISSUE-01 `import` 문 전면 누락 (심각도: Critical)

**발생 파일**: `routineParser.ts`, `BlockPopover.tsx`, `TimelineGrid.tsx`, `useRoutineState.ts` (4개 파일)

**증상**:
각 파일이 외부 타입·함수·컴포넌트를 참조하지만, 파일 상단에 `import` 문이 단 한 줄도 없는 상태로 출력됐다.

**실제 확인된 누락 내역**:

| 파일 | 참조하는 외부 심볼 | import 존재 여부 |
|---|---|---|
| `routineParser.ts` | `RoutineData`, `DayData`, `Block`, `Priority`, `DayValue`, `generateId` | ❌ 없음 |
| `BlockPopover.tsx` | `Block`, `DayValue`, `Priority`, `CategoryColorMap`, `CategoryCombobox`, `PriorityDropdown`, `useState`, `useRef`, `useEffect` | ❌ 없음 |
| `TimelineGrid.tsx` | `DayData`, `Block`, `DayValue`, `CompletionRecords`, `CategoryColorMap`, `CurrentTimeIndicator`, `TimelineBlock`, `computeBlockLayouts`, `HOUR_HEIGHT`, `formatDate` | ❌ 없음 |
| `useRoutineState.ts` | `RoutineData`, `Block`, `DayValue`, `CompletionRecords`, `SaveStatus`, `loadRoutineData`, `saveRoutineData`, `loadCompletionRecords`, `saveCompletionRecords`, `useState`, `useCallback`, `useEffect` | ❌ 없음 |

**원인 분석**:

7z solid archive(`src.7z`)를 Python `lzma` 모듈로 파싱할 때, 파일 경계를 바이너리 헤더가 아닌 **오프셋 추정**으로 분리했다. 이 과정에서 파일 상단의 import 블록이 앞 파일의 영역에 귀속되거나 잘려나갔다. AI는 불완전하게 추출된 소스를 "완전한 파일"로 인식한 채 수정을 진행했다.

실제 추출된 `TimelineBlock.tsx` 크기 vs 수정 후 크기 비교:
```
추출 당시:  4,893 chars  (import 블록 ~60줄 누락 상태)
수정 후:    8,000 chars  (전면 재작성 — 여기서도 import 미포함)
```

전면 재작성(`cat > file`)을 수행한 파일에서는 기존 import가 유지될 여지조차 없었다.

---

### ISSUE-02 파일명 혼동 — `parser.ts` vs `routineParser.ts` (심각도: High)

**발생 파일**: `routineParser.ts`, `routineParser.test.ts`

**증상**:
AI가 수정 대상 파일을 `routineParser.ts`로 생성했으나, 실제 프로젝트의 모든 파일은 `parser.ts`를 참조하고 있었다. 결과적으로:
- `routineParser.ts` — 빌드에 포함되지 않는 dead file로 생성됨
- `routineParser.test.ts` — `import { parseRoutineJson } from './routineParser'`로 작성되어 존재하지 않는 파일을 import
- 실제 수정은 `parser.ts`에 반영해야 했으나 AI는 새 파일을 만드는 방향으로 진행함

**실제 import 경로 (App.tsx 기준)**:
```typescript
// App.tsx — 실제 프로젝트
import { parseRoutineJson } from './utils/parser';  // ← 'parser'

// routineParser.test.ts — AI가 생성한 파일
import { parseRoutineJson } from './routineParser';  // ← 존재하지 않음
```

**원인 분석**:
세션 로그에 `routineParser.ts`라는 이름이 등장해서 AI가 그것이 실제 파일명이라고 가정했다. 실제 `import` 경로를 grep으로 확인하는 단계 없이 파일명을 결정했다.

---

### ISSUE-03 `BlockPopover` 부활로 인한 UX 충돌 (심각도: Medium)

**발생 파일**: `TimelineBlock.tsx`

**증상**:
이전 세션(Step 6)에서 개발자가 `BlockPopover`를 제거한 이력이 있었다. AI는 이 결정을 인지하지 못하고 `BlockPopover`를 다시 연결하는 방향으로 `TimelineBlock.tsx`를 재작성했다. 결과적으로:
- 블록 클릭 시 팝오버와 수정 모달이 동시에 뜨는 UX 충돌 발생
- 개발자가 팝오버 제거 여부를 다시 결정하고 수동으로 롤백해야 했음

**개발자가 최종 선택한 방향**: 팝오버 제거 — 카드 클릭 시 완료 토글, 펜 아이콘 클릭 시 수정 모달

**원인 분석**:
세션 로그에서 `BlockPopover` 관련 히스토리를 읽었으나 "제거 결정"이 최종 결정인지 확인하지 않았다. 이슈 파일에서 `BlockPopover` 관련 항목을 `제거`가 아닌 `미사용`으로 해석했다.

---

### ISSUE-04 `categoryUtils.ts` 존재 가정 (심각도: Medium)

**발생 파일**: `TimelineBlock.tsx`

**증상**:
전면 재작성한 `TimelineBlock.tsx`에서 `categoryUtils.ts`에 `getCategoryDisplayName`, `getBadgeColor` 함수가 있다고 가정하고 import했으나, 해당 파일 또는 함수가 실제 프로젝트에 존재하지 않을 가능성이 있었다.

```typescript
// AI가 작성한 TimelineBlock.tsx
import { getCategoryDisplayName, getBadgeColor } from '../utils/categoryUtils';
```

**원인 분석**:
소스 추출 파일 목록에 `categoryUtils.ts`가 없었음에도 불구하고, 세션 로그에서 유사한 함수 이름을 본 기억으로 파일이 존재할 것이라 추정했다.

---

### ISSUE-05 `SaveStatus` 타입 및 `sortBlocksByStartTime` 헬퍼 누락 (심각도: Medium)

**발생 파일**: `useRoutineState.ts`

**증상**:
`useRoutineState.ts`에서 `SaveStatus` 타입과 `sortBlocksByStartTime` 헬퍼 함수를 사용했으나, 해당 타입/함수의 출처(파일명, export 위치)를 확인하지 않아 import 경로가 부정확했다. 개발자가 직접 타입 정의와 헬퍼 함수를 추가하거나 올바른 import 경로로 수정해야 했다.

---

## 근본 원인 분석

발생한 5개 이슈는 모두 **하나의 선행 실패**에서 파생됐다.

```
[선행 실패]
소스 파일 추출이 불완전한 상태에서
실제 프로젝트 구조를 확인하는 검증 단계 없이
코드 수정 작업을 시작함
```

구체적으로는 세 가지 검증 단계가 모두 생략됐다.

**① 파일 구조 확인 미실시**
```bash
# 했어야 하는 명령
find src/ -type f -name "*.ts" -o -name "*.tsx" | sort
```
이 한 줄로 `parser.ts`와 `categoryUtils.ts`의 실제 존재 여부, 파일명을 확인할 수 있었다.

**② import 경로 확인 미실시**
```bash
# 했어야 하는 명령
grep -r "from '.*parser'" src/
grep -r "BlockPopover" src/
grep -r "categoryUtils" src/
```
이 명령들로 `parser.ts` 실제 참조 경로, `BlockPopover` 제거 여부, `categoryUtils` 존재 여부를 확인할 수 있었다.

**③ 소스 추출 완전성 검증 미실시**
7z solid archive 특성상 오프셋 기반 파일 분리는 오차가 발생한다. 추출 후 각 파일의 첫 줄이 `import`로 시작하는지, 마지막 줄이 `export default` 또는 `}`로 끝나는지 확인하는 단계가 없었다.

---

## 재발 방지 체크리스트

AI에게 코드 수정을 요청하기 전, 또는 AI가 수정 작업을 시작하기 전 반드시 수행해야 하는 사전 확인 항목이다.

### AI가 수정 작업 시작 전 실행해야 하는 명령

```bash
# Step 1. 실제 파일 목록 확인 (파일명 혼동 방지)
find src/ -type f | sort

# Step 2. 수정 대상 파일이 어디서 import되는지 확인
grep -r "from '.*[수정대상파일명]'" src/

# Step 3. 수정 대상 파일의 현재 import 블록 확인
head -20 src/[경로]/[파일명]

# Step 4. 관련 컴포넌트의 히스토리 결정 확인
# (예: BlockPopover가 제거된 건지 미연결인 건지)
grep -r "BlockPopover" src/

# Step 5. 전면 재작성이 필요한 경우, 원본 파일 전체를 먼저 읽기
cat src/[경로]/[파일명]
```

### 파일 수정 방식 기준

| 수정 범위 | 권장 방식 | 이유 |
|---|---|---|
| 특정 함수/블록만 변경 | `str_replace` | 기존 import 보존됨 |
| 파일 전체 재작성 필요 | 원본 전체 읽기 → import 블록 유지 → 내용만 교체 | import 누락 방지 |
| 새 파일 생성 | 유사 기존 파일의 import 패턴 참고 후 작성 | 경로 규칙 일관성 유지 |

### 수정 완료 후 자가 검증

```bash
# 생성/수정된 파일에 import가 있는지 확인
for file in [수정된파일목록]; do
  head -1 $file | grep -q "^import" || echo "WARNING: $file has no imports"
done

# TypeScript 타입 체크 (빌드 전 빠른 확인)
npx tsc --noEmit

# 테스트 실행
npm run test
```

---

## 개발자 조치 사항 기록

본 이슈 발생 후 개발자가 수동으로 수행한 조치:

| 파일 | 조치 내용 |
|---|---|
| `routineParser.ts` | `types`, `idGenerator` import 추가 |
| `BlockPopover.tsx` | `react`, `types`, `CategoryCombobox`, `PriorityDropdown` import 추가. `PriorityDropdown`이 default export임을 확인하여 import 구문 수정 |
| `TimelineGrid.tsx` | `react`, `types`, `weekUtils`, `overlapCalculator`, `CurrentTimeIndicator`, `TimelineBlock` import 추가 |
| `useRoutineState.ts` | `react`, `types`, `storageManager`, `sampleData`, `idGenerator`, `parser` import 추가. `SaveStatus` 타입과 `sortBlocksByStartTime` 헬퍼 함수 직접 추가 |
| `parser.ts` | AI가 만든 `routineParser.ts` 대신 기존 `parser.ts`에 `LEGACY_PRIORITY_MAP` 추가, `validateBlock`·`normalizeBlock` 레거시 변환 로직 반영 |
| `App.tsx` | `DayData` 타입 import 추가 |
| `TimelineBlock.tsx` | `BlockPopover` 제거, 팝오버 관련 state/useEffect 제거, 카드 onClick → `onToggleCompletion` 직접 호출로 변경 |
| `TimelineGrid.tsx` | `allCategories`, `onUpdateBlock` props 제거 |
| `routineParser.ts` | 빌드 대상에서 제외 (dead file) |
| `routineParser.test.ts` | import 경로 `./routineParser` → `./utils/parser`로 수정 필요 |
| `parser.test.ts` | 에러 메시지, 기본값 기대치를 현재 코드 기준으로 업데이트 필요 (미완료) |

**총 수동 수정 소요**: 빌드 에러 134개 해소

---

## 향후 AI 작업 요청 가이드

이번 이슈를 바탕으로 AI에게 코드 수정을 요청할 때 아래 형식으로 컨텍스트를 제공하면 동일한 실수를 예방할 수 있다.

```
[요청 시 포함할 정보]
1. 수정 대상 파일의 현재 전체 코드 (특히 import 블록)
2. 해당 파일이 어디서 import되는지 (grep 결과)
3. 이전 세션에서 제거/유지 결정한 컴포넌트 목록
4. 실제 프로젝트 파일 트리 (find src/ -type f 결과)
```

압축 파일을 업로드하는 방식보다 **수정 대상 파일의 전체 소스를 직접 붙여넣는 방식**이 import 누락 오류를 원천 차단한다.
