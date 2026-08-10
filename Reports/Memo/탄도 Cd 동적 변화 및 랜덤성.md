# 탄도 Cd 동적 변화 및 랜덤성

> 작성일: 2026년 04월 15일  
> 유형: 심층 메모

---

## 배경

MYP CoD 브랜치 탄도 시스템 점검 중, 현재 항력계수 `Cd`와 기타 계수들이 상수로 고정되어 있는 것을 발견. 실제 세계에서는 이 값들이 끊임없이 변화한다는 점에서 — 특히 마하수 전환 구간의 충격파, 대기 난류 등 — 이를 어떻게 코드에 반영할 수 있는지 논의한 내용.

---

## 내용

### 현실에서 Cd가 변하는 이유

**① 마하수(Mach Number) — 가장 큰 영향**

총알 속도는 발사 직후 마하 2~3에서 시작해 점점 감속. 음속 구간(마하 0.8~1.2)에서 충격파 발생 → `Cd`가 **2~3배** 급등했다가, 초음속에서 안정, 아음속이 되면 또 변화.

```
Mach 3.0  → Cd ≈ 0.25
Mach 1.0  → Cd ≈ 0.50 (충격파 천이, 최대)
Mach 0.5  → Cd ≈ 0.30
```

현재 코드는 `Cd = 0.3f` 고정 → 음속 구간 통과 시 극적인 감속 변화 없음.

**② 레이놀즈 수(Reynolds Number)**

`속도 × 탄두 크기 / 공기점성`으로 결정되는 난류/층류 전환 지표. 저속 구간에서 표면 경계층이 바뀌면서 Cd 변동. 총알 스케일에선 마하수에 비해 영향 작음.

**③ 요각/피치각 (Yaw / Pitch of Repose)**

자이로 안정화된 총알도 완전히 정렬되지 않고 미세하게 기울어진 채 비행. 이 기울기만큼 전면적이 넓어져 실효 항력 증가 + Magnus Effect로 횡방향 편향 발생.

**④ 대기 난류 / 바람**

순간순간 공기 흐름이 달라져 상대속도 방향이 흔들림 → 항력 방향 틀어짐.

---

### 코드 반영 방법

**마하수 기반 Cd 커브 (핵심 개선)**

```cpp
// 현재
float DragForceMag = 0.5f * AirDensity * Cd * CrossSectionArea * SpeedSquad;

// 개선: 속도 → 마하수 → Cd 커브 조회
float MachNumber = Velocity.Size() / SpeedOfSound;  // SpeedOfSound = 34300 cm/s
float DynamicCd = CdCurve->GetFloatValue(MachNumber);  // UCurveFloat 사용
float DragForceMag = 0.5f * AirDensity * DynamicCd * CrossSectionArea * SpeedSquad;
```

**미세 난류 노이즈**

```cpp
// 매 Tick마다 항력 방향에 아주 작은 랜덤 교란
float TurbulenceStrength = 0.002f;  // 튜닝값
FVector Turbulence = FMath::VRand() * TurbulenceStrength * Velocity.Size();
DragAccel += Turbulence;
```

- `FMath::VRand()` : 매 호출마다 다른 단위구 방향 반환
- 강도를 아주 작게 잡으면 장거리에서 탄착점이 자연스럽게 퍼지는 효과
- 실제 CEP(Circular Error Probable) 개념과 동일

---

### 우선순위

| 우선순위 | 항목 | 효과 |
|---------|------|------|
| ★★★ | 마하수 기반 Cd 커브 | 음속 구간 감속 패턴이 극적으로 달라짐 |
| ★★☆ | 미세 난류 노이즈 | 장거리 탄착 분산, 저격 게임플레이 깊이 |
| ★☆☆ | 요각 (Yaw of Repose) | 고급 시뮬 — 로켓탄엔 거의 불필요 |

- 라이플 : 음속 돌파가 있어서 마하수 Cd 커브 효과 가장 먼저 체감
- 로켓탄 : 속도 낮아서 마하수 문제 덜 드러남

