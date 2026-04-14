# COD_ProjectileMovementComponent 구현 계획

**작성일**: 2026-03-26
**브랜치**: CoD
**목적**: 포트폴리오 능력검증 — UActorComponent 직접 상속 기반 커스텀 발사체 무브먼트 컴포넌트

---

## 개발 방향 및 철학

- 발사체는 매 프레임 "자신이 가진 속도벡터"로 스스로 움직인다
- `SetActorLocation`, `AddForce` 코드문에 등장 안 함
- `UMovementComponent`, `UProjectileMovementComponent` 상속 없음 — `UActorComponent` 직접 구축
- Chaos와의 통신은 `SweepSingleByChannel` 단일 진입점으로 제한
- 물리 적분 계산은 멀티스레딩(워커 스레드)으로 처리
- 엔진 API 최소화 — 포트폴리오 테크니션 어필 목적

---

## 탄도식 (프로토타입 v1)

**프로토타입 적용**: 중력만

```
V(t + dt) = V(t) + A * dt

A = { 0, 0, -GravityScale * 980.0f }    (단위: cm/s²)

Delta = V(t) * dt
```

**미사용 (추후 확장)**
- AirDrag: 공기저항 (헤더에 선언만 된 상태)
- 스핀 드리프트, 바람

---

## 파일 구조

| 파일 | 상태 |
|------|------|
| `Source/MYP/cod/COD_ProjectileMovementComponent.h` | 헤더 완성. `bIsCalculating` 추가 필요 |
| `Source/MYP/cod/COD_ProjectileMovementComponent.cpp` | TODO 주석 삽입 완료. 구현 대기 |

---

## 헤더 추가 필드

```cpp
// Private:
std::atomic<bool> bIsCalculating = false;
// 고속 발사체 + 낮은 FPS 환경에서 이전 AsyncTask가 완료되기 전
// 다음 Tick이 진입하는 프레임 중첩을 방지
```

---

## 필수 헤더

```cpp
#include "MYP.h"            // LOGMSGF, LOGERRORF 매크로
#include "Engine/World.h"   // GetWorld(), SweepSingleByChannel
#include "Async/Async.h"    // AsyncTask, ENamedThreads
```

---

## 멀티스레딩 구조

```
[게임 스레드] TickComponent 진입
    │
    ├─ [TICK-1] 방어 검사 (IsValid, IsActorBeingDestroyed, bIsCalculating)
    ├─ [TICK-2] CurrentPos / CurrentVelocity 값 복사 (스냅샷)
    ├─ bIsCalculating = true
    └─ AsyncTask(WorkerThread) 발사
            │
            ├─ [TICK-3] 가속도: A = {0, 0, -GravityScale * 980.0f}
            ├─          속도 적분: NewVelocity = CurrentVelocity + A * dt
            ├─          이동 델타: Delta = CurrentVelocity * dt
            ├─          예상 위치: NewPos = CurrentPos + Delta
            └─ AsyncTask(GameThread) 발사
                    │
                    ├─ [TICK-4] IsValid 재확인
                    ├─ [TICK-5] SweepSingleByChannel (CurrentPos → NewPos)
                    ├─ [TICK-6] bHit == true  → LOGMSGF + GetOwner()->Destroy()
                    │          bHit == false → Velocity = NewVelocity
                    │                          UpdatedComponent->SetWorldLocation(NewPos)
                    └─ bIsCalculating = false
```

---

## BeginPlay 구현 순서

```
1. GetOwner() nullptr 검사
   → LOGERRORF + SetComponentTickEnabled(false) + return

2. UpdatedComponent = Owner->GetRootComponent() 바인딩
   → nullptr 검사 동일 처리

3. Velocity = InitVelocity 초기화
   → LOGMSGF(TEXT("Projectile spawned. InitVelocity=%s"), *Velocity.ToString())
```

---

## Sweep 파라미터

```cpp
FCollisionShape SweepShape = FCollisionShape::MakeSphere(5.0f); // 프로토타입 하드코딩

FCollisionQueryParams QueryParams;
QueryParams.AddIgnoredActor(GetOwner()); // 자신 무시
QueryParams.bTraceComplex = false;       // 단순 콜리전

GetWorld()->SweepSingleByChannel(
    HitResult,
    CurrentPos,       // Start: 이전 프레임 위치
    NewPos,           // End:   예상 도착 위치
    FQuat::Identity,  // 구형이므로 회전 무관
    ECC_Visibility,
    SweepShape,
    QueryParams
);
```

---

## 스레드 안전 주의사항

| 규칙 | 내용 |
|------|------|
| 워커 스레드 | UObject/UWorld 접근 금지. 순수 수치 계산만 |
| 람다 캡처 | 값 복사(`[=]`) 사용. 포인터 캡처 시 GC 위험 |
| 게임 스레드 복귀 | `IsValid()` 재확인 필수 |
| Destroy() 이후 | UpdatedComponent 포인터 접근 금지 |
| SweepSingleByChannel | 반드시 게임 스레드에서 호출 |
| SetWorldLocation | 반드시 게임 스레드에서 호출 |

---

## 검증 계획

1. 빌드 성공 확인 (Hot Reload 또는 솔루션 빌드)
2. CoDTestMap에서 발사체 스폰 → 포물선 궤적 육안 확인
3. 충돌 시 Destroy 정상 동작 확인
4. 로그에 InitVelocity, HitActor 출력 확인
