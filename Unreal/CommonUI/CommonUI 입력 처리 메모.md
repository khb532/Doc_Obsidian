## 목표

`Press Any Key` 화면이 활성화된 상태에서 입력을 감지하고, 입력이 들어오면 `Main Menu` 위젯을 `WidgetStack.FrontEnd`에 push한다.

```text
Press Any Key 활성화
→ 마우스 클릭 또는 키보드 입력 감지
→ Push Main Menu 이벤트 호출
→ Main Menu 위젯 push
→ Press Any Key 화면 비활성화
```

---

## 1. 마우스 입력 처리

### 사용 함수

```text
OnMouseButtonDown
```

마우스 버튼 클릭을 감지하는 함수이다.

### 처리 흐름

```text
OnMouseButtonDown
→ Push Main Menu 호출
→ Return Value = Handled
```

### 핵심 설정

```text
Activated Visibility = Visible
```

### 이유

마우스 입력은 위젯이 hit test 가능한 상태여야 감지된다.  
`Activated Visibility`가 `Visible`이 아니면 마우스 클릭 이벤트가 위젯에 전달되지 않는다.

### 반환값

```text
Handled
```

입력이 이 위젯에서 처리되었음을 의미한다.  
`Unhandled`로 두면 입력이 다른 위젯이나 하위 시스템으로 계속 전달될 수 있다.

---

## 2. 키보드 / 게임패드 입력 처리

### 사용 함수

```text
OnKeyDown
```

키보드 키 또는 게임패드 버튼 입력을 감지하는 함수이다.

### 처리 흐름

```text
OnKeyDown
→ Push Main Menu 호출
→ Return Value = Handled
```

### 필요한 추가 함수

```text
GetDesiredFocusTarget
```

키 입력을 받기 위해 포커스를 줄 대상을 반환하는 함수이다.

### 설정값

```text
GetDesiredFocusTarget → Self
```

`Press Any Key` 위젯 자신에게 포커스를 주겠다는 의미이다.

### 필요한 위젯 옵션

```text
Is Focusable = true
```

### 이유

키보드 입력은 포커스를 가진 위젯만 받을 수 있다.  
`GetDesiredFocusTarget`이 `Self`를 반환해도, 위젯 자체가 focusable이 아니면 포커스를 받을 수 없다.

따라서 키보드 입력 처리는 두 조건을 모두 만족해야 한다.

```text
GetDesiredFocusTarget = Self
Is Focusable = true
```

---

## 3. 마우스 입력과 키보드 입력의 차이

| 입력 종류 | 오버라이드 함수 | 필수 조건 |
|---|---|---|
| 마우스 클릭 | `OnMouseButtonDown` | `Activated Visibility = Visible` |
| 키보드 입력 | `OnKeyDown` | `GetDesiredFocusTarget = Self`, `Is Focusable = true` |
| 게임패드 입력 | `OnKeyDown` | 키보드 입력과 동일 |

---

## 4. 공통 실행 이벤트

### Custom Event

```text
Push Main Menu
```

`OnMouseButtonDown`과 `OnKeyDown` 양쪽에서 같은 커스텀 이벤트를 호출한다.

### 이유

마우스 입력과 키보드 입력의 감지 방식은 다르지만, 최종 동작은 동일하기 때문이다.

```text
입력 감지
→ Push Main Menu
→ Main Menu push
```

---

## 핵심 정리

- 마우스 입력은 visibility가 중요하다.
- 키보드 입력은 focus가 중요하다.
- `OnMouseButtonDown`은 마우스 클릭을 처리한다.
- `OnKeyDown`은 키보드와 게임패드 입력을 처리한다.
- `GetDesiredFocusTarget = Self`로 포커스 대상을 지정한다.
- `Is Focusable = true`가 아니면 키 입력을 받을 수 없다.
- 두 입력 모두 `Push Main Menu` 커스텀 이벤트로 합류시킨다.
