# Routine for ADHD — 전체 스펙 문서
**작성일: 2026-06-17**
**저장 경로: Docs/Spec/spec_routine_for_adhd.md**

---

## 앱 핵심 목표

ADHD를 가진 사용자가 계획을 쉽고 체계적으로 세울 수 있도록 돕는 앱.

```
① AI와 대화 → JSON 생성 → 앱에서 즉시 시각화
② 현재 계획 내보내기 → AI에게 다시 넣어서 다음 계획 수립
③ 사용자가 어떤 수정을 해도 오류/혼란 최소화
④ 주간 계획 + 장기 목표를 함께 관리
```

---

## 기술 스택 (확정)

| 항목 | 선택 | 비고 |
|---|---|---|
| 프론트엔드 | React | 지금 코드 유지 |
| 데이터베이스 | Supabase (PostgreSQL) | localStorage → 전환 예정 |
| 로그인 | 구글 소셜 로그인 | Supabase Auth 활용 |
| 저장 방식 | 디바운싱 자동저장 (변경 후 2초) | 저장 버튼도 병행 유지 |
| 동기화 | 새로고침 방식으로 시작 → 추후 실시간 추가 | |
| 앱 형태 | PWA로 시작 → 추후 네이티브 검토 | |
| 프레임워크 전환 | Next.js — 2번째 모듈 완성 후 검토 | |

---

## 폴더 구조 (모듈 분리형)

```
Dev/
  mini_projects/
    _main_app/              ← 메인 허브 앱 (로그인, 모듈 선택)
    Routine_for_ADHD/       ← 지금 앱 (주간 루틴 + 장기 목표)
    Health_Tracker/         ← 추후 추가
    Diary/                  ← 추후 추가
    Vocabulary/             ← 추후 추가
```

**핵심 원칙**: 모든 모듈이 같은 Supabase 프로젝트를 바라봄 (사용자 ID 공유)

### Routine_for_ADHD 내부 폴더 구조

```
src/
  types/
    index.ts          ← 공통 타입 (User, Auth 등 추후 추가)
    routine.ts        ← 루틴 관련 타입 (현재 index.ts 내용)
    goal.ts           ← 장기목표 타입 (추후 추가)
  hooks/
    useRoutineState.ts
    useWeekNavigation.ts
    useGoalState.ts   ← 장기목표 상태관리 (추후 추가)
  utils/
    storageManager.ts ← ⚠️ Supabase 전환 대상 (아래 체크리스트 참고)
    parser.ts
    weekUtils.ts
    categoryUtils.ts
    overlapCalculator.ts
    idGenerator.ts
    fileParser.ts
    constants.ts      ← 색상, 라벨 등 모든 상수 (중복 방지)
  components/
    routine/          ← 루틴 관련 컴포넌트 (모듈 2개 이상 시 분리)
    goal/             ← 장기목표 컴포넌트 (추후 추가)
    common/           ← 공통 컴포넌트 (Header, WeekNavigation 등)
```

---

## 코드 품질 원칙

### 단일 진실 공급원 (Single Source of Truth)
같은 내용은 딱 한 곳에만 정의하고, 필요한 곳에서 import해서 사용.

```typescript
// ❌ 금지: 여러 파일에 같은 상수 복사
// TimelineBlock.tsx
const PRIORITY_BORDER_COLOR = { urgent_important: '#EF4444', ... }
// RoutineEditorModal.tsx
const PRIORITY_BORDER_COLOR = { urgent_important: '#EF4444', ... }

// ✅ 올바른 방식: constants.ts에 한 번만 정의
// utils/constants.ts
export const PRIORITY_BORDER_COLOR = { urgent_important: '#EF4444', ... }
// TimelineBlock.tsx, RoutineEditorModal.tsx
import { PRIORITY_BORDER_COLOR } from '../utils/constants'
```

### AI에게 코드 요청 시 필수 규칙
1. 새 함수 만들기 전 "이미 있는 파일에 있는지 먼저 확인해줘" 요청
2. 테스트 파일에서 블록 데이터 만들 때 반드시 `Block` 타입 명시 요청
3. 수정 전 반드시 실행:
```bash
find src/ -type f | sort
grep -r "from '.*[수정대상파일명]'" src/
head -20 src/[경로]/[파일명]
```

