# Implementation Plan: Timeline UI Upgrade

## Overview

기존 카드 리스트 기반 주간 레이아웃을 Google Calendar 스타일의 시간축 그리드로 전환하고, 파일 기반 Import/Export 기능을 추가하며, 인라인 편집 기능을 개선하는 구현 계획이다. 기존 유틸리티 모듈의 인터페이스는 변경하지 않으며, UI 레이어와 파일 처리 레이어를 중심으로 변경한다.

## Tasks

- [x] 1. 유틸리티 모듈 구현
  - [x] 1.1 overlapCalculator 유틸리티 구현
    - `src/utils/overlapCalculator.ts` 파일 생성
    - `BlockLayout` 인터페이스 정의 (blockId, top, height, width, left)
    - `timeToMinutes(time: string): number` 헬퍼 함수 구현
    - `calculateTop(startTime, totalHeight)` 함수 구현: (minutes / 1440) × totalHeight
    - `calculateHeight(durationMinutes, totalHeight)` 함수 구현: 최소 높이 max(20분 분량, 28px) 보장
    - 겹침 판정 로직 구현: A.start < B.end AND B.start < A.end
    - 겹침 그룹 구성 및 너비/위치 계산: 그룹 내 N개 블록 → width=(100/N)%, left=(index×100/N)%
    - `calculateBlockLayouts(blocks, totalHeight): BlockLayout[]` 메인 함수 구현
    - _Requirements: 10.1, 10.2, 10.3, 17.1, 17.2, 17.3, 18.1, 18.2, 18.3_

  - [x] 1.2 overlapCalculator 단위 테스트 작성
    - 겹치지 않는 블록 배치 테스트
    - 2개, 3개, N개 겹침 블록 너비/위치 계산 테스트
    - top/height 계산 정확성 테스트
    - 최소 높이 보장 테스트
    - 경계값(00:00, 23:59) 테스트
    - _Requirements: 17.1, 17.2, 17.3, 18.1, 18.2, 18.3_

  - [x] 1.3 fileParser 유틸리티 구현
    - `src/utils/fileParser.ts` 파일 생성
    - `FileParseResult` 타입 정의 (success/error 유니온)
    - `ParserFunction` 타입 정의
    - `parsers` 레지스트리 구현 (확장 가능 구조)
    - `.json` 파서: JSON.parse 시도, 성공 시 jsonString 반환
    - `.txt` 파서: 텍스트 읽기 후 JSON.parse 시도, 실패 시 오류 메시지
    - 미지원 확장자 오류 처리: "현재 .json과 .txt 파일만 지원합니다."
    - BOM(U+FEFF) 제거 처리
    - `parseFile(file: File): Promise<FileParseResult>` 메인 함수 구현 (FileReader API 사용)
    - 10MB 파일 크기 제한 검증
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 16.2_

  - [x] 1.4 fileParser 단위 테스트 작성
    - .json 파일 정상 파싱 테스트
    - .txt 파일 JSON 내용 파싱 테스트
    - .txt 파일 비-JSON 내용 오류 테스트
    - 미지원 확장자 오류 테스트
    - BOM 포함 파일 처리 테스트
    - 10MB 초과 파일 거부 테스트
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 16.2_

