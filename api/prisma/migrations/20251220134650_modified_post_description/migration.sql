/*
  Warnings:

  - Made the column `R2CustomDomain` on table `Blog` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Blog` MODIFY `R2CustomDomain` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Post` MODIFY `description` TEXT NULL;
