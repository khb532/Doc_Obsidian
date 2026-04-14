# UE_ReNe 프로젝트 개발 기술 문서

> **프로젝트**: UE_ReNe — AI 기반 메타버스 채용 면접 플랫폼  
> **역할**: UE팀 (클라이언트 UI 시스템 & 네트워크 통신 담당)  
> **기간**: 2025년 11월 ~ 2026년 1월  
> **GitHub**: WantedFinalDev/UE_ReNe  
> **담당자 계정**: Dove9 / khb532

---

## 1. 프로젝트 개요

UE_ReNe는 구직자와 채용 기업이 메타버스 공간에서 만나 AI 면접 또는 1:1 실시간 면접을 진행할 수 있는 언리얼 엔진 5 기반 플랫폼이다.

### 팀 구성

- **AI팀**: AI 면접 서버, STT/TTS 파이프라인, 면접 결과 분석 백엔드 구축
- **UE팀 (내 파트)**: 언리얼 엔진 클라이언트 전담
  - PlayerController 시스템
  - UMG 위젯 UI 전체 구현
  - 서버 HTTP 통신 컴포넌트 구현
  - 음성 녹음 및 전송 시스템
  - AI 면접 플로우 연동

### 기술 스택

- **엔진**: Unreal Engine 5
- **언어**: C++ + Blueprint (UMG)
- **네트워크**: UE HTTP Module (Multipart/form-data, JSON REST)
- **음성**: UE Voice Module (IVoiceCapture)
- **입력**: Enhanced Input System
- **멀티플레이어**: UE 기본 Client-Server RPC 아키텍처
- **빌드/협업**: Git (GitHub), Visual Studio 2022

---

## 2. 담당 파트 상세

### 2.1 PlayerController 시스템 (`ARene_PlayerController`)

`Source/UE_ReNe/Public/Player/Rene_PlayerController.h`  
`Source/UE_ReNe/Private/Player/Rene_PlayerController.cpp`

플레이어의 모든 상호작용과 UI 관리의 중심 클래스. 기존 `AUE_ReNePlayerController`를 상속받아 게임 고유 기능을 구현했다.

#### 주요 기능 구현

**1) UI 생명주기 관리**

게임에는 다수의 UI 위젯이 존재하는데, 각 위젯의 생성/표시/제거를 PlayerController가 중앙에서 관리하는 구조로 설계했다.

- `ShowHUD()` — 게임 진행 중 메인 HUD를 생성 또는 재표시. 이미 생성된 인스턴스가 있으면 재사용(성능 최적화). StartMap에서는 진입하지 않도록 맵 이름 체크 로직 포함.
- `ShowInfodeskUI()` — 면접 안내 데스크 UI 표시. 기존 인스턴스를 RemoveFromParent하고 항상 새로 생성해 깨끗한 상태 보장.
- `OnCompanyUI()` / `OnSeekerUI()` — 역할(Host=기업, Client=구직자)에 따라 다른 UI를 표시. Authority 체크로 서버/클라이언트 분기.
- `OnToggleMenu()` — 메뉴 토글 키 입력 처리. Host면 CompanyUI, Client면 ServerRPC를 통해 SeekerUI 표시 요청.
- `EnableUIControll()` / `DisableUIControll()` — `bShowMouseCursor`와 `InputMode`(GameAndUI / GameOnly)를 원자적으로 전환.

**2) 멀티플레이어 RPC 구조**

서버-클라이언트 아키텍처에서 UI 표시가 올바른 클라이언트에게만 전달되도록 RPC 체인을 구현했다.

```
ClientRPC_CreateSeekerUI  → OnSeekerUI()
ClientRPC_CreateInfodeskUI → ShowInfodeskUI()
ServerRPC_ShowHUD → ClientRPC_ShowHUD → ShowHUD()
ServerRPC_SendUserData → PlayerState에 유저 데이터 저장
```

**3) 카메라 전환 시스템**

위젯 표시에 맞춰 카메라를 부드럽게 전환하는 기능. 레벨에 배치된 특정 태그를 가진 카메라 액터를 런타임에 탐색하여 `SetViewTargetWithBlend()`로 전환.

