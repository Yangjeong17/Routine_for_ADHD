# Requirements Document

## Introduction

타임라인 UI 업그레이드는 기존 ADHD 주간 루틴 플래너의 주요 UI를 시간축 기반 레이아웃으로 전환하고, 파일 기반 Import/Export 기능을 추가하며, 인라인 편집 기능을 개선하는 대규모 리팩토링이다. 기존 카드 리스트 형태의 레이아웃을 Google Calendar 스타일의 시간축 그리드로 교체하여 시간대별 루틴 배치를 직관적으로 파악할 수 있게 한다. 드래그 편집(요일 이동, 시간 변경, 드래그 삭제, 모바일 터치)은 이번 단계에서 제외하며, 타임라인 레이아웃 안정화 후 별도 Spec으로 진행한다.

## Glossary

- **App**: 주간 루틴 플래너 웹 애플리케이션 전체
- **Timeline_Grid**: 좌측 24시간 시간 라벨과 7개 요일 컬럼으로 구성된 시간축 기반 주간 레이아웃 컴포넌트
- **Time_Label**: Timeline_Grid 좌측에 1시간 단위로 표시되는 시간 텍스트 (00:00~23:00)
- **Guide_Line**: Timeline_Grid 배경에 30분 단위로 표시되는 보조 수평선
- **Day_Header**: Timeline_Grid 상단에 고정 표시되는 요일 헤더 (월~일 + 날짜)
- **Timeline_Block**: 시간축 위에 start/end 기준으로 위치와 높이가 계산되어 배치되는 루틴 블록 UI 요소
- **Current_Time_Indicator**: 한국 시간(KST) 기준 현재 시간을 나타내는 빨간 수평선
- **Block_Popover**: 짧은 블록이나 좁은 블록의 상세 정보를 hover/tap 시 표시하는 팝오버 UI
- **Import_Panel**: 파일 드래그앤드롭, 파일 선택, 텍스트 붙여넣기를 통해 루틴 데이터를 가져오는 패널
- **Export_Panel**: JSON 파일 다운로드와 텍스트 복사 기능을 제공하는 내보내기 패널
- **Drop_Zone**: 파일 드래그앤드롭 시 시각적 피드백을 제공하는 영역
- **File_Parser**: 파일 확장자에 따라 적절한 파싱 전략을 선택하는 모듈
- **Category_Combobox**: 기존 카테고리 목록에서 선택하거나 새 카테고리를 직접 입력할 수 있는 콤보박스 UI
- **Routine_Data**: 루틴 이름, 버전, 타임존, 수면 정보, 요일별 블록 배열을 포함하는 전체 데이터 구조
- **Block**: 개별 루틴 항목 데이터 (id, title, category, start, end, duration_minutes, priority, color, required, notes)
- **Parser**: JSON 문자열을 파싱하고 유효성을 검증하며 기본값을 보정하는 기존 모듈
- **Pretty_Printer**: 내부 Routine_Data를 유효한 JSON 문자열로 변환하는 기존 모듈
- **Storage_Manager**: localStorage를 통해 데이터를 저장/불러오기하는 기존 모듈
- **Routine_Editor_Modal**: 루틴 블록의 속성을 편집하는 모달 다이얼로그
- **Priority**: 루틴 블록의 중요도 수준 (high, medium, low 중 하나)
- **Hit_Area**: 짧은 블록 주변에 설정되는 보이지 않는 클릭/탭 가능 영역

## Requirements

### Requirement 1: JSON 파일 다운로드 내보내기

**User Story:** As a 사용자, I want to 현재 루틴 데이터를 JSON 파일로 다운로드하기, so that 로컬 파일로 백업하거나 다른 기기로 옮길 수 있다.

#### Acceptance Criteria

