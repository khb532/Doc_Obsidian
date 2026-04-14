# 총알 궤적 회전 동기화

> COD Clone Project — Projectile Rotation Sync
> 작성일: 2026-03-31

---

## 1. 개요

발사체(Projectile)가 포물선 궤적을 그릴 때, 메시의 회전값이 실제 이동 방향을 따라가지 않으면 시각적으로 어색하다. 총알이 아래로 휘어져 날아가는데 메시는 발사 순간의 수평 방향을 유지하고 있다면 몰입감이 깨진다.

이 문서는 `COD_ProjectileMovementComponent`에서 발생한 회전 고정 문제를 발견하고, CrossProduct 기반 회전 행렬을 거쳐 최종적으로 쿼터니언으로 해결하기까지의 과정을 기록한다.

---

## 2. 문제 정의 — 발사 순간 회전값 고정

`COD_ProjectileMovementComponent`는 매 Tick마다 속도 벡터(`Velocity`)에 중력 가속도를 적분해 발사체를 이동시킨다.

```cpp
// [TICK-2] 물리 적분
FVector Accel = {0.f, 0.f, -GravityScale * 980.f};
FVector Delta = Velocity * DeltaTime;
Velocity += Accel * DeltaTime;
FVector NewPos = UpdatedComponent->GetComponentLocation() + Delta;
```

위치는 매 프레임 갱신되지만, **회전값은 건드리지 않는다.** 결과적으로 발사체는 BeginPlay 시점에 설정된 회전값을 그대로 유지하며 날아간다. 중력으로 궤적이 아래로 휘어도 메시는 수평을 향한 채 고정된다.

---

## 3. 1차 해결 시도 — CrossProduct 기반 회전 행렬

속도 벡터 방향으로 회전을 맞추는 가장 직관적인 방법은 세 개의 직교 기저벡터를 직접 구성해 회전 행렬을 만드는 것이다.

```cpp
FVector Forward = Velocity.GetSafeNormal();
FVector Right   = FVector::CrossProduct(FVector::UpVector, Forward).GetSafeNormal();
FVector Up      = FVector::CrossProduct(Forward, Right);

FMatrix RotMatrix(Forward, Right, Up, FVector::ZeroVector);
FRotator NewRot = RotMatrix.Rotator();

UpdatedComponent->SetWorldLocation(NewPos, false, nullptr, ETeleportType::None);
UpdatedComponent->SetWorldRotation(NewRot, false, nullptr, ETeleportType::None);
```

`CrossProduct(UpVector, Forward)`로 Right를 구하고, 다시 `CrossProduct(Forward, Right)`로 Up을 직교화한다. 이렇게 만든 행렬로 `FRotator`를 추출하는 방식이다.

정상적인 궤적 범위에서는 잘 동작하지만, 한 가지 구조적 취약점이 있다.

---

## 4. 짐벌락 문제 발생 가능성

CrossProduct 방식은 **`UpVector`를 기준축으로 사용**한다. `Forward`(속도 방향)가 `UpVector`(0, 0, 1)와 평행해지는 순간, 즉 발사체가 **수직으로 낙하하는 상황**에서 문제가 생긴다.

```
Forward = (0, 0, -1)  ← 수직 낙하
UpVector = (0, 0, 1)

CrossProduct(UpVector, Forward) = (0, 0, 0)  ← 영벡터
```

`Right`가 영벡터가 되면 회전 행렬 자체가 정의 불가능한 상태가 된다. 이것이 **짐벌락(Gimbal Lock)** 의 일종으로, 두 축이 겹쳐버려 하나의 자유도를 잃는 현상이다.

총알이 수직 낙하하는 시나리오는 충분히 발생 가능하다. 위를 향해 쏜 뒤 포물선 정점을 지나 낙하하거나, 고지대에서 아래를 향해 발사할 때 이 상황에 근접한다. 대부분의 경우 `GetSafeNormal()`이 영벡터를 반환하면 ZeroVector로 처리되어 회전이 튀거나 고정되는 버그로 나타난다.

---

## 5. 최종 해결 — 쿼터니언 `FindBetweenNormals`

쿼터니언은 세 개의 오일러 각도 대신 **4차원 벡터**로 회전을 표현하기 때문에 축 의존성이 없고 짐벌락이 구조적으로 발생하지 않는다.

언리얼 엔진의 `FQuat::FindBetweenNormals(A, B)`는 단위 벡터 A에서 단위 벡터 B로 회전하는 **최단 경로 쿼터니언**을 반환한다. 어떤 방향이든 안정적으로 처리된다.

```cpp
// [TICK-4] else 블록 — 위치 및 회전 갱신
FVector Forward = Velocity.GetSafeNormal();
FQuat NewQuat   = FQuat::FindBetweenNormals(FVector::ForwardVector, Forward);

UpdatedComponent->SetWorldLocation(NewPos, false, nullptr, ETeleportType::None);
UpdatedComponent->SetWorldRotation(NewQuat, false, nullptr, ETeleportType::None);
```

`FVector::ForwardVector`(X축, 1, 0, 0)는 언리얼 엔진의 기본 전방 방향이다. 메시의 모델링 기준 전방축이 X축이라면 이대로 사용하면 되고, Y축이나 Z축이 전방인 경우 해당 벡터로 교체한다.

### CrossProduct 방식과 비교

| 항목 | CrossProduct + FMatrix | FQuat::FindBetweenNormals |
|------|------------------------|---------------------------|
| 짐벌락 | 수직 방향에서 발생 가능 | 발생하지 않음 |
| 기준축 의존성 | UpVector 필요 | 없음 |
| 코드 복잡도 | 중간 | 단순 |
| 보간 적합성 | 낮음 | 높음 (Slerp 가능) |

---

## 6. 구현 결과

쿼터니언 방식 적용 후 발사체는 어떤 궤적에서도 메시의 전방 방향이 속도 벡터를 정확히 따라간다. 수직 낙하, 포물선 정점 통과, 사선 발사 모두 회전 튐 없이 안정적으로 동작한다.

디버그 라인(`DrawDebugLine`)으로 궤적을 시각화하면 메시 방향과 이동 방향이 항상 일치하는 것을 확인할 수 있다.

```cpp
// 디버그: 매 프레임 이전 위치 → 현재 위치 라인
DrawDebugLine(
    GetWorld(),
    UpdatedComponent->GetComponentLocation(),
    NewPos,
    FColor::Red,
    false,
    2.0f
);
```
