# 탄도 시스템 개발 노트

> 포트폴리오용 개발 참고 문서 (1차 초안)
> 작성일: 2026-04-02

---

## 배경

팀 프로젝트에서 탄도 시스템을 담당했다. 팀 프로젝트가 마무리된 후, 그 경험을 바탕으로 개인 프로젝트에서 같은 시스템을 처음부터 다시 구현했다. 단순 이식이 아니라 **"더 낮은 레벨에서, 더 직접적으로"** 를 목표로 재설계했다.

테스트 환경은 언리얼 엔진 기본 제공 FPP(First Person) 번들팩 위에 구축했다. 플레이어 발사 인프라는 번들팩 것을 그대로 쓰고, 발사체 이동 컴포넌트만 완전히 교체했다.

---

## 왜 직접 구현인가

언리얼에는 `UProjectileMovementComponent`가 있다. 속도, 중력, 바운스를 몇 줄로 처리해주는 컴포넌트다.

```cpp
// 엔진 기본 방식 — 컴포넌트가 알아서 처리
ProjectileMovement->InitialSpeed = 3000.0f;
ProjectileMovement->MaxSpeed = 3000.0f;
ProjectileMovement->bShouldBounce = true;
```

편리하지만 이 컴포넌트는 내부에서 무슨 일이 벌어지는지 알 수 없다. 탄도 파라미터를 바꾸려면 컴포넌트가 노출한 프로퍼티 범위 안에서만 가능하고, 물리 모델 자체를 바꾸는 건 불가능하다.

개인 프로젝트의 목표는 달랐다:

- 탄도 공식을 직접 코드로 쓴다
- 충돌 판정을 직접 호출한다
- 엔진 컴포넌트를 상속하지 않는다

그 결과물이 `UCOD_ProjectileMovementComponent`다.

실제로 `AShooterProjectile`에서 엔진 컴포넌트는 주석 처리하고 커스텀 컴포넌트로 교체했다:

```cpp
// ShooterProjectile.h
// class UProjectileMovementComponent;       ← 제거
class UCOD_ProjectileMovementComponent;       // 교체

// ShooterProjectile.cpp
// #include "GameFramework/ProjectileMovementComponent.h"  ← 제거
#include "cod/COD_ProjectileMovementComponent.h"           // 교체

// 생성자
ProjectileMovement = CreateDefaultSubobject<UCOD_ProjectileMovementComponent>(TEXT("Projectile Movement"));
/*
 * ProjectileMovement->InitialSpeed = 3000.0f;   ← 제거
 * ProjectileMovement->MaxSpeed = 3000.0f;        ← 제거
 * ProjectileMovement->bShouldBounce = true;      ← 제거
 */
```

엔진이 제공하던 파라미터 설정 코드가 전부 사라졌다. 대신 이제부터 모든 것을 직접 계산한다.

---

## SetActorLocation을 쓰지 않는 이유

발사체 이동에 `SetActorLocation`을 쓰는 방법이 있다. 코스트가 싸고 코드가 단순하다.

```cpp
// 단순한 방법 — 하지만 문제가 있다
SetActorLocation(CurrentPos + Velocity * DeltaTime);
```

하지만 `SetActorLocation`은 물리적으로 텔레포트에 가깝다. 이전 위치와 다음 위치 사이의 공간을 건너뛰기 때문에, 발사체가 빠를수록 얇은 벽이나 캐릭터를 관통하는 문제가 생긴다. 충돌 검사가 두 점 사이에서 일어나지 않기 때문이다.

```
SetActorLocation 방식:
[이전 위치] ──────────────────→ [다음 위치]
                   ↑
           이 구간은 검사 안 함 → 얇은 벽 관통

Sweep 방식:
[이전 위치] ─── Sweep 스캔 ───→ [예상 위치]
                    ↑
             이 구간에서 충돌체가 있으면 HitResult 반환
```

이 프로젝트에서는 매 프레임 이전 위치 → 예상 위치 구간을 `SweepSingleByChannel`로 스캔한다. 발사체가 빠르게 날아가도 그 경로 위에 있는 모든 충돌체를 잡아낸다.

---

## UCOD_ProjectileMovementComponent 구조

### 상속 관계

```
UActorComponent
    └── UCOD_ProjectileMovementComponent
```

`UMovementComponent`도, `UProjectileMovementComponent`도 상속하지 않는다. `UActorComponent`에서 직접 출발했다. 엔진이 제공하는 무브먼트 관련 인프라(`UpdatedPrimitive`, `MoveComponent` 등)를 전혀 사용하지 않는다는 의미다.

