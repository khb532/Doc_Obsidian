# 총기 탄도학 시스템 개발 문서

> COD Clone Project — 개인 담당 구현 파트
> 작성일: 2026-03-19

---

## 1. 개요

이 시스템은 아군 AI NPC가 사용하는 **프로젝타일 기반 총기 시스템**이다. 단순히 총을 발사하는 것에 그치지 않고, 탄환이 실제 물리 법칙에 따라 날아가도록 **중력과 공기 저항을 직접 계산**한다. 또한 발사 이펙트, 사운드, 애니메이션 몽타주를 연동해 시각·청각적으로 완성도 있는 발사 경험을 제공하는 것이 목표다.

언리얼 엔진이 제공하는 `UProjectileMovementComponent`를 사용하면 물리를 쉽게 처리할 수 있지만, 이 시스템에서는 **탄도 계산을 직접 구현**하는 방식을 선택했다. 이를 통해 공기 저항 강도나 중력 배율 같은 탄도 파라미터를 세밀하게 조정할 수 있고, 구현 과정에서 물리 시뮬레이션에 대한 깊은 이해를 쌓을 수 있었다.

---

## 2. 클래스 구조

```
AWeaponBase          ← 무기의 기반 클래스 (총구 설정, 발사 처리, VFX/SFX)
└── ARifle           ← 소총. 블루프린트에서 구체적인 데이터 설정

ABulletActor         ← 탄환 액터 (물리 계산, 충돌, 수명 관리)
```

`AWeaponBase`가 발사의 트리거와 연출을 담당하고, `ABulletActor`가 실제 탄환의 물리 거동을 담당하는 형태로 역할을 분리했다. `ARifle`은 `AWeaponBase`를 상속해 소총 전용 파라미터를 블루프린트 단계에서 추가할 수 있는 확장 포인트를 제공한다.

---

## 3. 무기 기본 구조 (AWeaponBase)

### 3.1 컴포넌트 구성

무기 액터는 세 가지 핵심 컴포넌트로 구성된다.

- **Root (USceneComponent)**: 무기의 트랜스폼 기준점
- **Mesh (UStaticMeshComponent)**: 실제로 보이는 무기 외형. 메시는 블루프린트에서 할당하며, 180도 회전 오프셋과 3.5배 스케일이 기본 적용되어 있다.
- **Muzzle (UArrowComponent)**: 총구의 정확한 위치와 방향을 나타내는 더미 컴포넌트. 탄환은 이 컴포넌트의 트랜스폼을 그대로 가져와 생성된다.

```cpp
// WeaponBase.cpp[26-30]
Muzzle = CreateDefaultSubobject<UArrowComponent>(TEXT("Muzzle"));
Muzzle->SetupAttachment(RootComponent);
Muzzle->SetRelativeLocation(FVector(0.f, 60.f, 6.f)); // 총구 오프셋: 우측 60, 상단 6
Muzzle->SetRelativeRotation(FRotator(0.f, 90.f, 0.f)); // 발사 방향 정렬
```

`UArrowComponent`를 총구 위치 마커로 쓰는 이유는, 에디터에서 화살표 기즈모가 시각적으로 표시되기 때문에 총구 방향을 직관적으로 확인하고 조정할 수 있기 때문이다.

### 3.2 발사 흐름 (PullTrigger)

`AAllyCharacterBase`의 `ShootState()`가 호출하는 공개 인터페이스다. 발사에 필요한 세 가지 작업 — 탄환 생성, VFX 재생, SFX 재생 — 을 순서대로 실행한다.

```cpp
// WeaponBase.cpp[85-99]
void AWeaponBase::PullTrigger()
{
    SpawnBullet();                   // 1. 탄환 생성
    PlayMuzzleVFX(false);            // 2. 총구 이펙트 (Niagara)
    if (muzzleSFX)
        UGameplayStatics::PlaySound2D(GetWorld(), muzzleSFX); // 3. 발사음
}
```

탄환 생성은 Muzzle 컴포넌트의 현재 월드 트랜스폼을 그대로 사용한다. 위치는 총구 끝, 회전은 총구가 바라보는 방향이 되므로 총이 어느 방향을 향하든 탄환이 정확히 그 방향으로 생성된다.

```cpp
// WeaponBase.cpp[101-107]
void AWeaponBase::SpawnBullet()
{
    FTransform t = Muzzle->GetComponentTransform();
    Bullet = GetWorld()->SpawnActor<ABulletActor>(BulletClass, t);
}
```

### 3.3 총구 이펙트 (Niagara VFX)

Niagara 이펙트는 `UNiagaraFunctionLibrary::SpawnSystemAtLocation()`으로 총구 위치에 즉시 스폰된다. `bAutoDestroy = true` 옵션으로 이펙트 재생이 끝나면 자동으로 정리된다.