```cpp
void ARene_PlayerController::SetWidgetCameraToInfo()
{
    // "WidgetCamera00" 태그를 가진 액터 탐색
    for (TActorIterator<AActor> It(GetWorld()); It; ++It)
    {
        if (It->ActorHasTag(FName("WidgetCamera00")))
        {
            SetViewTargetWithBlend(*It, 0.2f);
            break;
        }
    }
}
```

**4) Host 착석 근접 감지 시스템 (Tick 기반)**

기업(Host) 플레이어가 면접 의자 근처에 접근하면 자동으로 착석 UI를 팝업하는 기능. Tick에서 매 프레임 거리를 체크한다.

```
Tick() 마다:
1. "HostSitTarget" 태그를 가진 액터 찾기 (최초 1회)
2. 플레이어 ~ 타겟 거리 계산 (임계값: 200.0f)
3. 200 이하: HostSitWidget 생성 & AddToViewport
4. 200 초과: HostSitWidget RemoveFromParent
```

자동이동 중이거나 이미 앉아있는 경우에는 팝업하지 않도록 `IsAutoMoving()`, `IsSitting()` 상태를 복합 체크.

**5) 유저 데이터 동기화 (BeginPlay)**

게임 시작 시 `GameInstance`에 캐싱된 로그인 유저 데이터(`FReneUserData`)를 PlayerState에 동기화.

- Host(HasAuthority): PlayerState에 직접 설정
- Client: `ServerRPC_SendUserData()`를 통해 서버에서 설정

**6) Enhanced Input System 연동**

UE5 Enhanced Input 시스템으로 입력 처리를 구성.

- `IMC_Common` (InputMappingContext) 로드 & 등록
- `IA_Menu` (메뉴 토글) → `OnToggleHomeMenu()`
- `PushToTalkAction` (PTT 버튼) → `OnStartTalking()` / `OnStopTalking()`

**7) 파일 다이얼로그**

`IDesktopPlatform` 모듈을 활용해 OS 네이티브 파일 탐색 다이얼로그를 열고, 선택된 파일 경로를 반환하는 헬퍼 함수 구현. Blueprint에서도 호출 가능하도록 `BlueprintCallable` 노출.

---

### 2.2 HUD 위젯 (`URene_HUD`)

`Source/UE_ReNe/Public/Widget/Rene_HUD.h`  
`Source/UE_ReNe/Private/Widget/Rene_HUD.cpp`

메인 HUD의 C++ 구현. `UWidgetSwitcher`를 활용해 HUD 내 여러 패널을 전환한다.

#### 구조

```
WBP_HUD (WidgetSwitcher: sw_HUD)
├── Index 0: 최소화 상태 (게임 플레이 중)
└── Index 1: 확장 상태 (메뉴 표시)

버튼:
- btn_Home       → sw_HUD 인덱스 1로 전환 + HomeDelegate 브로드캐스트
- btn_HQ_Profile → PlayerController::OnToggleMenu() 호출 후 자신 제거
- btn_HQ_Meeting → PlayerController::ShowInfodeskUI() 호출 후 자신 제거
- btn_HQ_Close   → sw_HUD 인덱스 0으로 전환 + DisableUIControll
```

`NativeConstruct()`에서 중복 바인딩 방지 패턴 적용 (RemoveDynamic → AddDynamic).

---

### 2.3 면접 선택 위젯 (`URene_SelectMeetingWidget`)

`Source/UE_ReNe/Public/Widget/Rene_SelectMeetingWidget.h`  
`Source/UE_ReNe/Private/Widget/Rene_SelectMeetingWidget.cpp`

구직자가 면접 방식(1:1 사람 면접 / AI 면접)을 선택하는 위젯. 핵심 비즈니스 로직이 집중된 클래스다.

#### 기능

**1:1 사람 면접 선택 시**
1. `OnClickedInterview` 델리게이트 브로드캐스트 (인포데스크 UI에 알림)
2. `ServerRPC_TeleportToLocation()` — 특정 좌표로 순간이동
3. `ServerRPC_RequestMoveAndSit()` — 면접 의자 타겟으로 NavMesh 자동 이동
4. 2.5초 딜레이 후 `PrivateInterviewCamera` 태그 카메라로 전환
5. 역할에 따른 분기:
   - Host → `ServerRPC_AcceptPrivateInterview()` (수락)
   - Client → `ServerRPC_RequestPrivateInterview()` (요청)

