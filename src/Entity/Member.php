<?php

namespace App\Entity;

use App\Doctrine\TenantScoped;
use App\Entity\Trait\TimestampableTrait;
use App\Enum\MemberRole;
use App\Repository\MemberRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity(repositoryClass: MemberRepository::class)]
#[ORM\Table(name: 'member')]
#[ORM\UniqueConstraint(name: 'UNIQ_MEMBER_ORG_USER', fields: ['organization', 'user'])]
#[ORM\HasLifecycleCallbacks]
class Member implements TenantScoped
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $id;

    #[ORM\ManyToOne(targetEntity: Organization::class, inversedBy: 'members')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Organization $organization;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\Column(enumType: MemberRole::class)]
    private MemberRole $role;

    #[ORM\Column]
    private \DateTimeImmutable $invitedAt;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $joinedAt = null;

    public function __construct()
    {
        $this->id = new UuidV7();
        $this->invitedAt = new \DateTimeImmutable();
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

    public function getUser(): User
    {
        return $this->user;
    }

    public function setUser(User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getRole(): MemberRole
    {
        return $this->role;
    }

    public function setRole(MemberRole $role): static
    {
        $this->role = $role;

        return $this;
    }

    public function getInvitedAt(): \DateTimeImmutable
    {
        return $this->invitedAt;
    }

    public function getJoinedAt(): ?\DateTimeImmutable
    {
        return $this->joinedAt;
    }

    public function markJoined(): static
    {
        $this->joinedAt = new \DateTimeImmutable();

        return $this;
    }
}
