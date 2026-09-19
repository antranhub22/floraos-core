-- AlterTable
ALTER TABLE "generation_jobs" ADD COLUMN     "job_group_id" TEXT;

-- CreateIndex
CREATE INDEX "generation_jobs_organization_id_job_group_id_idx" ON "generation_jobs"("organization_id", "job_group_id");
