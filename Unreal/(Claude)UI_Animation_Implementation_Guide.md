# UI 화면 전환 애니메이션 구현 가이드

**작성일**: 2025년 12월 29일
**프로젝트**: UE_ReNe
**브랜치**: KHB

---

## 📋 개요

WidgetSwitcher를 사용한 UI 화면 전환 시 슬라이드 & 페이드 애니메이션 구현 방법

**목표 효과**:
- 현재 UI: 왼쪽으로 슬라이드하며 페이드아웃
- 다음 UI: 오른쪽에서 슬라이드하며 페이드인

---

## 🎯 핵심 원리

### 1. Visibility 변경 감지

```cpp
// WidgetSwitcher가 인덱스를 바꾸면 자동으로 Visibility 변경됨
// → NativeOnVisibilityChanged() 자동 호출
virtual void NativeOnVisibilityChanged(
    const FSlateVisibility InVisibility,
    const FSlateVisibility InPreviousVisibility
) override;
```

### 2. 애니메이션 순서 제어

```
1. 현재 화면의 SlideOut 애니메이션 재생
2. 애니메이션 종료 콜백
3. WidgetSwitcher 인덱스 변경
4. 다음 화면의 SlideIn 애니메이션 자동 재생
```

---

## 🛠️ 구현 방법

### 1단계: UMG 애니메이션 생성 (Blueprint)

각 위젯 WBP에 2개의 애니메이션 추가:

```
Anim_SlideIn:
  - RenderTransform.Translation X: 1920 → 0 (0.3초)
  - RenderOpacity: 0 → 1 (0.3초)

Anim_SlideOut:
  - RenderTransform.Translation X: 0 → -1920 (0.3초)
  - RenderOpacity: 1 → 0 (0.3초)
```

---

### 2단계: 위젯 헤더 파일 (.h)

```cpp
class URene_LobbyWidget : public UUserWidget
{
    GENERATED_BODY()

protected:
    // Visibility 변경 시 자동 호출되는 함수
    virtual void NativeOnVisibilityChanged(
        const FSlateVisibility InVisibility,
        const FSlateVisibility InPreviousVisibility
    ) override;

    // 화면 활성화/비활성화 시 로직
    virtual void OnActivated();
    virtual void OnDeactivated();

public:
    // Blueprint 애니메이션 바인딩
    UPROPERTY(Transient, meta = (BindWidgetAnim))
    TObjectPtr<UWidgetAnimation> Anim_SlideIn;

    UPROPERTY(Transient, meta = (BindWidgetAnim))
    TObjectPtr<UWidgetAnimation> Anim_SlideOut;
};
```

---

### 3단계: Visibility 감지 구현 (.cpp)

```cpp
void URene_LobbyWidget::NativeOnVisibilityChanged(
    const FSlateVisibility InVisibility,
    const FSlateVisibility InPreviousVisibility)
{
    Super::NativeOnVisibilityChanged(InVisibility, InPreviousVisibility);

    // 화면에 올라올 때 (Hidden → Visible)
    if ((InPreviousVisibility == ESlateVisibility::Collapsed ||
         InPreviousVisibility == ESlateVisibility::Hidden) &&
        (InVisibility == ESlateVisibility::Visible))
    {
        if (Anim_SlideIn)
        {
            PlayAnimation(Anim_SlideIn); // 오른쪽에서 슬라이드 인
        }
        OnActivated(); // 활성화 로직 실행
    }
    // 화면에서 내려갈 때 (Visible → Hidden)
    else if ((InVisibility == ESlateVisibility::Collapsed ||
              InVisibility == ESlateVisibility::Hidden) &&
             (InPreviousVisibility == ESlateVisibility::Visible))
    {
        if (Anim_SlideOut)
        {
            PlayAnimation(Anim_SlideOut); // 왼쪽으로 슬라이드 아웃
        }
        OnDeactivated(); // 비활성화 로직 실행
    }
}

void URene_LobbyWidget::OnActivated()
{
    // 화면 진입 시 실행할 로직 (예: 데이터 갱신)
}

void URene_LobbyWidget::OnDeactivated()
{
    // 화면 퇴장 시 실행할 로직 (예: 타이머 정리)
}
```

---

### 4단계: 화면 전환 타이밍 제어

```cpp
// 부모 위젯 (예: Rene_StartWidget)
void URene_StartWidget::OnClickedEnter()
{
    // ... 로그인 검증 로직 ...

    if (Anim_SlideOut)
    {
        // 애니메이션 종료 시 콜백 바인딩
        FWidgetAnimationDynamicEvent AnimFinished;
        AnimFinished.BindDynamic(this, &URene_StartWidget::OnSlideOutFinished);
        BindToAnimationFinished(Anim_SlideOut, AnimFinished);

        PlayAnimation(Anim_SlideOut); // 현재 화면 SlideOut
    }
    else
    {
        OnSlideOutFinished(); // 애니메이션 없으면 바로 전환
    }
}

void URene_StartWidget::OnSlideOutFinished()
{
    // 애니메이션 종료 후 화면 전환
    sw_Switcher->SetActiveWidgetIndex(1);
    // → LobbyWidget의 Visibility 변경
    // → LobbyWidget::NativeOnVisibilityChanged() 자동 호출
    // → SlideIn 애니메이션 자동 재생
}
```

---

## 📊 전체 흐름도

```
사용자 클릭
    ↓
현재 화면의 Anim_SlideOut 재생
    ↓
애니메이션 종료 콜백
    ↓
WidgetSwitcher 인덱스 변경
    ↓
다음 화면의 Visibility 변경 감지
    ↓
다음 화면의 Anim_SlideIn 자동 재생
    ↓
OnActivated() 호출 (데이터 갱신 등)
```

---

## ✅ 적용 대상 위젯

현재 프로젝트의 모든 메인 위젯에 적용 가능:

- `URene_StartWidget`
- `URene_LobbyWidget`
- `URene_DashBoardWidget`
- `URene_ProfileWidget`
- 기타 Switcher로 관리되는 모든 위젯

---

## 💡 핵심 장점

1. **자동화**: Switcher 인덱스만 바꾸면 애니메이션 자동 재생
2. **재사용성**: 모든 위젯에 동일한 패턴 적용 가능
3. **확장성**: 나중에 Common UI로 전환해도 로직 재사용 가능
4. **명확성**: NativeOnVisibilityChanged()로 화면 상태 변화 명확히 감지

---

## 🚀 다음 단계

1. 각 위젯 WBP에 Anim_SlideIn/Anim_SlideOut 애니메이션 추가
2. C++ 헤더에 애니메이션 바인딩 추가
3. NativeOnVisibilityChanged() 구현
4. 기존 SetActiveWidgetIndex() 호출 부분에 애니메이션 콜백 추가

---

**작성일**: 2025년 12월 29일
