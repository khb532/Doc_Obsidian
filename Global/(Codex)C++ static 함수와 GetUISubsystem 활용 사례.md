# C++ static 함수와 GetUISubsystem 컴파일 에러 분석

## 문제 상황

Unreal Engine UI Subsystem 강의 코드를 따라 작성하던 중 `GetUISubsystem` 함수에서 컴파일 에러가 발생했다.

처음 작성한 선언은 다음과 같은 형태였다.

```cpp
UCLASS()
class UE_RENE_API UFE_UISubsystem : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    UFE_UISubsystem* GetUISubsystem(const UObject* WorldContextObject);
};
```

겉으로 보면 큰 문제가 없어 보인다. `UFE_UISubsystem` 안에 `GetUISubsystem`이라는 함수를 만들었고, 이 함수가 `UFE_UISubsystem*`를 반환하므로 의도도 자연스러워 보인다.

하지만 호출부는 다음과 같았다.

```cpp
UFE_UISubsystem* UISubsystem =
    UFE_UISubsystem::GetUISubsystem(CachedOwningWorld.Get());
```

여기서 문제가 생긴다. `UFE_UISubsystem::GetUISubsystem(...)`처럼 클래스 이름으로 함수를 호출하고 있는데, 정작 함수 선언에는 `static`이 붙어 있지 않았기 때문이다.

강의 영상의 원래 코드는 다음처럼 선언되어 있었다.

```cpp
static UFE_UISubsystem* GetUISubsystem(const UObject* WorldContextObject);
```

즉, 문제의 핵심은 함수 구현 내용이 아니라 선언부에서 `static`을 빠뜨린 것이었다.

## 왜 static이 없으면 문제가 되는가

C++에서 클래스 안에 선언한 함수는 기본적으로 일반 멤버 함수다.

일반 멤버 함수는 반드시 특정 객체를 통해 호출해야 한다.

```cpp
UFE_UISubsystem* UISubsystem = ...;
UISubsystem->GetUISubsystem(WorldContextObject);
```

이런 호출은 의미상 "이미 존재하는 `UISubsystem` 객체에게 `GetUISubsystem` 함수를 실행시켜라"에 가깝다.

반면 실제 호출부는 객체가 아니라 클래스 이름을 사용하고 있었다.

```cpp
UFE_UISubsystem::GetUISubsystem(CachedOwningWorld.Get());
```

이 호출 방식은 "특정 객체를 통해 호출하는 함수"가 아니라 "클래스 자체에 속한 함수"를 호출하는 방식이다. C++에서 이런 방식으로 호출하려면 해당 함수가 `static` 멤버 함수여야 한다.

따라서 `static`이 없는 상태에서 위처럼 호출하면 컴파일러 입장에서는 다음과 같은 모순을 보게 된다.

> 이 함수는 객체가 있어야 호출할 수 있는 일반 멤버 함수인데, 코드에서는 객체 없이 클래스 이름으로 호출하고 있다.

그래서 컴파일 에러가 발생한다.

## 여기서 헷갈렸던 지점

초보 개발자가 이 상황에서 헷갈리기 쉬운 이유는 함수 이름이 `GetUISubsystem`이기 때문이다.

이 함수는 말 그대로 UI Subsystem 인스턴스를 가져오기 위한 함수다. 그런데 이 함수가 일반 멤버 함수라면 호출하려면 이미 `UFE_UISubsystem` 객체가 필요하다.

그러면 흐름이 이상해진다.

```cpp
UFE_UISubsystem* UISubsystem = nullptr;

// UISubsystem을 얻고 싶은데,
// 이 함수를 호출하려면 이미 UISubsystem 객체가 필요하다.
UISubsystem->GetUISubsystem(WorldContextObject);
```

이 코드는 논리적으로 앞뒤가 맞지 않는다.

`UISubsystem`을 얻기 위해 `GetUISubsystem`을 호출하려는 것인데, `GetUISubsystem`을 호출하려면 이미 `UISubsystem`이 있어야 한다. 즉, 객체를 얻기 위한 입구가 객체 안에 들어가 있는 형태가 된다.

