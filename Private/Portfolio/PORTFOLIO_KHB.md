# MHGA 프로젝트 - 개인 기여 포트폴리오

> **작성자:** khb532 (GitHub: Dove9)
> **프로젝트 기간:** 2025.09 ~ 2025.11
> **엔진:** Unreal Engine 5 (C++)
> **장르:** 협동 요리 액션 (멀티플레이)
> **팀 규모:** 3인 (khb532 / hgh3k / 허지웅)

---

## 1. 프로젝트 개요

**MHGA**는 햄버거 가게를 배경으로 한 실시간 멀티플레이 협동 게임이다. 플레이어들은 주방에서 각자 역할을 분담하여 손님의 주문에 맞는 햄버거를 완성하고 서빙한다. 재료를 집어 조리하고, 포장지에 올려 레시피를 판정받은 뒤 완성된 햄버거를 전달하는 일련의 게임 루프가 핵심이다.

### 팀 역할 분담 요약

| 담당자 | 주요 영역 |
|--------|-----------|
| **khb532 (본인)** | WrappingPaper 시스템, 레시피 데이터 테이블, 조리 시스템(Patty/Portions/CookingArea), SauceBottle, Hamburger 머티리얼, 로딩 화면, 멀티플레이 리플리케이션 |
| hgh3k | GasFryer 비주얼/애니메이션, 손님 AI, UI 효과음, 씬 시퀀스 |
| 허지웅 | 플레이어 이동/사운드, 로비 시스템, 패키징 |

---

## 2. 담당 기여 범위

### Git 기여 통계

- **총 커밋:** 61개 (khb532 30 + Dove9 31)
- **주요 수정 파일 빈도:**

| 파일 | 수정 횟수 |
|------|-----------|
| `WrappingPaper.cpp` | 15 |
| `WrappingPaper.h` | 12 |
| `BurgerData.h` | 7 |
| `CookingArea.cpp` | 7 |
| `InteractComponent.cpp` | 6 |
| `IngredientBase.h` | 6 |
| `Hamburger.h` | 6 |
| `Patty.cpp` | 5 |
| `Hamburger.cpp` | 5 |
| `Portions.cpp` | 4 |

### 개발 타임라인

```
2025.09.30  프로젝트 초기 세팅, 데이터 구조 설계 시작
2025.10.01  BurgerData(DataTable 구조체/Enum) 설계
2025.10.13  WrappingPaper 개발 시작 (WIP)
2025.10.14  재료 추가/제거 로직 완성
2025.10.15  CompleteWrap(포장 완료) 로직 구현
2025.10.16  WrappingPaper 1차 완성, E키 인터랙션 연동
2025.10.17  SauceBottle, Props 추가
2025.10.20  프로토타입 완성
2025.10.21  WrappingPaper 버그 수정 및 Patty 시스템 개선
2025.10.22  WrappingPaper/Hamburger 멀티플레이 지원 추가
2025.10.23  멀티플레이 네트워크 리플리케이션 전면 구현
2025.10.24  플레이어 조준 위치에 재료 놓기 기능
2025.10.28  튀김 조리 시스템 (Portions + CookingArea 통합)
2025.10.29  Patty/Portions SFX 구현
2025.10.31  로딩 화면 구현
2025.11.02  Hamburger 머티리얼 RPC 수정
```

---

## 3. 핵심 구현: WrappingPaper 시스템

### 3.1 개요

`WrappingPaper` — DataTable 기반 런타임 레시피 판정 시스템

  플레이어가 포장지 위에 재료를 올리면 DataTable에 등록된 레시피와 비교해 햄버거를 완성하는 시스템입니다.

  핵심 설계 포인트:
  - 재료 목록을 TArray<FIngredientStack> → TMap<EIngredient, int32>으로 변환하여 재료를 올리는 순서와 무관하게 레시피 판정
  - 레시피를 FTableRowBase 상속 구조체(FBurgerRecipe)로 정의해 DataTable 에셋과 연동, C++ 재빌드 없이 에디터에서 메뉴 추가 가능
  - AddIngredient / RemoveIngredient / TryWrap 전부 Server, Reliable RPC로 설계해 판정 로직이 서버에서만 실행, 클라이언트 조작 불가
  - 재료 목록(OnAreaIngredients)은 DOREPLIFETIME으로 복제되어 모든 클라이언트에 실시간 동기화
  - 판정 성공 시 서버에서 AHamburger 스폰 → NetMulticast RPC로 메뉴별 텍스처 전파 → 재료/포장지 일괄 파괴

`AWrappingPaper`는 이 프로젝트의 핵심 게임플레이 오브젝트로, 플레이어가 포장지 위에 재료를 올려놓으면 레시피 판정을 통해 햄버거를 생성하는 시스템이다.