대신 직접 처리해야 하는 것들:
- `UpdatedComponent` — Owner의 `RootComponent`를 `BeginPlay`에서 직접 바인딩
- 위치 갱신 — `SetWorldLocation` 직접 호출
- 충돌 판정 — `SweepSingleByChannel` 직접 호출

### 헤더 전문

```cpp
// COD_ProjectileMovementComponent.h

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnHitDelegate, const FHitResult&, Hit);

UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class MYP_API UCOD_ProjectileMovementComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UCOD_ProjectileMovementComponent();

    virtual void BeginPlay() override;
    virtual void TickComponent(float DeltaTime, ELevelTick TickType,
                               FActorComponentTickFunction* ThisTickFunction) override;

private:
    FVector ApplyGravity();
    FRotator CalcRotation(FVector _Velocity);

public:
    // 발사 초기 속도 (기본 2000 cm/s = 초속 20m)
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Projectile")
    float InitSpeed = 2000.f;

    // 중력 배율 (1.0 = 기본 중력 980 cm/s², 0이면 무중력)
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Projectile")
    float GravityScale = 1.0f;

    // 공기저항 계수 (0.0 ~ 1.0, 클수록 빠르게 감속) — 선언 완료, 적용 대기
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Projectile")
    float AirDrag = 0.01f;

    UPROPERTY(BlueprintAssignable)
    FOnHitDelegate OnHitDelegate;

private:
    // 매 Tick마다 물리 적분으로 갱신되는 속도 벡터
    FVector Velocity = FVector::ZeroVector;

    // 실제로 이동시킬 대상 컴포넌트 (BeginPlay에서 Owner의 RootComponent로 바인딩)
    UPROPERTY()
    TObjectPtr<USceneComponent> UpdatedComponent = nullptr;
};
```

### 주요 프로퍼티 요약

| 필드 | 타입 | 설명 |
|------|------|------|
| `InitSpeed` | float | 발사 초기 속도 (기본 2000 cm/s) |
| `GravityScale` | float | 중력 배율 (기본 1.0 = 980 cm/s²) |
| `AirDrag` | float | 공기저항 계수 (선언 완료, 적분 미적용) |
| `OnHitDelegate` | Multicast Delegate | 충돌 발생 시 외부에 HitResult 전달 |
| `Velocity` | FVector | 매 프레임 적분으로 갱신되는 속도 벡터 |
| `UpdatedComponent` | USceneComponent* | 실제 이동 대상 컴포넌트 |

---

## 탄도 물리 구현

### 탄도식 (프로토타입 v1 — 중력만)

```
V(t + dt) = V(t) + A * dt

A = { 0, 0, -GravityScale * 980.0f }    (단위: cm/s²)

Delta = V(t) * dt
```

오일러 적분(Euler Method)이다. 매 프레임 가속도를 속도에 누적하고, 속도를 위치에 누적한다. 단순하지만 게임플레이 수준의 발사체에는 충분하다.

`GravityScale`을 명시적으로 선언한 이유가 있다. 엔진의 `GetWorld()->GetGravityZ()`를 그냥 가져다 쓰면 편하지만, 그렇게 하면 파라미터 제어권이 World Settings에 묶인다. `GravityScale`로 직접 배율을 관리하면 같은 월드에서도 발사체마다 중력 반응을 다르게 줄 수 있고, 에디터에서 실시간으로 조작하며 테스트할 수 있다. 언리얼 단위 1 UU ≈ 1 cm이므로, 초기 속도 2000은 초속 20m다.

### BeginPlay — 초기화 흐름

```cpp
void UCOD_ProjectileMovementComponent::BeginPlay()
{
    Super::BeginPlay();

    // [BP-1] Owner 유효성 검사
    AActor* Owner = GetOwner();
    if (!IsValid(Owner))
    {
        LOGERRORF(TEXT("Not Detected Owner"));
        SetComponentTickEnabled(false);
        return;
    }

    // [BP-2] UpdatedComponent 바인딩
    UpdatedComponent = Owner->GetRootComponent();
    if (!IsValid(UpdatedComponent))
    {
        LOGERRORF(TEXT("Not Set UpdatedComponent"));
        SetComponentTickEnabled(false);
        return;
    }

    // [BP-3] 초기 속도 복사
    Velocity = GetOwner()->GetActorForwardVector() * InitSpeed;
}
```

발사 방향은 Owner(발사체 액터)가 스폰된 시점의 Forward 벡터에서 가져온다. 발사체를 스폰할 때 Transform에 이미 조준 방향이 적용되어 있으므로, 컴포넌트에서 따로 방향을 계산할 필요가 없다.

