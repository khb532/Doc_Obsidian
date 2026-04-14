# 일일 작업 레포트 - 2026년 04월 06일

## 📋 프로젝트 정보
- **전체 프로젝트**: MYP — Unreal Engine 5 CoD Clone (C++ 기반 슈터 게임)
- **현재 단계**: 발사체 시스템 구현
- **단계 목표**: Projectile Rotation Sync 완성 및 안정화
- **작업 브랜치**: CoD

---

## ✅ 완료된 작업

**커밋 기준 완료 항목**:
- `[FIX] Projectile Rotation Sync` — FQuat::FindBetweenNormals 방식으로 교체 완료
- `[FIX] 디버그라인 추가` — DrawDebugLine으로 궤적 시각화
- `[FEAT] ShooterProjectile ↔ COD_ProjectileMovementComponent 연동 완료`

---

## 📊 전체 TODO 현황 (3/4 완료)

1. ✅ **FMatrix를 이용한 회전 행렬 개념 이해**
2. ✅ **CrossProduct 방식 구현 및 동작 확인**
3. ✅ **FQuat::FindBetweenNormals로 교체** — 쿼터니언 방식 적용 완료
4. ⏳ **짐벌락 문제 직접 확인** (보류)
   - 수직 발사 자체가 게임 내에서 불가능한 구조
   - 짐벌락 발생 가능성은 인지한 상태로 현 구현 유지 결정
   - 실제 버그 발생 시 추가 대응 예정

---

## 💡 학습 내용

- **FQuat::FindBetweenNormals**: 두 단위 벡터 사이의 최단 경로 쿼터니언 반환, 기준축 의존성 없음
- **짐벌락 발생 조건**: Forward가 UpVector(0,0,1)와 평행할 때 CrossProduct 결과가 영벡터 → 회전 행렬 정의 불가
- **실용적 판단**: 게임 구조상 발생 불가능한 엣지 케이스는 이론 검증 없이 가정 기반으로 처리 가능
- **CrossProduct vs FQuat 비교**: CrossProduct+FMatrix는 UpVector 의존, FQuat는 어떤 방향이든 안정적

---

**작성일**: 2026년 04월 06일