이 지점에서 `static`의 필요성이 드러난다.

## static을 붙이면 무엇이 달라지는가

`GetUISubsystem`을 `static`으로 선언하면 함수는 특정 객체에 묶이지 않는다.

```cpp
class UFE_UISubsystem : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    static UFE_UISubsystem* GetUISubsystem(const UObject* WorldContextObject);
};
```

이제 호출부는 자연스러워진다.

```cpp
UFE_UISubsystem* UISubsystem =
    UFE_UISubsystem::GetUISubsystem(CachedOwningWorld.Get());
```

이 코드는 의미상 다음과 같다.

> 나는 아직 `UFE_UISubsystem*`를 가지고 있지 않다.  
> 대신 `WorldContextObject`는 알고 있으니, 이 월드 기준으로 UI Subsystem 인스턴스를 찾아와라.

즉, `static`을 붙였기 때문에 객체를 얻기 전에도 클래스 이름을 통해 접근할 수 있다.

## 실제 GetUISubsystem 구현 분석

실제 `GetUISubsystem` 함수는 대략 다음 흐름을 가진다. 아래 코드는 핵심 로직만 남긴 축약 예시다.

```cpp
UFE_UISubsystem* UFE_UISubsystem::GetUISubsystem(
    const UObject* WorldContextObject
)
{
    if (IsValid(GEngine))
    {
        UWorld* World = GEngine->GetWorldFromContextObject(
            WorldContextObject,
            EGetWorldErrorMode::Assert
        );

        return UGameInstance::GetSubsystem<UFE_UISubsystem>(
            World->GetGameInstance()
        );
    }

    return nullptr;
}
```

이 함수는 `this`를 사용하지 않는다. `CreatedPrimaryLayout` 같은 `UFE_UISubsystem` 객체의 멤버 변수에도 접근하지 않는다.

대신 다음 순서로 동작한다.

1. `WorldContextObject`를 기준으로 현재 `UWorld`를 찾는다.
2. 그 `World`에서 `GameInstance`를 얻는다.
3. `GameInstance`가 관리하는 `UFE_UISubsystem` 인스턴스를 가져온다.

따라서 이 함수는 "이미 가진 UI Subsystem 객체의 기능을 실행하는 함수"가 아니다. "UI Subsystem 객체를 찾아오는 접근 함수"다.

이런 함수는 객체를 통해 호출하는 일반 멤버 함수보다, 클래스 이름으로 호출하는 `static` 멤버 함수가 더 자연스럽다.

## static은 생성한다는 뜻이 아니다

여기서 한 가지를 구분해야 한다.

`GetUISubsystem`이 `static`이라고 해서 이 함수가 `UFE_UISubsystem` 객체를 새로 만든다는 뜻은 아니다.

Unreal Engine의 `UGameInstanceSubsystem`은 보통 엔진이 `GameInstance` 생명주기에 맞춰 생성하고 관리한다. `GetUISubsystem`은 새 객체를 직접 생성하는 함수가 아니라, 현재 월드 기준으로 `GameInstance`에 등록된 Subsystem 인스턴스를 찾아서 반환하는 함수다.

더 정확히 말하면 다음과 같다.

> 객체가 아직 만들어지지 않은 상태에서 호출하는 함수라기보다, 내가 아직 그 객체 포인터를 가지고 있지 않은 상태에서 호출하는 함수다.

즉, `static`은 여기서 "생성 방식"을 나타내는 키워드가 아니다. "호출 방식"을 바꾸는 키워드다.

## 일반 멤버 함수와 비교하기

같은 `UFE_UISubsystem` 클래스 안에서도 모든 함수가 `static`이어야 하는 것은 아니다.

예를 들어 다음 함수는 일반 멤버 함수가 맞다.

```cpp
void UFE_UISubsystem::PushSoftWidgetToStackAsync(...)
{
    UCommonActivatableWidgetContainerBase* FoundWidgetStack =
        CreatedPrimaryLayout->FindWidgetStackByTag(...);
}
```

