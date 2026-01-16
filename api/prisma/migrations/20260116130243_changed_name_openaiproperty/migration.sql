/*
  Warnings:

  - You are about to drop the column `OpenAIApiKey` on the `Blog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Blog` DROP COLUMN `OpenAIApiKey`,
    ADD COLUMN `openAIApiKey` VARCHAR(191) NULL;
