# Requirements Document

## Introduction

주간 루틴 플래너는 ADHD 사용자를 위한 주간 루틴 관리 웹 애플리케이션이다. 사용자는 ChatGPT 등에서 생성한 루틴 JSON을 앱에 붙여넣어 요일별/시간대별 주간 스케줄표로 변환하고, 앱 내에서 루틴 블록을 수정/관리할 수 있다. 완료 체크는 날짜 기반으로 관리되어 같은 반복 루틴이라도 특정 날짜의 수행 여부를 별도로 기록한다. MVP에서는 서버 없이 localStorage만 사용하며, React + TypeScript + Vite + Tailwind CSS로 구현한다.

## Glossary

- **App**: 주간 루틴 플래너 웹 애플리케이션 전체
- **JSON_Import_Panel**: 사용자가 루틴 JSON을 붙여넣는 입력 영역 컴포넌트
- **Parser**: JSON 문자열을 파싱하고 유효성을 검증하며 기본값을 보정하는 모듈
- **Pretty_Printer**: 내부 Routine_Data를 유효한 JSON 문자열로 변환하는 모듈
- **Weekly_Schedule_View**: 월~일 7개 Day_Column으로 루틴 블록을 시간순 표시하는 메인 뷰 컴포넌트
- **Day_Column**: 특정 요일의 루틴 블록 목록을 날짜와 함께 표시하는 컬럼 컴포넌트
- **Routine_Block**: 하나의 루틴 항목을 나타내는 UI 블록 (제목, 시간, 카테고리, 중요도, 완료 체크박스 포함)
- **Routine_Editor_Modal**: 루틴 블록의 속성을 편집하는 모달 다이얼로그
- **Storage_Manager**: localStorage를 통해 Routine_Data와 Completion_Records를 저장/불러오기하는 모듈
- **Routine_Data**: 루틴 이름, 버전, 타임존, 수면 정보, 요일별 블록 배열을 포함하는 전체 데이터 구조
- **Block**: 개별 루틴 항목 데이터 (id, title, category, start, end, duration_minutes, priority, color, required, notes). completed 필드를 포함하지 않는다
- **Completion_Records**: 날짜별(YYYY-MM-DD) Block 완료 상태를 기록하는 데이터 구조. Block 데이터와 분리되어 관리된다
- **Priority**: 루틴 블록의 중요도 수준 (high, medium, low 중 하나)
- **Day_Value**: 요일을 나타내는 문자열 (monday, tuesday, wednesday, thursday, friday, saturday, sunday 중 하나)
- **Time_Format**: HH:mm 형식의 시간 문자열 (예: "09:00", "13:30")
- **Selected_Week_Start**: 현재 표시 중인 주의 월요일 날짜를 나타내는 내부 상태 값

## Requirements

### Requirement 1: JSON 가져오기

**User Story:** As a 사용자, I want to JSON 텍스트를 붙여넣어 루틴 데이터를 가져오기, so that ChatGPT 등에서 생성한 루틴을 앱에서 바로 사용할 수 있다.

#### Acceptance Criteria

1. THE JSON_Import_Panel SHALL 여러 줄의 JSON 텍스트를 입력받을 수 있는 텍스트 영역을 제공한다
2. WHEN 사용자가 JSON 텍스트를 입력하고 가져오기를 실행하면, THE Parser SHALL 해당 텍스트를 JSON으로 파싱한다
3. WHEN 유효한 JSON이 파싱되면, THE App SHALL 파싱된 데이터를 Routine_Data로 변환하여 Weekly_Schedule_View에 표시한다
4. IF JSON 텍스트가 유효한 JSON 형식이 아니면, THEN THE Parser SHALL "JSON 형식이 올바르지 않습니다" 오류 메시지를 반환한다
5. THE Parser SHALL JSON 형식 유효성 검증을 사용자가 가져오기 버튼을 클릭한 시점에만 수행하며, 입력 중에는 실시간 검증을 수행하지 않는다

### Requirement 2: JSON 유효성 검증

**User Story:** As a 사용자, I want to 잘못된 JSON 입력 시 구체적인 오류 메시지를 확인하기, so that 어떤 부분을 수정해야 하는지 알 수 있다.

#### Acceptance Criteria