### Supabase 전환 체크리스트 (storageManager.ts)
```
[ ] saveRoutineData
[ ] loadRoutineData
[ ] saveCompletionRecords
[ ] loadCompletionRecords
[ ] saveCategoryColors
[ ] loadCategoryColors
[ ] clearAllData
```
전환 시 함수 시그니처(이름, 파라미터, 반환값) 유지하고 내부만 교체.
단, localStorage(동기) → Supabase(비동기)로 바뀌므로 async/await 처리 필요.

---

## 카테고리 기능 스펙

### 방식: 노션형
기본 카테고리 제공 + 사용자가 수정/추가/삭제 가능

### 기본 카테고리 (6개)
```
휴식 / 업무 / 식사 / 운동 / 약속 / 루틴
```

### 사용자가 할 수 있는 것
- ✅ 이름 변경
- ✅ 색상 변경
- ✅ 삭제
- ✅ 새 카테고리 추가
- ✅ 순서 변경 (드래그)

### 카테고리 삭제 시 처리 (방식 A)
- 해당 카테고리를 쓰는 일정 블록의 `category` 필드값은 그대로 유지
- 카테고리 목록에서만 제거
- 목록에 없는 카테고리는 색상만 기본값(`#6B7280`)으로 표시
- 삭제 전 "이 카테고리를 사용하는 일정 N개가 있습니다" 경고 표시

### 데이터 구조
```json
[
  { "id": "cat-001", "name": "휴식", "color": "#6B7280", "order": 1 },
  { "id": "cat-002", "name": "업무", "color": "#3B82F6", "order": 2 },
  { "id": "cat-003", "name": "운동", "color": "#10B981", "order": 3 }
]
```

### 저장 경로
- 현재: localStorage (`routine-manager-category-colors`)
- 전환 후: Supabase `categories` 테이블 (user_id 연결)

---

## 내보내기 기능 스펙

### 형식 A — JSON 내보내기 (기존 유지)
- 용도: 앱으로 다시 가져오기, AI가 수정해서 재사용
- 형식: 현재 `RoutineData` JSON 그대로

### 형식 B — 요약 텍스트 내보내기 (신규 추가)
- 용도: AI와 대화할 때 현재 계획 맥락으로 붙여넣기
- 형식 예시:
```
=== 현재 루틴 요약 (2026-06-17 기준) ===

[주간 완료율]
이번 주 전체: 72%
카테고리별:
  - 취준: 5/7 (71%)
  - 운동: 6/7 (86%)
  - 식사: 7/7 (100%)

[자주 미룬 항목]
  - 저녁 독서 (완료율 28%)
  - 명상 (완료율 35%)

[장기목표 현황]
  - 취업 성공: 전체 52% / 이번 주 87% / D-172일
  - 포트폴리오: 전체 34% / 이번 주 60% / D-45일

[현재 루틴 전체]
월요일: 아침운동(07:00-08:00) / 취준(09:00-13:00) / ...
...
```

---

## 장기목표 기능 스펙

### 화면 위치
앱 상단 카드형 배너. 목표 여러 개면 3초마다 자동 슬라이드 (수동 이동도 가능).

### 카드 구성
```
┌─────────────────────────────────────────────────────┐
│ 🎯 취업 성공                            D-172일     │
│                                                     │
│ 전체 진행률  ████████░░░░░░░  52%                   │
│ 이번 주      ██████████████░  87% 🔥 잘하고 있어요! │
│                                                     │
│ 단계: 이력서 완성 ✅ → 포트폴리오 → 지원 → 합격    │
└─────────────────────────────────────────────────────┘
```

- 이번 주 완료율 높으면 🔥 피드백 표시
- 이번 주 완료율 낮으면 조용히 숫자만 표시 (압박 주지 않음)

### 목표 생성 방법
```
① AI와 대화로 큰 틀 구성
② AI가 JSON 생성
③ 앱에 JSON 가져오기
④ 앱이 JSON 읽어서 입력 폼 자동 생성
⑤ 사용자가 앱 안에서 세부 조정 후 저장
```

### 장기목표 JSON 포맷 (AI 요청 시 이 포맷 사용)
```json
{
  "goal_name": "취업 성공",
  "start_date": "2026-06-17",
  "deadline": "2026-12-15",
  "stages": [
    { "id": "s1", "title": "이력서 완성", "completed": false },
    { "id": "s2", "title": "포트폴리오 완성", "completed": false },
    { "id": "s3", "title": "지원 20곳", "completed": false },
    { "id": "s4", "title": "합격", "completed": false }
  ],
  "related_categories": ["취준", "앱개발"],
  "manual_adjustment": 0,
  "track_habit_category": "취준"
}
```

