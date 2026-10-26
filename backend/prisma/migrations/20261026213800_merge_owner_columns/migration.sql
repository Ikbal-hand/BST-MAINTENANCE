-- Set owner for all REG stores to 'PT Sumber Alfaria Trijaya Tbk.'
UPDATE `Store`
SET `ownerCompany` = 'PT Sumber Alfaria Trijaya Tbk.'
WHERE UPPER(`storeType`) = 'REG';

-- For FRC or any stores with empty ownerCompany, migrate existing ownerName if present
UPDATE `Store`
SET `ownerCompany` = TRIM(`ownerName`)
WHERE (`ownerCompany` IS NULL OR TRIM(`ownerCompany`) = '')
  AND `ownerName` IS NOT NULL
  AND TRIM(`ownerName`) != '';

-- Drop ownerName column
ALTER TABLE `Store` DROP COLUMN `ownerName`;
