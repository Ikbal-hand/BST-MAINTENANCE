DROP INDEX `User_email_key` ON `User`;

CREATE UNIQUE INDEX `User_workspaceId_email_key` ON `User`(`workspaceId`, `email`);
