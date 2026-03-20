# Ally AI NPC 캐릭터 시스템 개발 문서

> COD Clone Project — 개인 담당 구현 파트
> 작성일: 2026-03-19

---

## 1. 개요

이 시스템은 플레이어와 함께 작전을 수행하는 **아군 AI NPC**를 위해 설계된 캐릭터 제어 프레임워크다. 언리얼 엔진의 AIController와 NavMesh를 기반으로 하되, 복잡한 Behavior Tree 없이 **직접 작성한 상태 머신(State Machine)**으로 NPC의 전투 행동을 제어한다.

설계의 핵심 목표는 두 가지였다. 첫째, NPC가 단순히 제자리에서 총을 쏘는 것이 아니라 **엄폐와 발사를 번갈아가며 자연스러운 전투 루틴**을 수행하는 것. 둘째, 게임의 진행 단계(Phase)에 따라 **여러 NPC가 일사불란하게 명령을 받고 방어 위치로 이동**하는 것이다. 이 두 목표를 달성하기 위해 `AllyCharacterBase`, `AllyAIController`, `StoryManager` 세 클래스가 유기적으로 협력하는 구조를 설계했다.

---

## 2. 클래스 계층 구조

```
ACharacter (UE5 Engine)
└── AAllyCharacterBase          ← 핵심 구현 클래스 (상태 머신, 전투 로직)
    ├── AAllyDefenseChar        ← 블루프린트 확장용 파생 클래스
    └── ADefenseAllyCharacter   ← 블루프린트 확장용 파생 클래스

AAIController (UE5 Engine)
└── AAllyAIController           ← 이동 명령 수신 및 NavMesh 경로 탐색

AActor (UE5 Engine)
└── AStoryManager               ← 게임 페이즈 관리 및 AI 명령 브로드캐스트
```

`AAllyDefenseChar`와 `ADefenseAllyCharacter`는 `AAllyCharacterBase`를 그대로 상속하는 껍데기 클래스로, 실제 메시·애니메이션·방어 지점 같은 구체적인 데이터는 **블루프린트에서 설정**하도록 역할을 분리했다. 이렇게 하면 C++ 로직은 건드리지 않고 디자이너가 레벨에 다양한 종류의 아군 NPC를 배치할 수 있다.

---

## 3. 상태 머신 (State Machine) 설계

### 3.1 왜 Behavior Tree 대신 상태 머신인가

언리얼 엔진은 AI 행동 제어를 위해 비헤이비어 트리(Behavior Tree)와 블랙보드(Blackboard) 시스템을 제공한다. 그러나 이 프로젝트의 아군 NPC는 행동 패턴이 비교적 단순하고 명확하다 — 이동, 전투(발사·엄폐 반복), 피해 반응, 사망. 복잡한 트리 에셋을 관리하는 오버헤드 없이 **C++ 코드 한 곳에서 전체 흐름을 직접 제어**하는 것이 유지보수에 더 유리하다고 판단해 직접 구현한 상태 머신을 선택했다.

### 3.2 7가지 상태 정의

`AllyCharacterBase.h`에 `EAllyState` 열거형으로 7가지 상태를 정의한다.

```cpp
// AllyCharacterBase.h[8-18]
UENUM(BlueprintType)
enum class EAllyState : uint8
{
    Idle,    // 아무 행동도 하지 않는 완전한 대기 상태
    Ready,   // 전투 준비 — 즉시 Shoot으로 전환 트리거
    Move,    // 방어 지점으로 이동 중
    Cover,   // 엄폐 중 (일정 시간 후 다시 Shoot으로)
    Shoot,   // 타이머 기반 발사 반복
    Damage,  // 피격 반응 중 (이동·발사 불가)
    Die,     // 사망 (모든 행동 비활성)
};
```

### 3.3 Tick 기반 상태 전환

상태 머신의 중심은 `Tick()` 함수 안의 `switch` 문이다. 매 프레임마다 현재 상태를 확인하고 해당 상태의 로직을 실행한다. 상태 전환은 `SetState()` 함수를 통해서만 이루어지며, 이를 통해 상태 진입·종료 시점을 명확하게 관리한다.

```cpp
// AllyCharacterBase.cpp[79-129]
void AAllyCharacterBase::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);
    switch (mState)
    {
    case EAllyState::Shoot:
        FireTime += DeltaTime;
        if (FireTime > 2.0f)
        {
            ShootState();
            FireTime = 0.f;
            ++ToCover;
        }
        if (ToCover > MaxToCover)
        {
            SetState(EAllyState::Cover);
            ToCover = 0;
        }
        break;
    // ... 나머지 상태 처리
    }
}
```

### 3.4 발사 → 엄폐 → 발사 순환 패턴

전투 상태의 핵심은 **불규칙한 발사 횟수와 규칙적인 엄폐 쿨다운의 조합**이다. NPC가 일정 횟수 발사한 뒤 엄폐하고, 다시 발사하는 루틴이 반복된다.