**처리 흐름:**
```
재료 올림 (OnComponentBeginOverlap)
    → AddIngredient [Server RPC]
        → OnAreaIngredients 배열에 누적
            → DOREPLIFETIME으로 클라이언트 동기화
                ↓
플레이어 E키 입력
    → TryWrap [Server RPC]
        → HasBreadPair() && HasExtraIngredient() 검증
            → CompleteWrapping()
                → FindMatchingRecipe() : DataTable 레시피 매칭
                    → AHamburger 스폰 + 머티리얼 지정
                        → DestroyIngredients() : 재료/포장지 정리
```

### 3.2 데이터 구조 설계 (`BurgerData.h`)

재료와 메뉴를 런타임에 유연하게 다루기 위해 `UENUM` + `USTRUCT` 조합으로 데이터 구조를 설계했다.

```cpp
// 재료 종류 열거형
UENUM(BlueprintType)
enum class EIngredient : uint8
{
    None, BottomBread, MiddleBread, TopBread,
    RawPatty, WellDonePatty, OvercookedPatty,
    Lettuce, Tomato, Onion, Bacon, Cheese, Pickle, Sauce,
    RawPortion, ShanghaiPortion, ShrimpPortion
};

// 재료 스택 (재료 ID + 수량)
USTRUCT(BlueprintType)
struct FIngredientStack
{
    GENERATED_BODY()
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    EIngredient IngredientId = EIngredient::None;
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    int32 Quantity = 0;
};

// DataTable 행 구조체
USTRUCT(BlueprintType)
struct FBurgerRecipe : public FTableRowBase
{
    GENERATED_BODY()
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    EBurgerMenu BurgerName = EBurgerMenu::None;
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TArray<FIngredientStack> Ingredients;
};
```

`FBurgerRecipe`를 `FTableRowBase`에서 상속시켜 언리얼 에디터의 DataTable 에셋과 직접 연동한다. 덕분에 C++ 재컴파일 없이 에디터에서 레시피를 추가/수정할 수 있다.

### 3.3 레시피 판정 알고리즘 (`FindMatchingRecipe`)

포장지 위의 재료 배열을 DataTable의 전체 레시피와 비교해 일치하는 메뉴를 찾는다. 배열 직접 비교 대신 `TMap`으로 변환하여 순서 무관 비교를 구현했다.

```cpp
EBurgerMenu AWrappingPaper::FindMatchingRecipe(UDataTable* DT,
    const TArray<FIngredientStack>& WrapperIngr)
{
    // 배열 → TMap 변환 (재료ID : 수량)
    TMap<EIngredient, int32> WrapMap = MakeMapFromArray(WrapperIngr);

    TArray<FBurgerRecipe*> AllRows;
    DT->GetAllRows<FBurgerRecipe>(TEXT("FBurgerRecipe"), AllRows);

    for (FBurgerRecipe* Row : AllRows)
    {
        if (!Row) continue;
        TMap<EIngredient, int32> RecipeMap = MakeMapFromArray(Row->Ingredients);

        // 키(재료 종류) 수가 다르면 즉시 skip
        if (RecipeMap.Num() != WrapMap.Num()) continue;

        bool isMatched = true;
        for (const auto& Pair : RecipeMap)
        {
            const int32* WrapQty = WrapMap.Find(Pair.Key);
            if (WrapQty == nullptr || *WrapQty != Pair.Value)
            {
                isMatched = false;
                break;
            }
        }
        if (isMatched) return Row->BurgerName;
    }
    return EBurgerMenu::WrongBurger;
}
```

**설계 포인트:** 재료를 올리는 순서가 달라도 동일 레시피로 판정되어야 하므로, `TArray` 직접 비교 대신 `TMap<EIngredient, int32>`로 변환 후 키-값 일치 여부를 검사한다.

### 3.4 멀티플레이 리플리케이션

`OnAreaIngredients`(포장지 위 재료 목록)를 `ReplicatedUsing`으로 선언해 서버의 상태 변경이 클라이언트에 자동 전파되도록 했다.

```cpp
// WrappingPaper.h
UPROPERTY(ReplicatedUsing=OnRep_AddIng)
TArray<FIngredientStack> OnAreaIngredients;

// WrappingPaper.cpp
void AWrappingPaper::GetLifetimeReplicatedProps(
    TArray<class FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);
    DOREPLIFETIME(AWrappingPaper, OnAreaIngredients);
}
```

`AddIngredient`, `RemoveIngredient`, `TryWrap` 함수는 모두 `Server, Reliable` RPC로 선언되어 클라이언트 입력을 서버에서만 처리한다. 충돌 이벤트 시작 시 `HasAuthority()` 체크로 서버 권한을 보장한다.

### 3.5 포장 완료 및 햄버거 스폰

