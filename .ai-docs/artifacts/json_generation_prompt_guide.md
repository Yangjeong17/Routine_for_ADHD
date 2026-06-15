# 주간 루틴 JSON 생성 프롬프트 가이드

## 이 문서의 목적

AI에게 주간 루틴 JSON을 생성하도록 요청할 때, 아래 규칙을 지키지 않으면 다음과 같은 문제가 발생한다.

- 카테고리를 임의 문자열로 작성 → 앱 배지가 모두 기본 파랑으로 표시됨
- `color` 필드를 임의로 넣음 → 앱이 무시하거나 카드 색상이 어색해짐
- `priority`를 high/medium/low 중 아무거나 넣음 → 중요도 세로선 색상이 의도와 다르게 표시됨
- 필드명 오타 또는 누락 → 파싱 실패

아래 프롬프트 템플릿을 복사해서 AI에게 붙여넣으면 된다.

---

## 핵심 규칙 요약 (프롬프트 작성 전 반드시 숙지)

### 1. 카테고리(`category`) 규칙

카테고리는 아래 목록에서만 선택한다. 목록에 없는 카테고리가 필요하면 추가 요청 섹션에 명시한다.

| 카테고리 값 | 의미 | 배지 색상 |
|---|---|---|
| `career` | 취업 준비, 이력서, 자소서, 공고 분석 | 파랑 `#3B82F6` |
| `app_project` | 개인 앱/프로젝트 개발 | 보라 `#8B5CF6` |
| `health` | 스트레칭, 교정 운동, 건강 관리 | 초록 `#10B981` |
| `fitness` | 헬스, 유산소, 운동 루틴 | 초록 `#10B981` |
| `meal` | 식사, 샤워, 기본 생활 루틴 | 노랑 `#F59E0B` |
| `rest` | 휴식, 산책, 회복, 자유 시간 | 회색 `#6B7280` |
| `english` | 영어 공부 | 보라 `#8B5CF6` |
| `study` | 영어 외 학습, 자격증, 강의 수강 | 노랑 `#F59E0B` |
| `cleaning` | 방 청소, 정리정돈 | 청록 `#14B8A6` |
| `planning` | 계획 정리, 회고, 일정 수립 | 남색 `#64748B` |
| `drawing` | 그림, 창작 활동 | 분홍 `#EC4899` |
| `buffer` | 여유 시간, 조건부 작업 | 남색 `#64748B` |
| `team_project` | 팀 과제, 보고서, 협업 작업 | 빨강 `#DC2626` |

> 위 목록에 없는 카테고리를 써야 하면 프롬프트 하단 "추가 카테고리" 섹션에 명시한다.
> AI가 임의로 새 카테고리를 만들지 않도록 **"위 목록 외 카테고리 사용 금지"** 를 명시한다.

---

### 2. 중요도(`priority`) 규칙 — 아이젠하워 매트릭스 기반

`priority` 필드는 아래 4가지 값 중 하나만 사용한다.

| 값 | 의미 | 왼쪽 세로선 색상 | 판단 기준 |
|---|---|---|---|
| `urgent_important` | 중요 + 긴급 | 빨강 `#EF4444` | 오늘/이번 주 안에 반드시 완료해야 하고, 삶/목표에 직접 영향을 주는 일 |
| `not_urgent_important` | 중요 + 비긴급 | 초록 `#22C55E` | 삶/목표에 중요하지만 지금 당장 급하지 않은 일 (장기 투자, 루틴 유지) |
| `urgent_not_important` | 비중요 + 긴급 | 파랑 `#3B82F6` | 지금 처리해야 하지만 목표와 직접 연관성이 낮은 일 (식사, 청소 등) |
| `not_urgent_not_important` | 비중요 + 비긴급 | 회색 `#9CA3AF` | 여유 시간, 버퍼, 선택적 휴식 |

> **주의**: 기존 `high/medium/low` 값은 사용하지 않는다.
> AI에게 반드시 **"priority 필드는 위 4가지 값만 사용"** 으로 명시한다.

---

### 3. `color` 필드 규칙

`color` 필드는 앱에서 현재 사용하지 않는다 (카드 색상은 카테고리와 중요도로 결정됨).
그러나 JSON 스키마에 필드가 존재하므로 카테고리 기본 색상과 동일한 값을 넣는다.

> AI에게 **"color 필드는 카테고리 기본 색상과 동일하게 설정"** 으로 명시한다.

---

### 4. 필수 필드 체크리스트

각 블록에 아래 필드가 모두 있어야 한다.

```
id, title, category, start, end, duration_minutes, priority, color, required, notes
```

