# (Codex) COD_CloneProject StoryManager 분석 및 포트폴리오 포인트

작성일: 2026-06-15

## 문서 목적

이 문서는 `StoryManager`와 직접 연결된 구현을 코드 기준으로 정리하고, 이를 포트폴리오 PPT 슬라이드에서 어떻게 어필하면 좋은지 정리한 참고 문서다.

## 한눈에 보는 결론

- 이 파트의 핵심 가치는 **레벨 트리거와 아군 AI를 연결하는 전투 시퀀스 오케스트레이션**이다.
- 포트폴리오에서는 `switch` 문 자체보다 **`PhaseTrigger -> StoryManager -> AllyAIController -> AllyCharacterBase` 흐름**을 강조하는 편이 좋다.
- 현재 구현은 **작동하는 최소 페이즈 시스템 + 향후 확장 흔적**의 조합이다. 따라서 발표에서는 **구현 완료 범위**와 **개선 포인트**를 분리해서 말하는 것이 안전하다.

## 1. 실제 코드 기준 구조

`PhaseTrigger(오버랩)`
-> `StoryManager::ChangePhase()`
-> `AAllyAIController::RecieveOrder()`
-> `MoveDefenseLocation()`
-> `MoveToLocation()`
-> `AAllyCharacterBase::OnArrivedAtPosition()`
-> `Ready -> Shoot/Cover` 전투 루프

### 각 클래스의 역할

#### `AStoryManager`

- `EPhase` 상태값(`Start`, `Phase1`, `Phase2`, `Ending`)을 보유한다.
- 페이즈 전환 시 아군 AI 컨트롤러 전체에 명령을 브로드캐스트한다.
- 엔딩 단계에서는 `AAircraft`와 연결되어 공습 연출을 호출한다.
- 아군/적 AI 컨트롤러 등록소 역할도 겸한다.
- `BlueprintCallable`, `BlueprintReadWrite` 노출이 있어 Blueprint에서 연결하기 쉽다.

근거:
- `Source/COD/Public/StoryManager.h:12`
- `Source/COD/Public/StoryManager.h:37`
- `Source/COD/Public/StoryManager.h:39`
- `Source/COD/Public/StoryManager.h:48`
- `Source/COD/Public/StoryManager.h:61`
- `Source/COD/Public/StoryManager.h:64`
- `Source/COD/Private/StoryManager.cpp:65`
- `Source/COD/Private/StoryManager.cpp:88`

#### `APhaseTrigger`

- 씬에 배치되는 트리거 액터다.
- `TriggerBox` 오버랩 이벤트를 받아 목표 페이즈(`ToPhase`)를 `StoryManager`에 전달한다.
- 트리거 발동 후 자기 자신을 파괴해 1회성 진행 장치처럼 동작한다.
- 레벨 디자이너가 페이즈 전환 타이밍을 씬 배치로 제어할 수 있게 해 준다.

근거:
- `Source/COD/Public/PhaseTrigger.h:23`
- `Source/COD/Public/PhaseTrigger.h:29`
- `Source/COD/Private/PhaseTrigger.cpp:33`
- `Source/COD/Private/PhaseTrigger.cpp:35`
- `Source/COD/Private/PhaseTrigger.cpp:54`
- `Source/COD/Private/PhaseTrigger.cpp:60`

#### `AAllyAIController`

- 아군 폰을 점유할 때 `StoryManager`를 찾아 자동 등록한다.
- 페이즈 명령을 받으면 현재 페이즈에 맞는 방어 지점으로 이동한다.
- 이동 완료 후 캐릭터에게 도착 이벤트를 전달한다.
- `HasRecieved` 플래그로 중복 명령을 막으려는 의도가 보인다.

근거:
- `Source/COD/Private/Ally/AllyAIController.cpp:15`
- `Source/COD/Private/Ally/AllyAIController.cpp:21`
- `Source/COD/Private/Ally/AllyAIController.cpp:24`
- `Source/COD/Private/Ally/AllyAIController.cpp:34`
- `Source/COD/Private/Ally/AllyAIController.cpp:59`
- `Source/COD/Private/Ally/AllyAIController.cpp:69`
- `Source/COD/Private/Ally/AllyAIController.cpp:76`