**AI 면접 선택 시**
1. `ARene_PlayerState`에서 구직자 UserID 자동 획득
2. `AGameStateBase::PlayerArray`를 순회하여 Role이 "company"인 Host의 CompanyID, JobGroupID 자동 탐색 (Manual Override 미사용 시)
3. `PlayerController::RequestAIInterviewStart()` 위임 — 이동과 HTTP 요청의 타이밍 분리 설계

**Blueprint 설정 인터페이스**
- `SetTargetActors()` — 이동 목표 액터 설정
- `SetActualAIInterviewer()` — 실제 AI 면접관 액터 연결
- `SetInterviewDetails()` — 기업/직군 ID 수동 설정 (테스트용)

---

### 2.4 AI 면접 위젯 (`URene_InterviewWidget`)

`Source/UE_ReNe/Public/Widget/Rene_InterviewWidget.h`  
`Source/UE_ReNe/Private/Widget/Rene_InterviewWidget.cpp`

AI 면접 진행 중 화면에 표시되는 인터페이스.

#### 구성 요소

| 위젯 변수 | 역할 |
|---|---|
| `txt_Subtitle` | AI 발화 자막 표시 |
| `txt_Loading` | "AI 생각 중..." 로딩 상태 |
| `txt_AISpeaking` | AI 발화 중 표시 |
| `txt_PlayerSpeaking` | 플레이어 발화 중 표시 |
| `txt_PressToTalk` | PTT 안내 문구 |
| `btn_End` | 면접 종료 버튼 |

#### 주요 메서드

- `UpdateSubtitle(FString)` — AI 응답을 자막으로 실시간 갱신
- `SetLoadingState(bool)` — 로딩 텍스트 표시/숨김
- `SetLoadingText(FString)` — 상황에 따른 로딩 텍스트 변경 ("AI 생각 중..." / "면접 결과 분석 대기 중...")
- `ShowAISpeaking(bool)` / `ShowPlayerSpeaking(bool)` — 발화 상태 표시
- `ShowPressToTalk(bool)` — PTT 안내 표시 제어
- `SetInteractivity(bool)` — AI 발화 중 플레이어 입력 잠금

---

### 2.5 Host 착석 위젯 (`URene_HostSitWidget`)

`Source/UE_ReNe/Public/Widget/Rene_HostSitWidget.h`  
`Source/UE_ReNe/Private/Widget/Rene_HostSitWidget.cpp`

기업(Host) 플레이어가 면접 의자 근처에 다가갔을 때 표시되는 착석 확인 위젯.

- **착석 버튼 클릭** → `PC->RequestMoveToHostSitTarget()` (NavMesh 이동) + "HostInterviewCamera" 태그 카메라로 0.8초 블렌딩 전환
- **뒤로가기 버튼** → `DisableUIControll()` + RemoveFromParent
- 버튼 클릭 후 `PC->HostSitWidgetInstance = nullptr` 처리로 다음 접근 시 재생성 가능하도록 처리

---

### 2.6 프로필 위젯 (`URene_ProfileWidget`)

`Source/UE_ReNe/Public/Widget/Rene_ProfileWidget.h`  
`Source/UE_ReNe/Private/Widget/Rene_ProfileWidget.cpp`

유저 프로필 표시 및 서류 업로드 진입점 위젯. `URene_Company_Widget`, `URene_Seeker_Widget` 양쪽에 포함되어 재사용된다.

- `SetProfileName()` — `FReneUserData`를 받아 이름 텍스트 설정
- `OnClickUpload()` → `OnClickUploadDynamic` 델리게이트 브로드캐스트
- `OnClickDashBoard()` → `OnClickDashDynamic` 브로드캐스트
- `OnClickReturn()` → `OnClickReturnDynamic` 브로드캐스트

---

### 2.7 업로드 팝업 위젯 (`URene_UploadingPopupWidget`)

