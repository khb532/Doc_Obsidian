# 일일 작업 레포트 - 2026년 03월 18일

## 📋 프로젝트 정보
- **전체 프로젝트**: Unreal Engine 5 C++ 게임 프로젝트 (MYP) - COD 클론 탄도 시스템 이식
- **현재 단계**: 개발 초기 (Alpha)
- **Alpha 목표**: COD 클론의 탄도 시스템(`BulletActor`, `WeaponBase`)을 개인 프로젝트에 이식하고 테스트 환경 구축
- **작업 브랜치**: CoD

---

## ✅ 완료된 작업

**생성된 파일**:
- `Source/MYP/Private/Weapon/WeaponBase.cpp` - 무기 기반 클래스 구현
- `Source/MYP/Public/Weapon/WeaponBase.h` - 무기 기반 클래스 헤더
- `Source/MYP/Private/Projectile/BulletActor.cpp` - 탄환 액터 구현
- `Source/MYP/Public/Projectile/BulletActor.h` - 탄환 액터 헤더

**작업 중 파일**:
- `Document/COD/TestEnv_Setup.md` - 테스트 환경 구축 문서 (진행 중)

---

## 📊 전체 TODO 현황

⚠️ TODO를 사용하지 않음 (Git 변경사항 기반 레포트)

---

## 💡 학습 내용

- `Claude Code skill allowed-tools` 문법: `:*` (deprecated) vs ` *` (공백, 현재 표준)
- Claude Code 커밋 경고 (`quoted characters`, `$() command substitution`) 는 settings.json allow 규칙과 별개의 안전장치
- HEREDOC(`cat <<'EOF'`) 방식으로 커밋 메시지를 작성해도 `$()` 경고가 별도로 발생함
- `report` 스킬 `allowed-tools`에 `Write(*)`, `Edit(*)` 추가로 문서 작성 자동 허용 처리

---

**작성일**: 2026년 03월 18일
