-- Track failed verification/reset attempts per code for brute-force protection.
ALTER TABLE "email_verification_codes" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "password_reset_codes" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