- `id`: `{요일약자}-{카테고리}-{순번}` 형식 (예: `mon-career-001`)
- `start` / `end`: `HH:mm` 24시간 형식
- `duration_minutes`: `end - start`를 분으로 계산한 정수
- `required`: 반드시 해야 하면 `true`, 선택적이면 `false`

---

## 프롬프트 템플릿

아래를 복사해서 AI에게 붙여넣고, `[ ]` 안의 내용만 교체한다.

```
다음 규칙에 따라 주간 루틴 JSON 파일을 생성해줘.

## 기본 정보
- routine_name: "[루틴 이름]"
- version: "1.0"
- timezone: "Asia/Seoul"
- week_start: "[YYYY-MM-DD]"
- sleep.target_bedtime: "[HH:mm]"
- sleep.target_wakeup: "[HH:mm]"
- sleep.flex_hours: [숫자]

## 이번 주 주요 일정/목표
[자유 형식으로 이번 주 해야 할 일, 목표, 특이사항 작성]
예시:
- 취업 준비: 이력서 1개 완성, 공고 5개 분석
- 루틴앱 개발: UI 버그 수정, 가져오기 기능 테스트
- 팀 보고서 제출 마감: 수요일까지

## 고정 일정 (매일 반복)
[매일 같은 시간에 하는 일 목록]
예시:
- 08:10~08:40 아침 교정 스트레칭 (health)
- 12:00~13:30 점심 (meal)
- 17:30~18:30 휴식/운동 준비 (rest)
- 18:30~20:30 헬스 (fitness, 월화목금만)
- 20:30~21:40 저녁/샤워 (meal)
- 21:40~22:00 방 청소 20분 (cleaning)

## 카테고리 규칙 (반드시 준수)
아래 목록에서만 category 값을 선택한다. 목록 외 카테고리 사용 금지.
- career: 취업 준비
- app_project: 앱 개발
- health: 스트레칭/건강
- fitness: 운동
- meal: 식사/샤워
- rest: 휴식
- english: 영어 공부
- study: 학습
- cleaning: 청소
- planning: 계획/회고
- drawing: 그림
- buffer: 버퍼/조건부
- team_project: 팀 프로젝트
[필요시 추가 카테고리: (없으면 삭제)]

## 중요도 규칙 (반드시 준수)
priority 필드는 아래 4가지 값만 사용한다. high/medium/low 사용 금지.
- urgent_important: 중요하고 긴급한 일 (마감 있는 핵심 작업)
- not_urgent_important: 중요하지만 긴급하지 않은 일 (운동, 영어 등 루틴)
- urgent_not_important: 긴급하지만 중요도 낮은 일 (식사, 청소 등)
- not_urgent_not_important: 급하지도 중요하지도 않은 일 (휴식, 버퍼)

## color 규칙
color 필드는 카테고리의 기본 색상 hex 값으로 설정한다.
- career: #3B82F6
- app_project: #8B5CF6
- health: #10B981
- fitness: #10B981
- meal: #F59E0B
- rest: #6B7280
- english: #8B5CF6
- study: #F59E0B
- cleaning: #14B8A6
- planning: #64748B
- drawing: #EC4899
- buffer: #64748B
- team_project: #DC2626

## id 규칙
id는 {요일약자}-{카테고리}-{3자리 순번} 형식으로 생성한다.
예: mon-career-001, tue-meal-002

## 출력 형식
완성된 JSON만 출력한다. 설명 텍스트 없이 JSON 코드 블록으로만 응답한다.
최상위 구조:
{
  "routine_name": "...",
  "version": "1.0",
  "timezone": "Asia/Seoul",
  "week_start": "...",
  "sleep": { "target_bedtime": "...", "target_wakeup": "...", "flex_hours": ... },
  "days": [ { "day": "monday", "label": "월요일", "blocks": [...] }, ... ]
}
```

---

## 사용 예시

### 취준생 기준 이번 주 루틴 요청 예시

```
## 이번 주 주요 일정/목표
- 취업 준비: 자소서 1개 완성 (화요일 마감), 공고 분석 3개
- 루틴앱 버그 수정 및 기능 테스트
- 수요일은 운동 없는 회복일
- 토/일은 오후 6시간 그림 블록 고정
```

---

## 앱 스키마 현황

현재 앱의 `priority` 필드 타입은 아이젠하워 4단계로 이미 변경되어 있다.
위 프롬프트 템플릿의 규칙대로 JSON을 생성하면 앱에서 바로 사용 가능하다.

> 기존 `high/medium/low` 값이 포함된 JSON을 가져오면 모두 `not_urgent_important`(초록 세로선)로 폴백된다.
