#!/usr/bin/env python3
"""
init_ai_docs.py
---------------
새 프로젝트 시작 시 표준 프로젝트 구조와 .ai-docs/ 폴더를 자동 생성하는 스크립트.

사용법 (두 가지 방식):
  방식 A - --target 으로 경로 지정 (원본 스크립트 유지, 권장):
    python init_ai_docs.py --target /path/to/my_new_project
    → 지정한 경로에 전체 구조 생성, 스크립트는 제자리 유지

  방식 B - 프로젝트 폴더에 복사 후 실행 (스크립트 자동 삭제):
    python init_ai_docs.py
    → 스크립트가 있는 폴더 안에 전체 구조 생성 후 스크립트 자동 삭제

  dry-run (실제 생성 없이 미리보기):
    python init_ai_docs.py --target /path/to/my_new_project --dry-run

  프로젝트 이름 직접 지정:
    python init_ai_docs.py --target /path/to/my_new_project --name my_app
"""

import os
import sys
import argparse
import shutil
from pathlib import Path
from datetime import date


# ──────────────────────────────────────────────
# 템플릿 파일 내용
# ──────────────────────────────────────────────

README_PROJECT_TEMPLATE = """\
# {PROJECT_NAME}

> 프로젝트 한 줄 설명을 여기에 작성하세요.

## 프로젝트 구조

```
{PROJECT_NAME}/
├── .ai-docs/       ← AI 협업 문서 (세션 로그, 이슈, 명세 등)
├── src/            ← 소스 코드
├── tests/          ← 테스트 코드
├── docs/           ← 사람이 읽는 문서 (API 명세, 가이드 등)
├── scripts/        ← 빌드, 배포, 유틸 스크립트
├── .gitignore
├── README.md
└── CHANGELOG.md
```

## 시작하기

```bash
# 의존성 설치
# TODO: 설치 명령어 작성

# 개발 서버 실행
# TODO: 실행 명령어 작성
```

## AI 협업 워크플로우

`.ai-docs/README.md` 참고.
"""

CHANGELOG_TEMPLATE = f"""\
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - {date.today().isoformat()}

### Added
- 초기 프로젝트 구조 생성
"""

GITIGNORE_TEMPLATE = """\
# ==========================================
# 환경변수 & 시크릿 (절대 올리면 안 됨)
# ==========================================
.env
.env.*
.env.local
.env.development
.env.staging
.env.production
# 예시 파일은 허용
!.env.example

*.pem
*.key
*.p12
*.pfx
*.cer
*.crt
secrets/
secret.*
credentials/
credentials.*

# ==========================================
# 클라우드 & 서비스 인증
# ==========================================
.aws/
.gcp/
.azure/
gcloud/
serviceAccount*.json
*-service-account*.json
firebase*.json
# firebase 설정은 허용
!firebase.json

# ==========================================
# API 키, 토큰이 박힐 수 있는 파일들
# ==========================================
config/secrets.*
config/local.*
*.config.local.*

# ==========================================
# OS 시스템 파일
# ==========================================
.DS_Store
.DS_Store?
Thumbs.db
desktop.ini

# ==========================================
# 에디터 & IDE
# 개인 설정만 제외 (extensions.json은 공유 가능)
# ==========================================
.vscode/settings.json
.idea/
*.swp
*.swo

# ==========================================
# 로그 & 임시 파일
# ==========================================
*.log
logs/
tmp/
temp/
cache/

# ==========================================
# 의존성 (언어별로 필요한 것만 추가)
# ==========================================
node_modules/
__pycache__/
*.pyc
.venv/
venv/
"""

AI_DOCS_README_TEMPLATE = """\
# AI 협업 문서 구조 가이드

이 폴더는 AI(Kiro, ChatGPT 등)와의 협업 세션을 관리하기 위한 문서 저장소입니다.

## 폴더 구조

```
.ai-docs/
  README.md           ← 이 파일. 워크플로우 전체 설명
  templates/          ← 세션 시작/종료 시 AI에게 전달하는 프롬프트 템플릿
  logs/               ← 세션 종료 후 생성되는 인수인계 요약 문서
  issues/             ← 세션 중 발생한 이슈 로그
  specs/              ← 기능 구현 전 작성하는 단계별 명세 (step1.md, step2.md ...)
    examples/         ← 명세 작성 참고용 예시 파일
  artifacts/          ← AI가 생성한 결과물 (JSON, 분석 문서, 가이드 등)
```

## 워크플로우

### 세션 시작 시
1. 최신 `logs/session_N_xxx.md` 파일을 AI에게 컨텍스트로 제공
2. 구현할 기능이 있다면 `specs/` 안의 해당 step 파일도 함께 제공

### 세션 종료 시
1. `templates/session_summary.md` 프롬프트를 AI에게 전달
2. AI가 생성한 세션 요약 → `logs/` 에 저장
3. 이슈가 있었다면 이슈 로그 → `issues/` 에 저장

### 기능 추가 시
1. `specs/` 에 `step[N]_기능명.md` 형식으로 명세 작성 (`examples/` 참고)
2. AI에게 해당 파일을 컨텍스트로 제공 후 구현 요청

### AI 결과물 저장
- AI가 생성한 JSON, 가이드, 분석 문서 등은 `artifacts/` 에 저장
- 파일명 권장 형식: `YYYYMMDD_설명.md`

## 파일명 규칙

| 문서 종류 | 파일명 형식 |
|-----------|-------------|
| 세션 요약 | `session_[N]_[작업내용]_[YYYYMMDD]_[프로젝트명].md` |
| 이슈 로그 | `issue_log_session_[N]_[카테고리]_[YYYYMMDD]_[프로젝트명].md` |
| 기능 명세 | `step[N]_[기능명].md` |
| AI 결과물 | `YYYYMMDD_[설명].md` (자유 형식) |
"""

