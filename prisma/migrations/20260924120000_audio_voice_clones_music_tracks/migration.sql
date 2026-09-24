-- Khu vực C (24/09/2026): giọng nhân bản của tiệm + nhạc nền tiệm tự tải.
-- Hai bảng TENANT mới, không đụng dữ liệu cũ. Áp bằng `npx prisma migrate deploy`;
-- nếu lịch sử lệch (nợ #97/#104) thì áp tay bằng psql rồi:
--   npx prisma migrate resolve --applied 20260924120000_audio_voice_clones_music_tracks

CREATE TABLE "voice_clones" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'elevenlabs',
    "provider_voice_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sample_storage_key" TEXT NOT NULL,
    "sample_mime_type" TEXT NOT NULL,
    "sample_bytes" INTEGER NOT NULL,
    "consent_text" TEXT NOT NULL,
    "consented_by" TEXT NOT NULL,
    "consented_at" TIMESTAMP(3) NOT NULL,
    "job_id" TEXT,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "voice_clones_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "voice_clones_organization_id_status_idx" ON "voice_clones"("organization_id", "status");
ALTER TABLE "voice_clones" ADD CONSTRAINT "voice_clones_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "music_tracks" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mood" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_bytes" INTEGER NOT NULL,
    "duration_seconds" DOUBLE PRECISION,
    "license_type" TEXT NOT NULL,
    "license_source" TEXT NOT NULL,
    "license_note" TEXT,
    "attested_by" TEXT NOT NULL,
    "attested_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "music_tracks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "music_tracks_organization_id_mood_idx" ON "music_tracks"("organization_id", "mood");
ALTER TABLE "music_tracks" ADD CONSTRAINT "music_tracks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
