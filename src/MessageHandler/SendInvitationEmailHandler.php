<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\SendInvitationEmailMessage;
use App\Repository\MemberRepository;
use Psr\Log\LoggerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\Messenger\Exception\UnrecoverableMessageHandlingException;

#[AsMessageHandler]
final readonly class SendInvitationEmailHandler
{
    public function __construct(
        private MemberRepository $memberRepository,
        private LoggerInterface $logger,
    ) {
    }

    public function __invoke(SendInvitationEmailMessage $message): void
    {
        $member = $this->memberRepository->find($message->memberId);

        if ($member === null) {
            throw new UnrecoverableMessageHandlingException(
                sprintf('Member %s no longer exists — invitation email skipped.', $message->memberId),
            );
        }

        // TODO étape finitions : brancher symfony/mailer + template Twig.
        $this->logger->info('Invitation email to send', [
            'memberId' => (string) $member->getId(),
            'email' => $member->getUser()->getEmail(),
            'organization' => $member->getOrganization()->getName(),
            'role' => $member->getRole()->value,
        ]);
    }
}
