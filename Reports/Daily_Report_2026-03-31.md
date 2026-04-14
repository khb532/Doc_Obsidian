# 일일 작업 레포트 - 2026년 03월 31일

## 📋 프로젝트 정보
- **전체 프로젝트**: MYP — Unreal Engine 5 기반 C++ FPS 게임 (포트폴리오)
- **현재 단계**: CoD 브랜치 — 커스텀 발사체 무브먼트 컴포넌트 + ShooterProjectile 연동
- **단계 목표**: UCOD_ProjectileMovementComponent를 AShooterProjectile에 연동하고 발사 방향 처리 완료
- **작업 브랜치**: CoD

---

## ✅ 완료된 작업

**수정된 파일**:
- `Source/MYP/TP_FirstPerson/Variant_Shooter/Weapons/ShooterProjectile.h`
- `Source/MYP/TP_FirstPerson/Variant_Shooter/Weapons/ShooterProjectile.cpp`
- `Source/MYP/cod/COD_ProjectileMovementComponent.h`
- `Source/MYP/cod/COD_ProjectileMovementComponent.cpp`
- `Content/Variant_Shooter/Blueprints/Pickups/Projectiles/BP_ShooterProjectile_Bullet.uasset`

**신규 파일**:
- `Source/MYP/cod/COD_Crosshair.h`
- `Source/MYP/cod/COD_Crosshair.cpp`
- `Content/Blueprints/COD/WBP_Crosshair.uasset`

**구현 완료 항목**:

1. ✅ **[TASK-1] ShooterProjectile.h — include 및 타입 교체**
   - `UProjectileMovementComponent` 전방선언 제거
   - `UCOD_ProjectileMovementComponent` 전방선언 추가
   - 멤버 변수 타입 교체: `ProjectileMovement`

2. ✅ **[TASK-2] ShooterProjectile.cpp — include 및 생성자 수정**
   - `#include "GameFramework/ProjectileMovementComponent.h"` 제거
   - `#include "cod/COD_ProjectileMovementComponent.h"` 추가
   - `CreateDefaultSubobject` 타입 교체
   - `InitialSpeed`, `MaxSpeed`, `bShouldBounce` 제거

3. ✅ **[TASK-3] OnHitDelegate 바인딩**
   - `UFUNCTION() void OnProjectileHit(const FHitResult& Hit)` 선언
   - `BeginPlay()`에서 `AddDynamic` 바인딩

4. ✅ **[TASK-4] OnProjectileHit 구현 + NotifyHit 제거**
   - 기존 `NotifyHit` 몸체를 `OnProjectileHit`으로 이식
   - `Other`, `OtherComp` → `Hit.GetActor()`, `Hit.GetComponent()` 교체
   - `NotifyHit` 주석 처리

5. ✅ **[TASK-5] InitVelocity → InitSpeed 리팩토링 + 발사 방향 연동**
   - `FVector InitVelocity` → `float InitSpeed`로 교체
   - `BeginPlay()`에서 `Velocity = GetOwner()->GetActorForwardVector() * InitSpeed`

---

## 🔧 설계 특이사항

- **`NotifyHit` 재사용 불가**: 엔진이 자동 호출하는 가상함수라 시그니처가 델리게이트와 불일치. 새 핸들러 작성 후 몸체 이식으로 해결
- **`InitVelocity` FVector → float**: 발사 방향은 Owner의 `GetActorForwardVector()`에서 가져오므로, 속도 크기만 float으로 보관하는 방식으로 리팩토링
- **발사 방향 결정 위치**: `ShooterWeapon::CalculateProjectileSpawnTransform()`에서 스폰 Transform에 조준 방향이 이미 적용됨 → 컴포넌트에서 Owner Forward로 자동 수렴

---

## 🔜 다음 세션 작업

- 커스텀 맵 World Settings에서 GameMode / PlayerController 확인
- 크로스헤어 UI(`COD_Crosshair`, `WBP_Crosshair`) 연동 완료
- 실제 발사 테스트 및 탄도 확인

---

## 💡 학습 내용

- **`NotifyHit` vs 커스텀 델리게이트**: `NotifyHit`은 엔진 콜리전 기반 자동 호출 — 자체 Sweep 방식과 공존 불가, 델리게이트 핸들러로 대체
- **Dynamic Delegate 바인딩 조건**: `UFUNCTION()` 매크로 필수 — 리플렉션 시스템이 함수를 찾기 때문
- **`GetActorForwardVector()`**: 스폰 시 Transform 회전이 이미 적용되어 있으므로, 발사체 Owner Forward = 조준 방향
- **`FHitResult`에서 꺼낼 수 있는 것**: `GetActor()`, `GetComponent()`, `ImpactPoint`, `ImpactNormal`
- **ShooterUI 생성 구조**: `ShooterGameMode::BeginPlay()`에서 생성 — GameMode가 다르면 UI 전체 미생성

---

**작성일**: 2026년 03월 31일
