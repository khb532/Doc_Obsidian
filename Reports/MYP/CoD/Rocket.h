#pragma once

#include "CoreMinimal.h"
#include "BulletBase.h"
#include "Rocket.generated.h"

class UCOD_ProjMoveComponent_Rocket;

UCLASS()
class MYP_API ARocket : public ABulletBase
{
	GENERATED_BODY()

	/* Method */
public:
	ARocket();

protected:
	virtual void OnBulletHit(const FHitResult& HitResult) override;



	/* Field */
public:
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Explosion")
	float ExplosionRadius = 300.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Explosion")
	float ExplosionDamage = 200.f;

private:
	UPROPERTY(VisibleAnywhere, Category="Components")
	UCOD_ProjMoveComponent_Rocket* ProjectileMovement;
};
