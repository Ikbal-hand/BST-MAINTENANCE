UPDATE `Invoice`
SET `status` = 'unpaid'
WHERE `status` = 'draft';

ALTER TABLE `Invoice`
ALTER COLUMN `status` SET DEFAULT 'unpaid';
