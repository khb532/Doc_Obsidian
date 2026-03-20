# /push - Git 푸시 도우미

**Critical Language Requirement**: You MUST respond in Korean at all times.

---

## 트리거 조건

**TRIGGER when**: 사용자가 다음과 같은 요청을 할 때:
- "푸시", "푸쉬", "push", "푸시해줘", "푸쉬해줘", "푸쉬해", "푸시해", "올려줘", "올려"
- "커밋하고 푸시", "커밋하고 올려줘" → 커밋 먼저 실행 후 푸시
- "반영해줘", "원격에 올려줘"

**DO NOT TRIGGER when**:
- 푸시 없이 커밋만 요청할 때 → `/commit` skill 사용
- git 개념을 설명해달라고 할 때

---

## 실행 프로세스

### 1. 현재 상태 확인
```bash
git status
git log origin/{브랜치}..HEAD --oneline
```
- 커밋되지 않은 변경사항이 있으면 먼저 `/commit` 실행 안내
- 푸시할 커밋이 없으면 안내 후 종료

### 2. 푸시 실행 (확인 없이 바로)
```bash
git push origin {현재 브랜치}
```

---

## 주의사항

- `--force` / `--force-with-lease` 는 절대 사용하지 않음
- `master` 브랜치 직접 푸시 시 경고 표시 후 푸시
- 커밋이 없으면 푸시하지 않고 안내
