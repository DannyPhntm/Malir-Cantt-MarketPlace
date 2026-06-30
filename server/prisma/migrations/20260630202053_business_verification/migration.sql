-- Business authenticity verification (beta). Additive only — all columns are
-- nullable, so this is a non-destructive change safe to apply to existing data.

-- AlterTable
ALTER TABLE "business_accounts" ADD COLUMN     "business_address" TEXT,
ADD COLUMN     "business_phone" TEXT,
ADD COLUMN     "verification_doc_url" TEXT,
ADD COLUMN     "verification_doc_public_id" TEXT,
ADD COLUMN     "verification_doc_label" TEXT,
ADD COLUMN     "cnic_doc_url" TEXT,
ADD COLUMN     "cnic_doc_public_id" TEXT,
ADD COLUMN     "ntn_number" TEXT;
