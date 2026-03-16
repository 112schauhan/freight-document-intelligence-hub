-- CreateIndex
CREATE INDEX "Document_orgId_uploadTimestamp_idx" ON "Document"("orgId", "uploadTimestamp");

-- CreateIndex
CREATE INDEX "Document_orgId_fingerprint_idx" ON "Document"("orgId", "fingerprint");
