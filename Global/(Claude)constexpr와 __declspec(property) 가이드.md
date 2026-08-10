# C++ `constexpr` 와 `__declspec(property)` 가이드

---

## 1. `constexpr` — 컴파일 타임에 답을 내다

### 왜 필요한가

프로그램을 실행하면 CPU는 계산을 한다. 그런데 생각해보면, 어떤 계산은 실행할 때마다 항상 같은 답이 나온다. `2의 10승은 1024`, `원주율의 소수점 다섯 자리는 3.14159` — 이런 건 굳이 프로그램이 실행될 때 계산할 필요가 없다. 컴파일할 때 미리 답을 구해두면 런타임에는 그냥 상수를 쓰면 된다.

`constexpr`는 바로 이 역할을 한다. "이 값은 컴파일 타임에 결정될 수 있다"고 컴파일러에게 알려주는 키워드다.

---

### constexpr 변수

```cpp
constexpr int MAX_HP   = 100;
constexpr double PI    = 3.14159;
constexpr int TILE_SIZE = 64;
```

`const`와 헷갈릴 수 있는데, 결정적인 차이가 있다.

```cpp
int userInput = 42;

const int a = userInput;       // OK — 런타임 값도 허용
constexpr int b = userInput;   // ERROR — 컴파일 타임 값이어야 함
```

`const`는 "바꾸지 않겠다"는 약속이고, `constexpr`는 "컴파일 타임에 값이 확정된다"는 보장이다.

---

### constexpr 함수

`constexpr` 함수는 인자가 컴파일 타임 상수일 때 컴파일 타임에 평가되고, 그렇지 않으면 일반 함수처럼 런타임에 평가된다.

```cpp
constexpr int square(int n) {
    return n * n;
}

constexpr int a = square(5);  // 컴파일 타임 → a = 25 (어셈블리에 25가 박힘)
int x = 7;
int b = square(x);            // 런타임 평가 (x가 컴파일 타임 상수가 아님)
```

---

### C++ 버전별 진화

#### C++11 — 시작, 하지만 제약이 많다

함수 본문에 `return` 문 하나만 허용됐다. 루프나 지역 변수는 쓸 수 없었다.

```cpp
// C++11 스타일 — 삼항 연산자로 재귀를 써야 했다
constexpr int factorial(int n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
}
```

#### C++14 — 제약 완화

루프, 지역 변수, `if` 문 모두 허용됐다. 훨씬 자연스럽게 작성할 수 있게 됐다.

```cpp
// C++14 스타일
constexpr int factorial(int n) {
    int result = 1;
    for (int i = 2; i <= n; ++i)
        result *= i;
    return result;
}

constexpr int val = factorial(6);  // 컴파일 타임 → 720
```

#### C++17 — `if constexpr` 등장

템플릿 프로그래밍에서 가장 큰 변화다. 조건에 따라 컴파일 자체를 선택적으로 할 수 있게 됐다.

```cpp
template <typename T>
void process(T value) {
    if constexpr (std::is_integral_v<T>) {
        // T가 정수형일 때만 이 블록이 컴파일된다
        std::cout << "정수: " << value * 2 << "\n";
    } else {
        // 아닐 때만 이 블록이 컴파일된다
        std::cout << "실수: " << value + 0.5 << "\n";
    }
}
```

`if constexpr`가 없던 시절에는 템플릿 특수화나 `enable_if`를 써야 했던 코드를 이렇게 깔끔하게 표현할 수 있다.

#### C++20 — `consteval`, `constinit`

```cpp
// consteval — 반드시 컴파일 타임에만 호출 가능
consteval int mustCompileTime(int n) {
    return n * n;
}

consteval int a = mustCompileTime(5);  // OK
int x = 5;
int b = mustCompileTime(x);            // ERROR — 런타임 호출 불가

// constinit — 전역/정적 변수의 컴파일 타임 초기화를 강제
constinit int globalCounter = 0;  // 초기화는 컴파일 타임, 이후 수정은 허용
```

---

### `const` vs `constexpr` 비교

| 항목 | `const` | `constexpr` |
|------|---------|-------------|
| 평가 시점 | 런타임도 가능 | 컴파일 타임 강제 |
| 목적 | 수정 방지 | 컴파일 타임 연산 보장 |
| 함수에 적용 | 멤버 함수에만 (const 메서드) | 일반 함수 전체에 가능 |
| 템플릿 인자로 사용 | 불가 | 가능 |

---

### 실전 활용 패턴

```cpp
// 배열 크기로 활용 — VLA 없이 컴파일 타임 크기 지정
constexpr int BUFFER_SIZE = 256;
char buffer[BUFFER_SIZE];

// 템플릿 인자로 활용
template <int N>
struct FixedArray {
    int data[N];
};

constexpr int SIZE = 10;
FixedArray<SIZE> arr;  // OK

// 클래스에서 활용
struct Vector2D {
    float x, y;
    constexpr Vector2D(float x, float y) : x(x), y(y) {}
    constexpr float lengthSquared() const { return x*x + y*y; }
};

constexpr Vector2D origin{0.0f, 0.0f};
constexpr float len = origin.lengthSquared();  // 컴파일 타임 연산
```

---

## 2. `__declspec(property)` — 변수처럼 쓰는 getter/setter

### 왜 필요한가

