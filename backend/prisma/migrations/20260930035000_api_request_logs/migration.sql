CREATE TABLE `ApiRequestLog` (
  `id` VARCHAR(191) NOT NULL,
  `requestId` VARCHAR(128) NOT NULL,
  `workspaceId` VARCHAR(191) NOT NULL,
  `method` VARCHAR(10) NOT NULL,
  `path` VARCHAR(512) NOT NULL,
  `statusCode` INTEGER NOT NULL,
  `isSuccess` BOOLEAN NOT NULL,
  `durationMs` INTEGER NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `ApiRequestLog_requestId_idx` (`requestId`),
  INDEX `ApiRequestLog_workspaceId_createdAt_idx` (`workspaceId`, `createdAt`),
  INDEX `ApiRequestLog_workspaceId_isSuccess_createdAt_idx` (`workspaceId`, `isSuccess`, `createdAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `ApiRequestLog_workspaceId_fkey`
    FOREIGN KEY (`workspaceId`) REFERENCES `Workspace` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
