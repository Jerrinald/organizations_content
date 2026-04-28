<?php

declare(strict_types=1);

namespace App\Command;

use App\Enum\SubscriptionStatus;
use App\Event\SubscriptionExpiredEvent;
use App\Repository\SubscriptionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Attribute\Option;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;

#[AsCommand(
    name: 'subscriptions:expire-trials',
    description: 'Bascule les subscriptions Trialing dont le trialEndsAt est passé en PastDue.',
)]
final class ExpireTrialSubscriptionsCommand
{
    public function __construct(
        private readonly SubscriptionRepository $repository,
        private readonly EntityManagerInterface $em,
        private readonly EventDispatcherInterface $dispatcher,
        private readonly LoggerInterface $logger,
    ) {
    }

    public function __invoke(
        SymfonyStyle $io,
        #[Option(description: 'Affiche les subscriptions qui seraient expirées sans rien persister.')]
        bool $dryRun = false,
    ): int {
        $expiring = $this->repository->findExpiringTrials();

        if ($expiring === []) {
            $io->success('Aucun trial à expirer.');

            return Command::SUCCESS;
        }

        $io->note(sprintf('%d trial(s) à expirer%s.', \count($expiring), $dryRun ? ' (dry-run)' : ''));

        $processed = 0;
        foreach ($expiring as $subscription) {
            $orgId = (string) $subscription->getOrganization()->getId();

            try {
                $subscription->status = SubscriptionStatus::PastDue;
            } catch (\DomainException $e) {
                $this->logger->warning('Trial expiration skipped: invalid transition', [
                    'subscription_id' => (string) $subscription->getId(),
                    'organization_id' => $orgId,
                    'error' => $e->getMessage(),
                ]);
                continue;
            }

            $this->dispatcher->dispatch(new SubscriptionExpiredEvent($subscription));

            $io->writeln(sprintf(
                ' - org=%s sub=%s trialEndsAt=%s → PastDue',
                $orgId,
                (string) $subscription->getId(),
                $subscription->getTrialEndsAt()->format('c'),
            ));
            ++$processed;
        }

        if ($dryRun) {
            $io->warning('Dry-run : aucune persistance, EM clear.');
            $this->em->clear();

            return Command::SUCCESS;
        }

        $this->em->flush();

        $io->success(sprintf('%d trial(s) expiré(s).', $processed));

        return Command::SUCCESS;
    }
}
