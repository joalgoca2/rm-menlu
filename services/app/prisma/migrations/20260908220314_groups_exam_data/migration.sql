-- CreateTable
CREATE TABLE "student_groups" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "min_age" INTEGER DEFAULT 4,
    "max_age" INTEGER DEFAULT 99,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_disciplines" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "discipline_id" TEXT NOT NULL,
    "schedule_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_disciplines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_students" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_templates" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "discipline_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluation_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_criteria" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT DEFAULT 'GENERAL',
    "description" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluation_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_criterion_scores" (
    "id" TEXT NOT NULL,
    "exam_evaluation_id" TEXT NOT NULL,
    "criterion_id" TEXT NOT NULL,
    "rating" TEXT NOT NULL DEFAULT 'EXCELLENT',
    "numeric_score" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_criterion_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_groups_brand_id_idx" ON "student_groups"("brand_id");

-- CreateIndex
CREATE INDEX "group_disciplines_group_id_idx" ON "group_disciplines"("group_id");

-- CreateIndex
CREATE INDEX "group_disciplines_discipline_id_idx" ON "group_disciplines"("discipline_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_disciplines_group_id_discipline_id_key" ON "group_disciplines"("group_id", "discipline_id");

-- CreateIndex
CREATE INDEX "group_students_group_id_idx" ON "group_students"("group_id");

-- CreateIndex
CREATE INDEX "group_students_student_id_idx" ON "group_students"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_students_group_id_student_id_key" ON "group_students"("group_id", "student_id");

-- CreateIndex
CREATE INDEX "evaluation_templates_brand_id_idx" ON "evaluation_templates"("brand_id");

-- CreateIndex
CREATE INDEX "evaluation_templates_discipline_id_idx" ON "evaluation_templates"("discipline_id");

-- CreateIndex
CREATE INDEX "evaluation_criteria_template_id_idx" ON "evaluation_criteria"("template_id");

-- CreateIndex
CREATE INDEX "exam_criterion_scores_exam_evaluation_id_idx" ON "exam_criterion_scores"("exam_evaluation_id");

-- CreateIndex
CREATE INDEX "exam_criterion_scores_criterion_id_idx" ON "exam_criterion_scores"("criterion_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_criterion_scores_exam_evaluation_id_criterion_id_key" ON "exam_criterion_scores"("exam_evaluation_id", "criterion_id");

-- AddForeignKey
ALTER TABLE "student_groups" ADD CONSTRAINT "student_groups_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_disciplines" ADD CONSTRAINT "group_disciplines_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "student_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_disciplines" ADD CONSTRAINT "group_disciplines_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "disciplines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_students" ADD CONSTRAINT "group_students_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "student_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_students" ADD CONSTRAINT "group_students_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_templates" ADD CONSTRAINT "evaluation_templates_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_templates" ADD CONSTRAINT "evaluation_templates_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "disciplines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_criteria" ADD CONSTRAINT "evaluation_criteria_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "evaluation_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_criterion_scores" ADD CONSTRAINT "exam_criterion_scores_exam_evaluation_id_fkey" FOREIGN KEY ("exam_evaluation_id") REFERENCES "exam_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_criterion_scores" ADD CONSTRAINT "exam_criterion_scores_criterion_id_fkey" FOREIGN KEY ("criterion_id") REFERENCES "evaluation_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;