#### `AAllyCharacterBase`

- 캐릭터별로 `FirstDefensePoint`, `SecondDefensePoint`, `DefenseAcceptanceRadius`를 들고 있다.
- 이동 완료 시 `Ready` 상태로 되돌아가고, 이후 `Shoot` / `Cover` 루프로 전투를 재개한다.
- 즉, StoryManager의 페이즈 전환은 단순 위치 이동이 아니라 전투 행동 루프와 연결된다.
- 무기 스폰 및 장착까지 포함되어 있어 전투 준비 루틴이 캐릭터 내부에 정리되어 있다.

근거:
- `Source/COD/Public/Ally/AllyCharacterBase.h:48`
- `Source/COD/Public/Ally/AllyCharacterBase.h:51`
- `Source/COD/Public/Ally/AllyCharacterBase.h:54`
- `Source/COD/Public/Ally/AllyCharacterBase.h:60`
- `Source/COD/Private/Ally/AllyCharacterBase.cpp:27`
- `Source/COD/Private/Ally/AllyCharacterBase.cpp:30`
- `Source/COD/Private/Ally/AllyCharacterBase.cpp:44`
- `Source/COD/Private/Ally/AllyCharacterBase.cpp:50`
- `Source/COD/Private/Ally/AllyCharacterBase.cpp:61`
- `Source/COD/Private/Ally/AllyCharacterBase.cpp:146`
- `Source/COD/Private/Ally/AllyCharacterBase.cpp:158`
- `Source/COD/Private/Ally/AllyCharacterBase.cpp:168`

#### `AAircraft`

- `StoryManager`의 엔딩 페이즈와 연결된 연출 액터다.
- `AirStrike()` 호출 시 Tick 활성화, 메쉬 노출, 사운드 재생을 수행한다.
- 전투 진행 시스템과 시네마틱/연출 오브젝트를 연결하는 예시로 쓸 수 있다.

근거:
- `Source/COD/Public/StoryManager.h:49`
- `Source/COD/Private/StoryManager.cpp:58`
- `Source/COD/Private/StoryManager.cpp:62`
- `Source/COD/Private/Aircraft.cpp:43`
- `Source/COD/Private/Aircraft.cpp:46`
- `Source/COD/Private/Aircraft.cpp:47`
- `Source/COD/Private/Aircraft.cpp:49`

## 2. 구현된 기능 목록

### 2-1. 트리거 기반 스토리 페이즈 전환

- 레벨에 배치된 `APhaseTrigger`가 오버랩을 감지한다.
- 트리거별 `ToPhase` 값으로 원하는 전투 국면을 지정할 수 있다.
- 발동 후 `Destroy()` 되어 동일 이벤트가 중복 발생하지 않도록 처리되어 있다.

### 2-2. 중앙 집중형 페이즈 제어

- `AStoryManager`가 `CurPhase`를 단일 소스로 관리한다.
- `ChangePhase()` 내부에서 현재 페이즈에 맞는 처리 함수로 분기한다.
- 아군 AI 명령 브로드캐스트와 엔딩 연출 호출이 모두 이 지점에 모인다.

### 2-3. 아군 AI 자동 등록 및 명령 전달

- 아군 컨트롤러는 `OnPossess()`에서 `StoryManager`를 찾아 자기 자신을 등록한다.
- `StoryManager`는 `TWeakObjectPtr<AAllyAIController>` 배열을 보유해 등록된 아군에게 명령을 보낸다.
- 포인터 생명주기 측면에서 일반 raw pointer 배열보다 안전한 선택이다.

### 2-4. 캐릭터별 방어 지점 재배치

- `AAllyCharacterBase`마다 1차/2차 방어 지점이 각각 설정된다.
- `AAllyAIController`는 현재 페이즈를 읽어 적절한 방어 위치를 선택한다.
- `DefenseAcceptanceRadius`를 캐릭터별 설정값으로 둬서 현장 튜닝이 가능하다.

