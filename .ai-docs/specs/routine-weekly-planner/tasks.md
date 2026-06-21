# Implementation Plan: Routine Weekly Planner

## Overview

ADHD 사용자를 위한 주간 루틴 관리 웹앱 구현. JSON 가져오기/내보내기, 주간 스케줄 시각화, 날짜별 완료 체크, 블록 CRUD, localStorage 저장을 포함한다.

## Tasks

- [x] 1. 프로젝트 초기 설정 및 타입 정의
  - [x] 1.1 Vite + React + TypeScript 프로젝트 초기화 및 Tailwind CSS 설정
  - [x] 1.2 `src/types/index.ts` 생성: DayValue, Priority, Block, DayData, SleepInfo, RoutineData, CompletionRecords, AppState 타입 정의
  - [x] 1.3 `src/utils/sampleData.ts` 생성: 샘플 RoutineData 작성 (7일, 다양한 블록 포함)
  - [x] 1.4 폴더 구조 생성: types/, utils/, components/, hooks/
- [x] 2. ID 생성 및 주간 날짜 유틸리티
  - [x] 2.1 `src/utils/idGenerator.ts` 구현: generateId(), deduplicateIds() 함수
  - [x] 2.2 `src/utils/weekUtils.ts` 구현: getMonday(), getWeekDates(), formatDate(), addWeeks(), getDayValueFromDate() 함수
  - [x] 2.3 Write property test: deduplicateIds 후 모든 ID가 고유한지 검증 (Property 3: ID Uniqueness) `[pbt]`
  - [x] 2.4 Write property test: getWeekDates가 항상 7개 날짜를 반환하고 월요일부터 시작하는지 검증 `[pbt]`
- [x] 3. JSON Parser 구현
  - [x] 3.1 `src/utils/parser.ts` 구현: parseRoutineJson() 메인 함수 - JSON.parse 및 routine_name, days 배열 검증
  - [x] 3.2 Block 유효성 검증 구현: title/start/end 필수 필드, Time_Format(HH:mm), priority 값, end > start 시간 검증
  - [x] 3.3 기본값 보정 구현: color 기본값, id 자동 생성, duration_minutes 재계산, priority 기본값
  - [x] 3.4 누락 요일 자동 생성 구현: 7개 요일 중 빠진 요일을 빈 blocks로 추가
  - [x] 3.5 중복 ID 보정 통합: deduplicateIds 호출
  - [x] 3.6 Write property test: 파싱 성공 후 항상 7개 요일이 존재하는지 검증 (Property 5: Seven Days Invariant) `[pbt]`
  - [x] 3.7 Write property test: 파싱 성공 후 모든 block의 duration_minutes가 start/end 차이와 일치하는지 검증 (Property 4: Duration Consistency) `[pbt]`
  - [x] 3.8 Write property test: 파싱 성공 후 모든 block의 end > start인지 검증 (Property 7: Time Validity) `[pbt]`
- [x] 4. Pretty Printer 및 라운드트립
  - [x] 4.1 `src/utils/prettyPrinter.ts` 구현: routineDataToJson() 함수 (2-space 들여쓰기)
  - [x] 4.2 Write property test: parse(print(data)) ≡ data 라운드트립 검증 (Property 1: Parser Round-Trip) `[pbt]`
- [x] 5. Storage Manager 구현
  - [x] 5.1 `src/utils/storageManager.ts` 구현: saveRoutineData(), loadRoutineData(), saveCompletionRecords(), loadCompletionRecords(), clearAllData() 함수
  - [x] 5.2 에러 핸들링: localStorage 접근 실패 시 try-catch 처리
- [x] 6. 상태 관리 커스텀 훅
  - [x] 6.1 `src/hooks/useRoutineState.ts` 구현: routineData, completionRecords 상태 관리, 앱 시작 시 localStorage 로드, 샘플 데이터 폴백
  - [x] 6.2 블록 CRUD 핸들러 구현: addBlock, updateBlock, deleteBlock (저장 후 자동 정렬 및 localStorage 저장)
  - [x] 6.3 완료 체크 핸들러 구현: toggleCompletion(date, blockId) - CompletionRecords 업데이트 및 localStorage 저장
  - [x] 6.4 `src/hooks/useWeekNavigation.ts` 구현: selectedWeekStart 상태, goToPrevWeek, goToNextWeek, goToToday 핸들러
  - [x] 6.5 Write property test: 블록 추가/수정 후 해당 요일의 blocks가 start 시간 기준 정렬되어 있는지 검증 (Property 2: Time Sorting Invariant) `[pbt]`
