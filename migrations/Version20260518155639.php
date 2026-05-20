<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260518155639 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE article_import (id UUID NOT NULL, status VARCHAR(255) NOT NULL, imported_count INT NOT NULL, skipped_count INT NOT NULL, finished_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, organization_id UUID NOT NULL, author_id UUID NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE INDEX IDX_F789599D32C8A3DE ON article_import (organization_id)');
        $this->addSql('CREATE INDEX IDX_F789599DF675F31B ON article_import (author_id)');
        $this->addSql('CREATE INDEX IDX_ARTICLE_IMPORT_ORG_STATUS ON article_import (organization_id, status)');
        $this->addSql('ALTER TABLE article_import ADD CONSTRAINT FK_F789599D32C8A3DE FOREIGN KEY (organization_id) REFERENCES organization (id) ON DELETE CASCADE NOT DEFERRABLE');
        $this->addSql('ALTER TABLE article_import ADD CONSTRAINT FK_F789599DF675F31B FOREIGN KEY (author_id) REFERENCES member (id) NOT DEFERRABLE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE article_import DROP CONSTRAINT FK_F789599D32C8A3DE');
        $this->addSql('ALTER TABLE article_import DROP CONSTRAINT FK_F789599DF675F31B');
        $this->addSql('DROP TABLE article_import');
    }
}
