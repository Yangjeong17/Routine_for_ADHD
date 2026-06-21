# .directions/

프로젝트 매니징 문서 저장소. 내가 직접 작성하는 문서만 여기에 들어온다.
AI가 생성한 문서는 `.ai-docs/` 에 저장한다.

## 폴더 구조

```
.directions/
├── overview/      ← 프로젝트 전체 목표, 아이디어, 디자인 방향, 폴더 구조 등
├── steps/         ← step별 기능 지시 (자연어로 작성)
├── research/      ← 외부에서 가져온 정보, 오류 조사 결과, 사전 조사
└── references/    ← UI 레퍼런스, 참고 자료, 디자인 예시
```

## 파일명 규칙

| 폴더 | 파일명 형식 | 예시 |
|------|------------|------|
| `overview/` | `주제.md` | `architecture.md`, `design_direction.md` |
| `steps/` | `step[N]_기능명.md` | `step1_auth.md` |
| `steps/` (수정) | `step[N]-[N]_기능명_수정.md` | `step1-1_auth_수정.md` |
| `research/` | `YYYYMMDD_주제.md` | `20260617_supabase_rls.md` |
| `references/` | `YYYYMMDD_주제.md` | `20260617_calendar_ui.md` |

## 워크플로우에서의 역할

1. `steps/step[N]_기능명.md` 에 구현할 기능을 자연어로 작성
2. AI에게 해당 파일 제공 → AI가 `.ai-docs/specs/` 에 스펙 작성
3. 스펙 확인 후 승인 → 구현 시작

> 이 폴더는 `.gitignore` 에 포함되어 git에서 제외된다.