이 함수는 `CreatedPrimaryLayout`을 사용한다. `CreatedPrimaryLayout`은 특정 `UFE_UISubsystem` 인스턴스가 가지고 있는 멤버 변수다.

따라서 이 함수는 실제 Subsystem 객체를 얻은 뒤에 호출해야 한다.

```cpp
UFE_UISubsystem* UISubsystem =
    UFE_UISubsystem::GetUISubsystem(WorldContextObject);

UISubsystem->PushSoftWidgetToStackAsync(...);
```

여기서 흐름이 중요하다.

1. `static GetUISubsystem`으로 Subsystem 인스턴스를 찾는다.
2. 찾은 인스턴스 포인터로 일반 멤버 함수인 `PushSoftWidgetToStackAsync`를 호출한다.

즉, `static` 함수와 일반 멤버 함수는 역할이 다르다.

## 이번 이슈로 이해한 static의 의미

이번 컴파일 에러는 `static`의 의미를 체감하기 좋은 사례다.

처음에는 `GetUISubsystem`을 일반 멤버 함수로 선언했다. 하지만 호출부에서는 `UFE_UISubsystem::GetUISubsystem(...)`처럼 클래스 이름으로 호출하고 있었다. 이 둘은 서로 맞지 않는다.

일반 멤버 함수라면 객체가 필요하다.

```cpp
UISubsystem->GetUISubsystem(...);
```

`static` 멤버 함수라면 클래스 이름으로 호출할 수 있다.

```cpp
UFE_UISubsystem::GetUISubsystem(...);
```

그리고 `GetUISubsystem`은 바로 그 `UISubsystem` 객체를 얻기 위한 함수다. 그러므로 객체를 통해 호출해야 하는 일반 멤버 함수로 두면 설계상 어색해진다.

이 사례에서 `static`의 의미는 다음처럼 정리할 수 있다.

> `static` 멤버 함수는 특정 객체를 이미 가지고 있어야 호출하는 함수가 아니라, 클래스 이름을 통해 접근할 수 있는 함수다.  
> 특히 어떤 객체를 찾거나 얻기 위한 함수라면, 그 객체를 얻기 전에도 호출할 수 있어야 하므로 `static`이 필요할 수 있다.

## 판단 기준

앞으로 비슷한 상황을 만나면 다음 기준으로 판단하면 된다.

- 호출부가 `ClassName::FunctionName(...)` 형태인가?
- 함수 내부에서 `this`를 사용하지 않는가?
- 함수 내부에서 특정 객체의 멤버 변수에 접근하지 않는가?
- 이 함수가 객체의 기능을 실행하는 것이 아니라 객체를 찾거나 가져오는 역할인가?
- 이 함수를 호출하는 시점에 아직 해당 객체 포인터가 없는가?

위 조건에 해당한다면 `static` 멤버 함수가 적절할 가능성이 높다.

반대로 함수가 특정 객체의 멤버 변수나 상태를 사용한다면 일반 멤버 함수로 두는 것이 맞다.

## 정리

이번 문제는 강의 코드에서 `static` 선언을 놓치면서 발생한 컴파일 에러였다.

`GetUISubsystem`은 `UFE_UISubsystem` 인스턴스를 이미 가지고 있는 상태에서 호출하는 함수가 아니다. 오히려 그 인스턴스를 얻기 위해 호출하는 함수다.

그래서 다음 호출 방식이 필요하다.

```cpp
UFE_UISubsystem* UISubsystem =
    UFE_UISubsystem::GetUISubsystem(WorldContextObject);
```

이 호출을 가능하게 하려면 선언부가 반드시 다음처럼 되어야 한다.

```cpp
static UFE_UISubsystem* GetUISubsystem(const UObject* WorldContextObject);
```

결국 이번 사례에서 `static`은 단순한 문법 장식이 아니라, 함수의 역할과 호출 순서를 맞추기 위한 선언이다. 객체를 얻기 위한 함수는 그 객체가 없어도 호출할 수 있어야 하며, 그럴 때 `static` 멤버 함수가 필요해진다.
