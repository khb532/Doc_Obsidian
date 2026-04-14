# COD 슈터 시스템 재설계 문서

> 작성일: 2026-04-09  
> 브랜치: CoD  
> 기반 패키지: variant_shooter (FPP 번들팩)

---

## 1. 현황 분석

### 기존 구조 (variant_shooter)

```
AShooterCharacter (IShooterWeaponHolder)
  └── AShooterWeapon
        └── AShooterProjectile
              └── UCOD_ProjectileMovementComponent
```

| 클래스 | 현재 상태 | 문제점 |
|--------|-----------|--------|
| `AShooterCharacter` | 플레이어 + 인터페이스 구현 | 무기 목록 직접 보유, 강한 결합 |
| `AShooterWeapon` | Fire() → ProjectileClass 스폰 | 탄종 고정, 확장 불가 |
| `AShooterProjectile` | 단일 클래스, 폭발 여부 bool | 탄종별 분화 없음 |
| `UCOD_ProjectileMovementComponent` | 중력만 구현, UActorComponent 상속 | 탄종별 물리 특성 분화 불가 |

### 재사용 가능 자원

- `IShooterWeaponHolder` 인터페이스 → 그대로 유지
- `UCOD_ProjectileMovementComponent` → 베이스 클래스로 리팩토링
- `ATP_FirstPersonCharacter` → 캐릭터 베이스 유지
- `AShooterWeapon`의 FP/TP 메시 분리 구조 → 유지

---

## 2. 목표 아키텍처

### 설계 원칙

1. **의존성 방향**: `Player → Weapon → Bullet`, 역방향 참조 금지
2. **확장 지점**: 상속으로 탄종 분화, 공통 로직은 베이스에 집중
3. **인터페이스 경계**: Weapon은 Holder 인터페이스를 통해서만 캐릭터에 접근

### 전체 클래스 계층

```
ATP_FirstPersonCharacter
  └── AShooterCharacter  (IShooterWeaponHolder 구현)
        │
        │  Fire 명령만 전달 (약한 결합)
        ▼
      AShooterWeapon
        │
        │  BulletClass (TSubclassOf) 로 스폰
        ▼
      ABulletBase  ←─────────────────────────────┐
        ├── ASmallCaliber  (소구경 총알)           │
        ├── AHighCaliber   (대구경 / 스나이퍼)     │
        ├── ARocketBullet  (로켓탄)               │  상속
        └── ACannonShell   (포탄)                │

      UCOD_ProjectileMovementComponentBase  ──────┘
        ├── UCODProjMove_Bullet     (총알 전용)
        ├── UCODProjMove_Rocket     (로켓 전용)
        └── UCODProjMove_Artillery  (포탄 전용)
```

---

## 3. 클래스별 설계 명세

### 3-1. ABulletBase

> 경로: `Source/MYP/cod/Bullet/ABulletBase.h`

```cpp
UCLASS(Abstract)
class ABulletBase : public AActor
{
    // --- 컴포넌트 ---
    USphereComponent*                         CollisionComponent;
    UCOD_ProjectileMovementComponentBase*     ProjectileMovement;  // 자식이 교체

    // --- 탄종 공통 스탯 ---
    UPROPERTY(EditDefaultsOnly, Category="Bullet")
    float Mass          = 1.0f;    // 질량 (g 단위, 물리 계산용)
    
    UPROPERTY(EditDefaultsOnly, Category="Bullet")
    float InitSpeed     = 2000.f;  // 초기 속도 (cm/s)
    
    UPROPERTY(EditDefaultsOnly, Category="Bullet")
    float HitDamage     = 25.f;
    
    UPROPERTY(EditDefaultsOnly, Category="Bullet")
    float PhysicsForce  = 100.f;
    
    UPROPERTY(EditDefaultsOnly, Category="Bullet")
    TSubclassOf<UDamageType> HitDamageType;

    // --- 파괴 ---
    UPROPERTY(EditDefaultsOnly, Category="Bullet")
    float DeferredDestructionTime = 5.f;

    // --- 공통 인터페이스 ---
    virtual void OnBulletHit(const FHitResult& Hit);          // 히트 처리
    virtual void ApplyDamage(AActor* HitActor,
                              const FVector& HitLocation,
                              const FVector& HitDirection);   // 피해 적용

    // BP 확장 포인트
    UFUNCTION(BlueprintImplementableEvent)
    void BP_OnBulletHit(const FHitResult& Hit);
};
```

**역할**: 모든 탄환의 공통 생명주기·충돌·피해 처리를 담당.  
물리 컴포넌트 타입은 자식 클래스가 BeginPlay에서 교체.

---

### 3-2. 탄종별 Bullet 자식 클래스