1. WHEN routine_name 필드가 없는 JSON이 입력되면, THE Parser SHALL "routine_name이 필요합니다" 오류 메시지를 반환한다
2. WHEN days 필드가 배열이 아닌 JSON이 입력되면, THE Parser SHALL "days는 배열이어야 합니다" 오류 메시지를 반환한다
3. WHEN days 배열 내 day 값이 Day_Value에 해당하지 않으면, THE Parser SHALL "day는 monday~sunday 중 하나여야 합니다" 오류 메시지를 반환한다
4. WHEN days 배열 내 blocks 필드가 배열이 아니면, THE Parser SHALL "{day}의 blocks 항목이 배열이 아닙니다" 오류 메시지를 반환한다
5. WHEN Block에 title, start, end 중 하나라도 없으면, THE Parser SHALL "각 block에는 title, start, end가 필요합니다" 오류 메시지를 반환한다
6. WHEN Block의 start 또는 end가 Time_Format에 맞지 않으면, THE Parser SHALL "시간 형식이 올바르지 않습니다. 예: 09:00" 오류 메시지를 반환한다
7. WHEN Block의 priority가 high, medium, low 중 하나가 아니면, THE Parser SHALL "priority는 high, medium, low 중 하나여야 합니다" 오류 메시지를 반환한다
8. WHEN JSON 입력에 여러 유효성 오류가 동시에 존재하면, THE Parser SHALL 첫 번째로 발견된 오류 메시지만 반환한다

### Requirement 3: 시간 유효성 검증

**User Story:** As a 사용자, I want to 종료 시간이 시작 시간보다 빠른 경우 오류를 확인하기, so that 잘못된 시간 설정을 방지할 수 있다.

#### Acceptance Criteria

1. WHEN Block의 end 시간이 start 시간보다 빠르거나 같으면, THE Parser SHALL "종료 시간은 시작 시간보다 늦어야 합니다" 오류 메시지를 반환한다
2. THE Parser SHALL 자정을 넘어가는 시간 범위(예: start "23:00", end "01:00")를 유효하지 않은 것으로 처리한다

### Requirement 4: 기본값 자동 보정

**User Story:** As a 사용자, I want to 선택적 필드가 누락된 JSON도 정상적으로 가져오기, so that 최소한의 정보만으로도 루틴을 사용할 수 있다.

#### Acceptance Criteria

1. WHEN Block에 color 필드가 없으면, THE Parser SHALL 기본 색상 값("#6B7280")을 자동 부여한다
2. WHEN Block에 id 필드가 없으면, THE Parser SHALL 고유한 id를 자동 생성한다
3. WHEN Block의 duration_minutes가 없거나 start/end 시간 차이와 일치하지 않으면, THE Parser SHALL start와 end 기준으로 duration_minutes를 재계산한다. WHEN Block의 start와 end가 동일한 시간이면, THE Parser SHALL duration_minutes를 0으로 설정한다
4. WHEN Block에 priority 필드가 없으면, THE Parser SHALL 기본값 "medium"을 자동 부여한다

### Requirement 5: 누락 요일 자동 생성

**User Story:** As a 사용자, I want to 일부 요일만 포함된 JSON도 정상적으로 가져오기, so that 모든 요일을 명시하지 않아도 된다.

#### Acceptance Criteria

1. WHEN days 배열에 7개 요일 중 일부가 누락되어 있으면, THE Parser SHALL 누락된 요일을 빈 blocks 배열로 자동 생성한다
2. THE Parser SHALL 자동 생성된 요일에 해당 Day_Value의 한국어 label을 자동 부여한다

### Requirement 6: 중복 ID 보정

**User Story:** As a 사용자, I want to 중복된 ID가 있는 JSON도 정상적으로 가져오기, so that ID 충돌 없이 모든 블록을 관리할 수 있다.

#### Acceptance Criteria

1. WHEN 여러 Block의 id가 중복되면, THE Parser SHALL 중복된 id를 고유한 id로 재생성한다. IF id 재생성 과정에서 오류가 발생하면, THEN THE Parser SHALL 전체 JSON을 거부하고 오류 메시지를 반환한다
2. THE App SHALL 모든 Block을 id 기준으로 추가, 수정, 삭제, 완료 체크 처리한다

### Requirement 7: 가져오기 전 덮어쓰기 확인

