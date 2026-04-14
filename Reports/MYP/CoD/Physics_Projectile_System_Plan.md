# 물리 기반 발사체 시스템 설계

> CoD Clone Project — Physics Projectile System
> 작성일: 2026-04-06
> 목적: 포트폴리오 — 구현력 증명 (실용성보다 물리 시뮬 충실도 우선)
> 대상 회사 우대사항: DirectX 사용 가능한 자, 멀티스레딩 이용 가능한 자
> 전제: 수직 발사는 게임 구조상 불가 → 짐벌락 실검증 생략, 가정 기반 처리

---

## 1. 물리 레이어 (베이스 설계)

```
Force → Acceleration → Velocity → Position
```

- `Mass`, `AddForce()`, `ClearForces()`
- 매 Tick: `a = ΣF / m`, `v += a·dt`, `x += v·dt`
- **공기 저항 (Drag)**: `F_drag = -0.5 * ρ * Cd * A * v²` (방향: 속도 반대)

### 수치 적분 방식 선택
- 현재: **Euler 적분** (단순, 고속에서 오차 누적 가능)
- 권장 업그레이드: **RK4 (Runge-Kutta 4차)** — 같은 dt에서 정밀도 대폭 향상, 포트폴리오 임팩트 큼
  ```
  k1 = f(t,      y)
  k2 = f(t+dt/2, y + k1·dt/2)
  k3 = f(t+dt/2, y + k2·dt/2)
  k4 = f(t+dt,   y + k3·dt)
  y_next = y + (k1 + 2k2 + 2k3 + k4) · dt/6
  ```
- 단, 게임 특성상 Euler로도 충분할 수 있음 — RK4는 선택 구현

---

## 2. 발사체별 Force 구성

| 발사체 | 필요한 Force |
|--------|-------------|
| 총알 | 중력 + Drag |
| 수류탄 | 중력 + Drag + 바운스(충돌 반발) |
| 로켓 | 중력 + Drag + Thrust(추진) |
| 재블린 | 중력 + Drag + Thrust + 유도(Guidance) |

---

## 3. 유도 알고리즘 (Guidance)

### PPN (Pure Proportional Navigation)
실제 미사일 유도에 사용되는 비례 항법 유도 법칙

```
a_guidance = N * |V_closing| * ω
```
- `N`: 비례 항법 상수 (보통 3~5)
- `V_closing`: 폐쇄 속도 (목표 접근 속도)
- `ω`: 시선각(LOS) 변화율

### 재블린 Top-Attack
- Phase 1: 일정 고도까지 상승 (Boost)
- Phase 2: 고도 유지 후 목표 상공 이동 (Coast)
- Phase 3: 목표 위에서 수직 강하 (Terminal)

---

## 4. 충돌 / 바운스

- `OnHit` 콜백에서 법선 벡터 기반 반사 벡터 계산
- `Restitution` (반발계수)으로 에너지 손실 표현

```cpp
FVector Reflected = Velocity.MirrorByVector(HitNormal);
Velocity = Reflected * Restitution;
```

### 바운스 심화 (수류탄)
- **접선 마찰**: 반사 시 표면 접선 방향 속도도 감쇠 (`FrictionCoefficient`)
  ```
  V_normal   = (V · N) * N          // 법선 성분
  V_tangent  = V - V_normal         // 접선 성분
  V_result   = -V_normal * Restitution + V_tangent * (1 - Friction)
  ```
- 충돌 횟수 카운트 → 일정 횟수 후 정지 처리 (무한 바운스 방지)

---

## 5. 시각화 (디버그)

- 궤적 디버그 라인 (기존 구현 활용)
- **Phase별 색상 구분**
  - Boost: 초록
  - Coast: 노랑
  - Terminal: 빨강
- 속도/가속도 벡터 실시간 표시

---

## 6. 클래스 구조

```
COD_ProjectileMovementComponent      ← Force 적분 물리 베이스
│  Mass, Velocity, AddForce(), ClearForces(), Tick 적분
│
├── COD_BallisticMovement             ← 중력 + Drag
├── COD_RocketMovement                ← + Thrust (시간 기반 추진)
└── COD_GuidedMovement                ← + PPN 유도, Phase 관리
```

---

## 7. 구현 우선순위

1. 베이스 Force 적분 구조로 리팩토링 (`Mass`, `AddForce`)
2. Drag 공식 적용
3. `COD_BallisticMovement` — 총알/수류탄 분리, 바운스 구현
4. `COD_RocketMovement` — Thrust 추가
5. `COD_GuidedMovement` — PPN 유도 알고리즘
6. 재블린 Top-Attack Phase 전환
7. 물리 레이어 순수 C++ 분리 (`FProjectilePhysics`)
8. 멀티스레드 물리 Tick 병렬화
9. DirectX 프로젝트에 물리 레이어 이식
10. DirectX에서도 멀티스레드 적용
11. 디버그 시각화 고도화 (언리얼: 풀 인게임 / DirectX: 와이어프레임 + ImGui)
12. (선택) RK4 적분으로 업그레이드