| 클래스 | 특이사항 |
|--------|---------|
| `ASmallCaliber` | 경량(Mass≈0.004), 고속(3000 cm/s), 낮은 AirDrag |
| `AHighCaliber` | 중량, 강한 관통 데미지, HighCaliber 전용 무브 컴포넌트 |
| `ARocketBullet` | bExplodeOnHit=true, ExplosionRadius, Rocket 무브 컴포넌트 |
| `ACannonShell` | 고중량(Mass≈10), 포물선 궤적, Artillery 무브 컴포넌트 |

```cpp
// 예시: ARocketBullet
UCLASS()
class ARocketBullet : public ABulletBase
{
    UPROPERTY(EditDefaultsOnly, Category="Rocket")
    float ExplosionRadius = 500.f;

    UPROPERTY(EditDefaultsOnly, Category="Rocket")
    float SplashDamage = 80.f;

    virtual void OnBulletHit(const FHitResult& Hit) override; // 폭발 처리 추가
};
```

---

### 3-3. UCOD_ProjectileMovementComponentBase

> 경로: `Source/MYP/cod/UCOD_ProjectileMovementComponentBase.h`

```cpp
UCLASS(Abstract, ClassGroup=(COD))
class UCOD_ProjectileMovementComponentBase : public UActorComponent
{
    // --- 공통 물리 파라미터 ---
    UPROPERTY(EditAnywhere, Category="Projectile")
    float InitSpeed     = 2000.f;

    UPROPERTY(EditAnywhere, Category="Projectile")
    float GravityScale  = 1.0f;

    UPROPERTY(EditAnywhere, Category="Projectile")
    float AirDrag       = 0.01f;   // 이제 실제로 사용

    UPROPERTY(BlueprintAssignable)
    FOnHitDelegate OnHitDelegate;

    // --- 공통 내부 상태 ---
    FVector Velocity = FVector::ZeroVector;
    TObjectPtr<USceneComponent> UpdatedComponent;

    // --- 공통 Tick 흐름 ---
    virtual void TickComponent(...) override;  // 공통 Sweep·이동·회전 처리

    // --- 자식이 재정의하는 물리 적분 ---
    virtual FVector ComputeAcceleration(float DeltaTime);    // 기본: 중력만
    virtual FRotator ComputeRotation(const FVector& Vel);    // 기본: 속도 방향 정렬
};
```

**TickComponent 공통 흐름** (베이스에 고정):

```
1. 유효성 검사
2. Delta = Velocity * DeltaTime
3. Velocity += ComputeAcceleration(dt) * dt       ← 자식이 재정의
4. SweepSingleByChannel
5. Hit → OnHitDelegate.Broadcast
   NoHit → SetWorldLocation + SetWorldRotation(ComputeRotation) ← 자식이 재정의
```

---

### 3-4. 전용 발사체 무브 컴포넌트

#### UCODProjMove_Bullet (소/대구경 총알)

```cpp
class UCODProjMove_Bullet : public UCOD_ProjectileMovementComponentBase
{
    // 탄도 계수 (BC, Ballistic Coefficient)
    UPROPERTY(EditAnywhere, Category="Ballistics")
    float BallisticCoefficient = 0.5f;

    // 공기저항 공식: F_drag = -AirDrag * BC * V²
    virtual FVector ComputeAcceleration(float DeltaTime) override;
};
```

#### UCODProjMove_Rocket (로켓탄)

```cpp
class UCODProjMove_Rocket : public UCOD_ProjectileMovementComponentBase
{
    // 추력 지속 시간
    UPROPERTY(EditAnywhere, Category="Rocket")
    float ThrustDuration  = 1.5f;   // 초

    UPROPERTY(EditAnywhere, Category="Rocket")
    float ThrustForce     = 5000.f; // cm/s²

    float ElapsedTime = 0.f;

    // 추력 + 중력 + 유도 (선택)
    virtual FVector ComputeAcceleration(float DeltaTime) override;
};
```

#### UCODProjMove_Artillery (포탄)

```cpp
class UCODProjMove_Artillery : public UCOD_ProjectileMovementComponentBase
{
    // 대기압 밀도 계수
    UPROPERTY(EditAnywhere, Category="Artillery")
    float DragCoefficient = 0.3f;

    UPROPERTY(EditAnywhere, Category="Artillery")
    float CrossSectionalArea = 50.f; // cm²

    virtual FVector ComputeAcceleration(float DeltaTime) override;
    virtual FRotator ComputeRotation(const FVector& Vel) override; // 탄두 회전 추가
};
```

---

### 3-5. AShooterWeapon (수정 방향)

기존 `ProjectileClass` 타입을 `TSubclassOf<ABulletBase>` 로 교체.  
Fire 로직은 그대로 유지, Bullet 스폰 시 `InitSpeed` 를 Weapon 설정에서 전달.