1. THE Export_Panel SHALL "다운로드" 버튼을 제공한다
2. WHEN 사용자가 다운로드 버튼을 클릭하면, THE Export_Panel SHALL 현재 Routine_Data를 JSON 파일로 생성하여 브라우저 다운로드를 실행한다
3. THE Export_Panel SHALL 다운로드 파일명을 "{routine_name}_{YYYYMMDD}.json" 형식으로 생성하며, routine_name에 포함된 파일명 사용 불가 문자(/, \, :, *, ?, ", <, >, |)는 밑줄(_)로 치환한다
4. THE Export_Panel SHALL 자동 다운로드를 수행하지 않으며, 사용자가 다운로드 버튼을 명시적으로 클릭한 경우에만 파일을 생성한다
5. THE Export_Panel SHALL 기존 텍스트 복사 기능을 유지하여 "복사" 버튼을 다운로드 버튼과 함께 제공한다
6. WHEN 사용자가 복사 버튼을 클릭하면, THE Export_Panel SHALL JSON 텍스트를 클립보드에 복사하고 2초간 복사 완료 피드백을 표시한다

### Requirement 2: 파일 기반 가져오기 (드래그앤드롭)

**User Story:** As a 사용자, I want to 파일을 드래그앤드롭하여 루틴 데이터를 가져오기, so that 파일 탐색기에서 바로 파일을 끌어다 놓을 수 있다.

#### Acceptance Criteria

1. THE Import_Panel SHALL 파일을 드래그앤드롭할 수 있는 Drop_Zone 영역을 제공한다
2. WHILE 사용자가 파일을 Drop_Zone 위로 드래그하는 동안, THE Drop_Zone SHALL 시각적 하이라이트(테두리 색상 변경, 배경색 변경)를 표시한다
3. WHEN 사용자가 Drop_Zone에 파일을 드롭하면, THE File_Parser SHALL 해당 파일을 읽어 파싱을 시도한다
4. WHEN 드래그가 Drop_Zone 영역을 벗어나면, THE Drop_Zone SHALL 하이라이트를 즉시 제거한다
5. THE Import_Panel SHALL 한 번에 하나의 파일만 처리하며, 여러 파일이 드롭된 경우 첫 번째 파일만 처리한다
6. IF 드롭된 파일의 크기가 10MB를 초과하면, THEN THE Import_Panel SHALL 파일 크기 초과를 알리는 오류 메시지를 표시하고 파싱을 시도하지 않는다

### Requirement 3: 파일 기반 가져오기 (파일 선택)

**User Story:** As a 사용자, I want to 파일 선택 버튼으로 루틴 파일을 가져오기, so that 모바일 환경에서도 파일을 선택하여 가져올 수 있다.

#### Acceptance Criteria

1. THE Import_Panel SHALL "파일 선택" 버튼을 제공한다
2. WHEN 사용자가 파일 선택 버튼을 클릭하면, THE Import_Panel SHALL 운영체제의 파일 선택 다이얼로그를 열어 .json 및 .txt 파일을 선택할 수 있게 한다
3. WHEN 사용자가 파일을 선택하면, THE File_Parser SHALL 해당 파일을 읽어 파싱을 시도한다
4. THE Import_Panel SHALL 파일 선택 다이얼로그에서 허용 파일 형식을 .json, .txt로 제한한다

### Requirement 4: 파일 형식별 파싱 전략

**User Story:** As a 사용자, I want to .json과 .txt 파일 모두 가져올 수 있기, so that 다양한 형식의 루틴 파일을 사용할 수 있다.

#### Acceptance Criteria

1. WHEN .json 확장자 파일이 입력되면, THE File_Parser SHALL 파일 내용을 직접 JSON으로 파싱하여 기존 Parser 모듈에 전달한다
2. WHEN .txt 확장자 파일이 입력되면, THE File_Parser SHALL 파일 내용을 텍스트로 읽은 후 JSON 형식인지 판별한다
3. WHEN .txt 파일의 내용이 유효한 JSON이면, THE File_Parser SHALL 해당 내용을 JSON으로 파싱하여 기존 Parser 모듈에 전달한다
4. IF .txt 파일의 내용이 JSON 형식이 아니면, THEN THE File_Parser SHALL "지원하지 않는 텍스트 형식입니다. JSON 형식의 파일을 사용해주세요." 오류 메시지를 표시한다
5. IF 지원하지 않는 확장자(.docx, .md, .pdf 등)의 파일이 입력되면, THEN THE File_Parser SHALL "현재 .json과 .txt 파일만 지원합니다." 오류 메시지를 표시한다
6. THE File_Parser SHALL 파일 확장자별 파싱 로직을 독립된 함수로 분리하여, 새로운 확장자 지원 시 기존 코드 수정 없이 파싱 함수를 추가할 수 있는 구조로 구현한다

### Requirement 5: 텍스트 붙여넣기 가져오기 유지

**User Story:** As a 사용자, I want to 기존처럼 텍스트를 직접 붙여넣어 가져오기, so that 파일 없이도 JSON 텍스트를 바로 입력할 수 있다.

#### Acceptance Criteria

1. THE Import_Panel SHALL 텍스트 붙여넣기 영역을 파일 가져오기와 함께 제공한다
2. THE Import_Panel SHALL 파일 드래그앤드롭/선택 영역과 텍스트 붙여넣기 영역을 탭 또는 구분된 섹션으로 분리하여 표시한다
3. WHEN 사용자가 텍스트를 입력하고 가져오기를 실행하면, THE Import_Panel SHALL 기존 Parser 모듈을 사용하여 JSON 파싱을 수행한다

### Requirement 6: 시간축 기반 주간 레이아웃

**User Story:** As a 사용자, I want to 루틴을 시간축 기반 그리드로 보기, so that 각 루틴의 시간대 배치를 직관적으로 파악할 수 있다.

#### Acceptance Criteria

1. THE Timeline_Grid SHALL 좌측에 24시간 Time_Label을 1시간 단위(00:00~23:00)로 세로 배치한다
2. THE Timeline_Grid SHALL 배경에 30분 단위 Guide_Line을 수평으로 표시한다
3. THE Timeline_Grid SHALL 상단에 월요일부터 일요일까지 7개 Day_Header를 고정 표시한다
4. THE Day_Header SHALL 요일 이름과 실제 날짜를 함께 표시한다
5. THE Timeline_Grid SHALL 초기 로드 시 오전 6시(06:00) 위치가 화면에 보이도록 스크롤 위치를 설정한다
6. THE Timeline_Grid SHALL 위로 스크롤하면 0:00~5:59 시간대를 볼 수 있도록 전체 24시간을 렌더링한다
7. WHILE 각 요일 컬럼의 렌더링 너비가 80px 미만인 상태에서, THE Timeline_Grid SHALL 가로 스크롤을 제공하여 각 컬럼이 최소 80px 너비를 유지하도록 한다

### Requirement 7: 시간축 블록 배치

**User Story:** As a 사용자, I want to 각 루틴 블록이 시간축 위에 정확한 위치에 배치되기, so that 블록의 시작/종료 시간을 시각적으로 확인할 수 있다.

#### Acceptance Criteria

1. THE Timeline_Block SHALL Block의 start 시간을 기준으로 세로 위치(top)를 5분 단위 정밀도로 계산하여 배치한다
2. THE Timeline_Block SHALL Block의 start와 end 시간 차이를 기준으로 높이(height)를 5분 단위 정밀도로 계산한다
3. THE Timeline_Block SHALL Block의 color 값을 배경색으로 적용한다
4. WHILE Timeline_Block의 높이가 40px 이상인 동안, THE Timeline_Block SHALL 제목, 시간, 카테고리, 중요도 정보를 모두 표시한다
5. WHILE Timeline_Block의 높이가 40px 미만인 동안, THE Timeline_Block SHALL 제목만 표시한다

### Requirement 8: 현재 시간 표시선

**User Story:** As a 사용자, I want to 현재 시간을 빨간 실선으로 확인하기, so that 지금이 몇 시인지 직관적으로 파악할 수 있다.

#### Acceptance Criteria

1. THE Current_Time_Indicator SHALL 한국 시간(Asia/Seoul, UTC+9) 기준 현재 시간 위치에 빨간색 수평선을 표시한다
2. THE Current_Time_Indicator SHALL 1분마다 위치를 업데이트한다
3. THE Current_Time_Indicator SHALL Timeline_Grid의 전체 너비에 걸쳐 표시한다
4. WHILE 현재 시간이 화면에 보이지 않는 스크롤 위치에 있는 동안, THE Current_Time_Indicator SHALL 렌더링은 유지하되 사용자가 스크롤하여 확인할 수 있도록 한다

### Requirement 9: 짧은 블록 표시 정책

**User Story:** As a 사용자, I want to 5분, 10분, 15분짜리 짧은 루틴도 클릭하여 확인하기, so that 짧은 루틴도 놓치지 않고 관리할 수 있다.

#### Acceptance Criteria

1. THE Timeline_Block SHALL 최소 표시 높이를 20분 분량에 해당하는 픽셀 높이 또는 28px 중 더 큰 값으로 설정한다
2. WHILE Timeline_Block의 duration_minutes가 20분 미만인 동안, THE Timeline_Block SHALL 제목만 표시한다
3. WHEN 사용자가 짧은 Timeline_Block에 마우스를 올리거나 키보드 포커스를 주면, THE Block_Popover SHALL 시간, 카테고리, 중요도, 메모 등 상세 정보를 표시한다
4. WHEN 모바일 사용자가 짧은 Timeline_Block을 탭하면, THE Block_Popover SHALL 상세 정보를 표시한다
5. THE Timeline_Block SHALL 블록 주변에 최소 상하 6px의 보이지 않는 Hit_Area를 설정하여 선택 가능 영역을 확장한다

### Requirement 10: 블록 겹침 처리

**User Story:** As a 사용자, I want to 시간이 겹치는 블록을 나란히 보기, so that 겹치는 루틴을 모두 확인할 수 있다.

#### Acceptance Criteria

1. WHEN 같은 요일에 시간대가 겹치는 블록이 2개 존재하면, THE Timeline_Grid SHALL 각 블록을 50% 너비로 가로 나란히 배치한다
2. WHEN 같은 요일에 시간대가 겹치는 블록이 3개 존재하면, THE Timeline_Grid SHALL 각 블록을 33% 너비로 가로 나란히 배치한다
3. WHEN 같은 요일에 시간대가 겹치는 블록이 N개 존재하면, THE Timeline_Grid SHALL 각 블록을 (100/N)% 너비로 가로 나란히 배치한다
4. WHILE Timeline_Block의 렌더링 너비가 80px 미만인 상태에서, THE Timeline_Block SHALL 제목만 표시한다
5. WHEN 사용자가 좁은 Timeline_Block에 hover 또는 tap하면, THE Block_Popover SHALL 시간, 카테고리, 중요도, 메모 등 상세 정보를 표시한다

### Requirement 11: 인라인 편집 - 수정 모달 진입

**User Story:** As a 사용자, I want to 블록의 펜 아이콘을 클릭하여 수정 모달을 열기, so that 직관적으로 블록 편집에 진입할 수 있다.

#### Acceptance Criteria

1. THE Timeline_Block SHALL 제목 옆에 펜 아이콘 버튼을 표시한다
2. WHEN 사용자가 펜 아이콘 버튼을 클릭하면, THE Routine_Editor_Modal SHALL 해당 Block의 현재 값을 채워서 열린다
3. THE Block_Popover SHALL 상세 정보 표시 시 펜 아이콘 버튼을 포함하여 popover에서도 수정 모달에 진입할 수 있게 한다

### Requirement 12: 인라인 편집 - 카테고리 콤보박스

**User Story:** As a 사용자, I want to 블록에서 카테고리를 드롭다운으로 바로 선택하거나 새로 입력하기, so that 모달을 열지 않고도 카테고리를 빠르게 변경할 수 있다.

#### Acceptance Criteria

1. THE Category_Combobox SHALL 현재 Routine_Data의 모든 Block에서 사용 중인 category 값을 중복 없이 수집하여 선택 목록으로 제공한다
2. THE Category_Combobox SHALL 사용자가 기존 카테고리를 선택할 수 있는 드롭다운을 제공한다
3. THE Category_Combobox SHALL 사용자가 새 카테고리를 직접 입력할 수 있는 텍스트 입력 필드를 제공한다
4. WHEN 사용자가 Category_Combobox에서 카테고리를 선택하거나 입력하면, THE App SHALL 해당 Block의 category 값을 즉시 업데이트하고 Storage_Manager를 통해 저장한다

### Requirement 13: 인라인 편집 - 중요도 드롭다운

**User Story:** As a 사용자, I want to 블록에서 중요도를 드롭다운으로 바로 변경하기, so that 모달을 열지 않고도 중요도를 빠르게 조정할 수 있다.

#### Acceptance Criteria

1. THE Timeline_Block SHALL 중요도를 변경할 수 있는 드롭다운을 Block_Popover 또는 블록 내에 제공한다
2. THE 중요도 드롭다운 SHALL high, medium, low 세 가지 옵션을 제공한다
3. WHEN 사용자가 중요도 드롭다운에서 값을 변경하면, THE App SHALL 해당 Block의 priority 값을 즉시 업데이트하고 Storage_Manager를 통해 저장한다

### Requirement 14: 인라인 편집 - 삭제

**User Story:** As a 사용자, I want to 기존 삭제 버튼으로 블록을 삭제하기, so that 불필요한 루틴을 제거할 수 있다.

#### Acceptance Criteria

1. THE Timeline_Block SHALL 삭제 버튼을 Block_Popover 또는 블록 내에 제공한다
2. WHEN 사용자가 삭제 버튼을 클릭하면, THE App SHALL 해당 Block을 blocks 배열에서 제거하고 Storage_Manager를 통해 저장한다
3. THE App SHALL 이번 단계에서 드래그 삭제 기능을 구현하지 않는다

### Requirement 15: 수정 모달 시간 선택 개선

**User Story:** As a 사용자, I want to 수정 모달에서 5분 단위로 시간을 선택하기, so that 세밀한 시간 설정이 가능하다.

#### Acceptance Criteria

1. THE Routine_Editor_Modal SHALL 시작 시간과 종료 시간을 5분 단위로 선택할 수 있는 입력 UI를 제공한다
2. WHEN 사용자가 5분 단위 시간을 선택하면, THE Timeline_Block SHALL 해당 시간에 맞춰 5분 단위 정밀도로 위치를 재계산한다
3. THE Routine_Editor_Modal SHALL 시간 입력 시 5분 단위 스텝(step="300")을 적용한다

### Requirement 16: 파일 파싱 라운드트립

**User Story:** As a 개발자, I want to 파일 내보내기 후 다시 가져오기 시 데이터가 동일하기, so that 파일 기반 백업/복원의 무결성을 보장할 수 있다.

#### Acceptance Criteria

1. FOR ALL 유효한 Routine_Data 객체에 대해, Export_Panel로 JSON 파일을 생성한 후 해당 파일을 Import_Panel로 가져오면 id 필드를 제외한 모든 필드가 deep equality를 만족하는 Routine_Data 객체가 생성된다 (파일 라운드트립 속성)
2. THE File_Parser SHALL 파일 읽기 과정에서 BOM(Byte Order Mark)이 포함된 UTF-8 파일도 정상 처리한다

### Requirement 17: 블록 위치 계산 정확성

**User Story:** As a 개발자, I want to 블록 위치 계산이 시간 데이터와 정확히 일치하기, so that 시각적 표현의 정확성을 보장할 수 있다.

#### Acceptance Criteria

1. FOR ALL Block 객체에 대해, Timeline_Block의 top 위치는 (start 시간의 분 환산값 / 1440) × 그리드 전체 높이와 일치한다
2. FOR ALL Block 객체에 대해, Timeline_Block의 height는 (duration_minutes / 1440) × 그리드 전체 높이와 일치한다
3. THE Timeline_Grid SHALL 5분 = 동일한 픽셀 높이의 일관된 비율을 유지한다

### Requirement 18: 겹침 감지 정확성

**User Story:** As a 개발자, I want to 블록 겹침 감지가 정확하기, so that 겹치는 블록이 올바르게 나란히 배치된다.

#### Acceptance Criteria

1. FOR ALL 같은 요일의 Block 쌍(A, B)에 대해, A.start < B.end 이고 B.start < A.end이면 겹침으로 판정한다
2. FOR ALL 같은 요일의 Block 쌍(A, B)에 대해, A.end ≤ B.start 이거나 B.end ≤ A.start이면 겹치지 않음으로 판정한다
3. THE Timeline_Grid SHALL 겹침 그룹 내 모든 블록의 너비 합이 컬럼 전체 너비를 초과하지 않도록 한다

### Requirement 19: 이번 단계 제외 사항

**User Story:** As a 개발자, I want to 이번 단계의 범위를 명확히 제한하기, so that 타임라인 레이아웃 안정화에 집중할 수 있다.

#### Acceptance Criteria

1. THE App SHALL 이번 단계에서 드래그로 요일 간 블록 이동 기능을 구현하지 않는다
2. THE App SHALL 이번 단계에서 드래그로 시간 변경 기능을 구현하지 않는다
3. THE App SHALL 이번 단계에서 드래그로 블록 삭제 기능을 구현하지 않는다
4. THE App SHALL 이번 단계에서 모바일 터치 드래그 기능을 구현하지 않는다
5. THE App SHALL 기존 localStorage 기반 데이터 저장 로직을 변경하지 않는다
6. THE App SHALL 기존 Parser, Pretty_Printer, Storage_Manager, weekUtils, idGenerator 유틸리티 모듈의 인터페이스를 변경하지 않는다
