# 햄버거 제작 시스템 구현 개발 문서

> **프로젝트:** MHGA (맥도날드 핵 앤 슬래시 — 팀 프로젝트)
> **담당 파트:** 햄버거 포장지 구현 / 뒤집개·패티 뒤집기 연출 / 햄버거 재료 구성
> **엔진:** Unreal Engine 5 / C++
> **네트워크:** 멀티플레이 (Listen Server 기반)

---

## 목차

1. [시스템 개요](#1-시스템-개요)
2. [재료 데이터 설계](#2-재료-데이터-설계)
3. [재료 기반 클래스 (IngredientBase)](#3-재료-기반-클래스-ingredientbase)
4. [햄버거 포장지 구현 (WrappingPaper)](#4-햄버거-포장지-구현-wrappingpaper)
5. [포장지 박스 (WrapperBox)](#5-포장지-박스-wrapperbox)
6. [패티 요리 상태 설계](#6-패티-요리-상태-설계)
7. [뒤집개 구현 (Flipper)](#7-뒤집개-구현-flipper)
8. [패티 뒤집기 연출 (Patty)](#8-패티-뒤집기-연출-patty)
9. [그릴 영역 (CookingArea)](#9-그릴-영역-cookingarea)
10. [완성 햄버거 (Hamburger)](#10-완성-햄버거-hamburger)
11. [네트워크 구조 요약](#11-네트워크-구조-요약)

---

## 1. 시스템 개요

이 프로젝트는 멀티플레이 요리 게임으로, 플레이어가 햄버거 재료를 집어 조리하고 포장지 위에 올려 완성된 햄버거를 만드는 과정을 구현한다. 전체 흐름은 크게 세 단계로 나뉜다.

첫 번째는 **재료 준비 단계**다. 각 재료(빵, 패티, 치즈, 양상추 등)는 독립적인 액터로 월드에 존재하며, 플레이어가 집어서 이동할 수 있다. 패티는 그릴에 올리면 시간 경과에 따라 요리 상태가 변하고, 뒤집개를 사용해 뒤집어야 양면을 고르게 익힐 수 있다.

두 번째는 **포장 단계**다. 포장지 위에 재료를 올리면 포장지가 재료를 자동으로 감지해 목록을 관리한다. 플레이어가 포장 동작을 취하면 포장지는 현재 올려진 재료 조합을 데이터테이블에 정의된 레시피와 비교해 어떤 버거인지 판단한 뒤, 완성된 햄버거 액터를 생성한다.

세 번째는 **배달 단계**다. 완성된 햄버거는 포장지 액터가 파괴되면서 그 위치에 스폰되며, 이후 주문 확인 및 제출 과정으로 이어진다. 이 문서는 위 흐름 중 **재료 구성 설계**, **포장지 구현**, **패티 뒤집기 연출** 세 파트를 다룬다.

네트워크 측면에서 이 시스템은 서버 권한 모델을 따른다. 상태 변경은 반드시 서버에서만 이루어지며, 클라이언트는 Server RPC를 통해 요청을 보내고 결과를 Replicated 변수 또는 Multicast RPC로 전달받는다.

---

## 2. 재료 데이터 설계

### 2.1 설계 배경

여러 종류의 재료를 코드 내에서 일관되게 식별하고 레시피와 비교하기 위해서는 재료를 타입으로 구분하는 체계가 필요했다. 단순히 문자열로 관리하면 오타나 비교 비용이 문제가 되므로, 언리얼의 `UENUM`을 활용해 `EIngredient`라는 열거형으로 모든 재료 종류를 정의했다.

```cpp
// BurgerData.h[6-26]
UENUM(BlueprintType)
enum class EIngredient : uint8
{
    None, BottomBread, MiddleBread, TopBread,
    RawPatty, WellDonePatty, OvercookedPatty,
    Lettuce, Tomato, Onion, Bacon, Cheese, Pickle, Sauce,
    RawPortion, ShanghaiPortion, ShrimpPortion,
};
```

패티는 특이하게도 같은 물리 액터가 요리 상태에 따라 `RawPatty`, `WellDonePatty`, `OvercookedPatty` 세 가지 다른 재료 ID를 가진다. 이는 레시피 매칭 시 "잘 구워진 패티"와 "생 패티"를 명확히 구분하기 위한 설계다.

완성 가능한 버거 종류도 `EBurgerMenu`로 정의해 레시피 매칭 결과를 타입 안전하게 관리한다. `WrongBurger`는 어떤 레시피와도 맞지 않을 때 반환되는 예외 케이스다.

```cpp
// BurgerData.h[28-38]
UENUM(BlueprintType)
enum class EBurgerMenu : uint8
{
    None, WrongBurger, BigMac, BTD, QPC, Shanghai, Shrimp,
};
```

### 2.2 FIngredientStack — 재료 수량 묶음

포장지 위에 같은 종류의 재료가 여러 개 올라올 수 있다. 이를 하나의 엔트리로 관리하기 위해 재료 ID와 수량을 쌍으로 묶은 `FIngredientStack` 구조체를 정의했다.

```cpp
// BurgerData.h[40-50]
USTRUCT(BlueprintType)
struct FIngredientStack
{
    GENERATED_BODY()
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    EIngredient IngredientId = EIngredient::None;
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    int32 Quantity = 0;
};
```

예를 들어 치즈 2장이 올라오면 배열에 `{Cheese, 2}`라는 단일 엔트리가 존재한다. 이 구조 덕분에 레시피 비교 시 "치즈 2개가 필요한 레시피"와 정확히 대조할 수 있다.

### 2.3 FBurgerRecipe — 데이터테이블 레시피 행

레시피는 코드에 하드코딩하지 않고 언리얼의 데이터테이블(DataTable)에서 관리한다. `FBurgerRecipe`는 데이터테이블의 행 구조를 정의하며, 버거 이름과 필요 재료 목록을 담는다.

```cpp
// BurgerData.h[52-62]
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

이 방식은 새 버거 메뉴를 추가할 때 코드를 재컴파일할 필요 없이 에디터에서 데이터테이블 행을 추가하는 것만으로 확장이 가능하다는 장점이 있다. 레시피 데이터는 디자이너가 직접 수정할 수 있는 영역이기도 하다.

---

## 3. 재료 기반 클래스 (IngredientBase)

### 3.1 공통 인터페이스 설계

재료들은 종류에 상관없이 플레이어가 집고 내려놓고 사용하는 동일한 인터랙션 흐름을 따른다. 이 공통 행동을 인터페이스 `IGrabableProps`로 추상화하고, `AIngredientBase`가 이를 구현하는 기반 클래스 역할을 한다.

`IGrabableProps`는 `OnGrabbed`, `OnPut`, `OnUse`, `SetLocation`, `IsTool`, `GetMeshComp` 다섯 가지 순수 가상 함수를 정의한다. 뒤집개도 같은 인터페이스를 구현하므로, 플레이어의 인터랙션 컴포넌트는 재료인지 도구인지 구분 없이 동일한 코드로 모든 집을 수 있는 오브젝트를 처리한다.

### 3.2 물리 설정 및 복제

`AIngredientBase`의 생성자에서는 메시 컴포넌트에 물리 시뮬레이션과 중력을 활성화해 재료가 테이블이나 포장지 위에 자연스럽게 놓이도록 한다. 또한 멀티플레이 환경에서 모든 클라이언트가 재료의 위치를 볼 수 있도록 `bReplicates = true`와 `SetReplicateMovement(true)`를 설정한다.

요리 진행 여부를 판단하기 위한 `StartCook()`과 `ShutdownCook()` 가상 함수도 이 클래스에 선언된다. 일반 재료는 빈 구현을 가지고, 패티만 이를 오버라이드해 실제 타이머 로직을 수행한다. 이 구조 덕분에 그릴 영역(`CookingArea`)은 재료 종류를 알 필요 없이 기반 클래스 포인터만으로 `StartCook()`을 호출할 수 있다.

`EIngredient IngType` 변수는 복제 대상으로 등록되어 있어, 서버에서 패티의 조리 상태가 바뀌어 `IngType`이 `RawPatty`에서 `WellDonePatty`로 변경되면 모든 클라이언트에서도 같은 값을 유지한다.

---

## 4. 햄버거 포장지 구현 (WrappingPaper)

### 4.1 포장지의 역할

포장지는 햄버거 조립의 핵심 무대다. 플레이어가 재료를 포장지 위에 올려놓으면 포장지가 이를 감지하고, 충분한 재료가 모이면 플레이어의 포장 입력을 받아 햄버거를 완성한다. 포장지 자체는 물리 시뮬레이션 없이 바닥에 고정되어 있으며, 위에 올라오는 재료들의 오버랩을 감지하는 충돌 박스를 가진다.

### 4.2 재료 수집 — BoxComponent 오버랩 감지

`BeginPlay()`에서 `UBoxComponent`의 오버랩 시작·종료 델리게이트에 `AddIngredient`와 `RemoveIngredient`를 바인딩한다. 두 함수 모두 `Server, Reliable` RPC로 선언되어 있어, 클라이언트 측에서 오버랩 이벤트가 발생해도 실제 배열 수정은 서버에서만 이루어진다.

`AddIngredient`의 내부 흐름은 다음과 같다. 충돌한 액터를 `AIngredientBase`로 캐스팅해 재료 ID를 얻고, `OnAreaIngredients` 배열을 순회하며 같은 ID의 엔트리가 이미 있으면 수량만 증가시키고, 없으면 새 `FIngredientStack`을 추가한다. 동시에 `OverlappingActors` 배열에 약한 포인터(`TWeakObjectPtr<AActor>`)로 실제 액터도 추적해 나중에 포장 완료 시 한번에 파괴할 수 있도록 준비한다.

```cpp
// WrappingPaper.cpp[85-93]
for (FIngredientStack& tmp : OnAreaIngredients)
{
    if (tmp.IngredientId == IngId)
    {
        tmp.Quantity++;
        return;
    }
}
OnAreaIngredients.Add(Prop);
```

재료가 포장지 밖으로 나가면 `RemoveIngredient`가 호출되어 수량을 1 감소시키고, 수량이 0이 되면 해당 엔트리를 배열에서 제거한다. 이 방식으로 "재료를 올렸다가 다시 가져가는" 자유로운 조작이 가능하다.

`OnAreaIngredients`는 `DOREPLIFETIME`으로 복제 등록된 변수다. 서버에서 배열이 변경되면 클라이언트에서도 동일한 배열 상태를 유지한다. 개발 중 디버그 목적으로 `bShowLog` 플래그가 활성화되면 포장지 위치에 현재 재료 목록을 `DrawDebugString`으로 화면에 표시하도록 구현했다.

### 4.3 포장 유효성 검증 — TryWrap

플레이어가 포장 입력을 하면 `TryWrap()` Server RPC가 호출된다. 이 함수는 두 가지 조건을 모두 만족할 때만 `CompleteWrapping()`으로 진행한다.

첫 번째 조건은 `HasBreadPair()`다. 햄버거가 되려면 위 빵(`TopBread`)과 아래 빵(`BottomBread`)이 각각 최소 1개씩 있어야 한다. 빵이 없다면 어떤 재료 조합이든 햄버거로 완성될 수 없다.

```cpp
// WrappingPaper.cpp[259-277]
bool AWrappingPaper::HasBreadPair() const
{
    int32 Q_TBread = 0, Q_BBread = 0;
    for (const FIngredientStack& tmp : OnAreaIngredients)
    {
        if (tmp.IngredientId == EIngredient::TopBread) Q_TBread += tmp.Quantity;
        else if (tmp.IngredientId == EIngredient::BottomBread) Q_BBread += tmp.Quantity;
    }
    return Q_TBread >= 1 && Q_BBread >= 1;
}
```

두 번째 조건은 `HasExtraIngredient()`다. 빵만 있으면 햄버거가 아니라 빈 번에 불과하므로, 빵 이외의 재료가 최소 하나라도 있어야 한다. 이 조건을 통해 "위 빵 + 아래 빵 + 패티 또는 채소" 이상의 구성만 포장이 진행된다.

### 4.4 레시피 매칭 — FindMatchingRecipe

포장 조건을 통과하면 현재 포장지 위의 재료 배열을 데이터테이블의 모든 레시피와 비교한다. 비교를 효율적으로 하기 위해 배열 형태의 `FIngredientStack` 목록을 `TMap<EIngredient, int32>` 형태로 변환하는 `MakeMapFromArray()` 헬퍼를 만들었다.

매칭 로직은 다음 순서로 진행된다. 우선 레시피의 재료 종류 수와 포장지의 재료 종류 수가 같은지 비교해 빠르게 불일치 레시피를 걸러낸다. 개수가 같으면 레시피의 각 재료에 대해 포장지에 동일한 ID가 동일한 수량으로 존재하는지 확인한다. 모든 항목이 일치하면 해당 `EBurgerMenu`를 반환하고, 일치하는 레시피가 없으면 `EBurgerMenu::WrongBurger`를 반환한다.

```cpp
// WrappingPaper.cpp[236-252]
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
```

이 구조의 장점은 레시피가 데이터테이블로 분리되어 있어 코드 수정 없이 새 버거 종류를 추가하거나 기존 레시피를 수정할 수 있다는 점이다. `WrongBurger`라는 케이스 덕분에 잘못된 조합도 유효한 결과로 처리할 수 있어, 완성된 햄버거 오브젝트는 항상 생성되고 그 종류만 달라진다.

### 4.5 포장 완료 — CompleteWrapping

레시피 매칭 결과로 얻은 `EBurgerMenu` 값은 `StaticEnum<EBurgerMenu>()->GetNameStringByValue()`를 통해 문자열로 변환된다. 이 문자열은 이후 스폰된 햄버거 액터의 머티리얼 텍스처를 결정하는 데 사용된다.

포장 완료 시 `DestroyIngredients()`를 먼저 호출해 포장지 위의 모든 재료 액터를 파괴하고 추적 배열을 비운다. 그 후 포장지 자신의 위치에 `AHamburger` 액터를 스폰한다. 마지막으로 포장지 자신도 `Destroy()`를 통해 월드에서 제거된다.

```cpp
// WrappingPaper.cpp[306-311]
AHamburger* SpawnedBurger = GetWorld()->SpawnActor<AHamburger>(
    BurgerClass, this->GetActorTransform());
SpawnedBurger->SetName(Str);
SpawnedBurger->MultiRPC_SetMat(Str);
```

재료 파괴 직전에는 `MulticastRPC_WrapSound()`를 호출해 모든 클라이언트에서 포장 효과음이 재생된다. 효과음은 생성자에서 `ConstructorHelpers::FObjectFinder`로 미리 에셋을 로드해 `WrapperSound` 변수에 저장해둔다.

---

## 5. 포장지 박스 (WrapperBox)

포장지는 무한히 사용할 수 있는 소모품이다. `AWrapperBox`는 포장지를 공급하는 박스 액터로, 플레이어가 상호작용하면 지정된 위치(`WrapperPoint`, `USceneComponent`)에 새 포장지를 스폰한다. 포장지 스폰과 함께 멀티캐스트 효과음도 재생해 모든 플레이어에게 피드백을 준다. 이 설계 덕분에 게임 중 포장지가 소진되는 상황 없이 언제든 새 포장지를 꺼낼 수 있다.

---

## 6. 패티 요리 상태 설계

### 6.1 앞뒷면 독립 관리

패티 요리에서 가장 중요한 설계 결정은 앞면과 뒷면의 상태를 독립적으로 관리하는 것이다. 단순히 "패티가 익었는가"라는 하나의 상태만 관리하면 뒤집는 행위가 의미를 가지지 못한다. 뒤집기 전에는 아랫면이 그릴에 닿으므로 아랫면이 익고, 뒤집은 후에는 반대쪽 면이 익어야 한다. 이를 구현하기 위해 `bIsFrontCooked`, `bIsBackCooked`, `bIsFrontOverCooked`, `bIsBackOverCooked` 네 개의 bool 변수로 각 면의 상태를 추적한다.

현재 어느 면이 그릴을 향하고 있는지는 `bIsFrontSideDown` 변수로 관리한다. 이 값이 `true`이면 앞면이 아래를 향해 그릴에 닿고 있다는 의미다. 타이머가 만료될 때는 이 변수를 읽어 현재 아랫면이 어느 쪽인지 판단한 뒤 해당 면의 상태 변수를 업데이트한다.

### 6.2 종합 상태 결정 — UpdateCookState

네 개의 면 상태 변수를 종합해 최종 `EPattyCookState`를 결정하는 함수다. 우선순위는 명확하다. 한 면이라도 탔으면 전체 패티가 `Overcooked`다. 아무 면도 타지 않고 양면 모두 익었으면 `Cooked`다. 그 외 모든 경우는 `Raw`다.

이 결과는 동시에 `IngType`(재료 타입)도 갱신한다. `Cooked` 상태면 `WellDonePatty`, `Overcooked`면 `OvercookedPatty`, `Raw`면 `RawPatty`로 설정된다. 포장지의 레시피 매칭이 `IngType`을 기준으로 동작하므로, 레시피에 `WellDonePatty`를 요구하는 버거는 제대로 구워진 패티만 받아들인다.

### 6.3 타이머 구조

요리 타이머는 두 개가 존재한다. `cookTimer`는 `cookTime`(기본 3초) 후에 현재 면을 "익음" 상태로 만드는 단발 타이머고, `overcookTimer`는 `overcookTime`(기본 5초) 후에 "탐" 상태로 만드는 단발 타이머다. 두 타이머는 동시에 시작되어 순서대로 발동된다.

`StartCookTimer()`는 현재 아랫면의 상태를 확인한 뒤 아직 익지 않은 경우에만 `cookTimer`를, 아직 타지 않은 경우에만 `overcookTimer`를 설정한다. 이미 익은 면을 다시 구울 필요는 없으므로, 한 면이 이미 구워진 상태로 뒤집혔다가 다시 원래 방향으로 돌아와도 중복으로 타이머가 시작되지 않는다.

---

## 7. 뒤집개 구현 (Flipper)

### 7.1 도구로서의 뒤집개

뒤집개(`AFlipper`)는 `AIngredientBase`가 아니라 `IGrabableProps` 인터페이스를 직접 구현하는 별도의 도구 클래스다. `IsTool()` 함수가 `true`를 반환해 플레이어의 인터랙션 컴포넌트가 이를 도구로 식별한다.

집기(`OnGrabbed`)가 호출되면 `GrabCharacter` 포인터에 플레이어를 저장하고, 뒤집개의 회전을 플레이어 카메라 방향으로 맞춘다. 만약 다른 플레이어가 이미 잡고 있는 뒤집개를 집으려 하면 기존 플레이어의 인터랙션 컴포넌트에게 강제 내려놓기를 요청해 충돌을 방지한다.

### 7.2 스윕 트레이스 기반 상호작용

뒤집개 사용(`OnUse`)의 핵심은 **구체 스윕 트레이스**다. 플레이어 카메라 위치에서 시선 방향으로 200 유닛 길이의 캡슐을 쓸어내며 물리 오브젝트와의 충돌을 감지한다.

```cpp
// Flipper.cpp[58-68]
FVector Start = GrabCharacter->GetFirstPersonCameraComponent()->GetComponentLocation();
FVector End = Start + GrabCharacter->GetFirstPersonCameraComponent()->GetForwardVector() * 200;
FCollisionShape Sphere = FCollisionShape::MakeSphere(5.f);
GetWorld()->SweepSingleByChannel(Hit, Start, End, FQuat::Identity,
    ECollisionChannel::ECC_PhysicsBody, Sphere, Params);
```

단순 라인 트레이스가 아닌 구체 스윕을 사용한 이유는 패티가 그릴 위에 놓여 정밀한 조준 없이도 가까이 들이대면 감지될 수 있도록 편의성을 높이기 위해서다. 반지름 5 유닛의 구체는 너무 작아 의도치 않은 충돌이 발생하지 않으면서도 패티 정도의 크기를 충분히 커버한다.

충돌 오브젝트가 `IGrabableProps` 인터페이스를 구현하지 않으면 일찍 반환해 의도치 않은 오브젝트에 영향을 주지 않도록 했다.

### 7.3 회전 계산 — 쿼터니언 활용

뒤집는 회전을 계산할 때 오일러 각이 아닌 쿼터니언을 사용했다. 오일러 각은 짐벌 락(Gimbal Lock) 문제가 발생할 수 있고, 축 기준 회전 합성이 직관적이지 않다. 쿼터니언은 이런 문제가 없으며 언리얼의 `FQuat`이 이를 잘 지원한다.

뒤집기의 의미는 "플레이어의 좌우 방향(Right Vector)을 축으로 180도 회전"이다. 카메라 방향에서 Right 벡터를 추출하고, 이를 기준으로 반바퀴 회전하는 `FlipQuat`을 만든 뒤 패티의 현재 회전(`CurrentQuat`)에 합성한다.

```cpp
// Flipper.cpp[83-92]
FRotationMatrix CamMatrix(GrabCharacter->GetFirstPersonCameraComponent()->GetComponentRotation());
FVector RightVector = CamMatrix.GetScaledAxis(EAxis::Y);
FQuat CurrentQuat = Hit.GetActor()->GetActorQuat();
FQuat FlipQuat = FQuat(RightVector, FMath::DegreesToRadians(180.f));
FQuat NewQuat = FlipQuat * CurrentQuat;
```

플레이어가 바라보는 방향에 따라 뒤집는 축이 달라지므로, 어느 각도에서 뒤집든 "자신을 향해 뒤집는" 자연스러운 연출이 나온다.

### 7.4 물리 임펄스 적용

순수 회전 적용만으로는 패티가 그릴에 붙어서 빙그르르 도는 느낌이다. 실제로 뒤집개로 패티를 들어서 뒤집는 느낌을 주기 위해 회전 전에 **상향 임펄스**를 추가한다. 임펄스 방향은 패티의 현재 Up 벡터로, 패티가 기울어져 있어도 자신의 윗면 방향으로 밀려 올라가도록 했다. 강도는 200으로 설정해 짧게 튀어 오르는 정도의 연출이 나온다.

```cpp
// Flipper.cpp[95-103]
FVector ImpulseDirection = CurrentQuat.GetUpVector();
float ImpulseStrength = 200.f;
PrimitiveComp->AddImpulse(ImpulseDirection * ImpulseStrength, NAME_None, true);
Hit.GetActor()->SetActorRotation(NewQuat);
```

임펄스 적용 후 바로 회전을 설정하므로, 패티가 순간적으로 위로 튀면서 뒤집히는 모션이 연출된다.

---

## 8. 패티 뒤집기 연출 (Patty)

### 8.1 뒤집기 RPC 구조

`Patty::Flip()`은 서버와 클라이언트 어느 쪽에서 호출되든 결과적으로 서버에서만 실행되도록 설계되었다. 서버에서 직접 호출되면 `Server_Flip_Implementation()`을 바로 실행하고, 클라이언트에서 호출되면 `Server_Flip()` RPC를 통해 서버에 실행을 요청한다.

```cpp
// Patty.cpp[107-117]
void APatty::Flip()
{
    if (HasAuthority()) Server_Flip_Implementation();
    else Server_Flip();
}
```

이 패턴은 `StartCooking()`, `StopCooking()`에서도 동일하게 사용된다. 서버에서의 직접 호출과 클라이언트 RPC 경로를 명시적으로 분기하는 방식으로, 항상 서버 권한을 보장한다.

`Server_Flip_Implementation()` 내부에서는 `bIsFrontSideDown`을 반전하고, 현재 요리 중(`bIsCooking == true`)이면 기존 타이머를 모두 초기화한 뒤 새 면 기준으로 타이머를 다시 시작한다. 마지막으로 `MulticastRPC_PlayGrillSfx()`를 호출해 모든 클라이언트에서 뒤집기 사운드가 재생된다.

### 8.2 물리 상태 보정 — Server_CheckFlip

물리 시뮬레이션 환경에서는 예기치 않은 충돌이나 힘으로 패티가 뒤집기 입력 없이 물리적으로 뒤집힐 수 있다. 이때 논리 상태(`bIsFrontSideDown`)와 실제 물리 상태가 달라지면 잘못된 면이 익히게 되는 버그가 발생한다.

이 문제를 해결하기 위해 그릴에 올라간 동안 0.5초마다 `Server_CheckFlip()`을 폴링한다. 이 함수는 패티의 현재 Up 벡터와 월드 Up 벡터의 **내적(Dot Product)**을 계산한다. 내적이 0보다 작으면 패티의 Up이 아래를 향하고 있다는 의미, 즉 패티가 물리적으로 뒤집혀 있다는 뜻이다.

```cpp
// Patty.cpp[345-380]
float dot = FVector::DotProduct(GetActorUpVector(), FVector::UpVector);
bool bIsPhysicallyFlipped = dot < 0.f;
if (bIsFrontSideDown && !bIsPhysicallyFlipped)
{
    bIsFrontSideDown = false;
    bStateMismatch = true;
}
```

불일치가 감지되면 논리 상태를 물리 상태에 맞게 보정하고 타이머를 재시작한다. 이 방식은 정확한 뒤집기 입력 없이 패티가 굴러가는 엣지 케이스까지 커버한다.

### 8.3 머티리얼 동적 변경

패티의 시각적 상태 변화는 `UMaterialInstanceDynamic`을 통해 런타임에 텍스처와 색상 파라미터를 직접 수정하는 방식으로 구현했다. 패티 메시는 앞면(슬롯 0)과 뒷면(슬롯 1)에 각각 별도의 머티리얼 슬롯을 가지며, `BeginPlay()`에서 각 슬롯의 머티리얼로부터 동적 인스턴스를 생성해 저장한다.

상태가 변경되면 `OnRep_CookStateChanged()` 리플리케이션 콜백이 클라이언트에서도 호출되어 `UpdateMaterial()`을 실행한다. 이 함수는 앞면과 뒷면 각각에 대해 독립적으로 텍스처와 색상 파라미터를 설정한다.

- **Raw 상태:** rawTexture, 흰색 (`FLinearColor(1,1,1)`), Roughness 1.0
- **Cooked 상태:** cookedTexture, 흰색, Roughness 1.0
- **Overcooked 상태:** cookedTexture, 검은색 (`FLinearColor::Black`), Roughness 50.0

```cpp
// Patty.cpp[288-294]
frontMaterial->SetVectorParameterValue(TEXT("CookingLevel"), frontColor);
frontMaterial->SetScalarParameterValue(TEXT("CookingRough"), frontRough);
frontMaterial->SetTextureParameterValue(TEXT("BaseTexture"), frontTexture);
```

앞면과 뒷면이 독립적으로 업데이트되므로, 한 면만 탄 패티를 만들면 한쪽은 갈색, 다른 쪽은 검게 타 있는 시각적 표현이 가능하다.

---

## 9. 그릴 영역 (CookingArea)

`ACookingArea`는 그릴 위의 조리 공간을 나타내는 트리거 액터다. 콜리전 박스에 재료가 진입하면 `OnOverlapBegin`이 호출되어 해당 재료의 `StartCook()`을 실행한다. 재료가 그릴 밖으로 나가면 `OnOverlapEnd`가 `ShutdownCook()`을 호출한다.

두 함수 모두 `HasAuthority()` 확인으로 시작해 서버에서만 동작한다. 재료를 `AIngredientBase`로 캐스팅하므로, 패티가 아닌 다른 재료(채소 등)가 그릴에 올라가도 안전하게 빈 함수가 호출되고 아무 일도 발생하지 않는다. 이 설계 덕분에 그릴은 패티를 특별 취급하지 않아도 된다.

---

## 10. 완성 햄버거 (Hamburger)

### 10.1 텍스처 기반 버거 종류 표현

`AHamburger`는 포장이 완료되면 생성되는 결과 액터다. 실제로 포장된 햄버거의 외형을 버거 종류별로 다르게 표현하기 위해 `UMaterialInstanceDynamic`에 텍스처 파라미터를 런타임에 설정한다. 각 버거 종류에 대응하는 텍스처(`bigMacTexture`, `btdTexture`, `qpcTexture` 등)가 에디터에서 에셋으로 등록되어 있으며, `SetMat()` 함수가 버거 이름 문자열을 읽어 해당 텍스처로 교체한다.

`MultiRPC_SetMat()`은 Multicast RPC로 선언되어 서버에서 호출하면 모든 클라이언트에서 동일하게 텍스처가 변경된다.

### 10.2 네트워크 고려

`AHamburger`도 물리 시뮬레이션과 이동 복제가 활성화되어 있어, 완성된 햄버거를 집어서 이동하면 모든 플레이어에게 동일하게 보인다. `BurgerName` 문자열은 `DOREPLIFETIME`으로 복제되어 나중에 주문 확인 UI가 이 이름을 읽을 수 있도록 준비되어 있다.

---

## 11. 네트워크 구조 요약

이 시스템의 전반은 다음 네트워크 패턴을 일관되게 따른다.

**상태 변경은 항상 서버에서만.** 재료 추가/제거, 패티 뒤집기, 포장 완료 모두 `HasAuthority()` 검사를 통과한 서버 코드에서만 상태가 바뀐다. 클라이언트는 직접 상태를 바꾸지 않고 Server RPC로 요청만 보낸다.

**결과 전파는 Replicated 변수 또는 Multicast RPC로.** `OnAreaIngredients`, `CookState`, `bIsFrontSideDown` 같은 게임 상태 변수는 `DOREPLIFETIME`으로 복제된다. 효과음과 머티리얼 변경처럼 상태가 아닌 이벤트성 피드백은 Multicast RPC로 모든 클라이언트에 직접 호출된다.

**클라이언트 RPC 호출 패턴.** `Flip()`, `StartCooking()`, `StopCooking()` 같은 공개 함수들은 내부에서 `HasAuthority()`로 분기해 서버이면 구현 함수를 직접 호출하고, 클라이언트이면 Server RPC를 통해 요청한다. 이 패턴으로 같은 함수를 어디서든 안전하게 호출할 수 있다.

```
[클라이언트] Patty::Flip()
    → Server_Flip() RPC 전송
        → [서버] Server_Flip_Implementation()
            → bIsFrontSideDown 변경
            → StopAllTimer() / StartCookTimer()
            → MulticastRPC_PlayGrillSfx() 브로드캐스트
                → [전체 클라이언트] 사운드 재생
            → DOREPLIFETIME 변수 변경
                → [전체 클라이언트] OnRep_CookStateChanged() → UpdateMaterial()
```

이 구조는 치트 방지와 상태 일관성 측면에서 안정적이며, 클라이언트 수가 늘어도 서버 권한 모델이 흔들리지 않는다.