**User Story:** As a 사용자, I want to 새 JSON 가져오기 시 기존 데이터 덮어쓰기 여부를 확인받기, so that 실수로 기존 루틴을 잃어버리지 않을 수 있다.

#### Acceptance Criteria

1. WHEN 기존 Routine_Data가 존재하는 상태에서 사용자가 새 JSON 가져오기를 실행하면, THE App SHALL "기존 루틴을 덮어쓰시겠습니까?" 확인 다이얼로그를 표시한다
2. WHEN 사용자가 확인 다이얼로그에서 취소를 선택하면, THE App SHALL 기존 Routine_Data를 유지하고 가져오기를 중단한다
3. WHEN 사용자가 확인 다이얼로그에서 확인을 선택하면, THE App SHALL 새 Routine_Data로 기존 데이터를 대체한다

### Requirement 8: JSON 파싱 및 출력 라운드트립

**User Story:** As a 개발자, I want to 파싱과 출력이 데이터를 손실 없이 변환하기, so that 데이터 무결성을 보장할 수 있다.

#### Acceptance Criteria

1. THE Pretty_Printer SHALL Routine_Data를 유효한 JSON 문자열로 변환한다
2. FOR ALL 유효한 Routine_Data 객체에 대해, Parser로 파싱한 후 Pretty_Printer로 출력한 후 다시 Parser로 파싱하면 동등한 Routine_Data 객체가 생성된다 (라운드트립 속성)

### Requirement 9: 주간 날짜 기준 표시

**User Story:** As a 사용자, I want to 현재 주의 실제 날짜를 기준으로 루틴을 보기, so that 완료 체크가 해당 날짜에만 적용되도록 할 수 있다.

#### Acceptance Criteria

1. THE App SHALL 현재 날짜를 기준으로 이번 주의 월요일부터 일요일까지 날짜를 계산한다
2. THE Weekly_Schedule_View SHALL 각 Day_Column에 요일 이름과 실제 날짜(YYYY-MM-DD)를 함께 표시한다
3. THE App SHALL 내부 상태에 Selected_Week_Start 값을 유지하여 표시 중인 주를 추적한다
4. THE App SHALL 이전 주/다음 주 이동 버튼과 "오늘로 이동" 버튼을 제공한다

### Requirement 10: 주간 루틴표 렌더링

**User Story:** As a 사용자, I want to 루틴을 요일별 컬럼 형태의 주간 스케줄표로 보기, so that 한 주의 루틴을 한눈에 파악할 수 있다.

#### Acceptance Criteria

1. THE Weekly_Schedule_View SHALL 월요일부터 일요일까지 7개의 Day_Column을 가로로 배치하여 표시한다
2. THE Day_Column SHALL 해당 요일에 속한 모든 Routine_Block을 start 시간 기준 오름차순으로 정렬하여 표시한다
3. THE Routine_Block SHALL 블록의 시간 길이(duration_minutes)에 비례하는 높이로 렌더링한다
4. WHILE 화면 너비가 7개 컬럼을 표시하기에 부족한 상태에서, THE Weekly_Schedule_View SHALL 가로 스크롤을 제공한다
5. WHEN 시간이 겹치는 블록이 존재하면, THE Day_Column SHALL 경고나 오류 없이 겹치는 블록을 순서대로 모두 표시하며, 겹치는 블록에 대한 시각적 구분이나 경고를 제공하지 않는다

### Requirement 11: 루틴 블록 표시

**User Story:** As a 사용자, I want to 각 루틴 블록에서 핵심 정보를 바로 확인하기, so that 세부 내용을 열지 않아도 루틴을 파악할 수 있다.

#### Acceptance Criteria

1. THE Routine_Block SHALL 제목, 시간(start~end), 카테고리, 중요도 배지, 완료 체크박스, 수정 버튼, 삭제 버튼을 표시한다
2. THE Routine_Block SHALL Block의 color 값을 배경색 또는 좌측 보더 색상으로 적용한다
3. WHILE 해당 날짜의 Completion_Records에서 Block이 완료 상태인 동안, THE Routine_Block SHALL 투명도를 낮추거나 제목에 취소선을 적용한다. 두 효과는 독립적으로 적용될 수 있다
4. THE Routine_Block SHALL Priority 값에 따라 시각적으로 구분되는 배지를 표시한다 (high: 빨강, medium: 노랑, low: 초록)

