-- CreateTable
CREATE TABLE `InvoiceBap` (
    `invoiceId` VARCHAR(191) NOT NULL,
    `bapId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InvoiceBap_bapId_idx`(`bapId`),
    PRIMARY KEY (`invoiceId`, `bapId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Backfill the join relation for invoices created with the legacy bapId column.
INSERT INTO `InvoiceBap` (`invoiceId`, `bapId`)
SELECT `id`, `bapId`
FROM `Invoice`
WHERE `bapId` IS NOT NULL;

-- AddForeignKey
ALTER TABLE `InvoiceBap` ADD CONSTRAINT `InvoiceBap_invoiceId_fkey`
  FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvoiceBap` ADD CONSTRAINT `InvoiceBap_bapId_fkey`
  FOREIGN KEY (`bapId`) REFERENCES `Bap`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
