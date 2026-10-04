CREATE TABLE `Sparepart` (
    `id` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Sparepart_workspaceId_name_key`(`workspaceId`, `name`),
    INDEX `Sparepart_workspaceId_name_idx`(`workspaceId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Sparepart`
ADD CONSTRAINT `Sparepart_workspaceId_fkey`
FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;