`Source/UE_ReNe/Public/Widget/Rene_UploadingPopupWidget.h`  
`Source/UE_ReNe/Private/Widget/Rene_UploadingPopupWidget.cpp`

서류 파일 업로드 진행 상태를 표시하는 팝업 UI.

#### 상태 머신

`UWidgetSwitcher`를 이용해 3가지 상태를 전환:

| 인덱스 | 상태 | 설명 |
|---|---|---|
| 0 | Uploading | 업로드 진행 중 (스피너 등) |
| 1 | Complete | 업로드 성공 |
| 2 | Error | 업로드 실패 |

성공/실패 시 2초 후 자동으로 숨김 처리 (`FTimerHandle` + `SetTimer` 사용). 기존 타이머가 활성 중이면 먼저 `ClearTimer`하여 중복 방지.

PlayerController `BeginPlay()`에서 미리 생성 후 `Collapsed` 상태로 Viewport에 추가해두고, 업로드 이벤트에 따라 Show/Hide 처리.

---

### 2.8 WebView 위젯 (`URene_WebViewWidget`)

`Source/UE_ReNe/Public/Widget/Rene_WebViewWidget.h`  
`Source/UE_ReNe/Private/Widget/Rene_WebViewWidget.cpp`

AI 면접 결과 리포트를 웹 브라우저로 인게임에서 직접 표시하기 위한 위젯.

- `UWebBrowser` 컴포넌트를 래핑하여 C++에서 URL을 주입할 수 있는 인터페이스 제공
- `LoadURL(FString)` — URL을 `InitialURL`에 저장하고 WebBrowser에 직접 로드
- `GameInstance::GetNetworkSettings().AIReportURL + ResultID` 조합으로 최종 URL 생성
- `BlueprintReadWrite` 노출로 Blueprint에서도 접근 가능

---

### 2.9 파일 업로드 컴포넌트 (`URene_FileUploader`)

`Source/UE_ReNe/Public/Network/Rene_FileUploader.h`  
`Source/UE_ReNe/Private/Network/Rene_FileUploader.cpp`

구직자/기업 서류(PDF, 이력서 등)를 서버에 업로드하는 ActorComponent.

#### 설계 포인트

**파일명 자동 생성**: 플레이어 이름 + 타임스탬프 + 원본 파일명 조합으로 서버 충돌 방지
```
{PlayerName}_{YYYYMMDDHHMMSS}_{OriginalFilename}
```

**Multipart/Form-Data 수동 구성**: UE HTTP Module은 multipart body를 자동으로 구성해주지 않으므로, `TArray<uint8>`에 직접 바운더리와 헤더를 바이트 단위로 조립.

```
--{Boundary}
Content-Disposition: form-data; name="company_id"

{UserId}
--{Boundary}
Content-Disposition: form-data; name="file"; filename="{NewFilename}"
Content-Type: application/octet-stream

{FileBytes}
--{Boundary}--
```

**역할별 엔드포인트 분기**:
- `EUploadUserType::Company` → `CompanyDocsUploadEndpoint`
- `EUploadUserType::JobSeeker` → `JobSeekerDocsUploadEndpoint`

모든 URL/엔드포인트는 하드코딩 없이 `GameInstance::GetNetworkSettings()`(DataTable 기반)에서 런타임에 읽어온다.

**델리게이트 이벤트**:
- `OnSuccess` — HTTP 2xx 응답 시 ResponseBody 전달
- `OnFailure` — 연결 실패 또는 비-2xx 응답 시 에러 메시지 전달

PlayerController에서 두 델리게이트를 구독하여 `UploadingPopupWidget` 상태 전환에 연결.

---

### 2.10 AI 면접 네트워크 매니저 (`URene_AIInterviewNetworkManager`)

`Source/UE_ReNe/Public/Network/Rene_AIInterviewNetworkManager.h`  
`Source/UE_ReNe/Private/Network/Rene_AIInterviewNetworkManager.cpp`

AI 면접 시작 HTTP 요청과 플레이어 이동 사이의 타이밍 문제를 해결하기 위해 설계한 컴포넌트.

#### 문제 배경

