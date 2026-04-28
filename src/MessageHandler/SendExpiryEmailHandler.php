<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\SendExpiryEmailMessage;
use App\Repository\SubscriptionRepository;
use Psr\Log\LoggerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\Messenger\Exception\UnrecoverableMessageHandlingException;

#[AsMessageHandler]
final readonly class SendExpiryEmailHandler
{
    public function __construct(
        private SubscriptionRepository $subscriptionRepository,
        private LoggerInterface $logger,
    ) {
    }

    public function __invoke(SendExpiryEmailMessage $message): void
    {
        $subscription = $this->subscriptionRepository->find($message->subscriptionId);

        if ($subscription === null) {
            throw new UnrecoverableMessageHandlingException(
                sprintf('Subscription %s no longer exists — expiry email skipped.', $message->subscriptionId),
            );
        }

        // TODO étape finitions : brancher symfony/mailer + template Twig.
        $this->logger->info('Trial expiry email to send', [
            'subscriptionId' => (string) $subscription->getId(),
            'organization' => $subscription->getOrganization()->getName(),
            'status' => $subscription->status->value,
            'plan' => $subscription->getPlan()->value,
        ]);
    }
}
