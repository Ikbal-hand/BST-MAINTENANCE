CREATE TABLE `WorkspaceSettings` (
    `id` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NOT NULL,
    `logoDataUrl` LONGTEXT NULL,
    `signerName` VARCHAR(191) NOT NULL DEFAULT 'Muhamad Zidan Fauzan',
    `bankAccount` VARCHAR(191) NOT NULL DEFAULT '0548985555',
    `bankName` VARCHAR(191) NOT NULL DEFAULT 'BCA',
    `bankAccountName` VARCHAR(191) NOT NULL DEFAULT 'BERKARYA SATU TUJUAN CV',
    `signatureDataUrl` LONGTEXT NULL,
    `primaryColor` VARCHAR(191) NOT NULL DEFAULT '#1C6B4B',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WorkspaceSettings_workspaceId_key`(`workspaceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `WorkspaceSettings`
    ADD CONSTRAINT `WorkspaceSettings_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
