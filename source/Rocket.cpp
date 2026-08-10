
#include "Rocket.h"
#include "MYP.h"
#include "COD_ProjMoveComponent_Rocket.h"
#include "DrawDebugHelpers.h"
#include "Kismet/GameplayStatics.h"


ARocket::ARocket()
{
	Mass = 10.f;
	MuzzleVelocity = 2000.f;
	CD = 0.f;
	CrossSectionArea = 0.f;
	DestructionDelay = 0.f;

	ProjectileMovement = CreateDefaultSubobject<UCOD_ProjMoveComponent_Rocket>(TEXT("ProjectileMovement"));
}

void ARocket::OnBulletHit(const FHitResult& HitResult)
{
	BP_OnBulletHit(HitResult);

	// 폭발 반경 데미지
	UGameplayStatics::ApplyRadialDamage(
		GetWorld(),
		ExplosionDamage,
		HitResult.ImpactPoint,
		ExplosionRadius,
		UDamageType::StaticClass(),
		TArray<AActor*>{ this },
		this,
		GetInstigatorController(),
		true
	);

	// 디버그 시각화
	DrawDebugSphere(GetWorld(), HitResult.ImpactPoint, ExplosionRadius, 16, FColor::Orange, false, 3.f);
	LOGWARNF(TEXT("Rocket Hit: %s | 폭발반경 %.0fcm"), *GetNameSafe(HitResult.GetActor()), ExplosionRadius);

	Destroy();
}
