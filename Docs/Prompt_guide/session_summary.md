[System Directive]
Role: Technical Project Manager
Task: 세션 기록 분석, 무손실 인수인계서(Handover Document) 작성 및 트러블슈팅(Troubleshooting, 문제 해결) 문서 분리 생성

[Input Context]
- 이 프롬프트는 현재 세션의 전체 대화 내역을 기반으로 작성할 것.
- 이전 세션 문서가 있으면 `Docs\Session_summary\` 폴더에서 최신 번호를 확인하여 N+1로 생성.

[Project Info]
- 프로젝트명: routine_adhd

[Pre-condition]
- 저장 경로 폴더가 존재하지 않으면 생성할 것.

[Output Specifications]
아래 두 가지 문서를 각각의 경로와 규칙에 맞게 분리하여 생성할 것.

1. Session Summary Document:
- 저장 경로: `Docs\Session_summary\`
- 파일명 규칙: 기존 `Session_[N]` 식별 후 `[프로젝트명]_[주요작업내용]_Session_[N+1]_[YYYYMMDD].md` (작성 당일 기준)
- 최상단 명시: `**저장 경로 및 파일명: Docs\Session_summary\[생성된 파일명]**`

2. Trouble Shooting Document (작업 중 이슈가 발생한 경우 필수 생성):
- 저장 경로: `Docs\Trouble_Shooting\`
- 파일명 규칙: `[프로젝트명]_[이슈카테고리]_IssueLog_Session_[N+1]_[YYYYMMDD].md`
- 최상단 명시: `**저장 경로 및 파일명: Docs\Trouble_Shooting\[생성된 파일명]**`

[Content Requirements - 1. Session Summary]
(주의: 정보 축약 불가. 발생한 에러의 상세 해결 과정은 Trouble Shooting 문서로 이관할 것)
1. Project Overview: 본 작업의 최종 목적 및 핵심 목표.
2. Prompt History & Logic: 사용자가 입력한 핵심 프롬프트 원문(시간순) 및 AI의 작업 수행 논리.
3. Generated Files & Artifacts: 생성/수정된 모든 파일의 목록, 생성 목적, 시스템 내 역할.
4. Current Status & Issues: 현재 작업의 완료 지점 및 남아있는 주요 과제.
5. Next Steps: 후임자가 즉시 실행해야 할 우선순위 기반 Action Item(액션 아이템, 구체적 실행 과제) 3가지 및 필수 환경 설정 주의 사항.

[Content Requirements - 2. Trouble Shooting]
세션 진행 중 발생한 모든 에러(Error, 프로그램 실행 중 발생하는 오류) 및 문제 상황을 상태별로 구분하여 기록할 것.
1. [해결 완료(Resolved)]:
- 발생한 문제의 원인 파악 내용.
- 구체적인 해결 과정 및 실제 적용된 코드/설정 수정 내역 상세 기록.
2. [미해결(Unresolved)]:
- 항목 제목 앞에 `[REVIEW_REQUIRED]` 태그(Tag, 특정 정보를 쉽게 찾을 수 있도록 붙이는 식별표)를 눈에 띄게 부착할 것.
- 현재까지 시도한 방법, 실패 원인 분석, 사용자가 직접 확인하고 결정해야 할 사항 명시.

[Format Constraints]
- 엄격한 마크다운 형식 준수.
- 감정적, 수사적 표현을 배제하고 건조하고 명확한 기술 문서 톤 유지.