SESSION_SUMMARY_TEMPLATE = """\
[System Directive]
Role: Technical Project Manager
Task: 세션 기록 분석, 무손실 인수인계서(Handover Document) 작성 및 이슈 로그 문서 분리 생성

[Input Context]
- 이 프롬프트는 현재 세션의 전체 대화 내역을 기반으로 작성할 것.
- 이전 세션 문서가 있으면 `.ai-docs/logs/` 폴더에서 최신 번호를 확인하여 N+1로 생성.

[Project Info]
- 프로젝트명: {PROJECT_NAME}

[Pre-condition]
- 저장 경로 폴더가 존재하지 않으면 생성할 것.

[Output Specifications]
아래 두 가지 문서를 각각의 경로와 규칙에 맞게 분리하여 생성할 것.

1. Session Summary Document:
- 저장 경로: `.ai-docs/logs/`
- 파일명 규칙: `session_[N+1]_[주요작업내용]_[YYYYMMDD]_[프로젝트명].md` (작성 당일 기준)
- 최상단 명시: `**저장 경로 및 파일명: .ai-docs/logs/[생성된 파일명]**`

2. Issue Log Document (작업 중 이슈가 발생한 경우 필수 생성):
- 저장 경로: `.ai-docs/issues/`
- 파일명 규칙: `issue_log_session_[N+1]_[이슈카테고리]_[YYYYMMDD]_[프로젝트명].md`
- 최상단 명시: `**저장 경로 및 파일명: .ai-docs/issues/[생성된 파일명]**`

[Content Requirements - 1. Session Summary]
(주의: 정보 축약 불가. 발생한 에러의 상세 해결 과정은 Issue Log 문서로 이관할 것)
1. Project Overview: 본 작업의 최종 목적 및 핵심 목표.
2. Prompt History & Logic: 사용자가 입력한 핵심 프롬프트 원문(시간순) 및 AI의 작업 수행 논리.
3. Generated Files & Artifacts: 생성/수정된 모든 파일의 목록, 생성 목적, 시스템 내 역할.
4. Current Status & Issues: 현재 작업의 완료 지점 및 남아있는 주요 과제.
5. Next Steps: 후임자가 즉시 실행해야 할 우선순위 기반 Action Item 3가지 및 필수 환경 설정 주의 사항.

[Content Requirements - 2. Issue Log]
세션 진행 중 발생한 모든 에러 및 문제 상황을 상태별로 구분하여 기록할 것.
1. [해결 완료 (Resolved)]:
   - 발생한 문제의 원인 파악 내용.
   - 구체적인 해결 과정 및 실제 적용된 코드/설정 수정 내역 상세 기록.
   - 코드 변경은 반드시 before/after 코드 블록으로 표현.
2. [미해결 (Unresolved)]:
   - 항목 제목 앞에 `[REVIEW_REQUIRED]` 태그를 눈에 띄게 부착할 것.
   - 현재까지 시도한 방법, 실패 원인 분석, 사용자가 직접 확인하고 결정해야 할 사항 명시.

[Format Constraints]
- 엄격한 마크다운 형식 준수.
- 감정적, 수사적 표현을 배제하고 건조하고 명확한 기술 문서 톤 유지.
"""

