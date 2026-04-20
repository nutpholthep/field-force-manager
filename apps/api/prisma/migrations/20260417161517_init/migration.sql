-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'dispatcher', 'supervisor', 'technician', 'viewer');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('created', 'assigned', 'accepted', 'traveling', 'on_site', 'working', 'stuck', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "WorkOrderPriority" AS ENUM ('critical', 'high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "WorkOrderServiceType" AS ENUM ('installation', 'maintenance', 'repair', 'inspection', 'emergency', 'upgrade', 'removal');

-- CreateEnum
CREATE TYPE "SlaRisk" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "TechnicianStatus" AS ENUM ('active', 'inactive', 'on_leave', 'suspended');

-- CreateEnum
CREATE TYPE "TechnicianAvailability" AS ENUM ('available', 'busy', 'offline', 'break');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('scheduled', 'checked_in', 'checked_out', 'absent');

-- CreateEnum
CREATE TYPE "MemberSkillCertStatus" AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('planning', 'in_progress', 'on_hold', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "StuckReasonCategory" AS ENUM ('parts', 'access', 'technical', 'customer', 'weather', 'other');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('residential', 'commercial', 'industrial', 'government');

-- CreateEnum
CREATE TYPE "SiteType" AS ENUM ('office', 'warehouse', 'factory', 'retail', 'residential', 'data_center', 'outdoor');

-- CreateEnum
CREATE TYPE "ActiveStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "MaterialItemType" AS ENUM ('item', 'service');

-- CreateEnum
CREATE TYPE "DurationUnit" AS ENUM ('minutes', 'hours', 'days');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('info', 'warning', 'error', 'success');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'viewer',
    "phone" TEXT,
    "avatar_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "refresh_token" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_person" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "type" "CustomerType" NOT NULL DEFAULT 'commercial',
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "customer_id" TEXT,
    "customer_name" TEXT,
    "address" TEXT,
    "zone_id" TEXT,
    "zone_name" TEXT,
    "site_type" "SiteType" NOT NULL DEFAULT 'office',
    "equipment" TEXT[],
    "access_instructions" TEXT,
    "status" "ActiveStatus" NOT NULL DEFAULT 'active',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "polygon" JSONB NOT NULL DEFAULT '[]',
    "center_latitude" DOUBLE PRECISION,
    "center_longitude" DOUBLE PRECISION,
    "agent_id" TEXT,
    "agent_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriorityMaster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "duration_value" INTEGER NOT NULL DEFAULT 4,
    "duration_unit" "DurationUnit" NOT NULL DEFAULT 'hours',
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriorityMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StuckReason" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" "StuckReasonCategory" NOT NULL DEFAULT 'other',
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#f59e0b',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StuckReason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "item_number" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "description" TEXT,
    "category_id" TEXT,
    "category_name" TEXT,
    "item_group" TEXT,
    "item_type" "MaterialItemType" NOT NULL DEFAULT 'item',
    "unit" TEXT,
    "warehouse" TEXT,
    "stock_qty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "min_stock_qty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cost_price" DOUBLE PRECISION,
    "keywords" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "required_skill_ids" TEXT[],
    "allowed_priority_ids" TEXT[],
    "default_priority_id" TEXT,
    "default_duration_hrs" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "steps" JSONB NOT NULL DEFAULT '[]',
    "causes" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "nodes" JSONB NOT NULL DEFAULT '[]',
    "edges" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "color" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "zone_id" TEXT,
    "zone_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Technician" (
    "id" TEXT NOT NULL,
    "technician_code" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "photo_url" TEXT,
    "linked_user_id" TEXT,
    "linked_user_email" TEXT,
    "status" "TechnicianStatus" NOT NULL DEFAULT 'active',
    "team_role" TEXT,
    "team_role_name" TEXT,
    "team_id" TEXT,
    "team_name" TEXT,
    "home_latitude" DOUBLE PRECISION,
    "home_longitude" DOUBLE PRECISION,
    "current_latitude" DOUBLE PRECISION,
    "current_longitude" DOUBLE PRECISION,
    "zone_id" TEXT,
    "zone_name" TEXT,
    "skills" TEXT[],
    "certifications" TEXT[],
    "max_daily_jobs" INTEGER NOT NULL DEFAULT 6,
    "current_daily_jobs" INTEGER NOT NULL DEFAULT 0,
    "avg_completion_time_hrs" DOUBLE PRECISION,
    "sla_compliance_rate" DOUBLE PRECISION,
    "customer_rating" DOUBLE PRECISION,
    "jobs_completed_total" INTEGER NOT NULL DEFAULT 0,
    "performance_score" DOUBLE PRECISION,
    "availability" "TechnicianAvailability" NOT NULL DEFAULT 'available',
    "working_hours_start" TEXT NOT NULL DEFAULT '08:00',
    "working_hours_end" TEXT NOT NULL DEFAULT '17:00',
    "hourly_rate" DOUBLE PRECISION,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Technician_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberSkillCert" (
    "id" TEXT NOT NULL,
    "technician_id" TEXT NOT NULL,
    "technician_name" TEXT,
    "skill_id" TEXT NOT NULL,
    "skill_name" TEXT NOT NULL,
    "cert_file_url" TEXT,
    "cert_file_name" TEXT,
    "issued_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "status" "MemberSkillCertStatus" NOT NULL DEFAULT 'pending',
    "reviewer_note" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberSkillCert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicianAttendance" (
    "id" TEXT NOT NULL,
    "technician_id" TEXT NOT NULL,
    "technician_name" TEXT,
    "technician_code" TEXT,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'scheduled',
    "check_in_time" TEXT,
    "check_out_time" TEXT,
    "check_in_at" TIMESTAMP(3),
    "check_out_at" TIMESTAMP(3),
    "work_hours" DOUBLE PRECISION,
    "scheduled_jobs" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechnicianAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'created',
    "stuck_reason_id" TEXT,
    "stuck_reason_name" TEXT,
    "stuck_note" TEXT,
    "priority" "WorkOrderPriority" NOT NULL DEFAULT 'medium',
    "service_type" "WorkOrderServiceType" NOT NULL DEFAULT 'maintenance',
    "required_skills" TEXT[],
    "customer_name" TEXT,
    "customer_id" TEXT,
    "site_name" TEXT,
    "site_id" TEXT,
    "site_latitude" DOUBLE PRECISION,
    "site_longitude" DOUBLE PRECISION,
    "zone_name" TEXT,
    "assigned_technician_id" TEXT,
    "assigned_technician_name" TEXT,
    "sla_due" TIMESTAMP(3),
    "sla_risk" "SlaRisk" NOT NULL DEFAULT 'low',
    "scheduled_date" DATE,
    "scheduled_time" TEXT,
    "estimated_duration_hrs" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "actual_duration_hrs" DOUBLE PRECISION,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "travel_distance_km" DOUBLE PRECISION,
    "labor_cost" DOUBLE PRECISION,
    "equipment_cost" DOUBLE PRECISION,
    "travel_cost" DOUBLE PRECISION,
    "total_cost" DOUBLE PRECISION,
    "customer_rating" DOUBLE PRECISION,
    "notes" TEXT,
    "attachments" TEXT[],
    "dispatch_score" DOUBLE PRECISION,
    "project_id" TEXT,
    "project_step_id" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderMaterial" (
    "id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "work_order_number" TEXT,
    "material_id" TEXT NOT NULL,
    "item_number" TEXT,
    "item_name" TEXT,
    "unit" TEXT,
    "quantity_used" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "cost_price" DOUBLE PRECISION,
    "total_cost" DOUBLE PRECISION,
    "notes" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrderMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderStepData" (
    "id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "work_order_number" TEXT,
    "step_id" TEXT NOT NULL,
    "step_name" TEXT,
    "task_id" TEXT NOT NULL,
    "task_label" TEXT,
    "task_type" TEXT,
    "value_text" TEXT,
    "value_boolean" BOOLEAN,
    "value_file_url" TEXT,
    "value_file_name" TEXT,
    "value_materials" JSONB NOT NULL DEFAULT '[]',
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrderStepData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "project_number" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "customer_id" TEXT,
    "customer_name" TEXT,
    "site_id" TEXT,
    "site_name" TEXT,
    "workflow_id" TEXT NOT NULL,
    "workflow_name" TEXT,
    "current_step_id" TEXT,
    "current_step_name" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'planning',
    "priority" "WorkOrderPriority" NOT NULL DEFAULT 'medium',
    "assigned_technician_id" TEXT,
    "assigned_technician_name" TEXT,
    "start_date" DATE,
    "target_date" DATE,
    "completed_date" DATE,
    "completed_steps" TEXT[],
    "step_history" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "tags" TEXT[],
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'info',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "user_id" TEXT,
    "link" TEXT,
    "meta" JSONB,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAgent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "model" TEXT,
    "system_prompt" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "assigned_zone_ids" TEXT[],
    "assigned_zone_names" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAgent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StuckReason_code_key" ON "StuckReason"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialCategory_code_key" ON "MaterialCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Material_item_number_key" ON "Material"("item_number");

-- CreateIndex
CREATE UNIQUE INDEX "TeamRole_code_key" ON "TeamRole"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Technician_technician_code_key" ON "Technician"("technician_code");

-- CreateIndex
CREATE INDEX "MemberSkillCert_technician_id_idx" ON "MemberSkillCert"("technician_id");

-- CreateIndex
CREATE INDEX "TechnicianAttendance_date_idx" ON "TechnicianAttendance"("date");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicianAttendance_technician_id_date_key" ON "TechnicianAttendance"("technician_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_order_number_key" ON "WorkOrder"("order_number");

-- CreateIndex
CREATE INDEX "WorkOrder_status_idx" ON "WorkOrder"("status");

-- CreateIndex
CREATE INDEX "WorkOrder_assigned_technician_id_idx" ON "WorkOrder"("assigned_technician_id");

-- CreateIndex
CREATE INDEX "WorkOrder_project_id_idx" ON "WorkOrder"("project_id");

-- CreateIndex
CREATE INDEX "WorkOrder_scheduled_date_idx" ON "WorkOrder"("scheduled_date");

-- CreateIndex
CREATE INDEX "WorkOrderMaterial_work_order_id_idx" ON "WorkOrderMaterial"("work_order_id");

-- CreateIndex
CREATE INDEX "WorkOrderStepData_work_order_id_idx" ON "WorkOrderStepData"("work_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrderStepData_work_order_id_step_id_task_id_key" ON "WorkOrderStepData"("work_order_id", "step_id", "task_id");

-- CreateIndex
CREATE UNIQUE INDEX "Project_project_number_key" ON "Project"("project_number");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_workflow_id_idx" ON "Project"("workflow_id");

-- CreateIndex
CREATE INDEX "Notification_user_id_is_read_idx" ON "Notification"("user_id", "is_read");

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "MaterialCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Technician" ADD CONSTRAINT "Technician_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Technician" ADD CONSTRAINT "Technician_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberSkillCert" ADD CONSTRAINT "MemberSkillCert_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "Technician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberSkillCert" ADD CONSTRAINT "MemberSkillCert_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianAttendance" ADD CONSTRAINT "TechnicianAttendance_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "Technician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_assigned_technician_id_fkey" FOREIGN KEY ("assigned_technician_id") REFERENCES "Technician"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderMaterial" ADD CONSTRAINT "WorkOrderMaterial_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderMaterial" ADD CONSTRAINT "WorkOrderMaterial_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderStepData" ADD CONSTRAINT "WorkOrderStepData_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "Workflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_assigned_technician_id_fkey" FOREIGN KEY ("assigned_technician_id") REFERENCES "Technician"("id") ON DELETE SET NULL ON UPDATE CASCADE;
