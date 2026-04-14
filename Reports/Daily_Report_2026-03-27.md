# 일일 작업 레포트 - 2026년 03월 27일

## 📋 프로젝트 정보
- **전체 프로젝트**: MYP — Unreal Engine 5 기반 C++ FPS 게임 (포트폴리오)
- **현재 단계**: CoD 브랜치 — 커스텀 발사체 무브먼트 컴포넌트 구현
- **단계 목표**: UProjectileMovementComponent 미상속, UActorComponent 직접 구축으로 탄도 물리 구현
- **작업 브랜치**: CoD

---

## ✅ 완료된 작업

**수정된 파일**:
- `Source/MYP/cod/COD_ProjectileMovementComponent.h`
- `Source/MYP/cod/COD_ProjectileMovementComponent.cpp`

**구현 완료 항목** (7/7):

1. ✅ **[BP-1] Owner 유효성 검사** — `GetOwner()` + `IsValid()` + `SetComponentTickEnabled(false)`
2. ✅ **[BP-2] UpdatedComponent 바인딩** — `Owner->GetRootComponent()` 바인딩 + 실패 시 Tick 비활성화
3. ✅ **[BP-3] 초기 속도 복사** — `Velocity = InitVelocity`
4. ✅ **[TICK-1] TickComponent 유효성 검사** — UpdatedComponent / Owner / World 각각 분리 검사 + LOGERRORF
5. ✅ **[TICK-2] 물리 적분** — 오일러 적분 순서 준수 (Delta → Velocity 갱신 → NewPos)
6. ✅ **[TICK-3] SweepSingleByChannel** — 구형 Sweep, 자기 자신 무시, `bool bHit` 반환값 저장
7. ✅ **[TICK-4] HitResult 처리** — `OnHitDelegate` 델리게이트 브로드캐스트 방식으로 충돌 처리

---

## 🔧 설계 특이사항

- **충돌 처리를 델리게이트로 변경**: 원래 계획은 `GetOwner()->Destroy()` 직접 호출이었으나, `UProjectileMovementComponent` 엔진 소스 분석 결과 `OnProjectileStop` 델리게이트 방식이 더 구조적임을 확인 → `FOnHitDelegate` / `OnHitDelegate`로 구현
- **`IsBound()` 분리**: `bHit && IsBound()` 체인 대신 중첩 if로 분리하여 바인딩 누락 시 `LOGERRORF` 출력

---

## 🔜 다음 세션 작업 — ShooterProjectile 연동

`AShooterProjectile` (FPP 번들팩)을 우리 컴포넌트와 연동하기 위해 아래 수정 필요:

### 헤더 (`ShooterProjectile.h`)
- `#include "GameFramework/ProjectileMovementComponent.h"` → `COD_ProjectileMovementComponent.h` 로 교체
- `UProjectileMovementComponent* ProjectileMovement` → `UCOD_ProjectileMovementComponent* ProjectileMovement` 로 타입 교체

### CPP (`ShooterProjectile.cpp`)
- 생성자에서 `ProjectileMovement->InitialSpeed`, `MaxSpeed`, `bShouldBounce` 설정 제거 (우리 컴포넌트에 없는 필드)
- `BeginPlay`에서 `OnHitDelegate` 바인딩 추가 (`ProcessHit` 또는 `Destroy` 호출)
- `NotifyHit()` 제거 검토 — 우리 델리게이트가 충돌을 처리하므로 중복

---

## 💡 학습 내용

- **오일러 적분 순서**: Delta는 속도 갱신 전에 계산해야 현재 프레임 속도를 정확히 반영
- **`IsValid()` vs nullptr 체크**: GC PendingKill 상태 객체를 잡기 위해 UObject는 항상 `IsValid()` 사용
- **`SetWorldLocation(bSweep)`**: 내부적으로 Sweep을 수행할 수 있으나, 이미 `SweepSingleByChannel`로 판정한 경우 `false`로 중복 방지
- **델리게이트 `IsBound()` 불필요**: `Broadcast()`는 바인딩이 없으면 아무것도 안 하므로 사전 체크 불필요 (단, 바인딩 누락 감지 목적으로는 유용)
- **게임 총알 속도 표현**: 실제 총알 속도(37,000~90,000 cm/s)는 UE에서 히트스캔처럼 보임. 게임적 표현은 5,000~20,000 cm/s 수준의 느린 발사체 방식 사용

---

**작성일**: 2026년 03월 27일
