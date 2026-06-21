# AI 작업 문서 운영 README

## 1. 목적

이 폴더는 AI와 함께 앱 개발을 진행할 때 작업 지시, 계획, 구현 결과, 이슈 기록을 체계적으로 관리하기 위한 문서 공간이다.

목표는 다음과 같다.

* AI가 사용자의 자연어 요청을 오해하지 않도록 한다.
* 구현 전 작업 범위를 먼저 확인한다.
* 사용자가 승인한 범위 안에서만 AI가 코드를 수정하도록 한다.
* 작업 완료 후 다음 세션에서 바로 이어받을 수 있도록 기록을 남긴다.
* 반복 오류, dead code, 이전 결정 충돌, 빌드 검증 누락을 줄인다.

### 운영규칙
1. Steps/에 사용자 작업 요청서 작성
2. AI가 간단/정규 작업 계획 작성
3. 사용자가 계획 확인 후 승인
4. AI가 승인된 범위만 구현
5. AI가 자체 검증
6. 사용자가 실제 화면 검증
7. 오류가 있으면 오류 보완 요청서 작성
8. AI가 오류 보완 계획 작성
9. 사용자가 보완 계획 승인
10. AI가 보완
11. 사용자가 “최종 확인 완료” 선언
12. AI가 logs/issues 생성

### 토큰 절약을 위한 중요 규칙
상세한 문서는 구현 전이 아니라 최종 완료 후에만 작성한다.
구현 전 문서는 승인용 체크리스트 수준으로 짧게 작성한다.



---

## 2. 폴더 구조

```txt
.ai-docs/
  README.md
  project_state.md

  templates/
    step_request_template.md
    ai_plan_template.md
    fix_request_template.md
    session_summary.md

  steps/
    step_01_xxx.md

  plans/
    plan_step_01_xxx.md

  logs/
    step_01_xxx_20260615.md

  issues/
    issue_step_01_xxx_20260615.md

  artifacts/
    json/
    guides/
    analysis/
    references/

  archive/
```

---

## 3. 각 폴더 역할

### 3.1 `project_state.md`

현재 프로젝트의 최신 상태를 요약하는 문서다.

세션별 상세 기록이 아니라, 다음 AI가 가장 먼저 읽어야 할 “현재 기준 문서”다.

포함할 내용:

* 현재 앱 구조
* 확정된 주요 결정
* 유지해야 하는 기능
* 현재 남은 주요 이슈
* 다음 세션에서 주의할 점
* 절대 되돌리면 안 되는 결정

---

### 3.2 `templates/`

AI에게 전달할 고정 프롬프트 템플릿을 보관한다.

포함 파일:

```txt
step_request_template.md
ai_plan_template.md
fix_request_template.md
session_summary.md
```

역할:

* `step_request_template.md`: 사용자가 작업을 요청할 때 사용하는 기본 템플릿
* `ai_plan_template.md`: AI가 구현 전에 작성해야 하는 승인용 작업 계획 템플릿
* `fix_request_template.md`: 사용자가 오류 보완을 요청할 때 사용하는 템플릿
* `session_summary.md`: 최종 확인 후 log/issue 문서를 생성하게 하는 프롬프트

---

### 3.3 `steps/`

사용자가 자연어로 작성한 실제 작업 요청서를 저장한다.

규칙:

* 사용자는 완벽한 개발 명세서를 작성하지 않아도 된다.
* 단, 원하는 동작, 바꾸지 말아야 할 것, 완료 조건은 최대한 작성한다.
* AI는 이 문서를 읽고 바로 구현하지 않는다.
* AI는 먼저 `plans/`에 작성할 작업 계획을 만든다.

파일명 예시:

```txt
step_01_category_priority.md
step_02_card_modal.md
step_03_timeline_layout.md
```

---

### 3.4 `plans/`

AI가 사용자의 `steps/` 요청을 해석해서 만든 작업 계획을 저장한다.

이 문서는 구현 전 사용자 승인을 받기 위한 문서다.

포함할 내용:

* AI가 이해한 작업
* 수정 범위
* 제외 범위
* 이전 결정과 충돌 여부
* 확인이 필요한 점
* 예상 수정 파일
* 완료 조건
* 승인 요청

중요 규칙:

* 사용자가 승인하기 전까지 AI는 코드를 수정하지 않는다.
* 이 문서는 상세 보고서가 아니라 승인용 체크리스트로 짧게 작성한다.