AI 면접 시작 시 두 가지 작업이 필요하다:
1. HTTP POST 요청으로 AI 서버에 세션 생성
2. 플레이어를 면접 의자 위치로 NavMesh 이동

이동이 완료되기 전에 AI 서버 응답이 오면 면접 위젯이 의도치 않은 시점에 표시되는 문제가 발생.

#### 해결: 캐싱 + 지연 전송 패턴

```
1. RequestAIInterviewStart() 호출 시
   → AIInterviewManager.CacheInterviewRequest() (데이터만 저장)
   → 동시에 이동 명령 시작 (ServerRPC_RequestMoveAndSit)

2. 이동 완료 & 앉기 완료 후
   → Character가 PlayerController::ShowInterviewWidget() 호출
   → ShowInterviewWidget() 내에서 AIInterviewManager.SendCachedRequest() 호출
   → 이 시점에 실제 HTTP 요청 전송
```

#### HTTP 요청 구성

```json
POST {AIInterviewStartURL}
Content-Type: application/json

{
    "jobseeker_id": 123,
    "company_id": 4,
    "job_group_id": 2
}
```

#### 응답 처리

서버로부터 받는 초기 응답:
```json
{
    "session_id": "abc-123",
    "ai_audio_base64": "...",
    "ai_message": "안녕하세요, 면접을 시작하겠습니다."
}
```

응답 수신 시 처리 흐름:
1. `PlayerController::SetIsInAIInterview(true)` — 면접 상태 플래그 활성화
2. `PlayerController::SetAISessionID(SessionID)` — 이후 음성 업로드에 사용할 세션 ID 저장
3. `PlayerController::DisplayInitialAIMessage(AIMessage)` — 자막 표시 (위젯 미생성 시 캐싱)
4. `AIInterviewCamera` 태그 카메라로 전환
5. `AIInterviewer::PlayAIVoiceResponse(AIAudioBase64)` — AI 첫 음성 재생

---

### 2.11 음성 녹음 및 전송 컴포넌트 (`URene_LocalVoiceRecorder`)

`Source/UE_ReNe/Public/Network/Rene_LocalVoiceRecorder.h`  
`Source/UE_ReNe/Private/Network/Rene_LocalVoiceRecorder.cpp`

AI 면접 중 구직자의 마이크 입력을 캡처하고 AI 서버로 전송하는 핵심 컴포넌트.

#### 구조

UE `Voice` 모듈의 `IVoiceCapture` 인터페이스를 사용하여 OS 마이크에서 PCM 데이터를 캡처.

**초기화**:
```
BeginPlay() → InitializeVoiceCapture()
→ FVoiceModule::LoadModuleChecked("Voice")
→ VoiceModule.CreateVoiceCapture() → IVoiceCapture 인터페이스 획득
```

**녹음 시작** (`StartRecording()`):
1. `VoiceCapture->Start()`
2. 20ms 간격 타이머로 `CaptureVoiceData()` 반복 호출

**데이터 캡처** (`CaptureVoiceData()`):
1. `GetCaptureState()` → 사용 가능한 바이트 수 확인
2. `GetVoiceData()` → PCM 버퍼 읽기
3. `FScopeLock`으로 쓰레드 안전 보장 하에 `RecordedVoiceData`에 누적

**녹음 종료 & 업로드** (`StopAndUploadRecording(AISessionID)`):
1. 타이머 해제 + 마지막 `CaptureVoiceData()` 호출
2. `VoiceCapture->Stop()`
3. `OnAIResponseStateChanged.Broadcast(true)` — UI에 로딩 상태 표시 요청
4. `SendHttpRequest()` 비동기 전송

**HTTP 요청 구성** — Multipart/form-data:
- `session_id` 필드: AISessionID
- `speaker_role` 필드: `"company"` (Host) / `"seeker"` (Client)
- `file` 필드: 원시 PCM 데이터 (Content-Type: audio/pcm)

**응답 처리** (`ProcessAIResponse()`):
AI 서버로부터 다음 정보를 수신:
- `ai_message` → `OnAIMessageReceived.Broadcast()` → 면접 위젯 자막 갱신
- `ai_audio_base64` → AI 음성 재생
- `stage` → `OnInterviewStageReceived.Broadcast()` (CLOSING 감지용)
- `result_id` → `OnAIInterviewFinished.Broadcast()` → 면접 종료 플로우 진입

