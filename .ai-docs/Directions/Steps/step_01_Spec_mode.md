# 스펙모드 개발 요청 프롬프트

나는 JSON을 복붙해서 주간 루틴표로 변환하고, 앱 안에서 수정/관리할 수 있는 루틴 관리 웹앱을 만들고 싶다.

## 1. 서비스 개요

사용자는 ChatGPT 등에서 생성한 루틴 JSON을 앱에 복붙한다.
앱은 JSON을 파싱해서 요일별/시간대별 주간 스케줄표로 보여준다.
사용자는 앱에서 각 루틴 블록의 시간, 제목, 색상, 중요도, 순서, 완료 여부를 수정할 수 있다.

이 앱은 캘린더 앱처럼 복잡한 일정을 관리하기보다는, 반복되는 주간 루틴을 체계화하고 시각적으로 확인하는 데 초점을 둔다.

## 2. 핵심 사용자 흐름

1. 사용자가 JSON 입력창에 루틴 JSON을 붙여넣는다.
2. 앱이 JSON 유효성을 검사한다.
3. 문제가 없으면 주간 루틴표로 변환해서 보여준다.
4. 사용자는 각 루틴 블록을 수정할 수 있다.

   * 제목 수정
   * 시작 시간/종료 시간 수정
   * 요일 변경
   * 색상 변경
   * 중요도 변경
   * 메모 수정
   * 완료 체크
5. 사용자는 수정된 루틴을 저장할 수 있다.
6. 저장된 루틴은 새로고침해도 유지된다.
7. 사용자는 현재 루틴을 다시 JSON으로 내보낼 수 있다.

## 3. MVP 범위

우선 MVP에서는 로그인/회원가입, 서버 DB, 캘린더 외부 연동은 제외한다.
브라우저 localStorage를 사용해서 데이터를 저장한다.

MVP에서 반드시 구현할 기능은 다음과 같다.

### 필수 기능

* JSON 붙여넣기 입력창
* JSON 유효성 검사
* JSON 파싱 실패 시 오류 메시지 표시
* 주간 루틴표 렌더링
* 요일별 루틴 표시
* 시간순 자동 정렬
* 루틴 블록 추가
* 루틴 블록 수정
* 루틴 블록 삭제
* 완료 체크박스
* 중요도 선택

  * high
  * medium
  * low
* 색상 선택
* localStorage 저장
* JSON 내보내기

### 제외 기능

* 로그인/회원가입
* 서버 DB 연동
* 모바일 앱
* Google Calendar 연동
* 알림/푸시
* 드래그앤드롭
* AI 자동 생성 기능
* 자연어 파싱 기능

## 4. 추천 기술 스택

프론트엔드 중심의 단일 페이지 앱으로 개발한다.

* React
* TypeScript
* Vite
* Tailwind CSS
* localStorage

가능하면 컴포넌트를 명확히 분리한다.

예상 컴포넌트 구조:

* App
* JsonImportPanel
* WeeklyScheduleView
* DayColumn
* RoutineBlock
* RoutineEditorModal
* ExportJsonPanel

## 5. 데이터 구조

앱에서 사용할 기본 JSON 스키마는 다음과 같다.

```json
{
  "routine_name": "취준 중심 주간 루틴",
  "version": "1.0",
  "timezone": "Asia/Seoul",
  "sleep": {
    "target_bedtime": "00:00",
    "target_wakeup": "08:00",
    "flex_hours": 2
  },
  "days": [
    {
      "day": "monday",
      "label": "월요일",
      "blocks": [
        {
          "id": "career-001",
          "title": "취업준비",
          "category": "career",
          "start": "09:00",
          "end": "13:00",
          "duration_minutes": 240,
          "priority": "high",
          "color": "#4F46E5",
          "completed": false,
          "required": true,
          "notes": "이력서, 자소서, 기업분석"
        }
      ]
    }
  ]
}
```

## 6. 데이터 검증 규칙

JSON을 import할 때 다음을 검증한다.

* routine_name이 존재해야 한다.
* days는 배열이어야 한다.
* day는 monday, tuesday, wednesday, thursday, friday, saturday, sunday 중 하나여야 한다.
* blocks는 배열이어야 한다.
* 각 block에는 title, start, end가 있어야 한다.
* start와 end는 HH:mm 형식이어야 한다.
* priority는 high, medium, low 중 하나여야 한다.
* color가 없으면 기본 색상을 자동 부여한다.
* completed가 없으면 false로 자동 설정한다.
* id가 없으면 자동 생성한다.
* duration_minutes가 없거나 start/end와 맞지 않으면 start/end 기준으로 재계산한다.

