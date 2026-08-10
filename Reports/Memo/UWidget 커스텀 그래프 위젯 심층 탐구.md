# UWidget 커스텀 그래프 위젯 심층 탐구

> 작성일: 2026년 04월 16일  
> 유형: 나중에 찾아볼 것

---

## 배경

탄도 시뮬레이션 프로파일링 위젯(ProfilingWidget) 개발 중, 시계열 그래프를 인게임 HUD에 표시하기 위해 `UWidget`을 상속받은 커스텀 그래프 위젯(`UMYP_Graph`)을 구현하게 됨. `UUserWidget`이 아닌 `UWidget` → `SLeafWidget` 구조로 직접 Slate 레벨에서 그리기 명령을 다루는 방식을 시작했으며, 더 깊이 파볼 필요가 있다고 판단.

---

## 내용

### 현재까지 파악한 구조

```
UMYP_Graph : public UWidget
  └ RebuildWidget() → SNew(SMyGraphWidget) 반환
      └ SMyGraphWidget : public SLeafWidget
          ├ OnPaint() — FSlateDrawElement::MakeLines()로 그래프 선 그리기
          └ ComputeDesiredSize() — 위젯 크기 반환
```

### 더 파야 할 것들

- `SLeafWidget` vs `SCompoundWidget` vs `SPanel` 차이와 선택 기준
- `FSlateDrawElement::MakeLines()` 파라미터 상세 (FPaintGeometry, ESlateDrawEffect 등)
- `RebuildWidget()` 호출 타이밍과 캐싱 동작
- `UWidget`과 Slate 위젯 간 데이터 동기화 방법 (TAttribute, TSlateAttribute)
- `SLATE_BEGIN_ARGS` / `SLATE_END_ARGS` 매크로 동작 원리
- `ComputeDesiredSize()` 와 UMG 레이아웃 시스템 연동
- `Invalidate()` 호출 시점 — 데이터 변경 시 강제 리페인트 트리거 방법

---

## 관련 키워드

`UWidget`, `SLeafWidget`, `SWidget`, `NativePaint`, `FSlateDrawElement`, `MakeLines`, `RebuildWidget`, `SNew`, `Slate 렌더링 파이프라인`, `UMG 커스텀 위젯`