**강제 종료** (`RequestForceEndInterview(AISessionID)`):
면접 종료 버튼 클릭 시 AI 서버에 세션 종료를 명시적으로 알리는 별도 요청.

#### 이벤트 델리게이트

```cpp
FOnAIMessageReceived      OnAIMessageReceived;      // AI 자막 메시지 수신
FOnAIResponseStateChanged OnAIResponseStateChanged; // 로딩 상태 변경
FOnAIInterviewFinished    OnAIInterviewFinished;     // 면접 결과 ID 수신
FOnInterviewStageReceived OnInterviewStageReceived;  // 면접 단계 변경
```

모두 PlayerController의 BeginPlay에서 바인딩되어 UI 업데이트 체인을 형성.

---

### 2.12 P2P 면접 요청 플로우

1:1 사람 면접 시 구직자(Client)가 기업(Host)에게 면접 요청을 보내는 RPC 흐름.

```
Client 클릭
→ SelectMeetingWidget::OnStartPrivateInterviewClicked()
→ ServerRPC_RequestPrivateInterview()  [Client → Server]
  → GetWorld()->GetPlayerControllerIterator()로 Host PC 탐색
  → Host PC의 ClientRPC_ShowInterviewRequest() 호출  [Server → Host Client]
  → (Host가 수락 의사를 표시)
→ SelectMeetingWidget::OnStartPrivateInterviewClicked() (Host 측)
→ ServerRPC_AcceptPrivateInterview()  [Host → Server]
  → PendingRequestorPC 확인
  → GameMode::StartOneToOneVoiceChat(HostPC, ClientPC)  [1:1 음성 채팅 시작]
```

거절 시: `ServerRPC_DeclinePrivateInterview()` → `ClientRPC_InterviewRequestDeclined()`

---

### 2.13 AI 면접 종료 & 결과 표시 플로우

```
면접 종료 버튼 (InterviewWidget::btn_End)
→ PlayerController::EndInterview()
  → LocalVoiceRecorder::RequestForceEndInterview(AISessionID)
  
LocalVoiceRecorder::OnForceEndComplete()
  → ProcessAIResponse() → result_id 파싱
  → OnAIInterviewFinished.Broadcast(ResultID)
  
PlayerController::OnAIInterviewFinished(ResultID)
  → Server_SetInterviewResultID(ResultID)  [Client → Server]
  → PlayerState::SetInterviewResultID(ResultID) [서버 저장 + 복제]
  
PlayerState::OnInterviewResultIDUpdated 델리게이트 브로드캐스트
  → PlayerController::HandleInterviewResultIDUpdated(NewResultID)
  → ShowAIReportPage()
    → InterviewResultPopupWidget 생성 (결과 ID 표시)
    
InterviewResultPopupWidget::OnShowReportClicked
  → HandleShowReportClicked()
    → GameInstance에서 AIReportURL 획득
    → URL + ResultID 조합
    → WebViewWidget::LoadURL() [인게임 웹 브라우저로 결과 페이지 표시]

클로즈 처리
→ CloseReportAndWebView()
  → 위젯들 RemoveFromParent
  → ServerRPC_RequestStandUp() [앉기 해제]
  → ServerRPC_TeleportToLocation() [시작 위치로 복귀]
  → ShowHUD() [기본 HUD 복원]
```

---

### 2.14 이동 + 앉기 시스템

`ServerRPC_RequestMoveAndSit()` — NavMesh 경로 탐색 + AI 자동 이동 + 도착 후 앉기 애니메이션 연계.

```cpp
// 서버에서 실행
void ARene_PlayerController::ServerRPC_RequestMoveAndSit_Implementation(FTransform TargetTransform)
{
    // NavMesh 투영 진단 (디버그 로그)
    UNavigationSystemV1* NavSys = ...;
    NavSys->ProjectPointToNavigation(TargetTransform.GetLocation(), ...);
    
    // 자동이동 플래그 설정
    SetAutoMoving(true);
    
    // 캐릭터에 목표 착석 트랜스폼 전달
    ControlledCharacter->SetTargetSitTransform(TargetTransform);
    
    // AI 이동 명령 (NavMesh 경로 탐색 + 이동)
    UAIBlueprintHelperLibrary::SimpleMoveToLocation(this, TargetTransform.GetLocation());
}
```

