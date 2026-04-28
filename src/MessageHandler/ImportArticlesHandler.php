<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Dto\Streaming\ImportedArticleInput;
use App\Entity\Article;
use App\Message\ImportArticlesMessage;
use App\Repository\MemberRepository;
use App\Repository\OrganizationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\JsonStreamer\StreamReaderInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\Messenger\Exception\UnrecoverableMessageHandlingException;
use Symfony\Component\TypeInfo\Type;

#[AsMessageHandler]
final readonly class ImportArticlesHandler
{
    private const BATCH_SIZE = 100;

    public function __construct(
        private OrganizationRepository $organizationRepository,
        private MemberRepository $memberRepository,
        private EntityManagerInterface $em,
        private StreamReaderInterface $jsonStreamReader,
        private LoggerInterface $logger,
    ) {
    }

    public function __invoke(ImportArticlesMessage $message): void
    {
        $organization = $this->organizationRepository->find($message->organizationId)
            ?? throw new UnrecoverableMessageHandlingException(
                sprintf('Organization %s no longer exists.', $message->organizationId),
            );

        $author = $this->memberRepository->find($message->authorMemberId)
            ?? throw new UnrecoverableMessageHandlingException(
                sprintf('Author member %s no longer exists.', $message->authorMemberId),
            );

        $stream = @fopen($message->filePath, 'r');
        if ($stream === false) {
            throw new UnrecoverableMessageHandlingException(
                sprintf('Cannot open import file: %s', $message->filePath),
            );
        }

        $imported = 0;
        $skipped = 0;
        $startedAt = microtime(true);

        try {
            $type = Type::list(Type::object(ImportedArticleInput::class));

            /** @var iterable<ImportedArticleInput> $items */
            $items = $this->jsonStreamReader->read($stream, $type);

            foreach ($items as $index => $item) {
                if ($item->title === '' || $item->content === '') {
                    $this->logger->warning('Skipping invalid article during import', [
                        'importId' => (string) $message->importId,
                        'index' => $index,
                        'reason' => 'empty title or content',
                    ]);
                    ++$skipped;
                    continue;
                }

                $article = (new Article())
                    ->setOrganization($organization)
                    ->setAuthor($author)
                    ->setContent($item->content);
                $article->title = $item->title;
                if ($item->slug !== null && $item->slug !== '') {
                    $article->setSlug($item->slug);
                }

                $this->em->persist($article);
                ++$imported;

                if ($imported % self::BATCH_SIZE === 0) {
                    $this->em->flush();
                    $this->em->clear();
                    $organization = $this->organizationRepository->find($message->organizationId);
                    $author = $this->memberRepository->find($message->authorMemberId);
                }
            }

            $this->em->flush();
        } finally {
            if (\is_resource($stream)) {
                fclose($stream);
            }
            @unlink($message->filePath);
        }

        $this->logger->info('Articles import finished', [
            'importId' => (string) $message->importId,
            'organizationId' => (string) $message->organizationId,
            'imported' => $imported,
            'skipped' => $skipped,
            'durationMs' => (int) ((microtime(true) - $startedAt) * 1000),
        ]);
    }
}
