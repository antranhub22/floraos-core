-- Thẻ chào mẫu hoa (greeting-card) — 11 bảng `greeting_*` + 2 cột nguồn đơn của `orders`.
--
-- IDEMPOTENT có chủ đích (06/10/2026, PO chọn "không đổi hạ tầng"): production và máy anh Tony đã có
-- các bảng này qua `prisma db push` (render.yaml). Mọi lệnh đều IF NOT EXISTS / kiểm pg_constraint nên:
--   * áp lên CSDL đã có bảng → không đổi gì, không cần `migrate resolve`;
--   * áp lên CSDL thiếu bảng → tạo đủ đúng như schema.prisma.
-- Sinh từ `prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script`, chỉ giữ phần
-- Thẻ chào. Chuỗi migration vẫn chưa dựng được CSDL từ rỗng vì lý do cũ (nợ #143) — tệp này không đổi điều đó.


ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'MANUAL';

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "source_session_id" TEXT;

CREATE TABLE IF NOT EXISTS "greeting_catalogs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'STANDARD',
    "description" TEXT,
    "filters" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "greeting_catalogs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "greeting_catalog_products" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "catalog_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "greeting_catalog_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "greeting_sessions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "catalog_id" TEXT NOT NULL,
    "send_code" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "customer_name" TEXT,
    "customer_phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "selected_product_id" TEXT,
    "product_snapshot" JSONB,
    "order_id" TEXT,
    "opened_at" TIMESTAMP(3),
    "selected_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "revoked_by" TEXT,
    "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "greeting_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "greeting_integrations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "payment_provider" TEXT,
    "payment_webhook_key_hash" TEXT,
    "payment_webhook_key_hint" TEXT,
    "payment_webhook_enabled" BOOLEAN NOT NULL DEFAULT false,
    "notify_channel" TEXT,
    "notify_enabled" BOOLEAN NOT NULL DEFAULT false,
    "notify_config_encrypted" TEXT,
    "notify_templates" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "greeting_integrations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "greeting_payment_events" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "amount_vnd" DECIMAL(14,2) NOT NULL,
    "content" TEXT NOT NULL,
    "account_no" TEXT,
    "transaction_at" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "order_id" TEXT,
    "payment_id" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "greeting_payment_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "greeting_notifications" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "event_key" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient_masked" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "provider_message_id" TEXT,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "greeting_notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "greeting_share_links" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "catalog_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "channel" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "greeting_share_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "greeting_messages" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "order_id" TEXT,
    "session_id" TEXT,
    "step_key" TEXT NOT NULL DEFAULT 'GENERAL',
    "sender_id" TEXT NOT NULL,
    "sender_role" TEXT NOT NULL,
    "to_role" TEXT,
    "to_user_id" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'MESSAGE',
    "body" TEXT NOT NULL,
    "payload" JSONB,
    "reply_to_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "greeting_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "greeting_message_reads" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "greeting_message_reads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "greeting_catalog_events" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "catalog_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "visitor_hash" TEXT NOT NULL,
    "order_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "greeting_catalog_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "greeting_journey_events" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "greeting_journey_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "orders_organization_id_source_idx" ON "orders"("organization_id", "source");

CREATE INDEX IF NOT EXISTS "greeting_catalogs_organization_id_idx" ON "greeting_catalogs"("organization_id");

CREATE UNIQUE INDEX IF NOT EXISTS "greeting_catalogs_organization_id_code_key" ON "greeting_catalogs"("organization_id", "code");

CREATE INDEX IF NOT EXISTS "greeting_catalog_products_organization_id_catalog_id_idx" ON "greeting_catalog_products"("organization_id", "catalog_id");

CREATE INDEX IF NOT EXISTS "greeting_catalog_products_product_id_idx" ON "greeting_catalog_products"("product_id");

CREATE UNIQUE INDEX IF NOT EXISTS "greeting_catalog_products_catalog_id_product_id_key" ON "greeting_catalog_products"("catalog_id", "product_id");

CREATE INDEX IF NOT EXISTS "greeting_sessions_organization_id_catalog_id_idx" ON "greeting_sessions"("organization_id", "catalog_id");

CREATE INDEX IF NOT EXISTS "greeting_sessions_organization_id_sale_id_idx" ON "greeting_sessions"("organization_id", "sale_id");

CREATE INDEX IF NOT EXISTS "greeting_sessions_send_code_idx" ON "greeting_sessions"("send_code");

CREATE UNIQUE INDEX IF NOT EXISTS "greeting_sessions_organization_id_send_code_key" ON "greeting_sessions"("organization_id", "send_code");

CREATE UNIQUE INDEX IF NOT EXISTS "greeting_integrations_organization_id_key" ON "greeting_integrations"("organization_id");

CREATE UNIQUE INDEX IF NOT EXISTS "greeting_integrations_payment_webhook_key_hash_key" ON "greeting_integrations"("payment_webhook_key_hash");

CREATE INDEX IF NOT EXISTS "greeting_integrations_organization_id_idx" ON "greeting_integrations"("organization_id");

CREATE INDEX IF NOT EXISTS "greeting_payment_events_organization_id_status_idx" ON "greeting_payment_events"("organization_id", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "greeting_payment_events_organization_id_provider_external_i_key" ON "greeting_payment_events"("organization_id", "provider", "external_id");

CREATE INDEX IF NOT EXISTS "greeting_notifications_organization_id_order_id_idx" ON "greeting_notifications"("organization_id", "order_id");

CREATE UNIQUE INDEX IF NOT EXISTS "greeting_notifications_organization_id_order_id_event_key_key" ON "greeting_notifications"("organization_id", "order_id", "event_key");

CREATE UNIQUE INDEX IF NOT EXISTS "greeting_share_links_code_key" ON "greeting_share_links"("code");

CREATE INDEX IF NOT EXISTS "greeting_share_links_organization_id_owner_id_created_at_idx" ON "greeting_share_links"("organization_id", "owner_id", "created_at");

CREATE INDEX IF NOT EXISTS "greeting_share_links_organization_id_catalog_id_idx" ON "greeting_share_links"("organization_id", "catalog_id");

CREATE INDEX IF NOT EXISTS "greeting_messages_organization_id_order_id_idx" ON "greeting_messages"("organization_id", "order_id");

CREATE INDEX IF NOT EXISTS "greeting_messages_organization_id_session_id_idx" ON "greeting_messages"("organization_id", "session_id");

CREATE INDEX IF NOT EXISTS "greeting_messages_organization_id_to_user_id_created_at_idx" ON "greeting_messages"("organization_id", "to_user_id", "created_at");

CREATE INDEX IF NOT EXISTS "greeting_messages_organization_id_to_role_created_at_idx" ON "greeting_messages"("organization_id", "to_role", "created_at");

CREATE INDEX IF NOT EXISTS "greeting_message_reads_organization_id_user_id_idx" ON "greeting_message_reads"("organization_id", "user_id");

CREATE UNIQUE INDEX IF NOT EXISTS "greeting_message_reads_message_id_user_id_key" ON "greeting_message_reads"("message_id", "user_id");

CREATE INDEX IF NOT EXISTS "greeting_catalog_events_organization_id_catalog_id_created__idx" ON "greeting_catalog_events"("organization_id", "catalog_id", "created_at");

CREATE INDEX IF NOT EXISTS "greeting_catalog_events_organization_id_channel_idx" ON "greeting_catalog_events"("organization_id", "channel");

CREATE INDEX IF NOT EXISTS "greeting_journey_events_organization_id_session_id_idx" ON "greeting_journey_events"("organization_id", "session_id");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'greeting_catalogs_organization_id_fkey') THEN
    ALTER TABLE "greeting_catalogs" ADD CONSTRAINT "greeting_catalogs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'greeting_catalog_products_organization_id_fkey') THEN
    ALTER TABLE "greeting_catalog_products" ADD CONSTRAINT "greeting_catalog_products_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'greeting_catalog_products_catalog_id_fkey') THEN
    ALTER TABLE "greeting_catalog_products" ADD CONSTRAINT "greeting_catalog_products_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "greeting_catalogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'greeting_catalog_products_product_id_fkey') THEN
    ALTER TABLE "greeting_catalog_products" ADD CONSTRAINT "greeting_catalog_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'greeting_sessions_organization_id_fkey') THEN
    ALTER TABLE "greeting_sessions" ADD CONSTRAINT "greeting_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'greeting_sessions_catalog_id_fkey') THEN
    ALTER TABLE "greeting_sessions" ADD CONSTRAINT "greeting_sessions_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "greeting_catalogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'greeting_sessions_order_id_fkey') THEN
    ALTER TABLE "greeting_sessions" ADD CONSTRAINT "greeting_sessions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'greeting_integrations_organization_id_fkey') THEN
    ALTER TABLE "greeting_integrations" ADD CONSTRAINT "greeting_integrations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'greeting_payment_events_organization_id_fkey') THEN
    ALTER TABLE "greeting_payment_events" ADD CONSTRAINT "greeting_payment_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'greeting_notifications_organization_id_fkey') THEN
    ALTER TABLE "greeting_notifications" ADD CONSTRAINT "greeting_notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'greeting_share_links_organization_id_fkey') THEN
    ALTER TABLE "greeting_share_links" ADD CONSTRAINT "greeting_share_links_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'greeting_share_links_catalog_id_fkey') THEN
    ALTER TABLE "greeting_share_links" ADD CONSTRAINT "greeting_share_links_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "greeting_catalogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'greeting_messages_organization_id_fkey') THEN
    ALTER TABLE "greeting_messages" ADD CONSTRAINT "greeting_messages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'greeting_message_reads_organization_id_fkey') THEN
    ALTER TABLE "greeting_message_reads" ADD CONSTRAINT "greeting_message_reads_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'greeting_message_reads_message_id_fkey') THEN
    ALTER TABLE "greeting_message_reads" ADD CONSTRAINT "greeting_message_reads_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "greeting_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'greeting_catalog_events_organization_id_fkey') THEN
    ALTER TABLE "greeting_catalog_events" ADD CONSTRAINT "greeting_catalog_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'greeting_catalog_events_catalog_id_fkey') THEN
    ALTER TABLE "greeting_catalog_events" ADD CONSTRAINT "greeting_catalog_events_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "greeting_catalogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'greeting_journey_events_organization_id_fkey') THEN
    ALTER TABLE "greeting_journey_events" ADD CONSTRAINT "greeting_journey_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'greeting_journey_events_session_id_fkey') THEN
    ALTER TABLE "greeting_journey_events" ADD CONSTRAINT "greeting_journey_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "greeting_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
