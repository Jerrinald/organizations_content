<?php

namespace App\Entity;

use App\Doctrine\TenantScoped;
use App\Entity\Trait\TimestampableTrait;
use App\Enum\ArticleImportStatus;
use App\Repository\ArticleImportRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity(repositoryClass: ArticleImportRepository::class)]
#[ORM\Table(name: 'article_import')]
#[ORM\Index(name: 'IDX_ARTICLE_IMPORT_ORG_STATUS', fields: ['organization', 'status'])]
#[ORM\HasLifecycleCallbacks]
class ArticleImport implements TenantScoped
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $id;

    #[ORM\ManyToOne(targetEntity: Organization::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Organization $organization;

    #[ORM\ManyToOne(targetEntity: Member::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Member $author;

    #[ORM\Column(enumType: ArticleImportStatus::class)]
    public ArticleImportStatus $status = ArticleImportStatus::Queued {
        set(ArticleImportStatus $next) {
            $this->status = $next;
            if ($next->isTerminal() && $this->finishedAt === null) {
                $this->finishedAt = new \DateTimeImmutable();
            }
        }
    }

    #[ORM\Column(type: 'integer')]
    private int $importedCount = 0;

    #[ORM\Column(type: 'integer')]
    private int $skippedCount = 0;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $finishedAt = null;

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

    public function getAuthor(): Member
    {
        return $this->author;
    }

    public function setAuthor(Member $author): static
    {
        $this->author = $author;

        return $this;
    }

    public function getStatus(): ArticleImportStatus
    {
        return $this->status;
    }

    public function getImportedCount(): int
    {
        return $this->importedCount;
    }

    public function setImportedCount(int $importedCount): static
    {
        $this->importedCount = $importedCount;

        return $this;
    }

    public function getSkippedCount(): int
    {
        return $this->skippedCount;
    }

    public function setSkippedCount(int $skippedCount): static
    {
        $this->skippedCount = $skippedCount;

        return $this;
    }

    public function getFinishedAt(): ?\DateTimeImmutable
    {
        return $this->finishedAt;
    }
}