발사는 `FireTime` 타이머로 2초 간격으로 제어된다. 발사할 때마다 `ToCover` 카운터가 올라가고, 이 카운터가 `MaxToCover`를 초과하면 Cover 상태로 전환한다. `MaxToCover`는 매번 1~5 사이의 난수로 결정되기 때문에 NPC가 언제 엄폐할지 플레이어가 예측하기 어렵다.

```cpp
// AllyCharacterBase.cpp[168-179]
void AAllyCharacterBase::CoverState()
{
    bCovered = true;
    CoverCool += GetWorld()->GetDeltaSeconds();
    if (CoverCool > 3.0f)
    {
        MaxToCover = FMath::RandRange(1, 5); // 다음 사이클의 발사 횟수 무작위 결정
        SetState(EAllyState::Shoot);
        CoverCool = 0.f;
    }
}
```

이 순환을 타임라인으로 표현하면 다음과 같다.

```
[Shoot 2초] → [Shoot 2초] → ... → (1~5발 후) → [Cover 3초] → [Shoot] → ...
```

---

## 4. AI 컨트롤러 (AllyAIController)

### 4.1 역할 분리

`AAllyCharacterBase`가 전투 행동(발사, 엄폐)을 담당한다면, `AAllyAIController`는 **공간 이동**을 담당한다. 이 둘의 역할을 분리함으로써 전투 로직과 이동 로직이 서로를 오염시키지 않는다.

컨트롤러가 캐릭터를 점유(`OnPossess`)할 때 `StoryManager`에 자신을 등록한다. 이후 게임 페이즈가 변경되면 StoryManager가 등록된 모든 컨트롤러에 명령을 전달하는 구조다.

```cpp
// AllyAIController.cpp[15-22]
void AAllyAIController::OnPossess(APawn* InPawn)
{
    Super::OnPossess(InPawn);
    OwnChar = Cast<AAllyCharacterBase>(GetPawn());
    StoryManager = Cast<AStoryManager>(
        UGameplayStatics::GetActorOfClass(GetWorld(), AStoryManager::StaticClass())
    );
    if (StoryManager)
        StoryManager->RegAICtrl(this); // 자신을 StoryManager의 관리 목록에 등록
}
```

### 4.2 명령 수신 시스템 (RecieveOrder)

`RecieveOrder()`는 StoryManager가 페이즈를 변경할 때 호출하는 진입점이다. `HasRecieved` 플래그로 같은 명령이 중복으로 처리되는 것을 막는다 — 예를 들어 Phase1 명령이 연속으로 여러 번 들어와도 NPC가 이미 이동을 시작했다면 두 번째 명령은 무시한다.

```cpp
// AllyAIController.cpp[76-98]
void AAllyAIController::RecieveOrder(EPhase Phase)
{
    if (HasRecieved == true) return; // 중복 명령 방지

    if (Phase == EPhase::Phase1 || Phase == EPhase::Phase2)
    {
        HasRecieved = true;
        MoveDefenseLocation(); // 해당 페이즈의 방어 지점으로 이동
    }
}
```

### 4.3 NavMesh 기반 경로 탐색

이동 명령은 언리얼 엔진의 `MoveToLocation()`을 통해 NavMesh 경로 탐색으로 처리한다. 목표 지점은 NPC 캐릭터가 블루프린트에서 지정한 `FirstDefensePoint` / `SecondDefensePoint` 액터의 월드 위치다.

```cpp
// AllyAIController.cpp[24-47]
void AAllyAIController::MoveDefenseLocation()
{
    FVector DefenseLocation = (StoryManager->CurPhase == EPhase::Phase1)
        ? OwnChar->FirstDefensePoint->GetActorLocation()
        : OwnChar->SecondDefensePoint->GetActorLocation();

    OwnChar->SetState(EAllyState::Move);
    MoveToLocation(DefenseLocation, OwnChar->DefenseAcceptanceRadius, // 90.0f UU
        false, true, false, false, nullptr, true);
}
```

이동이 완료되면 `OnMoveCompleted()` 콜백이 호출되고, 성공한 경우 캐릭터를 Ready 상태로 전환해 즉시 전투를 시작하도록 한다.

---

## 5. StoryManager — 게임 페이즈 관리

### 5.1 Phase 체계

`StoryManager`는 게임 전체의 진행 흐름을 관리하는 싱글턴성 액터다. `EPhase` 열거형으로 게임 상태를 4단계로 구분한다.

```cpp
// StoryManager.h[11-18]
UENUM(BlueprintType)
enum class EPhase : uint8
{
    Start,   // 게임 시작 전 초기 상태
    Phase1,  // 첫 번째 방어선 구축
    Phase2,  // 두 번째 방어선으로 재배치
    Ending,  // 항공 지원 호출 및 게임 종료
};
```

### 5.2 AI 명령 브로드캐스트

페이즈가 변경되면 `StoryManager`는 자신이 관리하는 모든 `AllyAIController`에 명령을 일괄 전송한다. 컨트롤러 목록은 `TWeakObjectPtr` 배열로 관리해 이미 파괴된 액터를 안전하게 처리한다.

