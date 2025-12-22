/*
  Warnings:

  - Made the column `netlifySiteId` on table `Blog` required. This step will fail if there are existing NULL values in that column.
  - Made the column `R2BucketName` on table `Blog` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Blog` MODIFY `netlifySiteId` VARCHAR(191) NOT NULL,
    MODIFY `R2BucketName` VARCHAR(191) NOT NULL;
