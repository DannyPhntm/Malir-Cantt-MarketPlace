-- Additive: admin note / rejection reason on business accounts (nullable).
ALTER TABLE "business_accounts" ADD COLUMN     "admin_notes" TEXT;
