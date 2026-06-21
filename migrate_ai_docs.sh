#!/usr/bin/env bash
# ==============================================================================
# migrate_ai_docs.sh
# Routine_for_adhd 의 문서 체계를 project_init 표준으로 정리한다.
#   - 기존 파일을 새 이름/위치로 이동·개명 (git mv, 히스토리 보존)
#   - 이미 새로 생성된 중복 원본은 삭제 (git rm)
#   - 구 README / 자체 템플릿은 .ai-docs/archive 로 보관
#
# 사용법:
#   cd ~/Base/Dev/mini_project/Routine_for_adhd
#   bash migrate_ai_docs.sh --dry-run   # 미리보기 (아무것도 바꾸지 않음)
#   bash migrate_ai_docs.sh             # 실제 실행
#
# 되돌리기:
#   커밋 전이면  git reset --hard   /  git restore .
# ==============================================================================
set -euo pipefail

DRY_RUN=0
[ "${1:-}" = "--dry-run" ] && DRY_RUN=1

# 프로젝트 루트 확인
if [ ! -d ".ai-docs" ]; then
  echo "오류: 현재 폴더에 .ai-docs 가 없습니다. 프로젝트 루트에서 실행하세요." >&2
  exit 1
fi

[ "$DRY_RUN" -eq 1 ] && echo "=== [DRY-RUN] 미리보기 모드: 실제로 바뀌지 않습니다 ===" || true

# 이동/개명 (git mv 우선, 추적 안 된 파일이면 일반 mv)
mv_item() {
  local src="$1" dst="$2"
  if [ ! -e "$src" ]; then echo "  (건너뜀: 원본 없음) $src"; return 0; fi
  if [ -e "$dst" ]; then echo "  (건너뜀: 대상 존재) $dst"; return 0; fi
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "  MV  $src  ->  $dst"
  else
    mkdir -p "$(dirname "$dst")"
    git mv "$src" "$dst" 2>/dev/null || mv "$src" "$dst"
    echo "  MV  $src  ->  $dst"
  fi
}

# 삭제 (이미 새 파일로 재생성된 중복 원본)
rm_item() {
  local src="$1"
  if [ ! -e "$src" ]; then echo "  (건너뜀: 없음) $src"; return 0; fi
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "  RM  $src"
  else
    git rm -q "$src" 2>/dev/null || rm -f "$src"
    echo "  RM  $src"
  fi
}

echo ""
echo "== 1) 표준 폴더 보강 =="
if [ "$DRY_RUN" -eq 1 ]; then
  echo "  mkdir -p .directions/{overview,steps,research,references} .ai-docs/{specs,logs,issues,templates,artifacts,archive/templates}"
else
  mkdir -p .directions/overview .directions/steps .directions/research .directions/references
  mkdir -p .ai-docs/specs .ai-docs/logs .ai-docs/issues .ai-docs/templates .ai-docs/artifacts .ai-docs/archive/templates
fi

echo ""
echo "== 2) step 지시 이동 (.ai-docs/Directions/Steps -> .directions/steps) =="
# step_01, step_02 는 이미 .directions/steps 에 새로 생성됨 -> 원본 삭제
rm_item ".ai-docs/Directions/Steps/step_01_Spec_mode.md"
rm_item ".ai-docs/Directions/Steps/step_02_function_add_change.md"
mv_item ".ai-docs/Directions/Steps/step_03_error_audit.md"         ".directions/steps/step3_error_audit.md"
mv_item ".ai-docs/Directions/Steps/step_04_Eisenhower_urgent.md"   ".directions/steps/step4_eisenhower.md"
mv_item ".ai-docs/Directions/Steps/step_05_unsolved_and_add.md"    ".directions/steps/step5_unsolved_add.md"
mv_item ".ai-docs/Directions/Steps/step_06_detailed.md"            ".directions/steps/step6_detailed.md"
mv_item ".ai-docs/Directions/Steps/step_06-1_whole_part_review.md" ".directions/steps/step6-1_review.md"