---

## 4. 탄도 물리 계산 (ABulletActor)

### 4.1 설계 방향

언리얼 엔진의 `UProjectileMovementComponent`는 중력과 바운스, 속도 감쇠 등을 자동으로 처리해주는 편리한 컴포넌트다. 그러나 이 프로젝트에서는 **물리 계산을 직접 코드로 작성**하는 방식을 택했다. 이를 통해 공기 저항의 모델링 방식을 자유롭게 선택할 수 있고, 중력 배율·저항 강도 같은 파라미터를 게임플레이 요구에 맞게 미세 조정하는 것이 가능하다.

### 4.2 초기 속도 설정

탄환이 생성되는 순간 `BeginPlay()`에서 초기 속도 벡터를 설정한다. 총구 컴포넌트의 Forward 벡터 방향으로 10,000 UU/s의 속도를 부여한다.

```cpp
// BulletActor.cpp[26-32]
void ABulletActor::BeginPlay()
{
    Super::BeginPlay();
    PrevPos = GetActorLocation();
    Velocity = GetActorForwardVector() * BulletSpeed; // 10,000 UU/s
}
```

10,000 UU/s는 언리얼 엔진의 기본 단위(1 UU ≈ 1 cm)로 환산하면 초당 100미터, 즉 총알 속도로서 합리적인 게임플레이 스케일이다.

### 4.3 뉴턴 역학 기반 수치 적분

탄도 계산의 핵심은 `SetBullet()` 함수다. 매 프레임(Tick)마다 가속도를 계산하고, 이를 기반으로 속도와 위치를 업데이트하는 **오일러 방법(Euler Method)** 수치 적분을 사용한다.

```cpp
// BulletActor.cpp[53-70]
void ABulletActor::SetBullet(float DeltaTime)
{
    // 1. 가속도 계산: 중력 + 공기 저항
    FVector Accel = FVector(0.f, 0.f, GetWorld()->GetGravityZ()); // 중력

    const float Speed = Velocity.Size();
    if (Speed > KINDA_SMALL_NUMBER)
        Accel += -Velocity * 0.8f; // 공기 저항: 현재 속도에 비례한 반대 방향 힘

    // 2. 속도 업데이트
    Velocity += Accel * DeltaTime;
    if (Velocity.SizeSquared() < 1.f)
        Velocity = FVector::ZeroVector; // 거의 멈추면 완전 정지

    // 3. 위치 업데이트
    const FVector NextPos = GetActorLocation() + Velocity * DeltaTime;
    SetActorLocation(NextPos);

    // 4. 회전: 속도 벡터 방향으로 탄환 회전
    SetActorRotation(UKismetMathLibrary::MakeRotFromZX(Velocity, GetActorUpVector()));
}
```

**중력 처리**: `GetWorld()->GetGravityZ()`를 사용해 월드에 설정된 중력값을 동적으로 가져온다. 하드코딩 대신 월드 설정을 따르기 때문에 중력이 변하는 특수 구역에서도 자동으로 대응한다.

**공기 저항 모델**: 실제 유체 역학에서 공기 저항은 속도의 제곱에 비례하지만, 이 구현에서는 속도에 비례하는 **선형 감쇠(Linear Drag)** 모델을 사용한다. 계산이 단순하면서도 탄환이 점점 느려지는 시각적 효과를 충분히 표현할 수 있기 때문이다. 감쇠 계수 0.8은 빠른 속도 감소를 의도한 값이다.

**탄환 회전**: `MakeRotFromZX(Velocity, UpVector)`로 탄환의 Forward 벡터가 항상 이동 방향(Velocity)을 향하도록 매 프레임 회전을 갱신한다. 포물선 궤적을 따라 날아가면서 탄환이 자연스럽게 고개를 숙이는 시각 효과를 얻는다.

### 4.4 탄환 궤적 시각화 (디버그 모드)

`bDrawDebug` 플래그가 활성화된 경우, 이전 프레임 위치(`PrevPos`)와 현재 위치 사이에 디버그 라인을 그려 탄환의 궤적을 에디터에서 실시간으로 확인할 수 있다.

```cpp
// BulletActor.cpp[40-44]
if (bDrawDebug)
{
    DrawDebugLine(GetWorld(), PrevPos, GetActorLocation(),
        TrailColor, false, 1.f, 0, 1.5f); // 빨간색, 1초 표시 유지
    PrevPos = GetActorLocation();
}
```

이 기능은 총구 방향이 올바른지, 탄환이 의도한 포물선을 그리는지 개발 중에 빠르게 검증하는 데 활용했다.

### 4.5 탄환 수명 관리