ISSUE_LOG_TEMPLATE = """\
[System Directive]
Role: Technical Project Manager
Task: 세션 진행 중 발생한 이슈를 구조화된 이슈 로그 문서로 작성

[Project Info]
- 프로젝트명: {PROJECT_NAME}

[Output Specifications]
- 저장 경로: `.ai-docs/issues/`
- 파일명 규칙: `issue_log_session_[N]_[이슈카테고리]_[YYYYMMDD]_[프로젝트명].md`
- 최상단 명시: `**저장 경로 및 파일명: .ai-docs/issues/[생성된 파일명]**`

[Content Requirements]
세션 진행 중 발생한 모든 에러 및 문제 상황을 아래 구조로 기록:

## 1. 해결 완료 (Resolved)
각 항목마다:
- 발생 상황: 어떤 맥락에서 발생했는지
- 원인: 근본 원인 분석
- 해결 방법: 실제 적용한 코드/설정 변경 내역 (before/after 코드 블록 포함)
- 영향 범위: 수정된 파일 목록

## 2. 미해결 (Unresolved)
각 항목 제목 앞에 `[REVIEW_REQUIRED]` 태그 부착:
- 현재 상태
- 시도한 방법 및 실패 원인
- 사용자 확인/결정 필요 사항

[Format Constraints]
- 엄격한 마크다운 형식 준수.
- 건조하고 명확한 기술 문서 톤 유지.
"""

SPEC_EXAMPLE_TEMPLATE = """\
# step1 - 초기 설계 및 기반 구축 (예시)

> 이 파일은 예시입니다. 실제 명세 작성 시 이 형식을 참고하세요.
> 파일명 규칙: `step[N]_[기능명].md`
> 작성 후 이 examples/ 폴더의 파일은 참고용으로만 유지.

## 목표
이 단계에서 구현할 기능의 최종 목표를 한 문장으로 기술.

## 배경 / 이유
왜 이 기능이 필요한지, 어떤 문제를 해결하는지.

## 구현 범위

### 포함 (In Scope)
- 구현할 항목 1
- 구현할 항목 2

### 제외 (Out of Scope)
- 이번 단계에서 하지 않을 것
- 추후 단계로 미루는 것

## 상세 명세

### 데이터 구조 (필요 시)
```typescript
// 예시
interface ExampleType {
  id: string;
  name: string;
}
```

### UI/UX 요구사항 (필요 시)
- 화면 구성 설명
- 사용자 인터랙션 흐름

### 기술 요구사항
- 사용할 라이브러리/패턴
- 성능 요구사항
- 제약 조건

## 완료 기준 (Definition of Done)
- [ ] 체크리스트 항목 1
- [ ] 체크리스트 항목 2
- [ ] 빌드 에러 없음
- [ ] 기본 동작 확인

## 참고 자료
- 관련 문서 링크
- 참고할 기존 코드 경로
"""

DOCS_README_TEMPLATE = """\
# 문서 (docs/)

프로젝트 관련 사람이 읽는 문서를 여기에 작성합니다.

## 포함 항목 예시
- API 명세
- 아키텍처 설명
- 배포 가이드
- 사용자 가이드

> AI 협업 문서(세션 로그, 이슈, 명세)는 `.ai-docs/` 를 사용하세요.
"""

SCRIPTS_README_TEMPLATE = """\
# 스크립트 (scripts/)

빌드, 배포, 유틸리티 스크립트를 여기에 저장합니다.

## 파일명 규칙
- `build_*.sh` / `build_*.py` — 빌드 관련
- `deploy_*.sh` — 배포 관련
- `setup_*.sh` — 환경 설정 관련
"""

GITKEEP = ""


# ──────────────────────────────────────────────
# 폴더/파일 구조 정의
# ──────────────────────────────────────────────

def build_structure(project_name: str) -> dict:
    """생성할 전체 프로젝트 구조를 반환."""
    session_template = SESSION_SUMMARY_TEMPLATE.replace("{PROJECT_NAME}", project_name)
    issue_template = ISSUE_LOG_TEMPLATE.replace("{PROJECT_NAME}", project_name)
    project_readme = README_PROJECT_TEMPLATE.replace("{PROJECT_NAME}", project_name)

    return {
        # AI 협업 문서
        ".ai-docs": {
            "README.md": AI_DOCS_README_TEMPLATE,
            "templates": {
                "session_summary.md": session_template,
                "issue_log.md": issue_template,
            },
            "logs": {
                ".gitkeep": GITKEEP,
            },
            "issues": {
                ".gitkeep": GITKEEP,
            },
            "specs": {
                "examples": {
                    "step1_init_design.md": SPEC_EXAMPLE_TEMPLATE,
                },
            },
            "artifacts": {
                ".gitkeep": GITKEEP,
            },
        },
        # 소스 코드
        "src": {
            ".gitkeep": GITKEEP,
        },
        # 테스트
        "tests": {
            ".gitkeep": GITKEEP,
        },
        # 사람이 읽는 문서
        "docs": {
            "README.md": DOCS_README_TEMPLATE,
        },
        # 빌드/배포 스크립트
        "scripts": {
            "README.md": SCRIPTS_README_TEMPLATE,
        },
        # 루트 파일
        ".gitignore": GITIGNORE_TEMPLATE,
        "README.md": project_readme,
        "CHANGELOG.md": CHANGELOG_TEMPLATE,
    }