- 도착 후 캐릭터 측에서 `ShowInterviewWidget()` 또는 `SetAutoMoving(false)` 호출
- `ServerRPC_RequestStandUp()` — 서버에서 `Character::StandUp()` 호출로 앉기 해제

---

## 3. 기술적 도전과 해결 방법

### 3.1 이동 완료 타이밍 문제 (AI 면접 요청 지연)

**문제**: AI 면접 시작 HTTP 요청을 선택 즉시 보내면, 서버 응답(위젯 생성 트리거)이 플레이어 이동 완료 전에 도착해 UI가 잘못된 시점에 표시됨.

**해결**: `URene_AIInterviewNetworkManager` 컴포넌트에서 **캐싱 + 지연 전송 패턴**을 구현. 이동 완료 후 캐릭터가 `ShowInterviewWidget()`을 호출하는 시점에 `SendCachedRequest()`를 호출하도록 하여 타이밍 동기화.

### 3.2 초기 AI 메시지 위젯 미생성 타이밍 문제

**문제**: AI 서버 응답이 매우 빠를 경우, `InterviewWidget`이 아직 생성되기 전에 `DisplayInitialAIMessage()`가 호출되어 초기 자막이 표시되지 않음.

**해결**: `CachedInitialAIMessage` 멤버 변수에 메시지를 임시 저장. `ShowInterviewWidget()`에서 위젯 생성 직후 캐시 확인 후 자막 표시 및 캐시 초기화.

### 3.3 멀티플레이어 UI 권한 분리

**문제**: Host(서버)와 Client가 동일한 PlayerController 클래스를 사용하므로 잘못된 쪽에 UI가 생성될 위험.

**해결**: `HasAuthority()` + `IsLocalPlayerController()` + `IsLocalController()` 3중 체크를 일관성 있게 적용. ServerRPC → ClientRPC 체인으로 올바른 클라이언트에만 UI 표시 명령 전달.

### 3.4 웹 브라우저 멀티 플랫폼 지원

**문제**: `UWebBrowser`는 플랫폼에 따라 지원 여부가 다르며, URL 설정 시점(Construct vs LoadURL) 주의 필요.

**해결**: `LoadURL()`에서 `InitialURL` 설정 후 WebBrowser 컴포넌트에 직접 URL 로드. Blueprint에서도 접근 가능하도록 `BlueprintReadWrite`로 노출.

---

## 4. 커밋 이력 요약

| 커밋 | 날짜 | 내용 |
|---|---|---|
| Initial commit | 2025-11-12 | .gitignore 설정 |
| [FEAT] Ingame UI call | 2025-12 | 인게임 UI 호출 시스템 초기 구현 |
| [FEAT] Web Browser | 2025-12 | 웹 브라우저 위젯 기능 추가 |
| [WIP] UI : Profile, Document | 2025-12 | 프로필/서류 UI 작업 |
| [FIX] Meeting UI Flow + Selection UI | 2025-12 | 미팅 UI 플로우 + 선택 UI 기능 구현 |
| [FIX] RPC | 2025-12 | RPC 구조 수정 |
| [FIX] UI Beta Minimal | 2026-01-04 | Beta 시연용 최소 UI 구현 (HUD, 인포데스크, SelectMeeting 등) |
| [FIX] AutoMoveto Sit & UI | 2026-01-03 | 자동이동+앉기 + UI 연동 |
| [WIP] HUD | 2026-01-02 | HUD 위젯 C++ 구현 시작 |
| [FEAT] Asset | 2026-01-06 | 폰트/에셋 추가 |
| [FIX] 한글폰트 | 2026-01-07 | KoPubWorld 폰트 교체 정리 |
| [FEAT] ico/splash | 2026-01-07 | 아이콘/스플래시 이미지 적용 |
| [FIX] UI 한글화 / 버튼 정상화 | 2026-01-07 | 전체 UI 한글화 + 버튼 정상화 |
| [FIX] Client RPC : ShowHUD | 2026-01-07 | 클라이언트 HUD RPC 수정 |
| [WIP] Uploading UI | 2026-01-07 | 업로드 팝업 위젯 초안 |
| [FEAT] Uploading Feedback UI | 2026-01-08 | 업로드 팝업 완성 + PlayerController 연동 |
| [MERGE] Final | 2026-01-08 | 최종 머지 |

