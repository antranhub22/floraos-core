-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "organization_type" AS ENUM ('EXPERIENCE', 'SINGLE', 'CHAIN');

-- CreateEnum
CREATE TYPE "workspace_kind" AS ENUM ('EXPERIENCE', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "membership_status" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "trial_status" AS ENUM ('ACTIVE', 'EXHAUSTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "capability_scope" AS ENUM ('ORGANIZATION', 'BRANCH');

-- CreateEnum
CREATE TYPE "ai_mode" AS ENUM ('API', 'SELF_HOST', 'DETERMINISTIC');

-- CreateEnum
CREATE TYPE "ai_privacy_level" AS ENUM ('PUBLIC', 'SHOP', 'SENSITIVE');

-- CreateEnum
CREATE TYPE "ai_measure_state" AS ENUM ('CHUA_DO', 'THU_NGHIEM', 'SAN_XUAT');

-- CreateEnum
CREATE TYPE "asset_kind" AS ENUM ('ORIGINAL', 'ANALYZED', 'ENHANCED', 'MASTER', 'MARKETING', 'CATALOG', 'LANDING', 'SOCIAL', 'VIDEO', 'RATIO');

-- CreateEnum
CREATE TYPE "asset_state" AS ENUM ('PROCESSING', 'READY', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "job_status" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "product_status" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "approval_state" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "integration_client" AS ENUM ('LOCALBUDD', 'SOCIALFLOW');

-- CreateEnum
CREATE TYPE "video_format" AS ENUM ('REEL_15S', 'TIKTOK_30S', 'STORY_15S', 'SLIDESHOW', 'PRODUCT_PAGE', 'AD_MOTION');

-- CreateEnum
CREATE TYPE "video_stage" AS ENUM ('DRAFT', 'SCRIPT_GENERATING', 'SCRIPT_READY', 'SCRIPT_APPROVED', 'RENDERING', 'RENDER_COMPLETED', 'APPROVED', 'REJECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('DRAFT', 'CONFIRMED', 'PROCESSING', 'DELIVERED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "production_status" AS ENUM ('WAITING', 'ASSIGNED', 'ARRANGING', 'QUALITY_CHECK', 'READY');

-- CreateEnum
CREATE TYPE "delivery_status" AS ENUM ('PENDING', 'DISPATCHED', 'DELIVERING', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "customer_tier" AS ENUM ('NEW', 'BRONZE', 'SILVER', 'GOLD', 'VIP');

-- CreateEnum
CREATE TYPE "consent_channel" AS ENUM ('ZALO_ZNS', 'SMS', 'PHONE_CALL', 'PROMOTION');

-- CreateEnum
CREATE TYPE "voucher_discount_type" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "chat_channel" AS ENUM ('WEB_WIDGET', 'INTERNAL_DASHBOARD', 'STOREFRONT_CATALOG', 'LANDING_PAGE', 'FACEBOOK_MESSENGER', 'ZALO_OA', 'EMBEDDED_WIDGET', 'ZALO');

-- CreateEnum
CREATE TYPE "chat_sender_type" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "name" TEXT,
    "avatar_url" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'vi',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "organization_type" NOT NULL DEFAULT 'SINGLE',
    "credit_balance" INTEGER NOT NULL DEFAULT 0,
    "credit_plan" TEXT,
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "workspace_kind" NOT NULL DEFAULT 'PRODUCTION',
    "trial_count" INTEGER NOT NULL DEFAULT 0,
    "trial_limit" INTEGER,
    "trial_reset_at" TIMESTAMP(3),
    "trial_status" "trial_status",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_capabilities" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "capability_code" TEXT NOT NULL,
    "scope" "capability_scope" NOT NULL DEFAULT 'ORGANIZATION',

    CONSTRAINT "role_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capability_overrides" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "capability_code" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL,
    "updated_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capability_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "status" "membership_status" NOT NULL DEFAULT 'INVITED',
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joined_at" TIMESTAMP(3),

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "product_id" TEXT,
    "parent_asset_id" TEXT,
    "kind" "asset_kind" NOT NULL,
    "state" "asset_state" NOT NULL DEFAULT 'PROCESSING',
    "version" INTEGER NOT NULL DEFAULT 1,
    "storage_key" TEXT NOT NULL,
    "thumb_key" TEXT,
    "mime_type" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "aspect_ratio" TEXT,
    "file_size" INTEGER,
    "provider" TEXT,
    "model" TEXT,
    "model_version" TEXT,
    "pipeline_version" TEXT,
    "parameters" JSONB,
    "prompt" TEXT,
    "input_sha256" TEXT,
    "output_sha256" TEXT,
    "quality_score" DOUBLE PRECISION,
    "identity_score" DOUBLE PRECISION,
    "generated_flags" JSONB,
    "cost_usd" DOUBLE PRECISION,
    "approval_state" "approval_state" NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generation_jobs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT,
    "feature" TEXT NOT NULL,
    "status" "job_status" NOT NULL DEFAULT 'PENDING',
    "stage" TEXT,
    "result" TEXT,
    "idempotency_key" TEXT,
    "payload" JSONB NOT NULL,
    "output" JSONB,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),

    CONSTRAINT "generation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_events" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "job_id" TEXT,
    "feature" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "cost_credit" INTEGER NOT NULL DEFAULT 0,
    "cost_usd" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_profiles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "legal_name" TEXT,
    "display_name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "website" TEXT,
    "social_links" JSONB,
    "tax_code" TEXT,
    "description" TEXT,
    "operating_hours" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_profiles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "primary_color" TEXT,
    "secondary_color" TEXT,
    "accent_color" TEXT,
    "background_color" TEXT,
    "text_color" TEXT,
    "font_heading" TEXT,
    "font_body" TEXT,
    "logo_asset_id" TEXT,
    "tone_of_voice" TEXT,
    "hashtags" JSONB,
    "cta_templates" JSONB,
    "forbidden_styles" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "shape" TEXT,
    "facing" TEXT,
    "container" TEXT,
    "status" "product_status" NOT NULL DEFAULT 'DRAFT',
    "attributes" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" TEXT,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "attributes" JSONB,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_analyses" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "product_id" TEXT,
    "asset_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "model_version" TEXT NOT NULL,
    "contract_name" TEXT NOT NULL,
    "contract_version" TEXT NOT NULL,
    "raw" JSONB NOT NULL,
    "edited" JSONB,
    "approval_state" "approval_state" NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_rules" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_tokens" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "client" "integration_client" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "rotated_from_id" TEXT,

    CONSTRAINT "integration_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_metrics" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "metric_date" DATE NOT NULL,
    "reach" INTEGER,
    "impressions" INTEGER,
    "engagement" INTEGER,
    "clicks" INTEGER,
    "conversions" INTEGER,
    "spend_usd" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_capabilities" (
    "code" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "needs_approval" BOOLEAN NOT NULL DEFAULT true,
    "privacy_floor" "ai_privacy_level" NOT NULL DEFAULT 'SHOP',
    "accept_threshold" DOUBLE PRECISION,
    "measure_channels" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_capabilities_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "ai_models" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "mode" "ai_mode" NOT NULL,
    "capabilities" JSONB NOT NULL,
    "license" TEXT NOT NULL,
    "commercial_use" BOOLEAN NOT NULL,
    "territory" TEXT NOT NULL,
    "allowed_use" TEXT NOT NULL,
    "cost_class" TEXT NOT NULL,
    "latency_class" TEXT NOT NULL,
    "quality_class" TEXT NOT NULL,
    "measure_state" "ai_measure_state" NOT NULL DEFAULT 'CHUA_DO',
    "leaves_infra" BOOLEAN NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "version" TEXT NOT NULL,
    "registered_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_policies" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "capability_code" TEXT NOT NULL,
    "allowed_models" JSONB NOT NULL,
    "quality_target" TEXT,
    "cost_ceiling" INTEGER,
    "privacy_floor" "ai_privacy_level" NOT NULL,
    "updated_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_requests" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "job_id" TEXT,
    "capability_code" TEXT NOT NULL,
    "model_key" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "escalated_from" TEXT,
    "fallback_from" TEXT,
    "source" TEXT NOT NULL,
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "image_count" INTEGER,
    "duration_seconds" DOUBLE PRECISION,
    "gpu_seconds" DOUBLE PRECISION,
    "cost_usd" DOUBLE PRECISION,
    "latency_ms" INTEGER,
    "quality_score" DOUBLE PRECISION,
    "outcome" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_evaluations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "capability_code" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "scores" JSONB NOT NULL,
    "overall_score" DOUBLE PRECISION NOT NULL,
    "threshold_used" DOUBLE PRECISION,
    "needs_review" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occasions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "occasions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_links" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filters" JSONB,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "revoked_at" TIMESTAMP(3),
    "revoked_by" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_copies" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "product_id" TEXT,
    "raw" JSONB NOT NULL,
    "edited" JSONB,
    "approval_state" "approval_state" NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "profile_version" TEXT,
    "reject_reason" TEXT,
    "job_id" TEXT,
    "model_key" TEXT,
    "provider" TEXT,
    "cost_usd" DOUBLE PRECISION,
    "latency_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_copies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_jobs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "product_id" TEXT,
    "title" TEXT NOT NULL,
    "format" "video_format" NOT NULL,
    "stage" "video_stage" NOT NULL DEFAULT 'DRAFT',
    "script_approval" "approval_state" NOT NULL DEFAULT 'PENDING',
    "script_approved_at" TIMESTAMP(3),
    "script_approved_by" TEXT,
    "video_approval" "approval_state" NOT NULL DEFAULT 'PENDING',
    "video_approved_at" TIMESTAMP(3),
    "video_approved_by" TEXT,
    "duration_seconds" INTEGER NOT NULL DEFAULT 15,
    "aspect_ratio" TEXT NOT NULL DEFAULT '9:16',
    "music_track" TEXT,
    "voice_code" TEXT,
    "has_subtitle" BOOLEAN NOT NULL DEFAULT true,
    "caption_style" TEXT NOT NULL DEFAULT 'MODERN_BADGE',
    "has_watermark" BOOLEAN NOT NULL DEFAULT false,
    "final_video_url" TEXT,
    "final_asset_id" TEXT,
    "cost_credits" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_scenes" (
    "id" TEXT NOT NULL,
    "video_job_id" TEXT NOT NULL,
    "scene_index" INTEGER NOT NULL,
    "duration_seconds" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "image_asset_id" TEXT,
    "text_overlay" TEXT,
    "voice_script" TEXT,
    "transition_effect" TEXT DEFAULT 'fade',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_scenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "code" TEXT NOT NULL,
    "customer_id" TEXT,
    "status" "order_status" NOT NULL DEFAULT 'DRAFT',
    "production_status" "production_status" NOT NULL DEFAULT 'WAITING',
    "delivery_status" "delivery_status" NOT NULL DEFAULT 'PENDING',
    "total_vnd" DECIMAL(14,2) NOT NULL,
    "pricing_rule_ref" JSONB,
    "voucher_id" TEXT,
    "card_message" TEXT,
    "internal_note" TEXT,
    "delivery_window" JSONB,
    "delivery_address" JSONB,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT,
    "variant_id" TEXT,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price_vnd" DECIMAL(14,2) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_assignments" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "assignee_id" TEXT NOT NULL,
    "assigned_by" TEXT NOT NULL,
    "difficulty" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "released_at" TIMESTAMP(3),

    CONSTRAINT "order_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_events" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "axis" TEXT NOT NULL,
    "from_value" TEXT,
    "to_value" TEXT NOT NULL,
    "actor_id" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "tier" "customer_tier" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferred_flowers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferred_colors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "total_spent" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "order_count" INTEGER NOT NULL DEFAULT 0,
    "last_order_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_occasions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "is_recurring" BOOLEAN NOT NULL DEFAULT true,
    "reminder_days_before" INTEGER NOT NULL DEFAULT 7,
    "recipient_name" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_occasions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_consents" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "channel" "consent_channel" NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vouchers" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "code" TEXT NOT NULL,
    "discount_type" "voucher_discount_type" NOT NULL DEFAULT 'PERCENTAGE',
    "discount_value" DECIMAL(14,2) NOT NULL,
    "min_order_vnd" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "max_discount_vnd" DECIMAL(14,2),
    "expires_at" TIMESTAMP(3),
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" TIMESTAMP(3),
    "order_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_conversations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "title" TEXT NOT NULL DEFAULT 'Hội thoại tư vấn hoa',
    "channel" "chat_channel" NOT NULL DEFAULT 'WEB_WIDGET',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_type" "chat_sender_type" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_channel_integrations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "channel" "chat_channel" NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL DEFAULT '{}',
    "subscription_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_channel_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flower_taxonomy" (
    "ma_loai" TEXT NOT NULL,
    "nhom" TEXT NOT NULL,
    "cong_nang" TEXT,
    "ten_chuan" TEXT NOT NULL,
    "ten_khac" JSONB NOT NULL,
    "nhom_hoa" TEXT,
    "dvt_chuan" TEXT,
    "so_bong_tren_dvt" INTEGER,
    "duong_kinh_bong_cm" DOUBLE PRECISION,
    "dien_tich_phu_cm2" DOUBLE PRECISION,
    "ty_le_nhuy_tren_bong" DOUBLE PRECISION,
    "mau_nhuy" TEXT,
    "kieu_moc" TEXT,
    "dai_mau_tu_nhien" JSONB,
    "dac_diem_phan_biet" TEXT,
    "mua_vu" TEXT,
    "trang_thai" TEXT NOT NULL DEFAULT 'Đang dùng',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flower_taxonomy_pkey" PRIMARY KEY ("ma_loai")
);

-- CreateTable
CREATE TABLE "flower_confusable_pairs" (
    "ma_cap" TEXT NOT NULL,
    "ma_loai_a" TEXT NOT NULL,
    "ma_loai_b" TEXT NOT NULL,
    "dau_hieu_tach_a" TEXT NOT NULL,
    "dau_hieu_tach_b" TEXT NOT NULL,
    "muc_do_nham" TEXT NOT NULL,

    CONSTRAINT "flower_confusable_pairs_pkey" PRIMARY KEY ("ma_cap")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "workspaces_organization_id_idx" ON "workspaces"("organization_id");

-- CreateIndex
CREATE INDEX "branches_organization_id_idx" ON "branches"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "branches_organization_id_code_key" ON "branches"("organization_id", "code");

-- CreateIndex
CREATE INDEX "roles_organization_id_idx" ON "roles"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_organization_id_key_key" ON "roles"("organization_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "role_capabilities_role_id_capability_code_key" ON "role_capabilities"("role_id", "capability_code");

-- CreateIndex
CREATE INDEX "capability_overrides_organization_id_idx" ON "capability_overrides"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "capability_overrides_organization_id_role_id_capability_cod_key" ON "capability_overrides"("organization_id", "role_id", "capability_code");

-- CreateIndex
CREATE INDEX "memberships_organization_id_idx" ON "memberships"("organization_id");

-- CreateIndex
CREATE INDEX "memberships_user_id_idx" ON "memberships"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_organization_id_user_id_key" ON "memberships"("organization_id", "user_id");

-- CreateIndex
CREATE INDEX "assets_organization_id_idx" ON "assets"("organization_id");

-- CreateIndex
CREATE INDEX "assets_organization_id_product_id_idx" ON "assets"("organization_id", "product_id");

-- CreateIndex
CREATE INDEX "assets_parent_asset_id_idx" ON "assets"("parent_asset_id");

-- CreateIndex
CREATE INDEX "assets_output_sha256_idx" ON "assets"("output_sha256");

-- CreateIndex
CREATE INDEX "assets_organization_id_product_id_kind_approval_state_idx" ON "assets"("organization_id", "product_id", "kind", "approval_state");

-- CreateIndex
CREATE INDEX "generation_jobs_organization_id_idx" ON "generation_jobs"("organization_id");

-- CreateIndex
CREATE INDEX "generation_jobs_status_created_at_idx" ON "generation_jobs"("status", "created_at");

-- CreateIndex
CREATE INDEX "generation_jobs_organization_id_user_id_idx" ON "generation_jobs"("organization_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "generation_jobs_organization_id_feature_idempotency_key_key" ON "generation_jobs"("organization_id", "feature", "idempotency_key");

-- CreateIndex
CREATE INDEX "job_events_job_id_seq_idx" ON "job_events"("job_id", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "job_events_job_id_seq_key" ON "job_events"("job_id", "seq");

-- CreateIndex
CREATE INDEX "usage_organization_id_created_at_idx" ON "usage"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "usage_job_id_idx" ON "usage"("job_id");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_created_at_idx" ON "audit_logs"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_profiles_organization_id_key" ON "business_profiles"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "brand_profiles_organization_id_key" ON "brand_profiles"("organization_id");

-- CreateIndex
CREATE INDEX "products_organization_id_idx" ON "products"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_organization_id_code_key" ON "products"("organization_id", "code");

-- CreateIndex
CREATE INDEX "product_variants_organization_id_product_id_idx" ON "product_variants"("organization_id", "product_id");

-- CreateIndex
CREATE INDEX "product_images_organization_id_product_id_idx" ON "product_images"("organization_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_images_organization_id_product_id_asset_id_role_key" ON "product_images"("organization_id", "product_id", "asset_id", "role");

-- CreateIndex
CREATE INDEX "product_analyses_organization_id_idx" ON "product_analyses"("organization_id");

-- CreateIndex
CREATE INDEX "product_analyses_organization_id_product_id_idx" ON "product_analyses"("organization_id", "product_id");

-- CreateIndex
CREATE INDEX "product_analyses_job_id_idx" ON "product_analyses"("job_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_analyses_job_id_asset_id_key" ON "product_analyses"("job_id", "asset_id");

-- CreateIndex
CREATE INDEX "pricing_rules_organization_id_key_idx" ON "pricing_rules"("organization_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "integration_tokens_token_hash_key" ON "integration_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "integration_tokens_organization_id_idx" ON "integration_tokens"("organization_id");

-- CreateIndex
CREATE INDEX "integration_tokens_organization_id_client_idx" ON "integration_tokens"("organization_id", "client");

-- CreateIndex
CREATE INDEX "content_metrics_organization_id_idx" ON "content_metrics"("organization_id");

-- CreateIndex
CREATE INDEX "content_metrics_organization_id_metric_date_idx" ON "content_metrics"("organization_id", "metric_date");

-- CreateIndex
CREATE UNIQUE INDEX "content_metrics_organization_id_platform_content_id_metric__key" ON "content_metrics"("organization_id", "platform", "content_id", "metric_date");

-- CreateIndex
CREATE UNIQUE INDEX "ai_models_key_key" ON "ai_models"("key");

-- CreateIndex
CREATE INDEX "ai_policies_organization_id_idx" ON "ai_policies"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_policies_organization_id_capability_code_key" ON "ai_policies"("organization_id", "capability_code");

-- CreateIndex
CREATE INDEX "ai_requests_organization_id_created_at_idx" ON "ai_requests"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_requests_organization_id_capability_code_model_key_idx" ON "ai_requests"("organization_id", "capability_code", "model_key");

-- CreateIndex
CREATE INDEX "ai_requests_job_id_idx" ON "ai_requests"("job_id");

-- CreateIndex
CREATE INDEX "ai_evaluations_organization_id_entity_type_entity_id_idx" ON "ai_evaluations"("organization_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "ai_evaluations_organization_id_capability_code_idx" ON "ai_evaluations"("organization_id", "capability_code");

-- CreateIndex
CREATE INDEX "occasions_organization_id_idx" ON "occasions"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "occasions_organization_id_code_key" ON "occasions"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_links_slug_key" ON "catalog_links"("slug");

-- CreateIndex
CREATE INDEX "catalog_links_organization_id_idx" ON "catalog_links"("organization_id");

-- CreateIndex
CREATE INDEX "catalog_links_slug_idx" ON "catalog_links"("slug");

-- CreateIndex
CREATE INDEX "product_copies_organization_id_idx" ON "product_copies"("organization_id");

-- CreateIndex
CREATE INDEX "product_copies_organization_id_product_id_idx" ON "product_copies"("organization_id", "product_id");

-- CreateIndex
CREATE INDEX "product_copies_approval_state_idx" ON "product_copies"("approval_state");

-- CreateIndex
CREATE UNIQUE INDEX "product_copies_analysis_id_key" ON "product_copies"("analysis_id");

-- CreateIndex
CREATE INDEX "video_jobs_organization_id_idx" ON "video_jobs"("organization_id");

-- CreateIndex
CREATE INDEX "video_jobs_organization_id_product_id_idx" ON "video_jobs"("organization_id", "product_id");

-- CreateIndex
CREATE INDEX "video_jobs_stage_idx" ON "video_jobs"("stage");

-- CreateIndex
CREATE INDEX "video_jobs_script_approval_idx" ON "video_jobs"("script_approval");

-- CreateIndex
CREATE INDEX "video_jobs_video_approval_idx" ON "video_jobs"("video_approval");

-- CreateIndex
CREATE INDEX "video_scenes_video_job_id_idx" ON "video_scenes"("video_job_id");

-- CreateIndex
CREATE UNIQUE INDEX "video_scenes_video_job_id_scene_index_key" ON "video_scenes"("video_job_id", "scene_index");

-- CreateIndex
CREATE INDEX "orders_organization_id_status_idx" ON "orders"("organization_id", "status");

-- CreateIndex
CREATE INDEX "orders_organization_id_production_status_idx" ON "orders"("organization_id", "production_status");

-- CreateIndex
CREATE UNIQUE INDEX "orders_organization_id_code_key" ON "orders"("organization_id", "code");

-- CreateIndex
CREATE INDEX "order_items_organization_id_order_id_idx" ON "order_items"("organization_id", "order_id");

-- CreateIndex
CREATE INDEX "order_assignments_organization_id_assignee_id_idx" ON "order_assignments"("organization_id", "assignee_id");

-- CreateIndex
CREATE INDEX "order_assignments_organization_id_order_id_idx" ON "order_assignments"("organization_id", "order_id");

-- CreateIndex
CREATE INDEX "order_events_organization_id_order_id_created_at_idx" ON "order_events"("organization_id", "order_id", "created_at");

-- CreateIndex
CREATE INDEX "customers_organization_id_tier_idx" ON "customers"("organization_id", "tier");

-- CreateIndex
CREATE INDEX "customers_organization_id_name_idx" ON "customers"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "customers_organization_id_phone_key" ON "customers"("organization_id", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "customers_organization_id_code_key" ON "customers"("organization_id", "code");

-- CreateIndex
CREATE INDEX "customer_occasions_organization_id_customer_id_idx" ON "customer_occasions"("organization_id", "customer_id");

-- CreateIndex
CREATE INDEX "customer_occasions_organization_id_date_idx" ON "customer_occasions"("organization_id", "date");

-- CreateIndex
CREATE INDEX "customer_consents_organization_id_customer_id_idx" ON "customer_consents"("organization_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_consents_customer_id_channel_key" ON "customer_consents"("customer_id", "channel");

-- CreateIndex
CREATE INDEX "vouchers_organization_id_customer_id_idx" ON "vouchers"("organization_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_organization_id_code_key" ON "vouchers"("organization_id", "code");

-- CreateIndex
CREATE INDEX "chat_conversations_organization_id_status_idx" ON "chat_conversations"("organization_id", "status");

-- CreateIndex
CREATE INDEX "chat_conversations_organization_id_customer_id_idx" ON "chat_conversations"("organization_id", "customer_id");

-- CreateIndex
CREATE INDEX "chat_messages_organization_id_conversation_id_created_at_idx" ON "chat_messages"("organization_id", "conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "chat_channel_integrations_organization_id_is_enabled_idx" ON "chat_channel_integrations"("organization_id", "is_enabled");

-- CreateIndex
CREATE UNIQUE INDEX "chat_channel_integrations_organization_id_channel_key" ON "chat_channel_integrations"("organization_id", "channel");

-- CreateIndex
CREATE INDEX "flower_taxonomy_ten_chuan_idx" ON "flower_taxonomy"("ten_chuan");

-- CreateIndex
CREATE INDEX "flower_taxonomy_nhom_idx" ON "flower_taxonomy"("nhom");

-- CreateIndex
CREATE INDEX "flower_confusable_pairs_ma_loai_a_idx" ON "flower_confusable_pairs"("ma_loai_a");

-- CreateIndex
CREATE INDEX "flower_confusable_pairs_ma_loai_b_idx" ON "flower_confusable_pairs"("ma_loai_b");

-- CreateIndex
CREATE INDEX "flower_confusable_pairs_muc_do_nham_idx" ON "flower_confusable_pairs"("muc_do_nham");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_capabilities" ADD CONSTRAINT "role_capabilities_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capability_overrides" ADD CONSTRAINT "capability_overrides_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_events" ADD CONSTRAINT "job_events_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "generation_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage" ADD CONSTRAINT "usage_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_profiles" ADD CONSTRAINT "brand_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_analyses" ADD CONSTRAINT "product_analyses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_analyses" ADD CONSTRAINT "product_analyses_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_tokens" ADD CONSTRAINT "integration_tokens_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_metrics" ADD CONSTRAINT "content_metrics_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_policies" ADD CONSTRAINT "ai_policies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_policies" ADD CONSTRAINT "ai_policies_capability_code_fkey" FOREIGN KEY ("capability_code") REFERENCES "ai_capabilities"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_requests" ADD CONSTRAINT "ai_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_evaluations" ADD CONSTRAINT "ai_evaluations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occasions" ADD CONSTRAINT "occasions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_links" ADD CONSTRAINT "catalog_links_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_copies" ADD CONSTRAINT "product_copies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_jobs" ADD CONSTRAINT "video_jobs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_scenes" ADD CONSTRAINT "video_scenes_video_job_id_fkey" FOREIGN KEY ("video_job_id") REFERENCES "video_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_assignments" ADD CONSTRAINT "order_assignments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_assignments" ADD CONSTRAINT "order_assignments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_occasions" ADD CONSTRAINT "customer_occasions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_occasions" ADD CONSTRAINT "customer_occasions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_consents" ADD CONSTRAINT "customer_consents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_consents" ADD CONSTRAINT "customer_consents_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "chat_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_channel_integrations" ADD CONSTRAINT "chat_channel_integrations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flower_confusable_pairs" ADD CONSTRAINT "flower_confusable_pairs_ma_loai_a_fkey" FOREIGN KEY ("ma_loai_a") REFERENCES "flower_taxonomy"("ma_loai") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flower_confusable_pairs" ADD CONSTRAINT "flower_confusable_pairs_ma_loai_b_fkey" FOREIGN KEY ("ma_loai_b") REFERENCES "flower_taxonomy"("ma_loai") ON DELETE RESTRICT ON UPDATE CASCADE;