파일명 예시:

```txt
plan_step_01_category_priority.md
plan_step_02_card_modal.md
```

---

### 3.5 `logs/`

사용자가 최종 확인을 완료한 뒤 생성하는 세션 인수인계 문서다.

포함할 내용:

* 이번 세션 목표
* 실제 변경된 파일
* 구현 요약
* 확정된 결정
* 검증 결과
* 다음 세션에서 해야 할 일
* 건드리면 안 되는 항목

중요 규칙:

* 사용자가 “최종 확인 완료”라고 말하기 전까지 생성하지 않는다.
* 검증하지 않은 항목은 “성공”이라고 쓰지 않고 “미검증”으로 표시한다.

---

### 3.6 `issues/`

작업 중 발생한 오류, 문제, 미해결 항목을 기록한다.

포함할 내용:

* 해결 완료된 이슈
* 원인
* 해결 방법
* 수정 파일
* 검증 결과
* 미해결 이슈

미해결 항목은 반드시 `[REVIEW_REQUIRED]` 태그를 붙인다.

예시:

```md
### [REVIEW_REQUIRED] TimelineBlock dead code 재확인 필요
```

---

### 3.7 `artifacts/`

AI가 생성한 결과물을 저장한다.

예시:

* JSON 파일
* 분석 문서
* 가이드 문서
* 설계 참고 문서
* 임시 산출물

권장 하위 폴더:

```txt
artifacts/
  json/
  guides/
  analysis/
  references/
```

1. artifacts/json/

AI가 만든 JSON(JavaScript Object Notation, 데이터를 저장하거나 주고받을 때 많이 쓰는 형식) 예시를 저장하는 곳입니다.

예를 들면:
```
artifacts/json/category_sample.json
artifacts/json/routine_data_example.json
artifacts/json/priority_schema.json
```

사용 상황:
- 데이터 구조 예시 만들 때
- localStorage 저장 구조 정리할 때
- API 응답 예시 만들 때
- 더미 데이터 만들 때

2. artifacts/guides/

AI가 만든 사용법, 개발 가이드, 구현 지침을 저장하는 곳입니다.

예를 들면:
```
artifacts/guides/timeline_component_guide.md
artifacts/guides/local_storage_rule.md
artifacts/guides/category_priority_rule.md
```
사용 상황:
- 특정 기능의 사용 규칙 정리
- 컴포넌트 작성 방식 정리
- UI(User Interface, 사용자 화면) 규칙 정리
- 개발자가 나중에 참고할 가이드 정리

3. artifacts/analysis/

AI가 분석한 내용을 저장하는 곳입니다.

예를 들면:
```
artifacts/analysis/timeline_dead_code_analysis.md
artifacts/analysis/component_dependency_analysis.md
artifacts/analysis/prompt_failure_patterns.md
```

사용 상황:
- 왜 오류가 반복됐는지 분석
- 어떤 컴포넌트가 어디서 쓰이는지 분석
- 현재 구조의 문제점 분석
- 리팩토링 전에 영향 범위 분석

4. artifacts/references/

참고자료를 저장하는 곳입니다.

예를 들면:
```
artifacts/references/eisenhower_matrix_colors.md
artifacts/references/ui_design_reference.md
artifacts/references/prompt_examples.md
```

사용 상황:
- 디자인 참고안
- 색상 기준
- 외부 자료 요약
- 나중에 다시 볼 참고 문서

---

### 3.8 `archive/`

더 이상 사용하지 않는 문서나 이전 구조 백업을 저장한다.

예시:

* 폐기된 step 요청
* 오래된 plan 문서
* 이전 폴더 구조 백업
* 더 이상 유효하지 않은 템플릿

---

## 4. 기본 작업 흐름

```txt
1. 사용자가 steps/에 자연어 작업 요청서 작성
2. AI가 요청서를 읽고 plans/에 작업 계획 작성
3. 사용자가 작업 계획 검토
4. 사용자가 “승인” 또는 “진행해”라고 말함
5. AI가 승인된 범위 안에서만 구현
6. AI가 자체 검증
7. 사용자가 실제 화면에서 검증
8. 오류가 있으면 fix_request_template.md 기준으로 보완 요청
9. 오류가 해결되면 사용자가 “최종 확인 완료”라고 말함
10. AI가 logs/와 issues/ 문서 생성
11. 필요한 경우 project_state.md 갱신
```