### 2-5. 이동 완료 후 전투 상태 복귀

- 이동이 끝나면 `OnMoveCompleted()`에서 `OnArrivedAtPosition()`을 호출한다.
- 캐릭터는 `Ready` 상태로 복귀한 뒤 `Shoot` 상태로 넘어가고, 일정 시간 후 `Cover`를 오가는 단순 전투 루프를 가진다.
- 따라서 이 시스템은 "이동만 시키는 AI"가 아니라 "이동 후 전투 상태로 복귀하는 AI"로 설명할 수 있다.

### 2-6. 엔딩 연출 연동

- `Ending` 페이즈 진입 시 `StoryManager`가 `pAircraft->AirStrike()`를 호출한다.
- 페이즈 시스템이 AI 전술뿐 아니라 연출 트리거까지 포함하는 구조라는 점을 보여준다.

## 3. 포트폴리오에서 특히 어필하기 좋은 포인트

### 3-1. 가장 좋은 프레이밍

이 파트를 단순히 "`switch`로 페이즈 나눈 코드"로 소개하면 약하다.

더 좋은 표현은 아래와 같다.

- **레벨 트리거 기반으로 전투 국면을 전환하고, 아군 AI를 방어 지점으로 재배치하는 StoryManager 시스템 구현**
- **스토리 진행 이벤트를 중앙 매니저에서 받아 아군 행동과 엔딩 연출까지 연결한 전투 시퀀스 제어 구조 구현**
- **C++로 핵심 흐름을 고정하고, Blueprint/에디터 노출 프로퍼티로 레벨 세팅 가능성을 남긴 전투 진행 시스템 구현**

### 3-2. 기술적으로 어필할 수 있는 지점

- **중앙 오케스트레이션 구조**: 트리거, AI, 캐릭터, 연출 액터가 한 흐름으로 연결된다.
- **디자이너 친화적 세팅 포인트**: `EditAnywhere`, `BlueprintCallable`, `BlueprintReadWrite` 노출로 씬 세팅과 연결이 쉽다.
- **AI 재배치와 전투 상태 연계**: 페이즈 전환이 단순 변수 변경이 아니라 실제 위치 이동과 전투 루프 재개로 이어진다.
- **안전한 레지스트리 선택**: 컨트롤러 저장에 `TWeakObjectPtr`를 사용했다.
- **확장 가능한 뼈대**: `EnemyControllers`, `GetEnemyNum()`, `StartPhase()`, `Standby()` 등은 다음 단계 시스템 확장 흔적으로 읽힌다.

### 3-3. 면접이나 발표에서 말하기 좋은 포인트

- **"미션 이벤트를 AI 행동으로 번역하는 중간 계층을 직접 만들었다."**
- **"씬에 트리거를 배치하면 StoryManager가 전투 페이즈를 전환하고, 각 아군은 자신에게 설정된 방어 지점으로 이동한다."**
- **"이동 이후에는 캐릭터 상태 머신이 전투 상태로 자연스럽게 복귀하도록 연결했다."**
- **"연출 액터까지 같은 페이즈 체계에 물려서 게임플레이와 시네마틱 연결 지점을 만들었다."**

## 4. 슬라이드 구성 추천

### 슬라이드 1. 시스템 개요

제목 예시:
- `StoryManager 기반 전투 시퀀스 제어`
- `레벨 트리거와 AI를 연결한 미션 페이즈 시스템`

넣을 내용:
- 문제: 스토리 진행에 따라 아군 위치와 전투 국면을 바꿔야 했다.
- 해결: `StoryManager`를 중심으로 트리거, AI 컨트롤러, 캐릭터 상태, 연출 액터를 연결했다.
- 한 줄 요약: **레벨 이벤트를 실시간 전투 행동으로 번역하는 시스템**

### 슬라이드 2. 실행 흐름

권장 도식:
`PhaseTrigger -> StoryManager -> AllyAIController -> DefensePoint Move -> OnArrivedAtPosition -> Shoot/Cover`

여기서는 코드보다 흐름도를 크게 보여주는 편이 좋다.

### 슬라이드 3. StoryManager 책임 분리

