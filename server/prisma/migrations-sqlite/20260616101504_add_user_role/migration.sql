-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "cantt_pass_number" TEXT,
    "resident_location" TEXT NOT NULL,
    "account_type" TEXT NOT NULL DEFAULT 'personal',
    "role" TEXT NOT NULL DEFAULT 'user',
    "business_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_users" ("account_type", "business_verified", "cantt_pass_number", "created_at", "email", "email_verified", "id", "name", "password_hash", "phone", "resident_location") SELECT "account_type", "business_verified", "cantt_pass_number", "created_at", "email", "email_verified", "id", "name", "password_hash", "phone", "resident_location" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