```cpp
void AWrappingPaper::CompleteWrapping()
{
    if (!HasAuthority()) return;
    if (!(BurgerDataTable && BurgerClass)) return;

    EBurgerMenu CreatedBurgerName =
        FindMatchingRecipe(BurgerDataTable, OnAreaIngredients);

    DestroyIngredients();   // 재료 제거 + 포장지 파괴

    AHamburger* SpawnedBurger =
        GetWorld()->SpawnActor<AHamburger>(BurgerClass, GetActorTransform());

    FString Str = StaticEnum<EBurgerMenu>()->
        GetNameStringByValue(static_cast<int64>(CreatedBurgerName));

    SpawnedBurger->SetName(Str);
    SpawnedBurger->MultiRPC_SetMat(Str);  // 모든 클라이언트에 머티리얼 적용
}
```

햄버거가 스폰될 때 포장지 위치에서 생성되며, `MultiRPC_SetMat`을 통해 모든 클라이언트에서 메뉴에 맞는 텍스처가 즉시 적용된다.

---

## 4. 조리 시스템

### 4.1 CookingArea - 조리대 트리거

`ACookingArea`는 조리 영역을 담당하는 Box Collision 기반 액터다. 재료가 영역에 진입하면 `StartCook()`을 호출하고, 이탈 시 `ShutdownCook()`을 호출한다. 서버에서만 로직을 실행하도록 `HasAuthority()` 체크가 적용되어 있다.

튀김기 연동 시 `b_IsFryMachine` 플래그로 분기하여 `AGasFryer::StartCooking()`을 호출하고 타이머로 알람 사운드를 재생한다.

```cpp
void ACookingArea::OnOverlapBegin(...)
{
    if (!HasAuthority()) return;

    AIngredientBase* p_oningredient = Cast<AIngredientBase>(OtherActor);
    if (p_oningredient)
        p_oningredient->StartCook();

    if (b_IsFryMachine)
    {
        myGasFryer->StartCooking();
        GetWorld()->GetTimerManager().SetTimer(
            h_FryTimerHandle, this, &ACookingArea::PlayAlarm, m_nFryTime, false);
    }
}
```

### 4.2 Patty - 앞뒷면 상태 기반 조리

패티의 가장 큰 특징은 **앞면과 뒷면을 독립적으로 추적**한다는 점이다. 단순히 "익었다/안익었다"가 아니라, 각 면의 상태(`bIsFrontCooked`, `bIsBackCooked`, `bIsFrontOverCooked`, `bIsBackOverCooked`)를 각각 관리한다.

**상태 전이 로직:**

| 조건 | 결과 EIngredient |
|------|-----------------|
| 아무것도 안 익음 / 한쪽만 익음 | `RawPatty` |
| 양쪽 모두 익음 | `WellDonePatty` |
| 한쪽이라도 탐 | `OvercookedPatty` |

```cpp
void APatty::UpdateCookState()
{
    if (bIsFrontOverCooked || bIsBackOverCooked)
    {
        CookState = EPattyCookState::Overcooked;
        IngType = EIngredient::OvercookedPatty;
    }
    else if (bIsFrontCooked && bIsBackCooked)
    {
        CookState = EPattyCookState::Cooked;
        IngType = EIngredient::WellDonePatty;
    }
    else
    {
        CookState = EPattyCookState::Raw;
        IngType = EIngredient::RawPatty;
    }
}
```

**물리 기반 뒤집기 보정 (`Server_CheckFlip`):**

플레이어가 패티를 물리적으로 뒤집었을 때 논리 상태와 실제 물리 방향이 불일치할 수 있다. 0.5초 주기 타이머로 액터의 `UpVector`와 월드 `UpVector`의 내적을 검사하여 불일치를 감지하고 자동 보정한다.

```cpp
void APatty::Server_CheckFlip()
{
    FVector upVector = GetActorUpVector();
    float dot = FVector::DotProduct(upVector, FVector::UpVector);
    bool bIsPhysicallyFlipped = dot < 0.f;

    if (bIsFrontSideDown && !bIsPhysicallyFlipped)
    {
        bIsFrontSideDown = false;   // 논리 상태 보정
        StopAllTimer();
        StartCookTimer();           // 새 면 기준으로 타이머 재시작
    }
    // ...
}
```

머티리얼 변경은 `OnRep_CookStateChanged()`에서 `UpdateMaterial()`을 호출해 클라이언트에서도 시각적으로 반영된다. 동적 머티리얼 인스턴스(`UMaterialInstanceDynamic`)의 파라미터(`CookingLevel`, `CookingRough`, `BaseTexture` 등)를 직접 제어한다.

### 4.3 Portions - 튀김 재료 조리