넣을 내용:
- 페이즈 상태 보관
- 등록된 아군 AI에게 명령 브로드캐스트
- 엔딩 연출 호출
- Blueprint 노출을 통한 씬 세팅 지원

추천 메시지:
- **중앙에서 페이즈를 관리하되, 실제 이동 책임은 AI Controller로 분리했다.**

### 슬라이드 4. 아군 AI 협업 구조

넣을 내용:
- `OnPossess()`에서 자동 등록
- 페이즈별 방어 지점 선택
- 이동 완료 후 전투 상태 복귀

추천 메시지:
- **단순 이동 명령이 아니라, 이동 이후 전투 루프까지 연결되는 구조를 설계했다.**

### 슬라이드 5. 개선 포인트 / 다음 단계

넣을 내용:
- `StartPhase()` 연결 보완
- `MoveDefenseLocation()`의 글로벌 상태 의존 축소
- `PhaseTrigger` 오버랩 대상 필터링
- `MissionStep` 기반 데이터 주도형 확장 가능성

추천 메시지:
- **현재는 최소 동작 구조를 완성했고, 다음 단계로는 선형 스토리 미션에 더 맞는 데이터 주도형 구조로 확장할 수 있다.**

## 5. 포트폴리오에서 과장하지 않는 것이 좋은 부분

- `StartPhase()`는 함수가 존재하지만 `ChangePhase()`의 `switch`에 `EPhase::Start` 분기가 없어 현재는 실행되지 않는다.
  근거: `Source/COD/Private/StoryManager.cpp:21`, `36`, `68`, `70`, `76`, `81`

- `RecieveOrder(EPhase::Start)`는 `HasRecieved = true`만 설정하고 이동 완료 콜백으로 되돌아오지 않기 때문에, `StartPhase()`가 연결되면 이후 명령 흐름을 막을 가능성이 있다.
  근거: `Source/COD/Private/Ally/AllyAIController.cpp:73`, `76`, `81`, `83`

- `PhaseTrigger`는 현재 `OtherActor` 타입 검증 없이 오버랩만 되면 페이즈를 전환한다.
  근거: `Source/COD/Private/PhaseTrigger.cpp:47`, `50`, `54`

- `MoveDefenseLocation()`은 `RecieveOrder()`에서 이미 페이즈를 받았음에도 다시 `StoryManager->CurPhase`를 조회한다.
  근거: `Source/COD/Private/Ally/AllyAIController.cpp:24`, `28`, `37`

- `EnemyControllers`와 `GetEnemyNum()`는 구조상 준비되어 있지만, 현재 C++ 내부 호출 근거는 확인되지 않았다.
  근거: `Source/COD/Public/StoryManager.h:64`, `Source/COD/Private/StoryManager.cpp:97`, `100`

이 항목들은 약점이라기보다, **"내가 현재 구조를 어디까지 구현했고 다음에 무엇을 개선할지 알고 있다"** 를 보여주는 재료로 쓰면 된다.

## 6. 발표용 한 줄 정리

- **StoryManager를 중심으로 레벨 트리거, 아군 AI, 캐릭터 상태, 엔딩 연출을 하나의 페이즈 흐름으로 연결했다.**
- **플레이 상황 변화에 따라 아군을 방어 지점으로 재배치하고, 이동 완료 후 전투 루프까지 이어지도록 구성했다.**
- **C++ 기반 핵심 로직에 Blueprint 세팅 지점을 남겨, 구현 안정성과 레벨 디자인 유연성을 함께 가져가려 했다.**

## 7. 추천 발표 톤

- 구현 소개에서는 **"무엇이 실제로 동작하는가"** 를 먼저 말한다.
- 그 다음에 **"왜 이런 구조를 잡았는가"** 를 설명한다.
- 마지막에 **"다음 단계에서 어떻게 확장할 것인가"** 를 덧붙이면 포트폴리오 완성도가 높아진다.

특히 이 파트는 문법적으로 화려한 구조보다, **실제 플레이 흐름을 제어하는 구조를 직접 연결했다** 는 점이 더 강한 어필 포인트다.
