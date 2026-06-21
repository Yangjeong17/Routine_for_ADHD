# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed
- 2026-06-20: 프로젝트 문서 체계를 표준 구조(`.directions/` + `.ai-docs/`)로 재정비.
  - `.directions/`(overview/steps/research/references) 신설, 기존 step 지시 문서 이동.
  - `.ai-docs/`에 README, templates(4종), specs, logs, issues 정리.
  - 로그·이슈를 새 파일명 규칙(`step[N]_session[N]_YYYYMMDD`, `issue_step[N]_카테고리_YYYYMMDD`)으로 개명.
  - 루트 README/CHANGELOG/.gitignore 정비.

## [step2] - 2026-06-01

### Changed
- 카드 리스트 기반 주간 레이아웃을 24시간 시간축 그리드(TimelineGrid)로 전환.

### Added
- 블록 겹침 자동 분할 배치, KST 현재 시각 빨간 실선(CurrentTimeIndicator).
- 파일 드래그앤드롭/선택 Import(.json/.txt), JSON 파일 다운로드 Export.
- BlockPopover 기반 인라인 편집 컴포넌트(CategoryCombobox, PriorityDropdown).

## [step1] - 2026-06-01

### Added
- 초기 주간 루틴 플래너 구현: JSON 가져오기/내보내기, 주간 스케줄 시각화, 날짜별 완료 체크, 블록 CRUD, localStorage 저장.
- Vitest + fast-check 기반 테스트 스위트.
