-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `avatar` VARCHAR(191) NULL,
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Blog` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `domain` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `netlifySiteId` VARCHAR(191) NOT NULL,
    `R2BucketName` VARCHAR(191) NOT NULL,
    `R2CustomDomain` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `apiKey` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Blog_title_key`(`title`),
    UNIQUE INDEX `Blog_domain_key`(`domain`),
    UNIQUE INDEX `Blog_apiKey_key`(`apiKey`),
    INDEX `Blog_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Prompt` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `blogId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Prompt_blogId_idx`(`blogId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `blogId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Category_blogId_idx`(`blogId`),
    UNIQUE INDEX `Category_name_blogId_key`(`name`, `blogId`),
    UNIQUE INDEX `Category_slug_blogId_key`(`slug`, `blogId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tag` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `blogId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Tag_blogId_idx`(`blogId`),
    UNIQUE INDEX `Tag_name_blogId_key`(`name`, `blogId`),
    UNIQUE INDEX `Tag_slug_blogId_key`(`slug`, `blogId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Author` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `bio` VARCHAR(191) NULL,
    `avatar` VARCHAR(191) NULL,
    `blogId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Author_blogId_idx`(`blogId`),
    UNIQUE INDEX `Author_name_blogId_key`(`name`, `blogId`),
    UNIQUE INDEX `Author_slug_blogId_key`(`slug`, `blogId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Post` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `outline` TEXT NULL,
    `content` TEXT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `blogId` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'SCHEDULED', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Post_blogId_idx`(`blogId`),
    INDEX `Post_categoryId_idx`(`categoryId`),
    INDEX `Post_authorId_idx`(`authorId`),
    UNIQUE INDEX `Post_slug_blogId_key`(`slug`, `blogId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BlogMember` (
    `id` VARCHAR(191) NOT NULL,
    `blogId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'EDITOR') NOT NULL DEFAULT 'EDITOR',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BlogMember_blogId_idx`(`blogId`),
    INDEX `BlogMember_userId_idx`(`userId`),
    UNIQUE INDEX `BlogMember_blogId_userId_key`(`blogId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_PostToTag` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_PostToTag_AB_unique`(`A`, `B`),
    INDEX `_PostToTag_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Blog` ADD CONSTRAINT `Blog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_blogId_fkey` FOREIGN KEY (`blogId`) REFERENCES `Blog`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Category` ADD CONSTRAINT `Category_blogId_fkey` FOREIGN KEY (`blogId`) REFERENCES `Blog`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tag` ADD CONSTRAINT `Tag_blogId_fkey` FOREIGN KEY (`blogId`) REFERENCES `Blog`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Author` ADD CONSTRAINT `Author_blogId_fkey` FOREIGN KEY (`blogId`) REFERENCES `Blog`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `Author`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_blogId_fkey` FOREIGN KEY (`blogId`) REFERENCES `Blog`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BlogMember` ADD CONSTRAINT `BlogMember_blogId_fkey` FOREIGN KEY (`blogId`) REFERENCES `Blog`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BlogMember` ADD CONSTRAINT `BlogMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_PostToTag` ADD CONSTRAINT `_PostToTag_A_fkey` FOREIGN KEY (`A`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_PostToTag` ADD CONSTRAINT `_PostToTag_B_fkey` FOREIGN KEY (`B`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