```cpp
// 변경 전
TSubclassOf<AShooterProjectile> ProjectileClass;

// 변경 후
UPROPERTY(EditDefaultsOnly, Category="Weapon")
TSubclassOf<ABulletBase> BulletClass;
```

`FireProjectile()` 내부에서 스폰 후 `BulletBase->InitSpeed` 덮어쓰기 (선택).

---

### 3-6. AShooterCharacter (변경 없음)

`IShooterWeaponHolder` 인터페이스로만 Weapon과 통신.  
Bullet 타입을 전혀 알 필요 없음 → 의존성 최소화 달성.

---

## 4. 의존성 다이어그램

```
┌──────────────────────┐
│  AShooterCharacter   │  IShooterWeaponHolder 인터페이스만 사용
└──────────┬───────────┘
           │ Fire() 명령
           ▼
┌──────────────────────┐
│   AShooterWeapon     │  BulletClass 만 알고 있음
└──────────┬───────────┘
           │ SpawnActor<ABulletBase>
           ▼
┌──────────────────────┐     ┌──────────────────────────────┐
│     ABulletBase      │────▶│ UCOD_Proj_MovementBase       │
│  (ASmallCaliber 등)  │     │  (UCODProjMove_Bullet 등)    │
└──────────────────────┘     └──────────────────────────────┘
```

**각 계층이 아는 것만 정리:**

| 계층 | 아는 것 | 모르는 것 |
|------|---------|----------|
| Character | IShooterWeaponHolder | Weapon 구체 타입, Bullet |
| Weapon | ABulletBase (스폰만) | Character 구체 타입 |
| Bullet | MovementComponent | Weapon, Character |
| MovementComponent | Owner RootComponent | Bullet 데미지, Weapon |

---

## 5. 개발 순서 (구현 로드맵)

```
Phase 1 — 기반 클래스
  [1-1] UCOD_ProjectileMovementComponentBase 추출
        - 기존 COD_ProjectileMovementComponent 코드 분리
        - ComputeAcceleration / ComputeRotation 가상 함수화

  [1-2] ABulletBase 작성
        - 공통 충돌·피해·파괴 로직
        - ProjectileMovement 컴포넌트 슬롯

Phase 2 — 전용 무브 컴포넌트
  [2-1] UCODProjMove_Bullet  (AirDrag + BC 적용)
  [2-2] UCODProjMove_Rocket  (추력 + 타이머)
  [2-3] UCODProjMove_Artillery (고중량 포물선)

Phase 3 — 탄종 Bullet 자식 클래스
  [3-1] ASmallCaliber  → UCODProjMove_Bullet 사용
  [3-2] AHighCaliber   → UCODProjMove_Bullet 사용 (파라미터 차별화)
  [3-3] ARocketBullet  → UCODProjMove_Rocket 사용
  [3-4] ACannonShell   → UCODProjMove_Artillery 사용

Phase 4 — Weapon 연동
  [4-1] AShooterWeapon.ProjectileClass → BulletClass 교체
  [4-2] FireProjectile() 로직 업데이트

Phase 5 — 검증 및 정리
  [5-1] Blueprint 자식 클래스로 각 탄종 파라미터 튜닝
  [5-2] AShooterProjectile 제거 또는 Deprecated 처리
  [5-3] 기존 COD_ProjectileMovementComponent 제거
```

---

## 6. 파일 구조 계획

```
Source/MYP/cod/
├── COD_ProjectileMovementComponentBase.h/.cpp   ← NEW (Phase 1)
├── Bullet/
│   ├── BulletBase.h/.cpp                        ← NEW (Phase 1)
│   ├── SmallCaliber.h/.cpp                      ← NEW (Phase 3)
│   ├── HighCaliber.h/.cpp                       ← NEW (Phase 3)
│   ├── RocketBullet.h/.cpp                      ← NEW (Phase 3)
│   └── CannonShell.h/.cpp                       ← NEW (Phase 3)
├── Movement/
│   ├── CODProjMove_Bullet.h/.cpp                ← NEW (Phase 2)
│   ├── CODProjMove_Rocket.h/.cpp                ← NEW (Phase 2)
│   └── CODProjMove_Artillery.h/.cpp             ← NEW (Phase 2)
└── COD_ProjectileMovementComponent.h/.cpp       ← DEPRECATED → Phase 5에서 제거
```

---

## 7. 현재 COD_ProjectileMovementComponent 상태

- `UCOD_ProjectileMovementComponent` : `UActorComponent` 직접 상속
- 중력 적용 구현 완료, AirDrag 미사용
- `OnHitDelegate` → `ShooterProjectile.OnProjectileHit` 에 바인딩
- **Phase 1-1에서 베이스 클래스로 추출 후 이 클래스는 Deprecated 처리**
