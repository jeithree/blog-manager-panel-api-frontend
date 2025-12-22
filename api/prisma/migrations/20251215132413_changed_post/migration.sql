/*
  Warnings:

  - You are about to drop the column `published` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Post` DROP COLUMN `published`,
    ADD COLUMN `outline` TEXT NULL,
    ADD COLUMN `publishedAt` DATETIME(3) NULL,
    ADD COLUMN `status` ENUM('DRAFT', 'SCHEDULED', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    MODIFY `description` VARCHAR(191) NULL,
    MODIFY `imageUrl` VARCHAR(191) NULL,
    MODIFY `content` TEXT NULL;