---

## 5. 핵심 운영 규칙

### 5.1 구현 전 규칙

AI는 사용자의 `steps/` 요청을 받으면 바로 구현하지 않는다.

먼저 아래 내용을 포함한 작업 계획을 작성한다.

* 이해한 작업
* 수정 범위
* 제외 범위
* 충돌 또는 확인 필요 사항
* 예상 수정 파일
* 완료 조건

사용자가 승인하기 전까지 코드를 수정하지 않는다.

---

### 5.2 구현 중 규칙

AI는 승인된 범위만 수정한다.

금지 사항:

* 요청하지 않은 리팩토링
* 작업 범위 밖 파일 수정
* 기존 정상 기능 변경
* 데이터 구조 임의 변경
* 이전 결정 임의 되돌리기

---

### 5.3 구현 후 자체 검증 규칙

AI는 구현 후 아래 항목을 자체 검증한다.

* `npm run build` 성공
* TypeScript 타입 에러 없음
* dead code 없음
* 새 코드가 실제 화면에서 사용됨
* 기존 기능 유지
* 작업 제외 범위 침범 없음

검증하지 못한 항목은 “성공”이라고 쓰지 않고 “미검증”으로 표시한다.

---

### 5.4 사용자 검증 규칙

AI의 자체 검증 후 사용자가 실제 화면에서 확인한다.

사용자가 오류를 발견하면 바로 구현을 다시 지시하지 않고, 오류 보완 요청서를 작성한다.

오류 보완도 아래 순서를 따른다.

```txt
오류 설명 → AI 보완 계획 → 사용자 승인 → 수정 → 검증
```

---

### 5.5 최종 문서화 규칙

사용자가 “최종 확인 완료”라고 말한 뒤에만 `logs/`와 `issues/` 문서를 생성한다.

이유:

* 작업 중간 상태가 완료 기록으로 남는 것을 방지하기 위해
* 사용자 검증 전 미완성 작업이 완료로 기록되는 것을 방지하기 위해
* 다음 세션 AI가 잘못된 상태를 기준으로 작업하는 것을 막기 위해

---

## 6. 문서 레벨 기준

모든 작업에 긴 문서를 쓰지 않는다.

```txt
작은 수정:
- 짧은 steps 요청
- 간단 plan
- 최종 log는 간단히

기능 추가 / 구조 변경:
- 정규 steps 요청
- 정규 plan
- 최종 log/issue 작성

큰 리팩토링 / 반복 오류:
- 상세 steps 요청
- 정규 plan
- issue 문서 상세 작성
- project_state.md 갱신
```

---

## 7. 파일명 규칙

파일명은 가능하면 영문 소문자와 언더스코어를 사용한다.

권장 형식:

```txt
step_01_keyword.md
plan_step_01_keyword.md
step_01_keyword_YYYYMMDD.md
issue_step_01_keyword_YYYYMMDD.md
```

예시:

```txt
step_01_category_priority.md
plan_step_01_category_priority.md
step_01_category_priority_20260615.md
issue_step_01_category_priority_20260615.md
```

주의:

* 한글 파일명 사용 지양
* 대문자 사용 지양
* 공백 사용 금지
* 단어 구분은 언더스코어 사용

---

## 8. AI에게 자주 사용할 문구

### 8.1 새 작업 시작

```txt
steps/의 [파일명]을 읽고 바로 구현하지 말고 먼저 작업 계획을 작성해줘.
사용자가 승인하기 전까지 코드 수정하지 마.
```

### 8.2 작업 승인

```txt
승인. 위 계획대로 진행해.
단, 작업 제외 범위는 건드리지 말고 완료 후 자체 검증 결과를 알려줘.
```

### 8.3 오류 보완

```txt
아래 오류를 기준으로 바로 수정하지 말고 먼저 오류 보완 계획을 작성해줘.
사용자가 승인하기 전까지 코드 수정하지 마.
```

### 8.4 최종 문서화

```txt
최종 확인 완료.
이번 작업에 대해 logs/와 issues/ 문서를 생성하고, 필요한 경우 project_state.md도 갱신해줘.
```

---

## 9. 최우선 원칙

```txt
승인 전 코드 수정 금지.
최종 확인 전 logs/issues 생성 금지.
검증하지 않은 항목은 성공 처리 금지.
```
