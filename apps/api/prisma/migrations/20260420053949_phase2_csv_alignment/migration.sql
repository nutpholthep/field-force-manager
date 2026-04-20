-- AlterTable
ALTER TABLE "AIAgent" ADD COLUMN     "can_send_email" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "check_interval_minutes" INTEGER,
ADD COLUMN     "data_skills" TEXT[],
ADD COLUMN     "last_run_at" TIMESTAMP(3),
ADD COLUMN     "last_run_summary" TEXT,
ADD COLUMN     "llm_api_key" TEXT,
ADD COLUMN     "llm_api_url" TEXT,
ADD COLUMN     "llm_model" TEXT,
ADD COLUMN     "llm_provider" TEXT,
ADD COLUMN     "notification_email" TEXT,
ADD COLUMN     "sla_warning_hours" INTEGER;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "total_work_orders" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "category" TEXT,
ADD COLUMN     "related_entity_id" TEXT,
ADD COLUMN     "related_entity_type" TEXT,
ADD COLUMN     "target_user" TEXT;

-- AlterTable
ALTER TABLE "ServiceType" ADD COLUMN     "default_priority" TEXT;

-- AlterTable
ALTER TABLE "Workflow" ADD COLUMN     "version" TEXT;

-- AlterTable
ALTER TABLE "Zone" ADD COLUMN     "avg_daily_jobs" DOUBLE PRECISION,
ADD COLUMN     "provinces" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "technician_count" INTEGER NOT NULL DEFAULT 0;