## 7. UI 요구사항

전체 UI는 깔끔하고 직관적인 주간 스케줄러 형태로 만든다.

### 화면 구성

상단:

* 앱 제목
* 현재 루틴 이름
* JSON 가져오기 버튼
* JSON 내보내기 버튼
* 전체 저장 상태 표시

본문:

* 월요일부터 일요일까지 7개 컬럼
* 각 컬럼 안에 시간순 루틴 블록 표시
* 완료된 항목은 흐리게 표시하거나 취소선 처리
* 중요도에 따라 작은 배지 표시

루틴 블록:

* 제목
* 시간
* 카테고리
* 중요도
* 완료 체크박스
* 수정 버튼
* 삭제 버튼

편집 모달:

* 제목 입력
* 요일 선택
* 시작 시간
* 종료 시간
* 카테고리
* 중요도
* 색상
* 필수 여부
* 메모
* 저장/취소 버튼

## 8. 정렬 규칙

각 요일의 루틴 블록은 start 시간을 기준으로 자동 정렬한다.
사용자가 시간을 수정하면 자동으로 다시 정렬한다.

## 9. 완료 체크 규칙

완료 체크는 루틴 블록 단위로 관리한다.
completed가 true이면 완료 상태로 표시한다.
완료 상태도 localStorage에 저장한다.

단, MVP에서는 날짜별 완료 기록은 만들지 않는다.
즉 “이번 주 월요일의 취업준비 완료” 같은 히스토리는 저장하지 않고, 현재 루틴 블록의 완료 여부만 저장한다.

## 10. 저장 방식

MVP에서는 서버 없이 localStorage에 저장한다.

localStorage key 예시:

```text
routine-manager-current-routine
```

앱 시작 시 localStorage에 저장된 루틴이 있으면 자동으로 불러온다.
저장된 루틴이 없으면 샘플 루틴을 보여준다.

## 11. 에러 처리

JSON import 실패 시 사용자에게 이해하기 쉬운 메시지를 보여준다.

예시:

* JSON 형식이 올바르지 않습니다.
* days 배열이 없습니다.
* monday의 blocks 항목이 배열이 아닙니다.
* start 시간 형식이 올바르지 않습니다. 예: 09:00
* priority는 high, medium, low 중 하나여야 합니다.

## 12. 개발 순서

아래 순서로 개발해줘.

1. 프로젝트 구조 설계
2. 타입 정의 작성
3. 샘플 JSON 데이터 작성
4. localStorage 저장/불러오기 로직 작성
5. JSON import/export 기능 작성
6. 주간 루틴표 UI 작성
7. 루틴 블록 컴포넌트 작성
8. 루틴 편집 모달 작성
9. 추가/수정/삭제/완료 체크 기능 작성
10. JSON 검증 및 오류 메시지 개선
11. 전체 UI 다듬기
12. 코드 리팩토링

## 13. 산출물

다음 산출물을 만들어줘.

* 전체 개발 계획
* 폴더 구조
* TypeScript 타입 정의
* 샘플 JSON
* 주요 컴포넌트 설계
* MVP 구현 코드
* 실행 방법
* 추후 확장 기능 목록

## 14. 추후 확장 후보

MVP 이후에는 다음 기능을 추가할 수 있도록 구조를 너무 복잡하지 않게 설계해줘.

* 드래그앤드롭으로 순서 변경
* 날짜별 완료 기록
* 주간 달성률 통계
* 카테고리별 시간 합계
* 루틴 템플릿 여러 개 저장
* Markdown 내보내기
* Google Calendar 연동
* 로그인/회원가입
* 서버 DB 저장
* AI 자연어 루틴 생성
* 모바일 반응형 개선


# 스펙 추가

### Requirement 15: 시간 유효성 검증

1. WHEN Block의 end 시간이 start 시간보다 빠르거나 같으면, THE Parser SHALL "종료 시간은 시작 시간보다 늦어야 합니다" 오류 메시지를 반환한다
2. MVP에서는 자정을 넘어가는 일정(예: 23:00~01:00)을 지원하지 않는다

### Requirement 16: 누락 요일 자동 생성

1. WHEN days 배열에 일부 요일이 누락되어 있으면, THE Parser SHALL 누락된 요일을 빈 blocks 배열로 자동 생성한다
2. THE Weekly_Schedule_View SHALL 항상 월요일부터 일요일까지 7개 컬럼을 표시한다