### Requirement 12: 날짜별 루틴 완료 체크

**User Story:** As a 사용자, I want to 루틴 완료 여부를 날짜별로 체크하기, so that 같은 반복 루틴이라도 오늘 수행 여부만 따로 기록할 수 있다.

#### Acceptance Criteria

1. WHEN 사용자가 특정 날짜의 Routine_Block 완료 체크박스를 클릭하면, THE App SHALL 해당 날짜(YYYY-MM-DD)와 Block id를 기준으로 완료 상태를 토글한다
2. THE App SHALL 완료 여부를 Block 데이터 내부에 저장하지 않고, Completion_Records에 별도로 저장한다
3. THE Completion_Records SHALL YYYY-MM-DD 날짜 문자열을 최상위 key로 사용한다
4. THE Completion_Records SHALL 각 날짜 아래에 Block id를 key로, boolean 완료 상태를 value로 저장한다
5. WHEN 사용자가 다른 주로 이동하면, THE App SHALL 해당 주의 날짜에 대응하는 Completion_Records를 기준으로 완료 여부를 표시한다
6. IF 특정 날짜에 대한 완료 기록이 Completion_Records에 없으면, THEN THE App SHALL 해당 날짜의 모든 Block을 미완료 상태로 표시한다. 캐시된 데이터와 관계없이 Completion_Records에 기록이 없으면 항상 미완료로 표시한다
7. WHEN 완료 상태가 변경되면, THE Storage_Manager SHALL Completion_Records를 localStorage에 즉시 저장한다

### Requirement 13: 루틴 블록 추가

**User Story:** As a 사용자, I want to 새로운 루틴 블록을 추가하기, so that 기존 루틴에 새 항목을 넣을 수 있다.

#### Acceptance Criteria

1. THE App SHALL 각 Day_Column에 새 루틴 블록 추가 기능을 제공한다
2. WHEN 사용자가 새 블록 추가를 실행하면, THE Routine_Editor_Modal SHALL 빈 상태로 열린다. IF 모달 열기에 실패하면, THEN THE App SHALL 오류 메시지를 표시하고 사용자가 재시도할 수 있도록 한다
3. WHEN 사용자가 모달에서 필수 필드(제목, 요일, 시작 시간, 종료 시간)를 입력하고 저장하면, THE App SHALL 새 Block에 고유한 id를 부여하고 해당 요일의 blocks 배열에 추가한 후 start 시간 기준으로 재정렬한다. WHEN 유효성 검증 실패로 저장이 차단되더라도, THE App SHALL 기존 blocks 배열에 대한 정렬 작업은 수행한다

### Requirement 14: 루틴 블록 수정

**User Story:** As a 사용자, I want to 기존 루틴 블록의 속성을 수정하기, so that 루틴 내용을 상황에 맞게 변경할 수 있다.

#### Acceptance Criteria

1. WHEN 사용자가 Routine_Block의 수정 버튼을 클릭하면, THE Routine_Editor_Modal SHALL 해당 Block의 현재 값(제목, 요일, 시작 시간, 종료 시간, 카테고리, 중요도, 색상, 필수 여부, 메모)을 채워서 열린다
2. WHEN 사용자가 모달에서 값을 변경하고 저장하면, THE App SHALL 해당 Block의 데이터를 업데이트한다
3. WHEN Block의 요일이 변경되면, THE App SHALL 해당 Block을 이전 요일에서 제거하고 새 요일의 blocks 배열에 추가한다. 요일 이동은 명시적으로 요일 속성이 변경된 경우에만 수행한다
4. WHEN Block의 start 시간이 변경되면, THE Day_Column SHALL 해당 요일의 블록 목록을 start 시간 기준으로 재정렬한다

### Requirement 15: 루틴 블록 삭제

**User Story:** As a 사용자, I want to 불필요한 루틴 블록을 삭제하기, so that 루틴표를 깔끔하게 유지할 수 있다.

#### Acceptance Criteria

1. WHEN 사용자가 Routine_Block의 삭제 버튼을 클릭하면, THE App SHALL 해당 Block을 blocks 배열에서 제거한다
2. WHEN Block이 삭제되면, THE Storage_Manager SHALL 변경된 Routine_Data를 localStorage에 즉시 저장한다

