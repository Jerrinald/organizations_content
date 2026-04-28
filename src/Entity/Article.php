<?php

namespace App\Entity;

use App\Doctrine\TenantScoped;
use App\Entity\Trait\TimestampableTrait;
use App\Enum\ArticleStatus;
use App\Repository\ArticleRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\String\Slugger\AsciiSlugger;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity(repositoryClass: ArticleRepository::class)]
#[ORM\Table(name: 'article')]
#[ORM\UniqueConstraint(name: 'UNIQ_ARTICLE_ORG_SLUG', fields: ['organization', 'slug'])]
#[ORM\Index(name: 'IDX_ARTICLE_ORG_STATUS', fields: ['organization', 'status'])]
#[ORM\HasLifecycleCallbacks]
class Article implements TenantScoped
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

    #[ORM\Column(length: 255)]
    public string $title {
        set(string $value) {
            $this->title = $value;
            if (!isset($this->slug) || $this->slug === '') {
                $this->slug = self::slugify($value);
            }
        }
    }

    #[ORM\Column(length: 255)]
    private string $slug;

    #[ORM\Column(type: 'text')]
    private string $content;

    #[ORM\Column(enumType: ArticleStatus::class)]
    public ArticleStatus $status = ArticleStatus::Draft {
        set(ArticleStatus $next) {
            if (isset($this->status) && !$this->status->canTransitionTo($next)) {
                throw new \DomainException(
                    sprintf('Transition invalide : %s → %s', $this->status->value, $next->value),
                );
            }
            $this->status = $next;
            if ($next === ArticleStatus::Published && $this->publishedAt === null) {
                $this->publishedAt = new \DateTimeImmutable();
            }
        }
    }

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $publishedAt = null;

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

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getSlug(): string
    {
        return $this->slug;
    }

    public function setSlug(string $slug): static
    {
        $this->slug = $slug;

        return $this;
    }

    public function getContent(): string
    {
        return $this->content;
    }

    public function setContent(string $content): static
    {
        $this->content = $content;

        return $this;
    }

    public function getStatus(): ArticleStatus
    {
        return $this->status;
    }

    public function getPublishedAt(): ?\DateTimeImmutable
    {
        return $this->publishedAt;
    }

    public function setPublishedAt(?\DateTimeImmutable $publishedAt): static
    {
        $this->publishedAt = $publishedAt;

        return $this;
    }

    private static function slugify(string $title): string
    {
        return (new AsciiSlugger())->slug($title)->lower()->toString();
    }
}