# ──────────────────────────────────────────────
# 파일 시스템 생성 로직
# ──────────────────────────────────────────────

def create_structure(base_path: Path, structure: dict, depth: int = 0, dry_run: bool = False):
    """재귀적으로 폴더와 파일을 생성. dry_run=True 이면 출력만 하고 실제 생성하지 않음."""
    for name, content in structure.items():
        current_path = base_path / name
        if isinstance(content, dict):
            indent = "  " * depth
            print(f"{indent}📁 {name}/")
            if not dry_run:
                current_path.mkdir(parents=True, exist_ok=True)
            create_structure(current_path, content, depth + 1, dry_run)
        else:
            indent = "  " * depth
            icon = "🔧" if name.startswith(".") else "📄"
            print(f"{indent}{icon} {name}")
            if not dry_run:
                current_path.write_text(content, encoding="utf-8")


# ──────────────────────────────────────────────
# 메인 실행
# ──────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="새 프로젝트 표준 구조와 .ai-docs/ 를 생성합니다.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
사용 예시:
  방식 A (경로 지정, 원본 스크립트 유지, 권장):
    python init_ai_docs.py --target ~/projects/my_new_app

  방식 B (프로젝트 폴더에 복사 후 실행, 스크립트 자동 삭제):
    python init_ai_docs.py

  dry-run (실제 생성 없이 미리보기):
    python init_ai_docs.py --target ~/projects/my_new_app --dry-run

  프로젝트 이름 직접 지정:
    python init_ai_docs.py --target ~/projects/my_app --name my_app
        """
    )
    parser.add_argument(
        "--target", "-t",
        type=str,
        default=None,
        help="생성할 프로젝트 폴더 경로 (기본값: 스크립트가 위치한 폴더)"
    )
    parser.add_argument(
        "--name", "-n",
        type=str,
        default=None,
        help="프로젝트 이름 (기본값: 타겟 폴더명)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="실제 파일을 생성하지 않고 생성될 구조만 미리 출력"
    )
    args = parser.parse_args()

    # 타겟 경로 결정
    script_path = Path(__file__).resolve()
    if args.target:
        target_path = Path(args.target).expanduser().resolve()
        is_copy_mode = False  # 방식 A: 경로 지정, 원본 유지
    else:
        target_path = Path.cwd()  # 터미널 현재 위치 기준
        is_copy_mode = (script_path.parent.resolve() == target_path.resolve())  # 심볼릭 링크 안전

    # 프로젝트 이름 결정
    project_name = args.name or target_path.name

    # dry-run 안내
    if args.dry_run:
        print(f"\n🔍 [DRY-RUN] 실제 파일은 생성되지 않습니다.")
        print(f"\n🚀 프로젝트: {project_name}")
        print(f"📂 경로: {target_path}\n")
        structure = build_structure(project_name)
        create_structure(target_path, structure, dry_run=True)
        print(f"\n(dry-run 완료. 실제 생성하려면 --dry-run 옵션을 제거하세요.)")
        sys.exit(0)

    # 이미 존재하는 항목 확인
    existing = [
        name for name in [".ai-docs", "src", "tests", "docs", "scripts", "README.md"]
        if (target_path / name).exists()
    ]
    if existing:
        print(f"⚠️  이미 존재하는 항목: {', '.join(existing)}")
        answer = input("계속 진행하시겠습니까? 기존 파일은 덮어씁니다. (y/N): ").strip().lower()
        if answer != "y":
            print("취소됨.")
            sys.exit(0)

    # .gitignore 백업 처리
    gitignore_path = target_path / ".gitignore"
    if gitignore_path.exists():
        backup_path = target_path / ".gitignore.bak"
        shutil.copy2(gitignore_path, backup_path)
        print(f"💾 기존 .gitignore → .gitignore.bak 으로 백업")

    # 구조 생성
    print(f"\n🚀 프로젝트: {project_name}")
    print(f"📂 경로: {target_path}\n")

    structure = build_structure(project_name)
    create_structure(target_path, structure)

    print(f"\n✅ 프로젝트 구조 생성 완료!")
    print(f"\n다음 단계:")
    print(f"  1. README.md 에 프로젝트 설명 작성")
    print(f"  2. .ai-docs/specs/ 에 step1_기능명.md 작성 후 AI와 구현 시작")
    print(f"  3. 세션 종료 시 .ai-docs/templates/session_summary.md 프롬프트 사용")

    # 방식 B: 스크립트 자동 삭제
    if is_copy_mode:
        print(f"\n🗑️  스크립트 자동 삭제 중... ({script_path.name})")
        script_path.unlink()
        print(f"   원본은 별도로 보관되어 있습니다.")


if __name__ == "__main__":
    main()