### Requirement 16: 데이터 저장 및 불러오기

**User Story:** As a 사용자, I want to 수정한 루틴이 새로고침 후에도 유지되기, so that 매번 JSON을 다시 붙여넣지 않아도 된다.

#### Acceptance Criteria

1. THE Storage_Manager SHALL localStorage 키 "routine-manager-current-routine"을 사용하여 Routine_Data를 저장한다
2. THE Storage_Manager SHALL localStorage 키 "routine-manager-completion-records"를 사용하여 Completion_Records를 저장한다
3. WHEN 앱이 시작되면, THE Storage_Manager SHALL localStorage에서 저장된 Routine_Data와 Completion_Records를 불러온다. IF 한 종류의 데이터만 존재하면, THEN THE Storage_Manager SHALL 존재하는 데이터를 불러오고 누락된 데이터는 빈/기본값으로 처리한다
4. IF localStorage에 저장된 Routine_Data가 완전히 없으면, THEN THE App SHALL 샘플 루틴 데이터를 표시한다. 데이터가 존재하지만 로드 실패(손상, 파싱 오류 등)인 경우에는 샘플 데이터를 표시하지 않는다
5. WHEN Routine_Data가 변경되면(블록 추가, 수정, 삭제), THE Storage_Manager SHALL 변경된 Routine_Data를 localStorage에 즉시 저장한다

### Requirement 17: JSON 내보내기

**User Story:** As a 사용자, I want to 현재 루틴 데이터를 JSON으로 내보내기, so that 다른 곳에서 사용하거나 백업할 수 있다.

#### Acceptance Criteria

1. THE App SHALL JSON 내보내기 기능을 제공한다
2. WHEN 사용자가 JSON 내보내기를 실행하면, THE Pretty_Printer SHALL 현재 Routine_Data를 들여쓰기된 JSON 문자열로 변환하여 표시한다
3. THE App SHALL 내보낸 JSON 텍스트를 클립보드에 복사하는 기능을 제공한다

### Requirement 18: 상단 헤더 UI

**User Story:** As a 사용자, I want to 앱 상단에서 루틴 이름과 주요 액션을 확인하기, so that 현재 상태를 빠르게 파악하고 조작할 수 있다.

#### Acceptance Criteria

1. THE App SHALL 상단 헤더에 앱 제목, 현재 루틴 이름, JSON 가져오기 버튼, JSON 내보내기 버튼, 저장 상태 표시를 포함한다
2. THE App SHALL 현재 표시 중인 주의 날짜 범위와 이전 주/다음 주/오늘로 이동 버튼을 헤더 또는 본문 상단에 표시한다
3. THE App SHALL 데이터가 localStorage에 저장된 상태를 항상 시각적으로 표시한다 (예: "저장됨" 또는 "저장 중..."). 데이터가 안정적으로 저장된 상태에서도 저장 상태 표시기를 숨기지 않는다

### Requirement 19: 편집 모달 UI

**User Story:** As a 사용자, I want to 모달에서 루틴 블록의 모든 속성을 편집하기, so that 한 화면에서 모든 정보를 수정할 수 있다.

#### Acceptance Criteria

1. THE Routine_Editor_Modal SHALL 제목 입력, 요일 선택, 시작 시간 입력, 종료 시간 입력, 카테고리 입력, 중요도 선택(high/medium/low), 색상 선택, 필수 여부 토글, 메모 입력, 저장 버튼, 취소 버튼을 포함한다
2. WHEN 사용자가 취소 버튼을 클릭하면, THE Routine_Editor_Modal SHALL 변경 사항을 저장하지 않고 닫힌다
3. WHEN 사용자가 저장 버튼을 클릭하면, THE Routine_Editor_Modal SHALL 입력된 값을 검증한 후 유효하면 저장하고 닫힌다
4. IF 필수 필드(제목, 시작 시간, 종료 시간)가 비어있으면, THEN THE Routine_Editor_Modal SHALL 해당 필드에 오류 메시지를 표시하고 저장을 적극적으로 차단한다
5. WHEN 종료 시간이 시작 시간보다 빠르거나 같으면, THE Routine_Editor_Modal SHALL "종료 시간은 시작 시간보다 늦어야 합니다" 오류를 표시하고 저장을 차단한다
