# Routine for ADHD — AI 프롬프트 템플릿
**저장 경로: Docs/Prompt/ai_prompt_templates.md**
**작성일: 2026-06-17**

---

## 사용 방법

1. 아래 세 가지 프롬프트 중 필요한 것을 복사
2. `[ ]` 안의 내용을 내 상황에 맞게 작성
3. AI 대화창에 붙여넣기
4. AI가 생성한 JSON을 파일로 저장
5. 앱에서 가져오기

---

---

## 프롬프트 1 — 장기목표 처음 세울 때

> 언제 사용: 새 장기목표를 처음 만들 때. 이후에는 프롬프트 3 사용.

```
나는 "Routine for ADHD"라는 앱을 쓰고 있어.
이 앱은 JSON 파일을 가져오면 자동으로 시각화해주는 루틴 관리 앱이야.

---

[내 상황]
[예: 현재 취업 준비생이고, 6개월 안에 프론트엔드 개발자로 취업하고 싶어.
지금까지 한 것: 유튜브로 HTML/CSS 독학, 간단한 토이 프로젝트 1개
부족한 것: 포트폴리오, 알고리즘, 실전 경험]

---

[목표]
[예: 6개월 안에 프론트엔드 취업]

[목표 기한]
[예: 2026-12-31]

[관련 카테고리 — 앱에서 쓰는 카테고리명 그대로 적기]
[예: 취준, 앱개발, 학습]

[습관으로 추적할 카테고리 하나 — 가장 핵심적인 것]
[예: 취준]

---

위 정보를 바탕으로 아래 두 가지를 만들어줘.

### 요청 1: 장기목표 JSON
아래 포맷을 정확히 따라서 JSON 파일을 만들어줘.
포맷 외의 필드는 추가하지 마.

{
  "goal_name": "목표 이름",
  "start_date": "YYYY-MM-DD",
  "deadline": "YYYY-MM-DD",
  "stages": [
    { "id": "s1", "title": "단계 이름", "completed": false },
    { "id": "s2", "title": "단계 이름", "completed": false }
  ],
  "related_categories": ["카테고리1", "카테고리2"],
  "manual_adjustment": 0,
  "track_habit_category": "카테고리1"
}

- stages는 3~6개로 구성해줘. 너무 많으면 관리가 어려워.
- related_categories는 내가 위에 적은 카테고리 그대로 사용해줘.
- manual_adjustment는 항상 0으로 설정해줘.
- start_date는 오늘 날짜로 설정해줘.

### 요청 2: 첫 주 루틴 JSON (별도 파일)
이 장기목표를 달성하기 위한 첫 주 루틴을 아래 포맷으로 만들어줘.
장기목표의 related_categories와 연결되도록 카테고리를 일치시켜줘.

{
  "routine_name": "루틴 이름",
  "version": "1.0",
  "timezone": "Asia/Seoul",
  "days": [
    {
      "day": "monday",
      "label": "월요일",
      "blocks": [
        {
          "id": "고유ID",
          "title": "일정 제목",
          "category": "카테고리명 (한글)",
          "start": "HH:MM",
          "end": "HH:MM",
          "duration_minutes": 숫자,
          "priority": "urgent_important | not_urgent_important | urgent_not_important | not_urgent_not_important",
          "color": "#HEX색상코드",
          "completed": false,
          "required": true,
          "notes": "메모 (선택사항)"
        }
      ]
    }
  ]
}

규칙:
- day는 반드시 monday/tuesday/wednesday/thursday/friday/saturday/sunday 중 하나
- priority는 반드시 위 네 가지 중 하나 (high/medium/low 사용 금지)
- start와 end는 반드시 HH:MM 형식 (예: 09:00)
- end는 반드시 start보다 늦어야 함
- id는 중복 없이 고유하게 생성 (예: block-001, block-002)
- 7개 요일(월~일) 모두 포함해줘. 일정 없는 날은 blocks를 빈 배열 []로
- duration_minutes는 start와 end 기준으로 계산해줘
- 하루 일정은 현실적으로 짜줘. ADHD 사용자라 과부하 금지.
- 두 JSON 파일을 명확히 구분해서 보여줘.
  파일 1: goal_[목표이름]_[날짜].json
  파일 2: routine_[루틴이름]_[날짜].json
```

---

---

## 프롬프트 2 — 주간 플랜 짤 때

> 언제 사용: 매주 또는 격주로 새 루틴을 만들 때.
> 지난주 요약(형식 B 내보내기)을 앱에서 먼저 복사해서 [지난주 요약] 자리에 붙여넣으면 훨씬 정확한 계획이 나와.