echo ""
echo "== 3) 로그 개명 (.ai-docs/logs) =="
# step1/step2 세션은 이미 새 파일로 생성됨 -> 원본 삭제
rm_item ".ai-docs/logs/Session_1_전체구현_20260601_routine_adhd.md"
rm_item ".ai-docs/logs/Session_2_타임라인UI업그레이드_20260601_routine_adhd.md"
mv_item ".ai-docs/logs/Session_3_UI버그수정및카드리디자인_20260612_routine_adhd.md"  ".ai-docs/logs/step3_session1_20260612.md"
mv_item ".ai-docs/logs/Session_4_아이젠하워중요도및완료체크_20260612_routine_adhd.md" ".ai-docs/logs/step4_session1_20260612.md"
mv_item ".ai-docs/logs/Session_5_미해결항목정리및UI개선_20260612_routine_adhd.md"   ".ai-docs/logs/step5_session1_20260612.md"
mv_item ".ai-docs/logs/step_6_category_priority_ui_20260612_routine_adhd.md"        ".ai-docs/logs/step6_session1_20260612.md"
mv_item ".ai-docs/logs/session_6-1_summary_codefix_20260615.md"                     ".ai-docs/logs/step6_session2_20260615.md"

echo ""
echo "== 4) 이슈 개명 (.ai-docs/issues) =="
rm_item ".ai-docs/issues/IssueLog_Session_1_빌드에러_20260601_routine_adhd.md"
rm_item ".ai-docs/issues/IssueLog_Session_2_타임라인UI통합_20260601_routine_adhd.md"
mv_item ".ai-docs/issues/IssueLog_Session_3_UI버그수정_20260612_routine_adhd.md"            ".ai-docs/issues/issue_step3_uibug_20260612.md"
mv_item ".ai-docs/issues/IssueLog_Session_4_Priority타입전환및완료체크_20260612_routine_adhd.md" ".ai-docs/issues/issue_step4_priority_20260612.md"
mv_item ".ai-docs/issues/IssueLog_Session_5_헤더고정및리팩토링_20260612_routine_adhd.md"     ".ai-docs/issues/issue_step5_refactor_20260612.md"
mv_item ".ai-docs/issues/issue_step_6_build_errors_20260612_routine_adhd.md"                ".ai-docs/issues/issue_step6_build_20260612.md"
mv_item ".ai-docs/issues/issue_step_6-1_errors_20260615.md"                                 ".ai-docs/issues/issue_step6_session2_errors_20260615.md"

echo ""
echo "== 5) Directions 하위트리 -> 최상위 .directions/ =="
mv_item ".ai-docs/Directions/Spec/spec_routine_for_adhd.md"             ".directions/overview/spec_routine_for_adhd.md"
mv_item ".ai-docs/Directions/Spec/ai_prompt_templates.md"               ".directions/references/ai_prompt_templates.md"
mv_item ".ai-docs/Directions/UI/Scheduler_UI.png"                       ".directions/references/Scheduler_UI.png"
mv_item ".ai-docs/Directions/TAKE_AWAY/Session_direction.md"            ".directions/overview/session_direction.md"
mv_item ".ai-docs/Directions/Issues_investigate/cache_during_develop.md" ".directions/research/cache_during_develop.md"
mv_item ".ai-docs/Directions/steps.zip"                                 ".ai-docs/archive/steps.zip"

echo ""
echo "== 6) 구 README / 자체 템플릿 archive 보관 =="
mv_item ".ai-docs/ai_docs_README.md"                  ".ai-docs/archive/ai_docs_README.md"
mv_item ".ai-docs/templates/session_summary_v2.md"    ".ai-docs/archive/templates/session_summary_v2.md"
mv_item ".ai-docs/templates/ai_plan_template.md"      ".ai-docs/archive/templates/ai_plan_template.md"
mv_item ".ai-docs/templates/step_request_template.md" ".ai-docs/archive/templates/step_request_template.md"
# fix_request_template.md 는 표준과 동일하므로 그대로 유지

echo ""
echo "== 7) 빈 Directions 폴더 정리 =="
if [ "$DRY_RUN" -eq 1 ]; then
  echo "  (남은 항목이 없으면 .ai-docs/Directions 삭제 예정)"
else
  find .ai-docs/Directions -type d -empty -delete 2>/dev/null || true
  if [ -d ".ai-docs/Directions" ]; then
    echo "  주의: .ai-docs/Directions 에 옮기지 않은 항목이 남아 있어 삭제하지 않았습니다. 확인하세요:"
    find .ai-docs/Directions -type f
  else
    echo "  .ai-docs/Directions 삭제됨"
  fi
fi

echo ""
echo "=============================================================="
if [ "$DRY_RUN" -eq 1 ]; then
  echo "[DRY-RUN] 미리보기 완료. 실제 적용: bash migrate_ai_docs.sh"
else
  echo "완료. 'git status' 로 변경을 확인한 뒤 이상 없으면 commit 하세요."
  echo "되돌리기: git reset --hard  (커밋 전) / git restore ."
fi
echo "=============================================================="
