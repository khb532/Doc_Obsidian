# 일일 작업 레포트 - 2026년 04월 02일

## 📋 프로젝트 정보
- **전체 프로젝트**: MYP — Unreal Engine 5 CoD Clone (C++ 기반 슈터 게임)
- **현재 단계**: 발사체 시스템 구현
- **단계 목표**: 발사체 궤적과 메시 회전값 동기화
- **작업 브랜치**: CoD

---

## ✅ 완료된 작업

**커밋된 파일**:
- `Source/MYP/cod/COD_ProjectileMovementComponent.cpp` — SyncRotation() 함수 구현 (CrossProduct 기반)
- `Source/MYP/cod/COD_ProjectileMovementComponent.h` — SyncRotation() 선언 추가
- `Config/DefaultEngine.ini` — 관련 엔진 설정 변경

**구현 내용**:
- `SyncRotation(FVector Velocity)` 함수 신규 작성
- 매 Tick의 else 블록에서 `SetWorldRotation(SyncRotation())` 호출
- CrossProduct 기반 직교 기저벡터 구성: `Forward → Right → Up 재계산 → FMatrix → FRotator`

**작업 중**:
- 3단계: 짐벌락 문제 직접 확인 (에디터에서 수직 발사 테스트 대기 중)

---

## 📊 전체 TODO 현황 (2/4 완료)

1. ✅ **FMatrix를 이용한 회전 행렬 개념 이해**
2. ✅ **CrossProduct 방식 구현 및 동작 확인**
3. ⏳ **짐벌락 문제 직접 확인** (다음 작업)
   - [ ] 수직 방향으로 발사해 짐벌락 현상 재현
   - [ ] 회전이 튀거나 고정되는 증상 눈으로 확인
4. ⏳ **FQuat::FindBetweenNormals로 교체**

---

## 💡 학습 내용

- **FMatrix 회전 행렬 구성**: 세 직교 기저벡터(Forward/Right/Up)로 4×4 행렬을 만들고 FRotator로 추출하는 원리
- **CrossProduct 순서**: `Cross(UpVector, Forward) → Right`, `Cross(Forward, Right) → Up 재계산` 순서가 중요하며 교환법칙 불성립
- **Up 재계산의 이유**: 월드 UpVector와 Forward가 완전히 수직이 아닐 수 있어 FMatrix 직교성 보장을 위해 Up을 다시 계산
- **GetUpVector() 기준축 문제**: 컴포넌트 자신의 Up을 기준으로 쓰면 매 프레임 기준축이 오염되어 회전이 누적 표류함
- **짐벌락 발생 조건**: Forward가 UpVector와 평행(수직 낙하)해지면 CrossProduct 결과가 영벡터 → 행렬 정의 불가

---

**작성일**: 2026년 04월 02일