```cpp
// StoryManager.cpp[65-86]
void AStoryManager::ChangePhase(EPhase newphase)
{
    CurPhase = newphase;
    switch (CurPhase)
    {
        case EPhase::Phase1:  FirstPhase();  break; // 모든 Ally에게 Phase1 명령
        case EPhase::Phase2:  SecondPhase(); break; // 모든 Ally에게 Phase2 명령
        case EPhase::Ending:  EndPhase();   break;  // 항공 지원 호출
    }
}
```

`FirstPhase()`와 `SecondPhase()` 내부에서는 `AllyControllers` 배열을 순회하며 각 컨트롤러의 `RecieveOrder()`를 호출한다. 이 구조 덕분에 레벨에 몇 명의 NPC가 있든 `ChangePhase()` 한 번으로 모든 NPC를 동시에 움직일 수 있다.

---

## 6. NPC 초기화 및 무기 장착

NPC가 월드에 배치되거나 스폰될 때 `BeginPlay()`에서 초기화가 이루어진다. 가장 중요한 작업은 무기를 생성하고 캐릭터 메시의 소켓에 부착하는 것이다.

```cpp
// AllyCharacterBase.cpp[41-54]
void AAllyCharacterBase::BeginPlay()
{
    Super::BeginPlay();
    SetState(EAllyState::Ready); // 초기 상태: 즉시 전투 준비
    HP = MaxHP;
    GetMesh()->HideBoneByName(TEXT("weapon_r"), EPhysBodyOp::PBO_None); // 메시 내장 무기 숨김

    if (WeaponClass)
    {
        pCurWeapon = GetWorld()->SpawnActor<AWeaponBase>(WeaponClass);
        pCurWeapon->SetOwner(this);
        pCurWeapon->AttachToComponent(
            GetMesh(),
            FAttachmentTransformRules::KeepRelativeTransform,
            TEXT("Grip") // 손 소켓에 부착
        );
    }
}
```

메시의 `weapon_r` 본을 숨기는 이유는, 캐릭터 스켈레탈 메시가 자체적으로 무기 모델을 포함하고 있을 경우 런타임에 스폰한 무기 액터와 겹치지 않도록 하기 위해서다.

무기 클래스는 생성자에서 `ConstructorHelpers::FClassFinder`로 블루프린트 에셋을 참조해 로드한다. 이를 통해 C++ 코드에서 에셋 경로를 직접 하드코딩하되, 실제 메시·이펙트·사운드는 블루프린트 단계에서 교체 가능하도록 유연성을 확보했다.

---

## 7. 캐릭터 이동 설정

생성자에서 `UCharacterMovementComponent`의 파라미터를 직접 설정해 NPC 고유의 이동감을 구성한다.

- **최대 이동 속도**: 400 UU/s — 플레이어보다 약간 느린 속도로 아군 NPC다운 안정적인 이동
- **최대 가속도 / 감속도**: 2048 UU/s² — 빠른 응답성
- **지면 마찰**: 8.0f — 미끄러짐 없이 즉각 정지
- **회전 속도**: 720°/s, `bOrientRotationToMovement = true` — 이동 방향을 즉시 바라보며 자연스럽게 회전

---

## 8. 설계 의도와 트레이드오프

### 잘 된 점

**명확한 역할 분리**: 전투 로직(AllyCharacterBase), 이동 로직(AllyAIController), 게임 흐름(StoryManager)이 각자의 책임을 명확하게 가진다. 어느 한 클래스를 수정해도 다른 클래스에 미치는 영향이 최소화된다.

**확장 용이한 페이즈 시스템**: `EPhase`에 새 상태를 추가하고 `ChangePhase()`의 switch에 케이스를 하나 더 넣으면 새로운 게임 단계를 쉽게 추가할 수 있다.

**불규칙한 전투 패턴**: 고정된 발사 간격 대신 난수 기반 `MaxToCover`를 사용해 NPC가 기계적으로 보이지 않도록 했다.

### 개선 가능한 점

**Behavior Tree 도입**: 현재 상태 머신은 직관적이지만, 전투 행동이 더 복잡해질수록 switch-case 분기가 비대해질 수 있다. 적의 우선순위를 따지거나 대형을 형성하는 등 복잡한 판단이 필요해지면 Behavior Tree와 Blackboard를 도입하는 것이 유리하다.

**AI Perception 미사용**: 현재 구현에서는 적을 직접 감지하는 Perception 컴포넌트 없이, 게임 페이즈 변경이라는 외부 신호를 통해서만 전투를 시작한다. 실제 게임에서 더 자율적인 NPC를 원한다면 `UAIPerceptionComponent`를 추가해 적을 시야 또는 소리로 감지하는 로직을 구현할 수 있다.

**`HasRecieved` 플래그 방식의 한계**: 현재 방식은 페이즈당 한 번만 명령을 수신하도록 막아주지만, 동일 페이즈 내에서 이동 실패 후 재시도하는 로직이 없다. NavMesh 외부에 NPC가 있거나 이동이 실패하면 해당 NPC는 그 페이즈에서 영구적으로 멈춘다.