- [x] 2. Checkpoint - 유틸리티 모듈 검증
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. 타임라인 그리드 핵심 컴포넌트 구현
  - [x] 3.1 TimelineGrid 컴포넌트 구현
    - `src/components/TimelineGrid.tsx` 파일 생성
    - HOUR_HEIGHT(60px), TOTAL_HEIGHT(1440px), MIN_COLUMN_WIDTH(80px) 상수 정의
    - TimeLabels 내부 컴포넌트: 00:00~23:00 좌측 시간 라벨 렌더링
    - DayHeader 내부 컴포넌트: sticky position 요일+날짜 헤더
    - 30분 단위 Guide_Line 배경 수평선 렌더링
    - 초기 로드 시 06:00 위치로 스크롤 (useEffect + scrollTop)
    - 컬럼 최소 80px 너비, 부족 시 overflow-x-auto 가로 스크롤
    - Props 인터페이스 정의 (days, weekDates, completionRecords, 핸들러들)
    - 각 DayColumn 영역에서 overlapCalculator 호출하여 BlockLayout 계산
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 3.2 CurrentTimeIndicator 컴포넌트 구현
    - `src/components/CurrentTimeIndicator.tsx` 파일 생성
    - KST(Asia/Seoul, UTC+9) 기준 현재 시간 계산
    - top 위치 = (현재시간_분 / 1440) × TOTAL_HEIGHT
    - 1분마다 setInterval로 위치 업데이트
    - 빨간색(#EF4444) 실선, width: 100%, z-index로 블록 위에 표시
    - 컴포넌트 언마운트 시 interval 정리 (cleanup)
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 3.3 TimelineBlock 컴포넌트 구현
    - `src/components/TimelineBlock.tsx` 파일 생성
    - Props 인터페이스 정의 (block, dayValue, top, height, width, left, isCompleted 등)
    - position: absolute, top/height/width/left를 props로 받아 배치
    - block.color 배경색 적용 (opacity 조절)
    - 높이 ≥ 40px: 제목, 시간, 카테고리, 중요도 모두 표시
    - 높이 < 40px: 제목만 표시
    - 최소 표시 높이: max(20분 분량 px, 28px)
    - 펜 아이콘 버튼 (수정 모달 진입)
    - 삭제 버튼 제공
    - 짧은 블록(duration < 20분): 상하 6px Hit_Area 확장
    - 너비 < 80px 시 제목만 표시
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 9.1, 9.2, 9.5, 10.4, 11.1_

  - [x] 3.4 BlockPopover 컴포넌트 구현
    - `src/components/BlockPopover.tsx` 파일 생성
    - Props 인터페이스 정의 (block, dayValue, anchorRect, 핸들러들)
    - hover(데스크톱) 또는 tap(모바일) 시 표시
    - 시간, 카테고리, 중요도, 메모 등 상세 정보 표시
    - 펜 아이콘으로 수정 모달 진입 가능
    - 삭제 버튼 포함
    - 블록 외부 클릭 시 닫힘
    - _Requirements: 9.3, 9.4, 10.5, 11.3, 14.1_

- [x] 4. Checkpoint - 타임라인 그리드 기본 렌더링 검증
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. 인라인 편집 컴포넌트 구현
  - [x] 5.1 CategoryCombobox 컴포넌트 구현
    - `src/components/CategoryCombobox.tsx` 파일 생성
    - Props: value, allCategories, onChange
    - 기존 카테고리 드롭다운 목록 제공
    - 새 카테고리 직접 입력 가능한 텍스트 필드
    - 선택/입력 시 즉시 onChange 호출
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 5.2 PriorityDropdown 컴포넌트 구현
    - `src/components/PriorityDropdown.tsx` 파일 생성
    - Props: value, onChange
    - high, medium, low 세 가지 옵션 제공
    - 선택 시 즉시 onChange 호출
    - _Requirements: 13.1, 13.2, 13.3_

  - [x] 5.3 BlockPopover에 인라인 편집 위젯 통합
    - BlockPopover 내부에 CategoryCombobox 연동
    - BlockPopover 내부에 PriorityDropdown 연동
    - 인라인 편집 시 updateBlock → Storage_Manager 저장 흐름 연결
    - _Requirements: 12.4, 13.3, 14.1, 14.2_

- [x] 6. Import/Export 기능 구현
  - [x] 6.1 ImportPanel 컴포넌트 구현
    - `src/components/ImportPanel.tsx` 파일 생성 (기존 JsonImportPanel 대체)
    - 탭 UI로 "파일" / "텍스트" 섹션 분리
    - 파일 탭: FileDropZone + FileSelectButton 구현
    - FileDropZone: onDragEnter/Over/Leave/Drop 이벤트 처리
    - 드래그 시 시각적 하이라이트 (테두리 파란색, 배경 연파란)
    - 드롭 시 첫 번째 파일만 처리, 10MB 초과 시 오류
    - FileSelectButton: input[type=file] accept=".json,.txt" 연동
    - 텍스트 탭: 기존 텍스트 붙여넣기 영역 유지
    - fileParser 모듈 호출하여 파일 파싱 후 기존 onImport 핸들러 연결
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 5.1, 5.2, 5.3_

  - [x] 6.2 ExportJsonPanel 다운로드 기능 추가
    - 기존 `src/components/ExportJsonPanel.tsx` 수정
    - "다운로드" 버튼 추가 (기존 "복사" 버튼 유지)
    - 파일명 생성: `{routine_name}_{YYYYMMDD}.json`
    - routine_name 파일명 불가 문자(/, \, :, *, ?, ", <, >, |) → 밑줄(_) 치환
    - Blob + URL.createObjectURL + <a> 태그 click으로 다운로드 구현
    - Props에 routineName 추가
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 6.3 ImportPanel/ExportPanel 단위 테스트 작성
    - 파일 드롭 처리 테스트
    - 파일 크기 초과 오류 테스트
    - 탭 전환 동작 테스트
    - 다운로드 파일명 생성 로직 테스트
    - 특수문자 치환 테스트
    - _Requirements: 1.3, 2.5, 2.6, 16.1_

- [x] 7. App.tsx 통합 및 기존 컴포넌트 정리
  - [x] 7.1 App.tsx 리팩토링
    - `WeeklyScheduleView` → `TimelineGrid` 교체
    - `JsonImportPanel` → `ImportPanel` 교체
    - `ExportJsonPanel`에 `routineName` prop 추가
    - `handleUpdateBlockInline` 핸들러 추가 (인라인 편집용)
    - `allCategories` useMemo 계산 로직 추가
    - TimelineGrid에 onUpdateBlock prop 연결
    - _Requirements: 6.1, 7.1, 11.2, 12.4, 13.3, 14.2_

  - [x] 7.2 RoutineEditorModal 5분 단위 시간 선택 개선
    - `src/components/RoutineEditorModal.tsx` 수정
    - 시간 입력 `<input type="time">`에 `step="300"` 속성 추가
    - _Requirements: 15.1, 15.2, 15.3_

  - [x] 7.3 기존 컴포넌트 삭제
    - `src/components/WeeklyScheduleView.tsx` 삭제 (TimelineGrid로 대체)
    - `src/components/DayColumn.tsx` 삭제 (TimelineGrid 내부로 통합)
    - `src/components/RoutineBlock.tsx` 삭제 (TimelineBlock으로 대체)
    - `src/components/JsonImportPanel.tsx` 삭제 (ImportPanel로 대체)
    - _Requirements: 19.5, 19.6_

- [x] 8. Checkpoint - 전체 통합 검증
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. 통합 테스트 및 최종 검증
  - [x] 9.1 타임라인 렌더링 통합 테스트 작성
    - TimelineGrid가 블록을 올바른 위치에 렌더링하는지 테스트
    - 겹침 블록 나란히 배치 테스트
    - 초기 스크롤 위치(06:00) 테스트
    - CurrentTimeIndicator 렌더링 테스트
    - _Requirements: 6.5, 7.1, 7.2, 8.1, 10.1, 10.2, 10.3_

  - [x] 9.2 인라인 편집 통합 테스트 작성
    - CategoryCombobox 선택/입력 → updateBlock 호출 테스트
    - PriorityDropdown 변경 → updateBlock 호출 테스트
    - 펜 아이콘 클릭 → 모달 열림 테스트
    - 삭제 버튼 → deleteBlock 호출 테스트
    - _Requirements: 11.2, 12.4, 13.3, 14.2_

  - [x] 9.3 파일 Import/Export 라운드트립 테스트 작성
    - Export → Import 시 데이터 동일성 검증
    - BOM 포함 파일 처리 테스트
    - 다양한 확장자 오류 처리 테스트
    - _Requirements: 16.1, 16.2_

- [x] 10. Final Checkpoint - 전체 테스트 통과 확인
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- 태스크에 `*` 표시된 항목은 선택적이며 빠른 MVP를 위해 건너뛸 수 있습니다
- 각 태스크는 특정 요구사항을 참조하여 추적 가능합니다
- 기존 유틸리티 모듈(Parser, Pretty_Printer, Storage_Manager, weekUtils, idGenerator)의 인터페이스는 변경하지 않습니다
- 드래그 편집 기능은 이번 단계에서 제외됩니다 (Requirement 19)
- 외부 라이브러리 추가 없이 기존 의존성(React 19, Vite, Tailwind CSS, Vitest, fast-check)만 사용합니다
- Checkpoint에서 문제 발생 시 사용자에게 확인합니다

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3"] },
    { "id": 1, "tasks": ["1.2", "1.4"] },
    { "id": 2, "tasks": ["3.1", "3.2", "5.1", "5.2"] },
    { "id": 3, "tasks": ["3.3", "3.4", "6.1", "6.2"] },
    { "id": 4, "tasks": ["5.3", "6.3", "7.2"] },
    { "id": 5, "tasks": ["7.1"] },
    { "id": 6, "tasks": ["7.3"] },
    { "id": 7, "tasks": ["9.1", "9.2", "9.3"] }
  ]
}
```
