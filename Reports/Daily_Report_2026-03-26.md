# 일일 작업 레포트 - 2026년 03월 26일

## 📋 프로젝트 정보
- **전체 프로젝트**: MYP — UE5 기반 탄도 시스템 재구축 (포트폴리오 능력검증)
- **현재 단계**: 프로토타입 설계 완료 / 구현 직전
- **단계 목표**: 커스텀 Bullet Movement Component 완성 및 CoDTestMap 테스트
- **작업 브랜치**: `CoD`

---

## ✅ 완료된 작업

**생성된 파일**:
- `Source/MYP/cod/COD_ProjectileMovementComponent.h` — UActorComponent 기반 헤더 완성 (InitVelocity, GravityScale, AirDrag, Velocity, UpdatedComponent)
- `Source/MYP/cod/COD_ProjectileMovementComponent.cpp` — 탄도식 설계 블록 주석 삽입 완료
- `D:/DoveObs/Private/Portfolio/Chaos_DirectAccess_Research.md` — SweepSingleByChannel 직접 구현 가능성 조사 메모

**이전 세션 완료 내역**:
- `Source/MYP/TP_FirstPerson/` FPP 번들팩 include 경로 수정 및 빌드 성공
- UHT USTRUCT 이름 충돌 해결 (`FShooter` 접두사 추가)
- `LogTemplateCharacter` 중복 선언 해결 (`LogTP_FirstPersonCharacter` 로 변경)
- `MYP.Build.cs` TP_FirstPerson include 경로 추가

---

## 📊 전체 TODO 현황

⚠️ TODO를 사용하지 않음 (Git 변경사항 + 계획 문서 기반 레포트)

**남은 작업 (계획 문서 기준)**:

- [ ] `COD_ProjectileMovementComponent.h` — `bIsCalculating` (std::atomic<bool>) Private 필드 추가
- [ ] `COD_ProjectileMovementComponent.cpp` — BeginPlay 구현 (Owner/RootComponent 바인딩, Velocity 초기화)
- [ ] `COD_ProjectileMovementComponent.cpp` — TickComponent 구현
  - [ ] 게임 스레드: 방어 검사, 스냅샷
  - [ ] 워커 스레드: 중력 적분 (V = V + A*dt, Delta = V*dt)
  - [ ] 게임 스레드 복귀: SweepSingleByChannel → HitResult 처리 → SetWorldLocation / Destroy
- [ ] AShooterProjectile의 기존 UProjectileMovementComponent 제거 후 커스텀 컴포넌트로 교체
- [ ] CoDTestMap 테스트 (포물선 궤적 육안 확인, 충돌 Destroy 확인)

---

## 💡 학습 내용

- **SweepSingleByChannel**: 언리얼이 Chaos와 직접 통신하는 최저 레벨 공개 API. MoveComponent() 내부에서도 이것을 호출함. 이것 아래는 Chaos 블랙박스라 엔진 소스 수정 없이 대체 불가.
- **멀티스레딩 분리 원칙**: 순수 수치 계산(적분)은 워커 스레드 가능. UObject/UWorld 접근(Sweep, SetWorldLocation, Destroy)은 반드시 게임 스레드. 람다 캡처는 값 복사([=]) 사용, 포인터 캡처 시 GC 위험.
- **물리엔진 위임 vs 직접 계산**: FPS 발사체 수준에서는 직접 계산이 성능상 유리. Chaos 범용 오버헤드(관성 텐서, 마찰, 충돌 해소 반복 등) 회피 가능.
- **UpdatedComponent**: UMovementComponent 상속 없이 직접 구현 시 Owner의 RootComponent를 BeginPlay에서 직접 바인딩하는 방식으로 대체.
- **bIsCalculating 패턴**: 고속 발사체 + 낮은 FPS 환경에서 이전 AsyncTask가 완료되기 전 다음 Tick이 진입하는 프레임 중첩을 std::atomic<bool>으로 방지.

---

**작성일**: 2026년 03월 26일
