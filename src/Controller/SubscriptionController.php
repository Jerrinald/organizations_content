<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Subscription;
use App\Security\Voter\SubscriptionVoter;
use App\Service\BillingService;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/subscriptions')]
#[OA\Tag(name: 'Subscriptions')]
#[OA\Parameter(ref: '#/components/parameters/OrganizationIdHeader')]
final class SubscriptionController extends AbstractController
{
    #[Route('/{id}', methods: ['GET'])]
    public function show(
        Subscription $subscription,
        BillingService $billing,
    ): JsonResponse {
        $this->denyAccessUnlessGranted(SubscriptionVoter::VIEW, $subscription);

        return $this->json([
            'id' => (string) $subscription->getId(),
            'plan' => $subscription->getPlan(),
            'status' => $subscription->status,
            'isInTrial' => $subscription->isInTrial,
            'trialEndsAt' => $subscription->getTrialEndsAt()->format('c'),
            'currentPeriodEndsAt' => $subscription->getCurrentPeriodEndsAt()?->format('c'),
            'amountCents' => $billing->currentAmountCents($subscription),
            'nextRenewalDate' => $billing->nextRenewalDate($subscription)?->format('c'),
            'isInvoiceable' => $billing->isInvoiceable($subscription),
        ]);
    }

    #[Route('/{id}/invoice', methods: ['GET'])]
    public function invoice(
        Subscription $subscription,
        BillingService $billing,
    ): Response {
        $this->denyAccessUnlessGranted(SubscriptionVoter::MANAGE, $subscription);

        if (!$billing->isInvoiceable($subscription)) {
            throw new UnprocessableEntityHttpException(
                sprintf('Subscription is not invoiceable (status: %s).', $subscription->status->value),
            );
        }

        return new Response(
            $billing->renderInvoice($subscription),
            Response::HTTP_OK,
            [
                'Content-Type' => 'text/html; charset=utf-8',
                'Content-Disposition' => sprintf('attachment; filename="%s"', $billing->invoiceFilename($subscription)),
            ],
        );
    }
}