---

## 별첨 — UCurveFloat 같은 시스템을 직접 만든다면

`UCurveFloat`는 언리얼 엔진팀이 만든 툴이고, 이런 걸 직접 구현해보는 것이 엔진 개발자 수준의 작업임.  
크게 세 레이어로 구성됨.

---

### 레이어 1 — 데이터 구조 (커브 데이터)

키프레임 배열과 보간 방식을 정의하는 순수 데이터 레이어.

```cpp
enum class EInterpMode { Linear, CubicHermite, Constant };

struct FFloatKey
{
    float Time;       // X축 (예: 마하수)
    float Value;      // Y축 (예: Cd 값)
    float TangentIn;  // 들어오는 탄젠트 (Cubic에서 사용)
    float TangentOut; // 나가는 탄젠트 (Cubic에서 사용)
    EInterpMode Mode;
};

class FFloatCurve
{
public:
    TArray<FFloatKey> Keys; // 시간순 정렬 유지

    float GetValue(float InTime) const; // 핵심 함수
    void AddKey(float Time, float Value);
    void SortKeys();
};
```

---

### 레이어 2 — 보간 수학 (런타임)

`GetValue()` 내부에서 구간을 찾고 보간하는 로직.

```cpp
float FFloatCurve::GetValue(float InTime) const
{
    if (Keys.Num() == 0) return 0.f;
    if (Keys.Num() == 1) return Keys[0].Value;

    // 이진 탐색으로 해당 구간 키 찾기
    int32 Idx = 0;
    for (int32 i = 0; i < Keys.Num() - 1; ++i)
    {
        if (InTime < Keys[i + 1].Time) { Idx = i; break; }
    }

    const FFloatKey& K0 = Keys[Idx];
    const FFloatKey& K1 = Keys[Idx + 1];
    float T = (InTime - K0.Time) / (K1.Time - K0.Time); // 0~1 정규화

    switch (K0.Mode)
    {
    case EInterpMode::Linear:
        return FMath::Lerp(K0.Value, K1.Value, T);

    case EInterpMode::Constant:
        return K0.Value;

    case EInterpMode::CubicHermite:
        // 3차 에르미트 보간 (UCurveFloat가 실제로 쓰는 방식)
        float H = K1.Time - K0.Time;
        return FMath::CubicInterp(K0.Value, K0.TangentOut * H,
                                   K1.Value, K1.TangentIn  * H, T);
    }
    return 0.f;
}
```

---

### 레이어 3 — 에디터 UI (시각화/편집)

커브를 화면에 그리고 키를 편집하는 툴 레이어.  
언리얼에서는 **Slate**로 구현하는 영역.

- 커브를 화면에 렌더링 (선분 또는 베지에 곡선)
- 키 포인트 추가 / 드래그 이동 / 삭제
- 탄젠트 핸들 드래그
- 축 줌/패닝

> 이 레이어까지 구현하는 것이 본격적인 엔진 툴 개발 영역.  
> 데이터 + 보간 레이어(1,2)만 먼저 만들어도 런타임에서 완전히 활용 가능.

---

### 구현 난이도

| 레이어 | 난이도 | 핵심 개념 |
|--------|--------|-----------|
| 1. 데이터 구조 | ★☆☆ | 키프레임 배열 설계 |
| 2. 보간 수학 | ★★☆ | 에르미트 보간, 이진 탐색 |
| 3. 에디터 UI | ★★★ | Slate, 좌표 변환, 인터랙션 |

---

## 관련 키워드

- UCurveFloat, CurveFloat 에셋
- 마하수 (Mach Number), 음속 (Speed of Sound)
- 항력계수 Cd, 동적 Cd
- G7 탄도 계수 (Ballistic Coefficient)
- CEP (Circular Error Probable, 원형 공산 오차)
- Magnus Effect, Yaw of Repose
- Reynolds Number
- `FMath::VRand()` 난류 교란