발사 방향이 결정되는 실제 위치는 `ShooterWeapon::CalculateProjectileSpawnTransform()`이다. 거기서 조준 방향이 스폰 Transform에 이미 구워진다. 컴포넌트는 단순히 `GetActorForwardVector()`만 읽으면 된다.

### TickComponent — 매 프레임 처리 흐름

```
[TICK-1] 유효성 검사 (UpdatedComponent, Owner, World)
[TICK-2] 물리 적분 (Delta, 속도 갱신, 예상 위치 계산)
[TICK-3] SweepSingleByChannel (이전 위치 → 예상 위치)
[TICK-4] HitResult 처리
    ├─ 충돌 O → OnHitDelegate.Broadcast(HitResult)
    └─ 충돌 X → DrawDebugLine + SetWorldLocation + SetWorldRotation
```

```cpp
void UCOD_ProjectileMovementComponent::TickComponent(float DeltaTime, ELevelTick TickType,
                                                     FActorComponentTickFunction* ThisTickFunction)
{
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);

    // [TICK-1] 유효성 검사
    if (!IsValid(UpdatedComponent) || !IsValid(GetOwner()) || !IsValid(GetWorld()))
        return;

    // [TICK-2] 물리 적분
    FVector Delta = Velocity * DeltaTime;
    Velocity += ApplyGravity() * DeltaTime;
    FVector NewPos = UpdatedComponent->GetComponentLocation() + Delta;

    // [TICK-3] SweepSingleByChannel
    FCollisionQueryParams Params;
    Params.AddIgnoredActor(GetOwner());
    Params.bTraceComplex = false;

    FHitResult HitResult;
    bool bHit = GetWorld()->SweepSingleByChannel(
        HitResult,
        UpdatedComponent->GetComponentLocation(),
        NewPos,
        FQuat::Identity,
        ECC_Visibility,
        FCollisionShape::MakeSphere(5.f),
        Params
    );

    // [TICK-4] HitResult 처리
    if (bHit)
    {
        if (OnHitDelegate.IsBound())
            OnHitDelegate.Broadcast(HitResult);
    }
    else
    {
        DrawDebugLine(GetWorld(), UpdatedComponent->GetComponentLocation(), NewPos, FColor::Red, false, 2.f);
        UpdatedComponent->SetWorldLocation(NewPos, false, nullptr, ETeleportType::None);
        UpdatedComponent->SetWorldRotation(CalcRotation(Velocity), false, nullptr, ETeleportType::None);
    }
}
```

### ApplyGravity

```cpp
FVector UCOD_ProjectileMovementComponent::ApplyGravity()
{
    FVector Accel = {0.f, 0.f, -GravityScale * 980.f};
    return Accel;
}
```

중력 계산을 별도 함수로 분리했다. 추후 `AirDrag`나 바람 등 추가 가속도 요소가 생겨도 이 함수에 누적하면 된다. `ApplyGravity()`가 반환하는 값은 가속도(cm/s²)이고, Tick에서 `DeltaTime`을 곱해 속도에 적분된다.

---

## SweepSingleByChannel — Chaos와의 직접 통신

충돌 판정의 핵심이다.

```cpp
FHitResult HitResult;
bool bHit = GetWorld()->SweepSingleByChannel(
    HitResult,
    UpdatedComponent->GetComponentLocation(),  // Start: 현재 위치
    NewPos,                                    // End:   예상 위치
    FQuat::Identity,                           // 구형이므로 회전 무관
    ECC_Visibility,                            // 콜리전 채널
    FCollisionShape::MakeSphere(5.f),          // 구형 충돌체 (r=5cm)
    Params
);
```

`SweepSingleByChannel`은 언리얼이 Chaos 물리 엔진과 직접 통신하는 최저 레벨 공개 API다. 엔진 내부의 `MoveComponent()`도 결국 이것을 호출한다. 이보다 아래는 Chaos 내부 블랙박스다.

Start에서 End까지 지정한 형태(여기서는 반지름 5cm의 구)를 쓸어가며 충돌체가 있는지 검사한다. 충돌이 있으면 `HitResult`에 충돌 위치, 충돌한 컴포넌트, 충돌 법선 등의 정보가 채워지고 `true`를 반환한다.

`Params.AddIgnoredActor(GetOwner())`로 발사체 자신의 Owner(발사자)는 무시한다. `bTraceComplex = false`로 단순 콜리전을 사용해 성능을 아낀다.