---

## 5. 폴더 구조 (담당 파트)

```
Source/UE_ReNe/
├── Public/
│   ├── Player/
│   │   └── Rene_PlayerController.h        # UI/입력/네트워크 중앙 컨트롤러
│   ├── Widget/
│   │   ├── Rene_HUD.h                     # 메인 HUD
│   │   ├── Rene_SelectMeetingWidget.h     # 면접 방식 선택
│   │   ├── Rene_InterviewWidget.h         # AI 면접 진행 화면
│   │   ├── Rene_HostSitWidget.h           # Host 착석 확인 팝업
│   │   ├── Rene_ProfileWidget.h           # 유저 프로필
│   │   ├── Rene_UploadingPopupWidget.h    # 파일 업로드 상태 팝업
│   │   ├── Rene_WebViewWidget.h           # AI 결과 웹뷰
│   │   ├── Rene_InfodeskWidget.h          # 면접 안내 데스크
│   │   ├── Rene_Company_Widget.h          # 기업측 메인 UI
│   │   ├── Rene_Seeker_Widget.h           # 구직자측 메인 UI
│   │   ├── Rene_InterviewResultPopupWidget.h # 면접 결과 팝업
│   │   ├── Rene_LobbyWidget.h             # 로비 UI
│   │   ├── Rene_StartWidget.h             # 시작 화면
│   │   └── Rene_WebBrowser.h              # 웹 브라우저 래퍼
│   └── Network/
│       ├── Rene_FileUploader.h            # 서류 파일 업로드 컴포넌트
│       ├── Rene_LocalVoiceRecorder.h      # 음성 녹음+전송 컴포넌트
│       └── Rene_AIInterviewNetworkManager.h # AI 면접 HTTP 매니저
└── Private/
    ├── Player/
    │   └── Rene_PlayerController.cpp
    ├── Widget/
    │   ├── Rene_HUD.cpp
    │   ├── Rene_SelectMeetingWidget.cpp
    │   ├── Rene_InterviewWidget.cpp
    │   ├── Rene_HostSitWidget.cpp
    │   ├── Rene_ProfileWidget.cpp
    │   ├── Rene_UploadingPopupWidget.cpp
    │   ├── Rene_WebViewWidget.cpp
    │   └── ...
    └── Network/
        ├── Rene_FileUploader.cpp
        ├── Rene_LocalVoiceRecorder.cpp
        └── Rene_AIInterviewNetworkManager.cpp
```

---

## 6. 핵심 기술 요약

| 기술 | 적용 내용 |
|---|---|
| UMG / Slate | WidgetSwitcher, BindWidget, Dynamic Delegate 기반 UI 설계 |
| Enhanced Input System | InputMappingContext + InputAction 기반 PTT 및 메뉴 입력 처리 |
| Server-Client RPC | UI 표시 명령을 올바른 클라이언트에 전달하는 RPC 체인 설계 |
| HTTP Module | Multipart/form-data 바이너리 수동 구성, JSON 직렬화/역직렬화 |
| Voice Module | IVoiceCapture 인터페이스, PCM 데이터 실시간 폴링, 쓰레드 안전 처리 |
| NavMesh 이동 | AIBlueprintHelperLibrary::SimpleMoveToLocation, NavMesh 투영 진단 |
| DesktopPlatform | IDesktopPlatform::OpenFileDialog를 통한 네이티브 파일 선택 |
| DataTable 기반 설정 | 서버 URL, 엔드포인트를 GameInstance DataTable로 런타임 관리 |
| 캐싱+지연 패턴 | 이동-HTTP 타이밍 동기화 문제 해결 |
| WebBrowser 위젯 | 인게임 내장 웹 브라우저로 AI 결과 페이지 표시 |