### Requirement 17: 중복 ID 보정

1. WHEN 여러 Block의 id가 중복되면, THE Parser SHALL 중복된 id를 고유한 id로 재생성한다
2. THE App SHALL 모든 Block을 id 기준으로 추가, 수정, 삭제, 완료 체크 처리한다

### Requirement 18: 가져오기 전 덮어쓰기 확인

1. WHEN 기존 루틴 데이터가 있는 상태에서 사용자가 새 JSON 가져오기를 실행하면, THE App SHALL 기존 루틴을 덮어쓸지 확인한다
2. WHEN 사용자가 취소하면, THE App SHALL 기존 루틴 데이터를 유지한다
3. WHEN 사용자가 확인하면, THE App SHALL 새 Routine_Data로 기존 데이터를 대체한다

### Requirement 19: 주간 날짜 기준 표시

**User Story:** As a 사용자, I want to 현재 주의 실제 날짜를 기준으로 루틴을 보기, so that 완료 체크가 해당 날짜에만 적용되도록 할 수 있다.

#### Acceptance Criteria

1. THE App SHALL 현재 날짜를 기준으로 이번 주의 월요일부터 일요일까지 날짜를 계산한다
2. THE Weekly_Schedule_View SHALL 각 Day_Column에 요일과 날짜를 함께 표시한다
3. WHEN 사용자가 완료 체크를 클릭하면, THE App SHALL 해당 Day_Column의 날짜를 기준으로 completion_records를 업데이트한다
4. THE App SHALL 이전 주/다음 주 이동 기능을 제공할 수 있도록 내부 상태에 selectedWeekStart 값을 가진다

# 스펙 수정

### Requirement 7: 날짜별 루틴 완료 체크

**User Story:** As a 사용자, I want to 루틴 완료 여부를 날짜별로 체크하기, so that 같은 반복 루틴이라도 오늘 수행 여부만 따로 기록할 수 있다.

#### Acceptance Criteria

1. WHEN 사용자가 특정 날짜의 Routine_Block 완료 체크박스를 클릭하면, THE App SHALL 해당 날짜와 Block id를 기준으로 완료 상태를 토글한다
2. THE App SHALL 완료 여부를 Block 데이터 내부의 completed 필드에 저장하지 않는다
3. THE App SHALL 완료 여부를 날짜별 completion_records 데이터에 저장한다
4. THE Completion_Record SHALL YYYY-MM-DD 날짜 문자열을 key로 사용한다
5. THE Completion_Record SHALL 각 날짜 아래에 Block id와 boolean 완료 상태를 저장한다
6. WHEN 사용자가 다른 날짜 또는 다른 주를 조회하면, THE App SHALL 해당 날짜의 completion_records를 기준으로 완료 여부를 표시한다
7. IF 특정 날짜에 대한 완료 기록이 없으면, THEN THE App SHALL 모든 Block을 미완료 상태로 표시한다
8. WHEN 완료 상태가 변경되면, THE Storage_Manager SHALL completion_records를 localStorage에 저장한다

기존 Block에서 completed 제거
```
type RoutineBlock = {
  id: string;
  title: string;
  category?: string;
  start: string;
  end: string;
  duration_minutes: number;
  priority: "high" | "medium" | "low";
  color: string;
  required: boolean;
  notes?: string;
};
```
완료 기록 타입 추가.
```
type CompletionRecords = {
  [date: string]: {
    [blockId: string]: boolean;
  };
};
```

#### UI 변경
기존에는 그냥 “월요일 루틴”을 보여주는 구조였는데, 완료 체크가 날짜별이면 앱에 현재 기준 주간 날짜가 필요해.

예를 들어:

| 요일 | 날짜         | 완료 기록 key    |
| -- | ---------- | ------------ |
| 월  | 2026-06-01 | `2026-06-01` |
| 화  | 2026-06-02 | `2026-06-02` |
| 수  | 2026-06-03 | `2026-06-03` |


그래서 상단에 이런 기능이 있으면 좋아.

- 이번 주 보기
- 이전 주
- 다음 주
- 오늘로 이동

MVP에서 너무 복잡하면 “이번 주만 표시”로 시작해도 괜찮음.
하지만 날짜별 완료 체크를 하려면 최소한 내부적으로는 이번 주의 실제 날짜를 계산해야 함.