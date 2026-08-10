
#include "COD_ProjMoveComponent_Rocket.h"
#include "MYP.h"
#include "DrawDebugHelpers.h"


UCOD_ProjMoveComponent_Rocket::UCOD_ProjMoveComponent_Rocket()
{
	PrimaryComponentTick.bCanEverTick = true;
}

void UCOD_ProjMoveComponent_Rocket::TickComponent(float DeltaTime, ELevelTick TickType,
                                                   FActorComponentTickFunction* ThisTickFunction)
{
	// 회전 적분은 Base TickComponent 호출 전에 처리
	// (Base가 SyncRotation으로 덮어쓰기 전에 각속도 적용)
	PhaseElapsed += DeltaTime;

	// Phase 0: 콜드런치 — 탄두 역추진 토크
	if (PhaseElapsed < ColdLaunchDuration)
	{
		AActor* Owner = GetOwner();
		if (IsValid(Owner))
		{
			FQuat CurrentQuat = Owner->GetActorQuat();
			FVector Forward = Owner->GetActorForwardVector();

			// r = 탄두 끝 위치 오프셋 (발사체 앞쪽)
			FVector r = Forward * HalfLength;
			// F = 역방향 분사력 (탄두에서 뒤쪽으로 가스 분사)
			FVector F = -Forward * ColdLaunchForce;
			// Torque = r × F
			FVector Torque = FVector::CrossProduct(r, F);

			// 각가속도 = Torque / Inertia
			AngularVelocity += (Torque / Inertia) * DeltaTime;

			// 회전 적분: DeltaAngle = AngularVelocity * dt
			FVector DeltaAngle = AngularVelocity * DeltaTime;
			float AngleMag = DeltaAngle.Size();
			if (AngleMag > KINDA_SMALL_NUMBER)
			{
				FQuat DeltaQuat(DeltaAngle.GetSafeNormal(), AngleMag);
				Owner->SetActorRotation((DeltaQuat * CurrentQuat).Rotator());
			}
		}
	}
	// Phase 1: Coast — 각속도 서서히 감쇠
	else if (PhaseElapsed < LaunchDelay)
	{
		AngularVelocity *= FMath::Max(0.f, 1.f - DeltaTime * 3.f);

		AActor* Owner = GetOwner();
		if (IsValid(Owner) && !AngularVelocity.IsNearlyZero())
		{
			FQuat CurrentQuat = Owner->GetActorQuat();
			FVector DeltaAngle = AngularVelocity * DeltaTime;
			float AngleMag = DeltaAngle.Size();
			if (AngleMag > KINDA_SMALL_NUMBER)
			{
				FQuat DeltaQuat(DeltaAngle.GetSafeNormal(), AngleMag);
				Owner->SetActorRotation((DeltaQuat * CurrentQuat).Rotator());
			}
		}
	}

	// Base TickComponent 호출 (선형 적분 + 충돌 처리)
	Super::TickComponent(DeltaTime, TickType, ThisTickFunction);
}

FVector UCOD_ProjMoveComponent_Rocket::ComputeAcceleration(float DeltaTime)
{
	FVector GravityAccel = GravityScale * FVector(0.f, 0.f, -980.f);

	// Phase 0, 1: 중력만
	if (PhaseElapsed < LaunchDelay)
	{
		return GravityAccel;
	}

	// Phase 2: Boost — 기울어진 Forward 방향으로 추진
	if (PhaseElapsed < LaunchDelay + BurnDuration)
	{
		AActor* Owner = GetOwner();
		if (IsValid(Owner))
		{
			FVector ThrustDir = Owner->GetActorForwardVector();
			FVector ThrustAccel = ThrustDir * (ThrustForce / Mass);
			return GravityAccel + ThrustAccel;
		}
		return GravityAccel;
	}

	// Phase 3: Guide — Top-Attack
	if (!IsValid(TargetActor))
		return GravityAccel;

	FVector CurrentPos = GetOwner()->GetActorLocation();
	FVector TargetPos = TargetActor->GetActorLocation();

	// SubPhase A: 타겟 위 OvershootAltitude 고도 지점으로 유도
	FVector SubTarget = TargetPos + FVector(0.f, 0.f, OvershootAltitude);

	// 고도 도달 시 SubPhase B: 타겟 직접 하강
	if (!bReachedOvershoot && CurrentPos.Z >= SubTarget.Z)
	{
		bReachedOvershoot = true;
		LOGMSGF(TEXT("Top-Attack: 오버슈트 고도 도달, 하강 시작"));
	}

	FVector FinalTarget = bReachedOvershoot ? TargetPos : SubTarget;
	FVector ToTarget = (FinalTarget - CurrentPos).GetSafeNormal();

	// 현재 속도 방향에서 타겟 방향으로 TurnRate deg/s 회전 보간
	FVector CurrentDir = Velocity.GetSafeNormal();
	FVector GuidedDir = FMath::VInterpNormalRotationTo(CurrentDir, ToTarget, DeltaTime, TurnRate);

	return GravityAccel + GuidedDir * (ThrustForce / Mass);
}
