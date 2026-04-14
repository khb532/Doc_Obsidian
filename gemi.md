기본 사용법:
컨텍스트 추가: @를 사용해 파일을 컨텍스트로 지정 (예: @src/myFile.ts)
셸 모드: !로 셸 명령 실행 (예: !npm run start) 또는 자연어 사용 (예: 서버 시작)

명령어:
 /about - 버전 정보 표시
 /agents - 에이전트 관리
   list - 사용 가능한 로컬 및 원격 에이전트 목록
   reload - 에이전트 레지스트리 다시 로드
   enable - 비활성화된 에이전트 활성화
   disable - 활성화된 에이전트 비활성화
   config - 에이전트 설정
 /auth - 인증 관리
   signin - 로그인 또는 인증 방법 변경
   signout - 로그아웃 및 모든 캐시된 자격 증명 삭제
 /bug - 버그 리포트 제출
 /chat - 자동 저장된 대화 탐색 및 체크포인트 관리
   list - 저장된 수동 대화 체크포인트 목록
   save - 현재 대화를 체크포인트로 저장. 사용법: /resume save <태그>
   resume - 체크포인트에서 대화 재개. 사용법: /resume resume <태그>
   delete - 대화 체크포인트 삭제. 사용법: /resume delete <태그>
   share - 현재 대화를 마크다운 또는 JSON 파일로 공유. 사용법: /resume share <파일>
   debug - 가장 최근 API 요청을 JSON 페이로드로 내보내기
 /clear - 화면 및 대화 기록 초기화
 /commands - 커스텀 슬래시 명령어 관리. 사용법: /commands [reload]
   reload - .toml 파일에서 커스텀 명령어 정의 다시 로드. 사용법: /commands reload
 /compress - 컨텍스트를 요약으로 압축
 /copy - 마지막 결과 또는 코드 스니펫을 클립보드에 복사
 /docs - 브라우저에서 Gemini CLI 전체 문서 열기
 /directory - 워크스페이스 디렉토리 관리
   add - 워크스페이스에 디렉토리 추가. 여러 경로는 쉼표로 구분
   show - 워크스페이스의 모든 디렉토리 표시
 /editor - 외부 에디터 설정
 /extensions - 확장 기능 관리
   list - 활성화된 확장 기능 목록
   update - 확장 기능 업데이트. 사용법: update <확장명>|--all
   explore - 브라우저에서 확장 기능 페이지 열기
   reload - 모든 확장 기능 다시 로드
 /help - Gemini CLI 도움말
 /footer - 푸터(상태바)에 표시할 항목 설정
 /shortcuts - 입력창 위 단축키 패널 토글
 /hooks - 훅 관리
   panel - 등록된 모든 훅과 상태 표시
   enable - 이름으로 훅 활성화
   disable - 이름으로 훅 비활성화
   enable-all - 비활성화된 모든 훅 활성화
   disable-all - 활성화된 모든 훅 비활성화
 /rewind - 특정 메시지로 되돌아가 대화 재시작
 /ide - IDE 통합 관리
 /init - 프로젝트를 분석해 맞춤형 GEMINI.md 파일 생성
 /oncall - 온콜 관련 명령어
   dedup - status/possible-duplicate 라벨 이슈 분류
   audit - status/need-triage 라벨 이슈 분류
 /mcp - MCP(Model Context Protocol) 서버 관리
   list - 설정된 MCP 서버 및 도구 목록
   desc - 설명 포함 MCP 서버 및 도구 목록
   schema - 설명 및 스키마 포함 MCP 서버 및 도구 목록
   auth - OAuth 지원 MCP 서버 인증
   reload - MCP 서버 다시 로드
   enable - 비활성화된 MCP 서버 활성화
   disable - MCP 서버 비활성화
 /memory - 메모리 관련 명령어
   show - 현재 메모리 내용 표시
   add - 메모리에 내용 추가
   reload - 소스에서 메모리 다시 로드
   list - 사용 중인 GEMINI.md 파일 경로 목록
 /model - 모델 설정 관리
   manage - 모델 설정 대화상자 열기
   set - 사용할 모델 설정. 사용법: /model set <모델명> [--persist]
 /permissions - 폴더 신뢰 설정 및 기타 권한 관리
   trust - 폴더 신뢰 설정 관리. 사용법: /permissions trust [<디렉토리경로>]
 /plan - 플랜 모드 전환 및 현재 플랜 보기
   copy - 현재 승인된 플랜을 클립보드에 복사
 /policies - 정책 관리
   list - 모드별로 그룹화된 모든 활성 정책 목록
 /privacy - 개인정보 처리방침 표시
 /quit - CLI 종료
 /resume - 자동 저장된 대화 탐색 및 체크포인트 관리
   list - 저장된 수동 대화 체크포인트 목록
   save - 현재 대화를 체크포인트로 저장. 사용법: /resume save <태그>
   resume - 체크포인트에서 대화 재개. 사용법: /resume resume <태그>
   delete - 대화 체크포인트 삭제. 사용법: /resume delete <태그>
   share - 현재 대화를 마크다운 또는 JSON 파일로 공유. 사용법: /resume share <파일>
   debug - 가장 최근 API 요청을 JSON 페이로드로 내보내기
 /stats - 세션 통계 확인. 사용법: /stats [session|model|tools]
   session - 세션별 사용 통계 표시
   model - 모델별 사용 통계 표시
   tools - 도구별 사용 통계 표시
 /theme - 테마 변경
 /tools - 사용 가능한 Gemini CLI 도구 목록. /tools desc로 설명 포함
   list - 사용 가능한 Gemini CLI 도구 목록
   desc - 설명 포함 Gemini CLI 도구 목록
 /skills - Gemini CLI 에이전트 스킬 목록, 활성화, 비활성화, 다시 로드. 사용법: /skills [list | disable <이름> |...]
   list - 사용 가능한 에이전트 스킬 목록. 사용법: /skills list [nodesc] [all]
   link - 로컬 경로에서 에이전트 스킬 연결. 사용법: /skills link <경로> [--scope user|workspace]
   disable - 이름으로 스킬 비활성화. 사용법: /skills disable <이름>
   enable - 비활성화된 스킬 활성화. 사용법: /skills enable <이름>
   reload - 검색된 스킬 목록 다시 로드. 사용법: /skills reload
 /settings - Gemini CLI 설정 보기 및 편집
 /tasks - 백그라운드 작업 뷰 토글
 /vim - Vim 모드 켜기/끄기
 /setup-github - GitHub Actions 설정
 /terminal-setup - 멀티라인 입력을 위한 터미널 키바인딩 설정 (VS Code, Cursor, Windsurf)
 /upgrade - 더 높은 한도를 위해 Gemini Code Assist 티어 업그레이드
 ! - 셸 명령어
 [MCP] - Model Context Protocol 명령어 (외부 서버 제공)

키보드 단축키:
Ctrl+Left/Ctrl+Right - 입력창에서 단어 단위 이동
Ctrl+C - 애플리케이션 종료
Ctrl+Enter - 새 줄 입력
Ctrl+L - 화면 초기화
Ctrl+S - 텍스트 복사를 위한 선택 모드 진입
Ctrl+X - 외부 에디터에서 입력 열기
Ctrl+Y - YOLO 모드 토글
Enter - 메시지 전송
Esc - 작업 취소 / 입력 초기화 (두 번 누름)
Page Up/Page Down - 페이지 위/아래로 스크롤
Shift+Tab - 편집 자동 수락 토글
Ctrl+P/Ctrl+N - 프롬프트 기록 순환

전체 단축키 목록은 https://geminicli.com/docs/cli/keyboard-shortcuts/ 참고
