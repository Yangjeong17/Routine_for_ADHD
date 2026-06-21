# 반영 안된 기능
## 가져오기
"내보내기" 기능은 제대로 구현이 되었지만, 가져오기 기능은 누르면 그냥 하얀 화면만 보이고 아무것도 화면에 나타나지 않음.

## 중요도 표시
중요도 표시가 어디에도 나타나지 않음.
이전에는 블록의 왼쪽에 얇은 선으로 중요도를 보였지만, 지금은 블록전체를 블록의 카테고리로 나누어서 색이 입혀져서 중요도를 확인할 수 없음. 또한 블록에도 중요도가 보이지 않아서 중요도를 확인하려면 블록을 무조건 눌러야 함. 다음과 같이 변경 필요.

### 카테고리
일정 카드 UI를 구현해줘. 하단의 카드 크기 등은 비율 가이드를 위한거기 때문에 가로세로 크기 고정은 아님.

카드는 #F5F5F5 의 둥근 사각형 형태이고, 전체적으로 미니멀한 캘린더 일정 블록처럼 보이게 해줘.
카드 크기는 가로 336px, 세로 176px 정도로 하고, 모서리는 10~12px 정도 둥글게 처리해줘.
카드 테두리는 #ECECEC 으로 1px 

카드 왼쪽 상단에는 카테고리 배지를 배치해줘.
배지는 파란색 배경의 둥근 사각형이고, 텍스트는 "업무"야.
배지 크기는 약 48px x 33px 정도이고, 글자는 흰색, 굵게 표시해줘.
배지 모서리는 8px 정도 둥글게 해줘.

배지 오른쪽에는 일정 제목을 배치해줘.
제목 텍스트는 "집중 업무 블록"이고, 검정색, 굵은 글씨로 표시해줘.
제목은 배지와 세로 중앙이 맞도록 배치해줘.

제목 아래에는 시간 텍스트를 배치해줘.
시간 텍스트는 "09:30 - 11:30"이고, 검정색 또는 진한 회색으로 표시해줘.
제목보다 조금 작거나 같은 크기로 하되, 제목보다 굵기는 약하게 해줘.

전체 레이아웃은 다음 구조를 따라줘.

[업무]  집중 업무 블록
       09:30 - 11:30

여기서 "업무" 배지는 일정의 카테고리를 나타내는 요소야.
앞으로 카테고리는 업무, 개인, 운동, 학습, 휴식 등으로 바뀔 수 있으니,
카테고리 값에 따라 배지 텍스트와 색상을 쉽게 바꿀 수 있는 구조로 만들어줘.

Create a reusable schedule card component.

Component requirements:
- White rounded card container
- Size: 336px width, 176px height
- Border: 1px solid light gray
- Border radius: 10px
- Padding: 12px

Layout:
- Top-left horizontal row
- Left item: category badge
- Right item: schedule text block

Category badge:
- Text: "업무"
- Meaning: schedule category
- Background color: blue
- Text color: white
- Font weight: bold
- Border radius: 8px
- Approx size: 48px x 33px

Text block:
- Title: "집중 업무 블록"
- Time: "09:30 - 11:30"
- Title should be bold and larger than the time
- Time should appear directly below the title
- Align the title vertically near the center of the category badge

Important:
The category badge must be implemented as a separate reusable element.
The category value can change later, such as "업무", "개인", "운동", "학습", or "휴식".
The title and time should also be passed as data, not hard-coded only for this example.

### 중요도 표시
- 카드 왼쪽 가장자리에 중요도를 나타내는 얇은 세로선 추가
- 중요도 색상 규칙:
  - high: 빨간색
  - medium: 주황색
  - low: 회색

## 완료된 퀘스트 체크 기능
퀘스트 완료된건 체크해서 #F5F5F5 원래 카드 색깔에서 비활성화된거처럼 전체적으로 어두운 색으로 #636363 이정도로 변하도록 구현해줘.
카드 배경 말고도 테두리, 카테고리 블록도 모두 전체적으로 어두워지도록 구현해줘.
