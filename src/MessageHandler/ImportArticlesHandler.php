<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Dto\Streaming\ImportedArticleInput;
use App\Entity\Article;
use App\Enum\ArticleImportStatus;
use App\Message\ImportArticlesMessage;
use App\Repository\ArticleImportRepository;
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
        private ArticleImportRepository $articleImportRepository,
        private EntityManagerInterface $em,
        private StreamReaderInterface $jsonStreamReader,
        private LoggerInterface $logger,
    ) {
    }

    public function __invoke(ImportArticlesMessage $message): void
    {
        $import = $this->articleImportRepository->find($message->importId)
            ?? throw new UnrecoverableMessageHandlingException(
                sprintf('ArticleImport %s no longer exists.', $message->importId),
            );

        $organization = $this->organizationRepository->find($message->organizationId)
            ?? throw new UnrecoverableMessageHandlingException(
                sprintf('Organization %s no longer exists.', $message->organizationId),
            );

        $author = $this->memberRepository->find($message->authorMemberId)
            ?? throw new UnrecoverableMessageHandlingException(
                sprintf('Author member %s no longer exists.', $message->authorMemberId),
            );

        $import->status = ArticleImportStatus::Processing;
        $this->em->flush();

        $stream = @fopen($message->filePath, 'r');
        if ($stream === false) {
            $import->status = ArticleImportStatus::Failed;
            $this->em->flush();

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
                    $import->setImportedCount($imported);
                    $import->setSkippedCount($skipped);
                    $this->em->flush();
                }
            }

            $import->setImportedCount($imported);
            $import->setSkippedCount($skipped);
            $import->status = ArticleImportStatus::Success;
            $this->em->flush();
        } catch (\Throwable $e) {
            $import->setImportedCount($imported);
            $import->setSkippedCount($skipped);
            $import->status = ArticleImportStatus::Failed;
            try {
                $this->em->flush();
            } catch (\Throwable $flushError) {
                $this->logger->error('Could not persist failed import status', [
                    'importId' => (string) $message->importId,
                    'error' => $flushError->getMessage(),
                ]);
            }

            throw $e;
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
