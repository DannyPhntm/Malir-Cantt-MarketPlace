-- AlterTable: listings gains subcategory + posting_type
ALTER TABLE "listings" ADD COLUMN "subcategory" TEXT;
ALTER TABLE "listings" ADD COLUMN "posting_type" TEXT NOT NULL DEFAULT 'personal';

-- RedefineTable: business_accounts — drop `approved`, add business_type + seller_status,
-- change payment_status default. SQLite requires a table rebuild.
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_business_accounts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "business_name" TEXT NOT NULL,
    "business_type" TEXT,
    "seller_status" TEXT NOT NULL DEFAULT 'not_applied',
    "payment_status" TEXT NOT NULL DEFAULT 'payment_required',
    CONSTRAINT "business_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_business_accounts" ("id", "user_id", "business_name", "payment_status")
    SELECT "id", "user_id", "business_name", "payment_status" FROM "business_accounts";
DROP TABLE "business_accounts";
ALTER TABLE "new_business_accounts" RENAME TO "business_accounts";
CREATE UNIQUE INDEX "business_accounts_user_id_key" ON "business_accounts"("user_id");
PRAGMA foreign_keys=ON;