상하이버거/새우버거용 포션의 튀김 조리 시스템이다. `b_IsShanghai`, `b_IsShrimp` 플래그로 재료 타입을 구분하며, 타이머(15초) 완료 시 `EIngredient` 타입이 `RawPortion`에서 `ShanghaiPortion` 또는 `ShrimpPortion`으로 변경된다.

멀티플레이에서 `CookState`를 `DOREPLIFETIME`으로 복제하고 `OnRep_CookState()`에서 클라이언트 머티리얼을 갱신한다.

---

## 5. 기타 구현

### 5.1 SauceBottle - 소스 발사 도구

`ASauceBottle`은 `AIngredientBase`를 상속하며, `IGrabableProps` 인터페이스의 `OnUse()`를 재정의해 `ShootSauce()`를 호출한다. 플레이어가 소스 병을 집은 상태에서 사용 키를 누르면 `Arrow` 컴포넌트 방향으로 소스 액터를 스폰한다.

소스 발사 시 `NetMulticast, Reliable` RPC로 사운드를 모든 클라이언트에 재생한다.

### 5.2 Hamburger - 완성 햄버거 액터

`AHamburger`는 `IGrabableProps`를 구현하는 완성품 액터다. `BurgerName`을 `DOREPLIFETIME`으로 복제하고, `MultiRPC_SetMat`으로 모든 클라이언트에서 메뉴별 텍스처를 동적으로 교체한다. 물리 시뮬레이션(`SetSimulatePhysics(true)`)과 무브먼트 복제(`SetReplicateMovement(true)`)를 활성화해 멀티플레이에서 자연스러운 물리 동작을 지원한다.

지원 메뉴: `WrongBurger`, `Shrimp`, `Shanghai`, `BTD`, `QPC`, `BigMac`

### 5.3 로딩 화면

씬 전환 시 표시되는 로딩 화면을 구현했다. `ALoadingBurger` 액터가 `USceneCaptureComponent2D`로 햄버거 메쉬를 `UTextureRenderTarget2D`에 캡처하고, `Tick`에서 매 프레임 회전시킨다. 이 렌더 타겟을 `WBP_LoadingUI` 위젯에서 이미지로 표시해 로딩 중 회전하는 3D 햄버거 애니메이션을 구현했다.

`UMHGAGameInstance`와 `AMHGAGameMode`에 로딩 위젯 생성/제거 로직을 연동하여 맵 전환 시 자동으로 로딩 화면이 출력된다.

---

## 6. 네트워크 아키텍처

이 프로젝트는 언리얼 엔진의 서버-클라이언트 모델을 따른다. khb532가 담당한 모든 게임플레이 로직은 다음 원칙을 적용했다.

### 권한 분리 원칙

| 처리 주체 | 역할 |
|----------|------|
| **서버 (HasAuthority)** | 재료 추가/제거, 레시피 판정, 햄버거 스폰, 조리 타이머, 패티 상태 변경 |
| **Server RPC** | 클라이언트 입력(E키, 포장 시도, 패티 뒤집기)을 서버로 전달 |
| **NetMulticast RPC** | 사운드 재생, 머티리얼 변경 등 시각/청각 효과를 모든 클라이언트에 전파 |
| **DOREPLIFETIME** | 재료 목록, 조리 상태, 버거 이름 등 게임 상태를 클라이언트에 자동 동기화 |
| **ReplicatedUsing** | 상태 변경 시 클라이언트에서 머티리얼 자동 갱신(OnRep 콜백) |

### 적용 사례 요약

```
[클라이언트] E키 입력
    → TryWrap() (Server, Reliable)
        → [서버] HasBreadPair() + HasExtraIngredient() 검증
            → FindMatchingRecipe() 레시피 판정
                → AHamburger SpawnActor (서버)
                    → DOREPLIFETIME(BurgerName) → 클라이언트 동기화
                        → MultiRPC_SetMat (NetMulticast) → 모든 클라이언트 머티리얼 적용
```

---

## 7. 기술 스택 요약

| 항목 | 내용 |
|------|------|
| 엔진 | Unreal Engine 5 |
| 언어 | C++ |
| 네트워크 | UE Replication (Server/NetMulticast RPC, DOREPLIFETIME, ReplicatedUsing) |
| 데이터 관리 | DataTable + FTableRowBase 상속 구조체 |
| 재료 인식 | TMap 기반 순서 무관 레시피 매칭 |
| 머티리얼 | UMaterialInstanceDynamic 런타임 파라미터 제어 |
| 렌더링 | SceneCaptureComponent2D + RenderTarget (로딩 화면) |
| 사운드 | SoundAttenuation 기반 공간 음향, Multicast RPC 동기화 |

---

*이 문서는 MHGA 프로젝트 Git 히스토리(2025.09.30 ~ 2025.11.11)와 소스 코드를 기반으로 작성되었습니다.*
