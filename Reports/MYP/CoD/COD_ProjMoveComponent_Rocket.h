#pragma once

#include "CoreMinimal.h"
#include "COD_ProjMoveComponent_Base.h"
#include "COD_ProjMoveComponent_Rocket.generated.h"

UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class MYP_API UCOD_ProjMoveComponent_Rocket : public UCOD_ProjMoveComponent_Base
{
	GENERATED_BODY()

	/* Method */
public:
	UCOD_ProjMoveComponent_Rocket();

	virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

protected:
	virtual FVector ComputeAcceleration(float DeltaTime) override;



	/* Field */
public:
	// Phase 0: 콜드런치
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Ballistics|ColdLaunch")
	float ColdLaunchForce = 80000.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Ballistics|ColdLaunch")
	float ColdLaunchDuration = 0.3f;

	// 발사체 절반 길이 — 토크 팔(r) 계산에 사용
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Ballistics|ColdLaunch")
	float HalfLength = 80.f;

	// 관성 모멘트 (스칼라 단순화)
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Ballistics|ColdLaunch")
	float Inertia = 500.f;

	// Phase 1: Coast → Phase 2: Boost 전환까지 대기 시간
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Ballistics|Boost")
	float LaunchDelay = 2.f;

	// Phase 2: 메인 추진
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Ballistics|Boost")
	float ThrustForce = 120000.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Ballistics|Boost")
	float BurnDuration = 2.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Ballistics|Boost")
	float GravityScale = 1.f;

	// Phase 3: Top-Attack 유도
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Ballistics|Guide")
	float TurnRate = 90.f;

	// 타겟 위 고도 오프셋 (cm) — 이 고도 도달 후 수직 하강
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Ballistics|Guide")
	float OvershootAltitude = 2000.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Ballistics|Guide")
	TObjectPtr<AActor> TargetActor = nullptr;

private:
	FVector AngularVelocity = FVector::ZeroVector;
	float PhaseElapsed = 0.f;
	bool bReachedOvershoot = false;
};