```
나는 "Routine for ADHD"라는 앱을 쓰고 있어.
이 앱은 JSON 파일을 가져오면 자동으로 주간 타임라인으로 시각화해줘.

---

[지난주 요약 — 앱에서 "요약 텍스트 내보내기"로 복사한 내용 붙여넣기]
[없으면 이 항목 삭제해도 됨]

---

[이번 주 상황 / 특이사항]
[예: 수요일 오후에 병원 예약 있음.
목요일은 친구 약속으로 저녁 없음.
이번 주는 포트폴리오 마무리에 집중하고 싶음.]

---

[이번 주 가장 중요한 목표 1~3가지]
[예:
1. 포트폴리오 메인 페이지 완성
2. 알고리즘 문제 5개 풀기
3. 운동 5일 이상]

---

위 내용을 바탕으로 이번 주 루틴 JSON을 만들어줘.

포맷:

{
  "routine_name": "루틴 이름",
  "version": "1.0",
  "timezone": "Asia/Seoul",
  "days": [
    {
      "day": "monday",
      "label": "월요일",
      "blocks": [
        {
          "id": "고유ID",
          "title": "일정 제목",
          "category": "카테고리명 (한글)",
          "start": "HH:MM",
          "end": "HH:MM",
          "duration_minutes": 숫자,
          "priority": "urgent_important | not_urgent_important | urgent_not_important | not_urgent_not_important",
          "color": "#HEX색상코드",
          "completed": false,
          "required": true,
          "notes": "메모 (선택사항)"
        }
      ]
    }
  ]
}

규칙:
- day는 반드시 monday/tuesday/wednesday/thursday/friday/saturday/sunday 중 하나
- priority는 반드시 위 네 가지 중 하나 (high/medium/low 사용 금지)
- start와 end는 반드시 HH:MM 형식 (예: 09:00)
- end는 반드시 start보다 늦어야 함
- id는 중복 없이 고유하게 생성 (예: block-001, block-002)
- 7개 요일(월~일) 모두 포함해줘. 일정 없는 날은 blocks를 빈 배열 []로
- duration_minutes는 start와 end 기준으로 계산해줘
- category는 아래 기본 카테고리 안에서 골라줘.
  없으면 새로 만들어도 되는데 한글로 짧게 써줘.
  기본 카테고리: 휴식 / 업무 / 식사 / 운동 / 약속 / 루틴
- ADHD 사용자라 하루 일정을 과부하 없이 현실적으로 짜줘.
  블록 사이에 여유 시간 꼭 넣어줘.
- 지난주에 잘 못 지킨 항목은 이번 주 분량을 줄이거나 시간대를 조정해줘.
- 파일명: routine_[루틴이름]_[날짜].json
```

---

---

## 프롬프트 3 — 장기목표 수정할 때

> 언제 사용: 기존 장기목표의 기한을 바꾸거나, 단계를 수정하거나,
> 목표 자체가 바뀌었을 때.
> 기존 goal JSON 파일 내용을 [현재 목표 JSON] 자리에 붙여넣어.

```
나는 "Routine for ADHD"라는 앱을 쓰고 있어.
기존 장기목표 JSON을 수정해야 해.

---

[현재 목표 JSON — 앱에서 내보낸 기존 goal JSON 붙여넣기]

---

[수정할 내용]
[예:
- 기한을 2026-12-31에서 2027-02-28로 연장
- 2단계 "포트폴리오 완성"을 완료 처리
- 3단계를 "지원 20곳"에서 "지원 10곳"으로 변경
- 새 단계 추가: "최종 합격 후 온보딩 준비"]

---

[현재 상황 — 선택사항, 있으면 더 정확하게 수정해줌]
[예: 생각보다 포트폴리오가 빨리 완성됐고,
지원은 양보다 질로 가기로 했음]

---

위 내용을 반영해서 수정된 장기목표 JSON을 만들어줘.

규칙:
- 아래 포맷을 정확히 따라줘. 포맷 외 필드 추가 금지.
- 수정하지 않은 필드는 원본 그대로 유지해줘.
- stages의 id는 기존 것 유지, 새로 추가하는 단계만 새 id 부여.
- manual_adjustment는 0으로 리셋해줘.
- 완료된 단계는 "completed": true로 설정해줘.

포맷:

{
  "goal_name": "목표 이름",
  "start_date": "YYYY-MM-DD",
  "deadline": "YYYY-MM-DD",
  "stages": [
    { "id": "s1", "title": "단계 이름", "completed": true },
    { "id": "s2", "title": "단계 이름", "completed": false }
  ],
  "related_categories": ["카테고리1", "카테고리2"],
  "manual_adjustment": 0,
  "track_habit_category": "카테고리1"
}

- 파일명: goal_[목표이름]_수정_[날짜].json
```

---

---

## 자주 하는 실수 체크리스트

AI가 만들어준 JSON을 앱에 넣기 전에 아래를 확인해줘.

```
□ priority 값이 다음 네 가지 중 하나인지 확인
  urgent_important / not_urgent_important /
  urgent_not_important / not_urgent_not_important
  (high / medium / low 는 앱이 자동 변환하지만 없는 게 깔끔함)

□ start가 end보다 빠른지 확인 (예: 09:00 ~ 10:00 ✅ / 10:00 ~ 09:00 ❌)

□ day 값이 영문 소문자인지 확인
  monday / tuesday / wednesday / thursday / friday / saturday / sunday

□ id가 중복되지 않는지 확인

□ 7개 요일이 모두 있는지 확인 (일정 없는 날은 blocks: [] 로)

□ 루틴 JSON과 목표 JSON이 별도 파일인지 확인
```
