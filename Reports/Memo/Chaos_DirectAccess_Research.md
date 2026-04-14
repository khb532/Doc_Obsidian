# Chaos 직접 통신 조사 메모

SweepSingleByChannel 자체 구현 하고싶었는데
결론은 그 아래가 Chaos 블랙박스라 엔진 소스 안 건드리면 불가능

SweepSingleByChannel 자체가 언리얼에서 Chaos랑 직접 통신하는 최저 레벨 API임
MoveComponent() 걷어내고 이거 직접 쓰는 것만으로도 충분한 어필 포인트

추후 더 파고싶으면:
- Chaos::FChaosPhysicsSolver
- Engine/Source/Runtime/Experimental/Chaos/
