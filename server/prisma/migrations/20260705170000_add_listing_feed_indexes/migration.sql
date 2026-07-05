-- Composite indexes for the hot listing read paths.
-- Additive only: no data change, no column/table change.
--   * (status, created_at) → public feed: WHERE status='approved' ORDER BY created_at DESC
--   * (category, status)   → category browsing
CREATE INDEX "listings_status_created_at_idx" ON "listings"("status", "created_at");
CREATE INDEX "listings_category_status_idx" ON "listings"("category", "status");