탄환은 `lifetime` 타이머가 3초를 초과하면 자동으로 `Destroy()`된다. 적에게 맞지 않더라도 반드시 소멸하기 때문에 탄환 액터가 씬에 무한정 쌓이는 메모리 누수를 방지한다.

```cpp
// BulletActor.cpp[46-50]
lifetime += DeltaTime;
if (lifetime > 3.f)
    this->Destroy();
```

3초 동안의 이동 거리는 초기 속도 10,000 UU/s에서 공기 저항으로 급격히 감소하므로 실제 유효 사거리 내에서 충분히 처리된다.

---

## 5. 발사 연출 연동

총기 시스템은 물리 계산 외에도 세 가지 피드백 레이어를 동시에 트리거한다.

**애니메이션**: `ShootState()`에서 `PlayAnimMontage(ShootMontage)`를 호출해 사격 자세 및 반동 애니메이션을 재생한다. 몽타주는 블루프린트에서 캐릭터마다 다른 애니메이션을 지정할 수 있다.

**VFX**: `PlayMuzzleVFX()`가 총구 위치에 Niagara 이펙트를 스폰한다. 연기·불꽃 파티클로 발사 순간의 시각적 임팩트를 강조한다.

**SFX**: `UGameplayStatics::PlaySound2D()`로 발사음을 재생한다. `PlaySoundAtLocation` 대신 `PlaySound2D`를 사용해 3D 위치와 무관하게 일정한 볼륨을 유지하도록 했다.

---

## 6. Player 무기 시스템과의 비교

같은 프로젝트에서 플레이어가 사용하는 무기 시스템은 `UCODWeaponComponent`와 `ACODProjectile`로 구성되어 있으며, 아군 NPC 시스템과는 별도로 구현되어 있다.

| 항목 | Ally NPC (직접 구현) | Player |
|------|---------------------|--------|
| 무기 클래스 | `AWeaponBase` (Actor) | `UCODWeaponComponent` (Component) |
| 발사체 | `ABulletActor` | `ACODProjectile` |
| 물리 처리 | 직접 계산 (SetBullet) | `UProjectileMovementComponent` |
| 초기 속도 | 10,000 UU/s | 3,000 UU/s |
| 공기 저항 | 있음 (선형 감쇠 0.8) | 없음 |
| 발사 방향 | 총구 Forward 벡터 | 카메라 방향 기반 |
| 발사 입력 | 타이머 자동 호출 | Enhanced Input System |

주목할 만한 차이는 **발사체 속도**다. NPC 탄환(10,000 UU/s)이 플레이어 탄환(3,000 UU/s)보다 3배 이상 빠르게 설정되어 있다. NPC가 AI 제어 하에 정확도가 낮을 수 있으므로 탄환 자체의 속도를 높여 목표물에 도달하는 비율을 보완하는 의도로 해석할 수 있다. 또한 NPC 탄환은 공기 저항으로 빠르게 감속되기 때문에 초기값을 높게 잡아야 충분한 사거리를 확보할 수 있다.

---

## 7. 개선 가능한 영역

### 오브젝트 풀링 (Object Pooling)

현재 구현에서는 발사할 때마다 `SpawnActor<ABulletActor>()`로 탄환을 생성하고 3초 후 `Destroy()`한다. 여러 NPC가 동시에 발사할 경우 매 발사마다 메모리 할당·해제가 발생한다. 미리 탄환 풀(Pool)을 생성해두고 재사용하면 런타임 메모리 할당 비용을 크게 줄일 수 있다.

### 히트스캔 옵션

현재는 모든 발사가 실제 물리 탄환을 생성하는 프로젝타일 방식이다. 근거리 전투가 많거나 성능 최적화가 필요한 상황에서는 `LineTraceSingleByChannel()`을 활용한 히트스캔 방식이 더 효율적일 수 있다. 히트스캔과 프로젝타일을 사거리에 따라 혼합 적용하는 하이브리드 방식도 고려할 수 있다.

### 발사 정확도 파라미터

현재 탄환은 총구 Forward 벡터를 정확히 따라가기 때문에 AI의 조준 정확도는 캐릭터가 적을 얼마나 정확히 바라보느냐에만 달려 있다. 발사 시 속도 벡터에 랜덤 오프셋(산탄, Spread)을 추가하면 거리에 따른 정확도 감소를 구현할 수 있다.

### 충돌 처리 미구현

현재 `ABulletActor`에는 충돌 처리 코드가 없다. 캡슐 컴포넌트(`Collision`)가 있지만 히트 이벤트 바인딩이 구현되지 않아 탄환이 벽이나 적 캐릭터를 통과한다. 추후 `OnComponentBeginOverlap` 또는 `OnComponentHit`을 바인딩해 데미지 처리와 충돌 이펙트를 추가할 수 있다.
