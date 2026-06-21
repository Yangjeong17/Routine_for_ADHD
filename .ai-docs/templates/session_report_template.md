[System Directive]
Role: Technical Project Manager
Task: 세션 기록 분석, 무손실 인수인계서(Handover Document) 작성 및 트러블슈팅(Troubleshooting, 문제 해결) 문서 분리 생성

[Input Context]
- 이 프롬프트는 현재 세션의 전체 대화 내역을 기반으로 작성할 것.
- 이전 세션 문서가 있으면 `.ai-docs/logs/` 폴더에서 최신 번호를 확인하여 N+1로 생성.

[Format Rules]
- 파일명은 영문 소문자만 사용
- 단어 구분은 언더스코어(_)
- 작업 내용 키워드는 영문 1~2단어로 요약 (무슨 작업인지 식별 가능한 수준)

    Good: step1_session1_20260612.md       → step1, 첫 번째 세션
          step1_session2_20260613.md       → step1이 두 세션에 걸친 경우
          step2_session1_20260614.md       → step2 시작
    Bad:  step_1_작업_20260612.md          → 한글 사용, 언더스코어 위치 불일치
          step1_task_20260612.md           → session 번호 없음
          step1_session1_ImplementAuth_20260612.md → 너무 길고 카멜케이스

[Project Info]
- 프로젝트명: Routine_for_adhd

[Pre-condition]
- 저장 경로 폴더가 존재하지 않으면 생성할 것.

[Output Specifications]
아래 두 가지 문서를 각각의 경로와 규칙에 맞게 분리하여 생성할 것.

1. Session Summary Document:
- 저장 경로: `.ai-docs/logs/`
- 파일명 규칙: 기존 `step[N]_session[N]` 식별 후 `step[N]_session[N+1]_YYYYMMDD.md` (작성 당일 기준)
- 최상단 명시: `**저장 경로 및 파일명: .ai-docs/logs/[생성된 파일명]**`

2. Trouble Shooting Document (작업 중 이슈가 발생한 경우에만 생성):
- 저장 경로: `.ai-docs/issues/`
- 파일명 규칙: `issue_step[N]_[이슈카테고리]_YYYYMMDD.md`
- 이슈 카테고리 키워드는 영문 1~2단어로 요약 (무슨 이슈인지 식별 가능한 수준)

    Good: issue_step1_auth_20260612.md       → 인증 관련 이슈
          issue_step2_db_connect_20260612.md → DB 연결 이슈
    Bad:  issue_step1_문제_20260612.md       → 한글 사용
          issue_step1_error_20260612.md      → 너무 추상적

- 최상단 명시: `**저장 경로 및 파일명: .ai-docs/issues/[생성된 파일명]**`

[Content Requirements - 1. Session Summary]
(주의: 정보 축약 불가. 발생한 에러의 상세 해결 과정은 Trouble Shooting 문서로 이관할 것)

1. Project Overview
본 작업의 최종 목적 및 핵심 목표.

2. Session Decisions
이번 세션에서 결정/확인/변경된 내용을 아래 구조로 작성할 것.
서술형 금지. 항목당 한 줄로 명확하게.

## 결정된 것
- [결정 내용]

## 미결정인 것
- [미결정 항목] — 이유: [왜 미결정인지]

## 시도했으나 실패한 것
- [시도 내용] → [실패 원인] → [대안 또는 해결 방법]

3. Constraints & Decisions (프로젝트 전체 기술 결정 누적 기록)
매 세션마다 전체 목록을 유지하며 변경 시 반드시 주석으로 이유를 기재할 것.

| 결정 항목 | 현재 선택 | 이유 | 변경 이력 |
|-----------|-----------|------|-----------|
| [예: 프레임워크] | [예: React] | [이유] | [없음 / 변경일: 이유] |
| [예: 데이터 저장] | [예: Supabase] | [이유] | [없음 / 변경일: 이유] |

4. File Snapshot
현재 세션 종료 시점의 주요 파일/폴더 구조. 신규/수정/삭제 파일은 반드시 표시할 것.

```
src/
├── components/
│   ├── [파일명]   ← 신규
│   ├── [파일명]   ← 수정
│   └── [파일명]   ← 유지
└── utils/
    └── [파일명]   ← 삭제
```

5. Generated Files & Artifacts
생성/수정된 모든 파일의 목록, 생성 목적, 시스템 내 역할.

6. Current Status & Issues
현재 작업의 완료 지점 및 남아있는 주요 과제.

7. Next Steps
다음 세션에서 즉시 실행해야 할 Action Item을 우선순위 기반으로 작성.
개수 제한 없음. 불필요하게 늘리지 말 것.

- [ ] [최우선 항목]
- [ ] [다음 항목]

8. 다음 세션 시작 가이드
다음 세션에서 AI에게 제공해야 할 파일 목록.

- `.ai-docs/logs/[이번 세션 파일명]` ← 필수
- `.ai-docs/specs/[관련 스펙 파일]` ← 해당되는 경우
- `.directions/steps/[관련 step 파일]` ← 해당되는 경우

[Content Requirements - 2. Trouble Shooting]
세션 진행 중 발생한 모든 에러(Error, 프로그램 실행 중 발생하는 오류) 및 문제 상황을 상태별로 구분하여 기록할 것.

## 1. 해결 완료 (Resolved)
각 항목마다:
- 발생 상황: 어떤 맥락에서 발생했는지
- 원인: 근본 원인 분석
- 해결 방법: 실제 적용한 코드/설정 변경 내역 (before/after 코드 블록 포함)
- 영향 범위: 수정된 파일 목록

## 2. 미해결 (Unresolved)
각 항목 제목 앞에 `[REVIEW_REQUIRED]` 태그를 눈에 띄게 부착할 것:
- 현재 상태
- 시도한 방법 및 실패 원인
- 사용자 확인/결정 필요 사항

[Format Constraints]
- 엄격한 마크다운 형식 준수.
- 감정적, 수사적 표현을 배제하고 건조하고 명확한 기술 문서 톤 유지.
