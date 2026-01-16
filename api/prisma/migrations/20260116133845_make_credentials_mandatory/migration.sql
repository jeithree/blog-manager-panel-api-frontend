/*
  Warnings:

  - Made the column `R2AccessKeyId` on table `Blog` required. This step will fail if there are existing NULL values in that column.
  - Made the column `R2AccountId` on table `Blog` required. This step will fail if there are existing NULL values in that column.
  - Made the column `R2SecretAccessKey` on table `Blog` required. This step will fail if there are existing NULL values in that column.
  - Made the column `netlifyToken` on table `Blog` required. This step will fail if there are existing NULL values in that column.
  - Made the column `openAIApiKey` on table `Blog` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Blog` MODIFY `R2AccessKeyId` VARCHAR(191) NOT NULL,
    MODIFY `R2AccountId` VARCHAR(191) NOT NULL,
    MODIFY `R2SecretAccessKey` VARCHAR(191) NOT NULL,
    MODIFY `netlifyToken` VARCHAR(191) NOT NULL,
    MODIFY `openAIApiKey` VARCHAR(191) NOT NULL;
