<?php

namespace App\Repository;

use App\Entity\Subscription;
use App\Enum\SubscriptionStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Subscription>
 */
class SubscriptionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Subscription::class);
    }

    /**
     * @return list<Subscription>
     */
    public function findExpiringTrials(?\DateTimeImmutable $now = null): array
    {
        $now ??= new \DateTimeImmutable();

        return $this->createQueryBuilder('s')
            ->andWhere('s.status = :status')
            ->andWhere('s.trialEndsAt < :now')
            ->setParameter('status', SubscriptionStatus::Trialing)
            ->setParameter('now', $now)
            ->getQuery()
            ->getResult();
    }
}
