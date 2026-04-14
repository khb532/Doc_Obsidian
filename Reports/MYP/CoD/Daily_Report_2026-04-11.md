# 일일 작업 레포트 - 2026년 04월 11일

## 📋 프로젝트 정보
- **전체 프로젝트**: MYP — Unreal Engine 5 기반 C++ 게임 프로젝트
- **현재 단계**: WIP — 탄도 시뮬레이션 시스템 구축 및 테스트
- **단계 목표**: 라이플탄 탄도 물리 컴포넌트 교체 방식 구현, 궤적 시각화 테스트 완료
- **작업 브랜치**: CoD

---

## ✅ 완료된 작업

**생성된 파일**:
- `Source/MYP/cod/BulletBase.h/.cpp` — 탄종 공통 베이스 액터 (Abstract)
- `Source/MYP/cod/COD_ProjMoveComponent_Base.h/.cpp` — 기존 컴포넌트 리팩토링, 가속도 기반 물리 적분
- `Source/MYP/cod/COD_ProjMoveComponent_Rifle.h/.cpp` — 라이플탄 전용 무브 컴포넌트 (중력 + 항력)
- `Source/MYP/cod/SmallCaliber.h/.cpp` — 5.56mm 라이플탄 액터
- `Content/Blueprints/COD/BP_SmallCaliber.uasset` — SmallCaliber 기반 블루프린트

**수정된 파일**:
- `ShooterWeapon.h/.cpp` — ProjectileClass → BulletClass 교체, InitBulletData 연동
- `COD_ProjMoveComponent_Base.cpp` — Hit 시 ImpactPoint 이동, 궤적 DrawDebugLine 보완

---

## 📊 전체 작업 현황

⚠️ TODO 미사용 — Git 변경사항 및 설계 문서 기반 레포트

| # | 작업 | 상태 |
|---|------|------|
| 1 | `ABulletBase` 작성 | ✅ 완료 |
| 2 | `UCOD_ProjMoveComponent_Base` 리팩토링 | ✅ 완료 |
| 3 | `UCOD_ProjMoveComponent_Rifle` 작성 | ✅ 완료 |
| 4 | `ASmallCaliber` 작성 | ✅ 완료 |
| 5 | `BulletBase` BeginPlay 컴포넌트 바인딩 | ✅ 완료 |
| 6 | `AShooterWeapon` BulletClass 연동 | ✅ 완료 |
| 7 | 라이플탄 발사·궤적 시각화 테스트 | ✅ 완료 |
| 8 | `UCOD_ProjMoveComponent_Rocket` 작성 | ⏸ 후순위 보류 |
| 9 | `ARocketBullet` 작성 | ⏸ 후순위 보류 |

**다음 진행**: 로켓탄 컴포넌트 및 액터 구현 → 라이플 vs 로켓 탄도 비교 시각화

---

## 🐛 트러블슈팅

- **총알 공중 정지** — `bStartWithTickEnabled = false` + SpawnActor 타이밍 문제 → Rifle 컴포넌트 Tick 기본 활성화로 해결
- **기존 BP 찌꺼기** — 리패런팅된 BP 대신 새 BP(`BP_SmallCaliber`) 생성으로 해결
- **궤적 끊김** — Hit 블록에 ImpactPoint까지 DrawDebugLine 추가로 해결
- **CoreRedirect** — 새 BP 사용으로 불필요, DefaultEngine.ini 추가분 제거

---

## 💡 학습 내용

- **탄도 물리 단위계**: 카오스 엔진과 독립적으로 직접 적분 시 g/cm 단위계를 자체적으로 일관 유지
- **DragScale 튜닝**: V² 수치 폭발 방지 — AirDensity를 g/cm³로 맞추면 DragScale=1.0 이 올바른 출발점
- **bStartWithTickEnabled**: SpawnActor → BeginPlay → Tick 순서에서 InitBulletData 타이밍 주의
- **CoreRedirect**: 클래스 이름 변경 시 기존 BP 에셋 참조 유지를 위해 필요하나, 새 BP 생성으로 우회 가능
- **Sweep 한 프레임 이동거리**: V=92000 cm/s, dt=0.016s → 1프레임 1472cm 이동, 근거리 Hit 오판 원인

---

**작성일**: 2026년 04월 11일