- [x] 7. Header 및 Week Navigation UI
  - [x] 7.1 `src/components/Header.tsx` 구현: 앱 제목, 루틴 이름, Import/Export 버튼, 저장 상태 표시
  - [x] 7.2 `src/components/WeekNavigation.tsx` 구현: 현재 주 날짜 범위 표시, 이전/다음/오늘 버튼
- [x] 8. WeeklyScheduleView 및 DayColumn
  - [x] 8.1 `src/components/WeeklyScheduleView.tsx` 구현: 7개 DayColumn 가로 배치, overflow-x-auto 가로 스크롤, min-width 설정
  - [x] 8.2 `src/components/DayColumn.tsx` 구현: 요일 이름 + 날짜 헤더, blocks를 start 시간순 렌더링, 블록 추가 버튼
- [x] 9. RoutineBlock 컴포넌트
  - [x] 9.1 `src/components/RoutineBlock.tsx` 구현: 제목, 시간, 카테고리, 중요도 배지, 완료 체크박스, 수정/삭제 버튼
  - [x] 9.2 블록 높이 비례 렌더링: duration_minutes 기반 높이 계산 (inline style)
  - [x] 9.3 색상 적용: Block의 color를 border-left 색상으로 적용
  - [x] 9.4 완료 상태 스타일: 완료 시 opacity-50 + line-through 적용
  - [x] 9.5 Priority 배지: high(빨강), medium(노랑), low(초록) 색상 배지
- [x] 10. RoutineEditorModal 구현
  - [x] 10.1 `src/components/RoutineEditorModal.tsx` 구현: 제목, 요일, 시작/종료 시간, 카테고리, 중요도, 색상, 필수 여부, 메모 입력 폼
  - [x] 10.2 폼 유효성 검증: 필수 필드 확인, 시간 유효성(end > start) 확인, 인라인 오류 메시지
  - [x] 10.3 추가/수정 모드 분기: 빈 폼(추가) vs 기존 값 채움(수정)
  - [x] 10.4 저장/취소 버튼 동작 구현
- [x] 11. JSON Import Panel 및 덮어쓰기 확인
  - [x] 11.1 `src/components/JsonImportPanel.tsx` 구현: 텍스트 영역, 가져오기 버튼, 오류 메시지 표시
  - [x] 11.2 `src/components/OverwriteConfirmDialog.tsx` 구현: 확인/취소 버튼이 있는 다이얼로그
  - [x] 11.3 가져오기 플로우 통합: 기존 데이터 존재 시 확인 다이얼로그 → 확인 시 덮어쓰기, 취소 시 유지
- [x] 12. JSON Export Panel
  - [x] 12.1 `src/components/ExportJsonPanel.tsx` 구현: Pretty_Printer로 변환된 JSON 표시, 클립보드 복사 버튼
  - [x] 12.2 클립보드 복사 기능: navigator.clipboard.writeText 사용, 복사 완료 피드백
- [x] 13. App 통합 및 최종 연결
  - [x] 13.1 `src/App.tsx` 구현: useRoutineState, useWeekNavigation 훅 연결, 모든 컴포넌트 조합
  - [x] 13.2 앱 시작 시 데이터 로드: localStorage에서 불러오기, 없으면 샘플 데이터 표시
  - [x] 13.3 전체 플로우 테스트: JSON 가져오기 → 표시 → 수정 → 저장 → 새로고침 후 유지 확인
  - [x] 13.4 UI 다듬기: Tailwind 스타일 조정, 반응형 가로 스크롤 확인, 전체적인 레이아웃 정리

## Task Dependency Graph

```json
{
  "waves": [
    {"tasks": ["1"]},
    {"tasks": ["2", "5"]},
    {"tasks": ["3"]},
    {"tasks": ["4", "6"]},
    {"tasks": ["7", "8", "9", "10", "11", "12"]},
    {"tasks": ["13"]}
  ]
}
```

## Notes

- 테스트 프레임워크: Vitest + fast-check (property-based testing)
- 시간 겹침은 허용 (경고/오류 없음)
- 자정 넘김 시간은 MVP에서 지원하지 않음
- Block 데이터에 completed 필드 없음 - CompletionRecords로 분리 관리
- localStorage 키: `routine-manager-current-routine`, `routine-manager-completion-records`