발사체 콜리전 형태는 반지름 5cm의 구형. 프로토타입 단계라 하드코딩이지만, 이후 `UPROPERTY`로 노출해 조정 가능하게 할 수 있다.

---

## 충돌 후 처리 — 델리게이트 패턴

충돌이 발생하면 컴포넌트가 직접 `Destroy`하지 않는다. `OnHitDelegate`로 `HitResult`를 발사체 액터 쪽에 전달하고, 처리는 외부에 위임한다.

```cpp
// 델리게이트 선언 (헤더)
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnHitDelegate, const FHitResult&, Hit);

// 충돌 발생 시
if (OnHitDelegate.IsBound())
    OnHitDelegate.Broadcast(HitResult);
```

`AShooterProjectile`에서 `BeginPlay`에 바인딩한다:

```cpp
// ShooterProjectile.cpp — BeginPlay
void AShooterProjectile::BeginPlay()
{
    Super::BeginPlay();

    CollisionComponent->IgnoreActorWhenMoving(GetInstigator(), true);
    ProjectileMovement->OnHitDelegate.AddDynamic(this, &AShooterProjectile::OnProjectileHit);
}
```

`OnProjectileHit`이 실제 충돌 처리를 담당한다:

```cpp
void AShooterProjectile::OnProjectileHit(const FHitResult& Hit)
{
    if (bHit) return;
    bHit = true;

    CollisionComponent->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    MakeNoise(NoiseLoudness, GetInstigator(), GetActorLocation(), NoiseRange, NoiseTag);

    if (bExplodeOnHit)
        ExplosionCheck(GetActorLocation());
    else
        ProcessHit(Hit.GetActor(), Hit.GetComponent(), Hit.ImpactPoint, -Hit.ImpactNormal);

    BP_OnProjectileHit(Hit);

    if (DeferredDestructionTime > 0.0f)
        GetWorld()->GetTimerManager().SetTimer(DestructionTimer, this,
            &AShooterProjectile::OnDeferredDestruction, DeferredDestructionTime, false);
    else
        Destroy();
}
```

여기서 `NotifyHit`을 쓰지 않은 이유가 있다. `NotifyHit`은 엔진 콜리전 시스템이 자동 호출하는 가상 함수라 시그니처가 델리게이트와 불일치한다. 자체 Sweep 방식과 공존할 수 없어 새 핸들러로 교체했다.

이 방식의 장점은 컴포넌트가 충돌 후 행동(폭발, 데미지, 이펙트 등)에 대해 아무것도 알 필요가 없다는 것이다. 컴포넌트는 "충돌이 났다"는 사실만 외부로 던지고, 어떻게 처리할지는 바인딩된 함수가 결정한다. 역할이 명확하게 분리되고 컴포넌트 재사용성이 높아진다.

---

## 회전 동기화 — CalcRotation

발사체가 포물선 궤적을 그릴 때 메시 회전이 이동 방향을 따라가지 않으면 어색하다. 총알이 아래로 휘어져 날아가는데 메시는 발사 순간의 수평 방향을 유지하고 있다면 몰입감이 깨진다.

`CalcRotation`이 매 Tick 속도 벡터 방향으로 회전을 맞춰준다.

```cpp
FRotator UCOD_ProjectileMovementComponent::CalcRotation(FVector _Velocity)
{
    FVector Forward = _Velocity.GetSafeNormal();
    FVector Up      = FVector::UpVector;
    FVector Right   = FVector::CrossProduct(Up, Forward).GetSafeNormal();
    Up              = FVector::CrossProduct(Forward, Right).GetSafeNormal();

    FMatrix m = FMatrix(Forward, Right, Up, FVector::ZeroVector);
    return m.Rotator();
}
```

세 직교 기저벡터(Forward / Right / Up)를 CrossProduct로 구성해 회전 행렬을 만드는 방식이다.

- `CrossProduct(UpVector, Forward)` → Right 구함
- `CrossProduct(Forward, Right)` → Up을 재직교화

Up을 재계산하는 이유가 있다. 월드 UpVector와 Forward가 완전히 수직이 아닐 수 있기 때문에, FMatrix의 직교성을 보장하려면 Up을 다시 계산해야 한다.

### 현재 구현의 한계 — 짐벌락

이 방식은 `UpVector`를 기준축으로 사용한다. Forward(속도 방향)가 UpVector(0, 0, 1)와 평행해지는 순간, 즉 발사체가 **수직으로 낙하하는 상황**에서 문제가 생긴다.

```
Forward  = (0, 0, -1)   ← 수직 낙하
UpVector = (0, 0,  1)

CrossProduct(UpVector, Forward) = (0, 0, 0)  ← 영벡터
```