---

## 8. 포트폴리오 어필 포인트 정리

| 항목 | 어필 내용 | 우대사항 대응 |
|------|-----------|--------------|
| Force 적분 구조 | 물리 엔진 설계 원리 이해 | — |
| Drag 공식 | 실제 유체역학 공식 적용 | — |
| PPN 유도 | 실제 방산 유도 법칙 구현, 코드 주석에 수식 출처 명시 | — |
| RK4 적분 | 수치해석 지식 보유 증명 | — |
| Phase 시각화 | 디버그 설계 능력, 시연 가능 | — |
| 상속 구조 | 확장성 있는 컴포넌트 설계 | — |
| 멀티스레드 물리 Tick | 발사체 N개 병렬 적분 | ✅ 멀티스레딩 |
| DirectX 이식 | 동일 물리 클래스를 D3D 환경에서 구동 | ✅ DirectX |

---

## 9. 우대사항 대응 전략

### 전체 구조

```
[언리얼 프로젝트]                  [DirectX 프로젝트]
COD_ProjectileMovement             D3D_ProjectileDemo
└── FProjectilePhysics      →      └── FProjectilePhysics  (동일 파일, 한 줄 수정 없음)
    (순수 C++, 언리얼 무관)              렌더링만 D3D11로 교체
```

"물리 코드 한 줄도 안 바꾸고 DirectX로 이식" 이 면접 스토리의 핵심.

---

### 방법 1 — 물리 레이어 순수 C++ 분리

언리얼 include가 전혀 없는 순수 C++ 클래스로 물리 계산부를 분리.
언리얼 컴포넌트는 얇은 래퍼 역할만 담당.

```cpp
// 언리얼 의존 없는 순수 물리 클래스
class FProjectilePhysics
{
public:
    FVector Position;
    FVector Velocity;
    float   Mass;

    void AddForce(FVector Force);
    void Tick(float DeltaTime);   // 적분만
    FVector GetPosition() const;
};

// 언리얼 컴포넌트는 래퍼만 담당
void COD_ProjectileMovementComponent::TickComponent(...)
{
    Physics.Tick(DeltaTime);
    UpdatedComponent->SetWorldLocation(Physics.GetPosition()); // API는 여기만
}
```

**면접 어필**: `FProjectilePhysics.h/.cpp` — "이 파일은 언리얼 include가 하나도 없습니다" 직접 증명 가능.

---

### 방법 2 — 멀티스레드 물리 Tick 병렬화 (✅ 멀티스레딩 우대 직접 대응)

발사체가 동시에 수십 개 날아다닐 때 물리 적분을 병렬 처리.

```
메인 스레드      : 렌더링, 입력, 게임 로직
물리 워커 스레드 : 각 발사체의 Tick 적분 병렬 처리
```

```cpp
// 언리얼: ParallelFor
ParallelFor(Projectiles.Num(), [&](int32 i)
{
    Projectiles[i]->Physics.Tick(DeltaTime);
});

// DirectX: std::thread / std::async 동일 개념 적용
```

주의: 적분 완료 후 위치 적용은 반드시 메인 스레드에서 처리 (렌더 스레드 안전).

---

### 방법 3 — DirectX 이식 (✅ DirectX 우대 직접 대응)

`FProjectilePhysics`를 그대로 D3D11 프로젝트에 복사, 렌더링만 교체.

| 환경 | 시각화 수준 |
|------|------------|
| 언리얼 | 풀 인게임 — 스크린샷, 영상, Phase 색상 디버그 라인 |
| DirectX | 궤적 와이어프레임 + ImGui 수치 출력 (속도/위치/Phase 실시간 표시) |

DirectX에서 풀 메시 렌더링은 불필요. 물리가 엔진 없이 동작한다는 것만 증명하면 충분.

---

### 방법 4 — 단위 테스트 (방법 1 병행)

물리 클래스 분리 후 언리얼 없이 돌리는 테스트 작성.

```cpp
FProjectilePhysics p;
p.Mass = 1.0f;
p.AddForce({0, 0, -980.f}); // 중력
p.Tick(1.0f);
assert(p.Velocity.Z == -980.f);
```

테스트 코드 자체가 "물리 로직이 엔진과 독립적임"을 코드로 증명. 로직 신뢰도 추가.

---

**작성일**: 2026년 04월 06일
