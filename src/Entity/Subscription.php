<?php

namespace App\Entity;

use App\Doctrine\TenantScoped;
use App\Entity\Trait\TimestampableTrait;
use App\Enum\PlanTier;
use App\Enum\SubscriptionStatus;
use App\Repository\SubscriptionRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity(repositoryClass: SubscriptionRepository::class)]
#[ORM\Table(name: 'subscription')]
#[ORM\UniqueConstraint(name: 'UNIQ_SUBSCRIPTION_ORG', fields: ['organization'])]
#[ORM\HasLifecycleCallbacks]
class Subscription implements TenantScoped
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $id;

    #[ORM\ManyToOne(targetEntity: Organization::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Organization $organization;

    #[ORM\Column(enumType: PlanTier::class)]
    private PlanTier $plan = PlanTier::Free;

    #[ORM\Column(enumType: SubscriptionStatus::class)]
    public SubscriptionStatus $status = SubscriptionStatus::Trialing {
        set(SubscriptionStatus $next) {
            if (isset($this->status) && !$this->status->canTransitionTo($next)) {
                throw new \DomainException(
                    sprintf('Transition invalide : %s → %s', $this->status->value, $next->value),
                );
            }
            $this->status = $next;
            if ($next === SubscriptionStatus::Active) {
                $this->currentPeriodEndsAt = new \DateTimeImmutable(self::PERIOD_DURATION);
            }
        }
    }

    #[ORM\Column]
    private \DateTimeImmutable $trialEndsAt;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $currentPeriodEndsAt = null;

    private const PERIOD_DURATION = '+30 days';

    public function __construct()
    {
        $this->id = new UuidV7();
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getOrganization(): Organization
    {
        return $this->organization;
    }

    public function setOrganization(Organization $organization): static
    {
        $this->organization = $organization;

        return $this;
    }

    public function getPlan(): PlanTier
    {
        return $this->plan;
    }

    public function setPlan(PlanTier $plan): static
    {
        $this->plan = $plan;

        return $this;
    }

    public bool $isInTrial {
        get => $this->status === SubscriptionStatus::Trialing
            && $this->trialEndsAt > new \DateTimeImmutable();
    }

    public function getTrialEndsAt(): \DateTimeImmutable
    {
        return $this->trialEndsAt;
    }

    public function setTrialEndsAt(\DateTimeImmutable $trialEndsAt): static
    {
        $this->trialEndsAt = $trialEndsAt;

        return $this;
    }

    public function getCurrentPeriodEndsAt(): ?\DateTimeImmutable
    {
        return $this->currentPeriodEndsAt;
    }

    public function setCurrentPeriodEndsAt(?\DateTimeImmutable $currentPeriodEndsAt): static
    {
        $this->currentPeriodEndsAt = $currentPeriodEndsAt;

        return $this;
    }
}