C#이나 C++/CLI에서는 프로퍼티가 언어 수준에서 지원된다. `player.HP = 100;` 처럼 값을 대입하는 문법 뒤에 자동으로 setter 함수가 호출되는 방식이다.

표준 C++에는 이 기능이 없다. 하지만 MSVC(Visual Studio의 컴파일러)는 `__declspec(property)` 라는 비표준 확장 키워드를 통해 이와 유사한 동작을 제공한다.

> **주의**: `__declspec(property)`는 MSVC 전용 비표준 확장이다. GCC, Clang에서는 동작하지 않는다.

---

### 기본 문법

```cpp
class Player {
private:
    int _hp = 100;

public:
    // 프로퍼티 선언
    __declspec(property(get = GetHp, put = SetHp)) int HP;

    int GetHp() const {
        return _hp;
    }

    void SetHp(int value) {
        _hp = (value >= 0) ? value : 0;  // 음수 방지
    }
};

// 사용
Player player;
player.HP = 150;           // 내부적으로 SetHp(150) 호출
int current = player.HP;   // 내부적으로 GetHp() 호출
```

필드처럼 보이지만 실제로는 함수 호출이다.

---

### 읽기 전용 / 쓰기 전용

```cpp
class Circle {
private:
    float _radius = 1.0f;

public:
    // 읽기 전용 — get만 지정
    __declspec(property(get = GetArea)) float Area;

    // 쓰기 전용 — put만 지정
    __declspec(property(put = SetRadius)) float Radius;

    float GetArea() const {
        return 3.14159f * _radius * _radius;
    }

    void SetRadius(float r) {
        if (r > 0) _radius = r;
    }
};

Circle c;
c.Radius = 5.0f;       // OK
float a = c.Area;       // OK
c.Area = 10.0f;         // ERROR — put이 없으므로 쓰기 불가
```

---

### 인덱스 프로퍼티 (배열 접근)

```cpp
class Inventory {
private:
    int _items[10] = {};

public:
    __declspec(property(get = GetItem, put = SetItem)) int Items[];

    int GetItem(int index) const {
        return _items[index];
    }

    void SetItem(int index, int value) {
        _items[index] = value;
    }
};

Inventory inv;
inv.Items[0] = 42;       // SetItem(0, 42) 호출
int val = inv.Items[0];  // GetItem(0) 호출
```

---

### 언리얼 엔진의 UPROPERTY와의 관계

언리얼 엔진에서 자주 보는 `UPROPERTY()`는 `__declspec(property)`와는 완전히 다른 개념이다.

| 항목 | `__declspec(property)` | `UPROPERTY()` |
|------|------------------------|---------------|
| 목적 | getter/setter 자동 연결 | 리플렉션 시스템 등록 |
| 동작 | 컴파일러 수준 문법 변환 | UHT(언리얼 헤더 툴) 처리 |
| 블루프린트 노출 | 불가 | 가능 |
| 가비지 컬렉션 | 무관 | 관여 (UObject* 추적) |
| 에디터 노출 | 불가 | 가능 |

언리얼 프로젝트에서 변수를 에디터에 노출하거나 블루프린트에서 접근하려면 `UPROPERTY()`를 써야 한다. `__declspec(property)`는 그 역할을 대체하지 못한다.

---

### 주의사항 및 한계

**1. 비표준이다**
표준 C++에는 없는 기능이다. GCC나 Clang으로 컴파일하면 동작하지 않는다. 크로스 플랫폼 코드에는 사용하면 안 된다.

**2. 실제 멤버 변수가 아니다**
`__declspec(property)`로 선언한 이름은 실제 메모리를 차지하는 변수가 아니다. 주소를 취할 수 없다.

```cpp
// ERROR — 프로퍼티는 주소를 가져올 수 없다
int* ptr = &player.HP;
```

**3. C++ 표준에 property는 없다**
C++23에서 표준 property 기능을 추가하자는 제안이 있었으나 채택되지 않았다. 현재 표준 C++에는 이 기능이 없다.

---

### 크로스 플랫폼 대안

플랫폼에 무관하게 유사한 패턴을 구현하고 싶다면, 래퍼 클래스를 사용하는 방법이 있다.

```cpp
template <typename T>
class Property {
public:
    std::function<T()>    getter;
    std::function<void(T)> setter;

    operator T() const { return getter(); }
    Property& operator=(T value) { setter(value); return *this; }
};

class Player {
private:
    int _hp = 100;

public:
    Property<int> HP{
        [this]() { return _hp; },
        [this](int v) { _hp = (v >= 0) ? v : 0; }
    };
};

Player p;
p.HP = 50;
int h = p.HP;
```

다만 이 방법은 `std::function`의 오버헤드가 있으므로 성능이 중요한 코드에서는 주의가 필요하다.

---

## 요약

| 키워드 | 종류 | 핵심 역할 |
|--------|------|-----------|
| `constexpr` | 표준 C++ | 컴파일 타임 상수/함수 |
| `consteval` | 표준 C++20 | 컴파일 타임 전용 함수 강제 |
| `constinit` | 표준 C++20 | 전역 변수 컴파일 타임 초기화 강제 |
| `if constexpr` | 표준 C++17 | 템플릿 조건부 컴파일 |
| `__declspec(property)` | MSVC 비표준 | getter/setter를 변수 문법으로 연결 |
