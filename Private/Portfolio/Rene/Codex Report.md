좋아요. 커밋 기준으로 보면 포트폴리오에는 **“UI 시스템 구조 개선 + 실제 서비스 UI 구현”** 쪽으로 잡는 게 제일 좋아 보여요.

현재 브랜치에 미커밋 변경도 하나 있습니다: `WBP_CAW_MainMenu.uasset`  
아래 내용은 **커밋된 작업 기준**으로만 추렸습니다.

**1. CommonUI 기반 FrontEnd UI 구조 구축**

가장 강한 포트폴리오 소재입니다.

쓸 내용:

- Unreal Engine의 기존 `CreateWidget + AddToViewport` 방식에서 발생하는 **UI 관리 복잡도**를 개선하기 위해 CommonUI 기반 구조를 도입
- `PrimaryLayout + WidgetStack + ActivatableWidget` 구조를 설계/구현
- `GameInstanceSubsystem` 기반 UI 관리 흐름 작성
- GameplayTag를 이용해 `FrontEnd`, `HUD`, `Modal`, `GameMenu` 등 UI Stack을 분리
- SoftClass 기반 비동기 Push 노드 구현

대표 커밋:

- `a5c5195 [FEAT] ~Template Layout Widget`
- `e20c9f6 [FEAT] CUW`
- `de22dd0 [FIX] Convert Rene->CUW`

포트폴리오 문장 예시:

> 기존 UMG 위젯의 개별 AddToViewport 방식에서 벗어나, CommonUI 기반의 PrimaryLayout/WidgetStack 구조를 도입했습니다. GameInstanceSubsystem에서 UI Stack을 중앙 관리하고, GameplayTag 기반으로 화면 계층을 분리하여 FrontEnd UI의 확장성과 유지보수성을 개선했습니다.

**2. Blueprint AsyncAction 기반 UI Push 노드 구현**

이건 기술적으로 꽤 좋아요. 단순 UI 작업보다 “시스템을 만든 사람” 느낌이 납니다.

쓸 내용:

- `UBlueprintAsyncActionBase`를 상속한 `UAsyncAction_PushSoftWidget` 구현
- Blueprint에서 사용할 수 있는 `Push Soft Widget To Widget Stack` 노드 제공
- Soft Widget Class를 비동기 로드 후 지정된 Stack에 Push
- Push 전/후 이벤트를 Blueprint에 노출

포트폴리오 문장 예시:

> C++로 `UBlueprintAsyncActionBase` 기반 AsyncAction 노드를 구현하여, Blueprint에서 SoftClass 기반 UI를 비동기 로드 후 지정된 WidgetStack에 Push할 수 있도록 구성했습니다. 이를 통해 디자이너/기획자가 Blueprint 그래프에서 UI 전환을 쉽게 제어할 수 있게 했습니다.

**3. 레거시 로그인/메인메뉴/참가 UI를 CommonUI 구조로 전환**

실제 전환 작업으로 보여주기 좋습니다.

쓸 내용:

- 기존 `Rene_StartWidget` 계열 UI를 CommonUI/ActivatableWidget 흐름으로 전환
- Login, MainMenu, Join 화면을 `WBP_Login_Conv`, `WBP_Join_Conv`, `WBP_CAW_MainMenu`로 분리/재구성
- 기존 GameInstance 로그인 Delegate, 프로필 반환 이벤트 등 기존 로직과 신규 UI 구조 연결

포트폴리오 문장 예시:

> 기존 로그인/메인메뉴/참가 화면을 CommonUI 기반 ActivatableWidget 구조로 전환했습니다. 기존 로그인 Delegate 및 프로필 UI 이벤트 흐름은 유지하면서, 화면 전환은 WidgetStack Push 방식으로 재구성해 UI 생명주기를 명확히 분리했습니다.

**4. HUD / 인게임 UI / Client RPC 개선**

이전 커밋도 좋은 소재입니다.

쓸 내용:

- HUD 생성 및 표시 흐름 개선
- 클라이언트 RPC 기반 HUD 표시 문제 수정
- 회의 선택 UI, 인포데스크 UI, 플레이어 컨트롤러 연동

대표 커밋:

- `37ea9c6 [WIP] HUD`
- `6013627 [FIX] UI Beta Minimal`
- `28f74ba [FIX] Client RPC : ShowHUD`

포트폴리오 문장 예시:

> 멀티플레이 환경에서 HUD 표시 타이밍 문제를 Client RPC 기반으로 수정하고, PlayerController 중심의 HUD/UI 표시 흐름을 정리했습니다. 이를 통해 클라이언트별 UI 표시 안정성을 개선했습니다.

**5. 업로드 피드백 UI 구현**

기능 단위로 따로 넣기 좋습니다.

쓸 내용:

- 파일 업로드 과정에서 사용자에게 진행 상태/피드백을 보여주는 Popup UI 구현
- PlayerController 및 ProfileWidget과 연동
- 업로드 중복/상태 안내 UX 개선

대표 커밋:

- `1ba104b [WIP] Uploading UI`
- `ccc41c4 [FEAT] Uploading Feedback UI`

포트폴리오 문장 예시:

> 파일 업로드 과정의 사용자 피드백 부족 문제를 해결하기 위해 업로드 팝업 UI를 구현했습니다. PlayerController와 ProfileWidget 흐름에 연결하여 업로드 요청 중 사용자 상태 인지가 가능하도록 개선했습니다.

**6. UI 현지화/한글 폰트/버튼 정상화**

보조 항목으로 넣으면 좋습니다.

쓸 내용:

- 한글 폰트 누락 및 UI 텍스트 표시 문제 수정
- 주요 UI의 한글화 반영
- 버튼 동작 및 화면 표시 오류 수정

대표 커밋:

- `78022bc [FIX] UI 한글화 / 버튼 정상화`
- `896ddd9 [FIX] 한글 누락분`
- `bae0f3e [FIX] 한글폰트`

**포트폴리오에서 제일 앞에 둘 추천 항목**

개인적으로는 이 순서가 좋아요.

1. **CommonUI 기반 FrontEnd UI 아키텍처 구축**
2. **Blueprint AsyncAction 기반 WidgetStack Push 시스템 구현**
3. **로그인/메인메뉴/참가 UI의 레거시 구조 전환**
4. **멀티플레이 HUD 표시 및 Client RPC UI 처리 개선**
5. **업로드 피드백 팝업 UI 구현**
6. **UI 한글화 및 버튼/폰트 이슈 수정**

핵심 어필 포인트는 **“단순히 위젯을 만든 게 아니라, UI가 많아질 때 관리 가능한 구조로 바꿨다”** 입니다.