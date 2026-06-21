# Routine_for_adhd

> ADHD 사용자를 위한 주간 루틴 관리 웹앱. JSON을 붙여넣거나 파일로 가져와 24시간 시간축 그리드로 주간 루틴을 시각화하고, 블록을 추가·수정·삭제하며 날짜별 완료를 체크한다.

## 프로젝트 구조

```
Routine_for_adhd/
├── .directions/    ← 사람 주도 매니징 문서 (목표, step별 기능 지시, 조사·참고 자료)
├── .ai-docs/       ← AI 협업 문서 (스펙, 세션 로그, 이슈, 템플릿, 산출물)
├── .kiro/          ← Kiro IDE 스펙/스티어링 (원본 스펙 보관)
├── src/            ← 소스 코드 (components, hooks, utils, types)
├── index.html
├── package.json
├── .gitignore
├── README.md
└── CHANGELOG.md
```

> 테스트는 별도 `tests/` 폴더 없이 소스 옆에 `*.test.ts(x)` 형태로 같이 둔다(co-located).

## 기술 스택

- React 19 + TypeScript
- Vite (개발 서버 / 빌드)
- Tailwind CSS v4
- Vitest + fast-check (단위 테스트 + 속성 기반 테스트)
- 데이터 저장: 브라우저 localStorage (서버 없음)

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 테스트 실행
npm test
```

## AI 협업 워크플로우

문서는 두 영역으로 나뉜다.

- `.directions/` — 내가 직접 작성하는 매니징 문서 (`steps/`에 자연어로 기능 지시, `steps/cowork/`에 Cowork 대화 정리본 → Claude Code 지시용)
- `.ai-docs/` — AI가 작성하는 스펙(`specs/`), 세션 로그(`logs/`), 이슈(`issues/`), 산출물(`artifacts/`)

세션 시작 시 `.directions/steps/step[N]_기능명.md`를 작성해 AI에게 전달하면, AI가 `.ai-docs/specs/`에 스펙을 작성하고 승인 후 구현한다. 세션 종료 시 `.ai-docs/templates/session_report_template.md` 프롬프트로 로그/이슈를 생성한다. 자세한 내용은 `.ai-docs/README.md` 참고.