### 진행률 계산 방식
```
전체 진행률 (목표 시작일 ~ 오늘 누적):
  = (관련 카테고리 누적 완료율 × 0.7)
  + (완료된 단계 수 / 전체 단계 수 × 0.3)
  + manual_adjustment (사용자 수동 조정, ±슬라이더)

이번 주 완료율 (월~일 기준, 매주 리셋):
  = 관련 카테고리의 이번 주 완료율
```

자동계산 비중(70/30)은 추후 사용자 설정에서 변경 가능하게 구현.

### 목표일 초과 시 처리
- D-Day 당일 팝업 **한 번만** 표시
- 사용자가 무시하면 자동으로 "기한 초과" 상태 유지 (재촉 없음)
- 팝업 선택지:
  ```
  ① 목표일 연장  → 새 날짜 선택
  ② 완료로 표시  → 🎉 축하 화면
  ③ 보관하기     → 카드에서 숨김, 기록 유지
  ④ 나중에 결정  → 기한 초과 상태로 유지
  ```
- 기한 초과 카드: 빨간 강조 없이 ⚠️ 아이콘만 조용히 표시

### 보관함
- 보관된 목표는 카드 슬라이드에서 숨김
- "보관함" 메뉴에서 언제든 다시 꺼낼 수 있음
- 기록 전부 유지
- 형식 B 내보내기에 포함 (AI에게 과거 맥락 제공)

### 알림 (D-Day 기준)
```
D-30  →  "목표일 30일 전입니다"
D-7   →  "목표일 1주 전입니다"
D-1   →  "내일이 목표일입니다"
D-Day →  목표 완료 여부 선택 팝업
```

---

## 개인화 및 데이터 보안

### 사용자 구조
```
나 (개발자)    → Supabase 가입, DB 소유 및 관리
사용자 (친구)  → 내 앱에서 구글 로그인만
               → Supabase 존재 자체 몰라도 됨
```

### 데이터 격리 (RLS 적용)
- 각 사용자는 자신의 데이터만 조회/수정 가능
- 앱 화면을 통해서는 타인 데이터 접근 불가
- Supabase 관리자 콘솔은 개발자 접근 가능 (기술적 한계)
- 추후 사용자 증가 시 개인정보처리방침 작성 필요

### 완료 기록 보관
- Supabase 전환 후 날짜별 누적 무제한 보관 (용량 문제 없음)
- localStorage 사용 중에는 오래된 기록 자동 정리 로직 추가 권장

---

## 현재 남은 버그 및 기술 부채

### 즉시 수정 필요
```
1. src/utils/routineParser.test.ts 삭제
   → 존재하지 않는 './routineParser' import

2. RoutineEditorModal.tsx 중복 함수 제거
   → isValidTimeFormat, timeToMinutes를
     '../utils/parser'에서 import로 교체

3. BlockPopover.tsx 삭제 또는 연결
   → 현재 dead code 상태
   → 삭제하거나 실제로 연결해야 함

4. InlineEdit.integration.test.tsx
   → priority: 'medium' → 'not_urgent_important' 수정
```

### 추후 수정 권장
```
5. utils/constants.ts 생성
   → PRIORITY_BORDER_COLOR 등 중복 상수를 한 곳으로 통합

6. src/assets/ 불필요 파일 삭제
   → react.svg, vite.svg, hero.png

7. src/App.css 삭제
   → 현재 import되는 곳 없음
```

---

## 구현 로드맵

```
[Phase 1 — 지금 당장]
  □ 위 버그 4개 수정
  □ Supabase 프로젝트 생성
  □ 구글 로그인 연동
  □ storageManager.ts → Supabase 전환
  □ 카테고리 노션형 구현 (CRUD + 순서 변경)

[Phase 2 — 로그인 안정화 후]
  □ 형식 B 내보내기 (요약 텍스트) 구현
  □ 장기목표 카드 구현
  □ 장기목표 JSON 가져오기 + 폼 자동 생성
  □ D-Day 알림 구현

[Phase 3 — 모듈 2개 이상 시]
  □ React → Next.js 전환
  □ _main_app 허브 구현
  □ 폴더 구조 routine/ health/ common/ 으로 정리
  □ PWA 적용

[Phase 4 — 사용자 생기기 시작할 때]
  □ 개인정보처리방침 작성
  □ 실시간 동기화 추가
  □ 네이티브 앱 전환 검토
```
