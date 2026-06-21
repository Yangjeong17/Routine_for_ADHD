# AI 협업 문서 구조 가이드

이 폴더는 AI와의 협업 세션을 관리하기 위한 문서 저장소입니다.

## 폴더 구조

```
프로젝트/
├── .directions/            ← 사람 주도: 프로젝트 매니징 문서
│   ├── overview/           ← 전체 목표, 아이디어, 디자인 방향
│   ├── steps/              ← step별 기능 지시 (내가 자연어로 작성)
│   ├── research/           ← 외부 정보, 오류 조사 결과
│   └── references/         ← UI 레퍼런스, 참고 자료
└── .ai-docs/               ← AI 협업 전용
    ├── specs/              ← AI가 .directions/steps/ 보고 작성한 스펙
    ├── logs/               ← 세션 종료 후 생성되는 세션 요약
    ├── issues/             ← 세션 중 발생한 이슈 및 버그 기록
    ├── templates/          ← AI에게 전달하는 템플릿 모음
    │   ├── session_report_template.md
    │   ├── spec_template.md
    │   ├── spec_template_minor.md
    │   └── fix_request_template.md
    └── artifacts/          ← AI가 생성한 결과물 (JSON, 분석 문서 등)
```

## 워크플로우

### 세션 시작 시
1. 구현하고자 하는 기능을 자연어로 `.directions/steps/step[N]_기능명.md` 에 작성
2. 최신 `logs/` 파일을 AI에게 컨텍스트로 제공
3. AI가 `.directions/steps/step[N]_기능명.md` 를 보고 스펙 작성
   - 대규모 작업: `templates/spec_template.md` 참고
   - 소규모 수정: `templates/spec_template_minor.md` 참고
4. 스펙 확인 및 승인 후 구현 시작

### 세션 종료 시
1. `templates/session_report_template.md` 프롬프트를 AI에게 전달
2. AI가 생성한 세션 요약 → `logs/` 에 저장
3. 이슈가 있었다면 → `issues/` 에 저장

### AI 결과물 저장
- AI가 생성한 JSON, 가이드, 분석 문서 등은 `artifacts/` 에 저장
- 파일명 형식: `YYYYMMDD_설명.md`

## 파일명 규칙

| 문서 종류 | 위치 | 파일명 형식 |
|-----------|------|-------------|
| 기능 지시 | `.directions/steps/` | `step[N]_기능명.md` |
| 수정 지시 | `.directions/steps/` | `step[N]-[N]_기능명_수정.md` |
| 기능 스펙 | `.ai-docs/specs/` | `step[N]_기능명.md` (.directions와 1:1 대응) |
| 세션 요약 | `.ai-docs/logs/` | `step[N]_session[N]_YYYYMMDD.md` |
| 이슈 로그 | `.ai-docs/issues/` | `issue_step[N]_카테고리_YYYYMMDD.md` |
| AI 결과물 | `.ai-docs/artifacts/` | `YYYYMMDD_설명.md` |
| 조사 자료 | `.directions/research/` | `YYYYMMDD_주제.md` |
| 참고 자료 | `.directions/references/` | `YYYYMMDD_주제.md` |