`Right`가 영벡터가 되면 회전 행렬 자체가 정의 불가능한 상태가 된다. `GetSafeNormal()`이 영벡터를 반환하면 ZeroVector로 처리되어 회전이 튀거나 고정되는 버그로 나타난다. 정상적인 궤적 범위에서는 잘 동작하지만, 수직 발사 → 낙하 시나리오에서 이 한계에 도달할 수 있다. 이 부분은 다음 단계에서 쿼터니언으로 교체 예정이다.

---

## 개발 히스토리

시스템이 완성되기까지 커밋 단위로 정리한 흐름이다.

| 날짜 | 내용 |
|------|------|
| 03-18 | `BulletActor`, `WeaponBase` 이식 — 초기 빌드 오류 수정 |
| 03-26 | FPP 번들팩 추가 — 테스트 환경 구축. include 경로 및 UHT 충돌 해결 |
| 03-26 | `COD_ProjectileMovementComponent.h` 완성 — 탄도식 설계 블록 주석 삽입 |
| 03-31 | `ShooterProjectile ↔ UCOD_ProjectileMovementComponent` 연동 완료 — `UProjectileMovementComponent` 교체, `OnHitDelegate` 바인딩, `InitSpeed` 리팩토링, WBP_Crosshair 추가 |
| 04-02 | Tick 내 `DrawDebugLine` 추가 — 탄도 궤적 실시간 시각화 |
| 04-02 | `CalcRotation()` 신규 작성 — CrossProduct 기반 회전 행렬로 메시 방향 동기화 |

크게 세 단계를 거쳤다:

1. **환경 구축** — FPP 번들팩 위에 테스트 맵 세팅, 기존 컴포넌트 제거
2. **연동** — `ShooterProjectile`이 커스텀 컴포넌트를 사용하도록 교체, 델리게이트 바인딩
3. **시각 검증** — 디버그 라인으로 궤적 확인, 회전 동기화 구현

---

## 핵심 어필 포인트 정리

**1. 탄도 공식을 직접 코드로**
뉴턴 역학 기반 오일러 적분을 직접 작성했다. 엔진 컴포넌트에 파라미터를 넘기는 것이 아니라, `V(t+dt) = V(t) + A*dt` 공식이 코드에 그대로 있다.

**2. SetActorLocation 한계를 알고 Sweep으로 해결**
단순 이동과 물리적으로 올바른 이동의 차이를 이해하고 있다는 증거다. 왜 Sweep이 필요한지, 어느 레벨의 API를 써야 하는지를 선택하고 적용했다.

**3. SweepSingleByChannel — Chaos와의 직접 통신**
엔진이 노출하는 물리 API 최저 레벨을 직접 사용했다. `MoveComponent` 추상화 레이어를 거치지 않는다.

**4. UActorComponent 직접 상속**
`UProjectileMovementComponent` 상속 없이 처음부터 컴포넌트를 만들었다. `UpdatedComponent` 바인딩, 충돌 판정, 위치 갱신을 전부 직접 처리한다.

**5. 델리게이트 기반 충돌 처리**
컴포넌트가 충돌 후 행동을 몰라도 된다. 역할 분리가 명확하고 재사용 가능한 구조다.

**6. NotifyHit 대신 커스텀 핸들러**
엔진 콜리전 시스템 자동 호출 방식(`NotifyHit`)과 자체 Sweep 방식의 충돌을 인지하고, 설계 의도에 맞는 방식으로 교체했다.

---

## 현재 상태 및 미구현 항목

| 항목 | 상태 | 비고 |
|------|------|------|
| 탄도 물리 (중력) | ✅ 완료 | 오일러 적분, GravityScale 파라미터 |
| Sweep 충돌 판정 | ✅ 완료 | SweepSingleByChannel, 구형 r=5cm |
| 회전 동기화 | ✅ 완료 | CrossProduct 기반 (짐벌락 한계 있음) |
| 디버그 시각화 | ✅ 완료 | DrawDebugLine, 궤적 실시간 확인 |
| 델리게이트 연동 | ✅ 완료 | OnHitDelegate → ShooterProjectile |
| AirDrag 공기저항 | 🔲 미적용 | 헤더 선언 완료, 적분 미적용 |
| 짐벌락 해소 | 🔲 다음 단계 | 쿼터니언(FQuat::FindBetweenNormals) 교체 예정 |
| 오브젝트 풀링 | 🔲 미구현 | 현재 SpawnActor/Destroy 방식 |

---

*이 문서는 pptx 슬라이드 작성 시 참고용 초안이다.*
