-- CreateTable
CREATE TABLE "disciplines" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disciplines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "belts" (
    "id" TEXT NOT NULL,
    "discipline_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color_hex" TEXT NOT NULL DEFAULT '#FFFFFF',
    "order_index" INTEGER NOT NULL DEFAULT 1,
    "min_classes" INTEGER NOT NULL DEFAULT 24,
    "min_months" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "belts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "phone_number" TEXT,
    "emergency_contact" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "birth_date" TIMESTAMP(3),
    "emergency_contact" TEXT,
    "effort_points" INTEGER NOT NULL DEFAULT 0,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "last_attendance" TIMESTAMP(3),
    "shields_available" INTEGER NOT NULL DEFAULT 1,
    "current_belt_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_enrollments" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "discipline_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "physical_challenges" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "discipline_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "min_age" INTEGER DEFAULT 4,
    "max_age" INTEGER DEFAULT 99,
    "target_belt_id" TEXT,
    "target_reps" INTEGER NOT NULL DEFAULT 10,
    "metric_type" TEXT NOT NULL DEFAULT 'REPETITIONS',
    "xp_reward" INTEGER NOT NULL DEFAULT 40,
    "requires_validation" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "physical_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_challenge_progress" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "challenge_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "xp_earned" INTEGER NOT NULL DEFAULT 0,
    "evidence_url" TEXT,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_at" TIMESTAMP(3),
    "verified_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_challenge_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_exams" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "discipline_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "exam_date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "fee_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grade_exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_evaluations" (
    "id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "target_belt_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "score" DOUBLE PRECISION,
    "feedback" TEXT,
    "certified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "discipline_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "tournament_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_categories" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "min_age" INTEGER DEFAULT 4,
    "max_age" INTEGER DEFAULT 99,
    "gender" TEXT DEFAULT 'MIXED',
    "min_weight" DOUBLE PRECISION,
    "max_weight" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_matches" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "round_index" INTEGER NOT NULL DEFAULT 1,
    "match_index" INTEGER NOT NULL DEFAULT 1,
    "red_student_id" TEXT,
    "blue_student_id" TEXT,
    "winner_student_id" TEXT,
    "red_score" INTEGER NOT NULL DEFAULT 0,
    "blue_score" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "disciplines_brand_id_idx" ON "disciplines"("brand_id");

-- CreateIndex
CREATE INDEX "belts_discipline_id_idx" ON "belts"("discipline_id");

-- CreateIndex
CREATE UNIQUE INDEX "parent_profiles_user_id_key" ON "parent_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_user_id_key" ON "student_profiles"("user_id");

-- CreateIndex
CREATE INDEX "student_profiles_brand_id_idx" ON "student_profiles"("brand_id");

-- CreateIndex
CREATE INDEX "student_profiles_parent_id_idx" ON "student_profiles"("parent_id");

-- CreateIndex
CREATE INDEX "student_profiles_current_belt_id_idx" ON "student_profiles"("current_belt_id");

-- CreateIndex
CREATE INDEX "student_enrollments_student_id_idx" ON "student_enrollments"("student_id");

-- CreateIndex
CREATE INDEX "student_enrollments_discipline_id_idx" ON "student_enrollments"("discipline_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_enrollments_student_id_discipline_id_key" ON "student_enrollments"("student_id", "discipline_id");

-- CreateIndex
CREATE INDEX "physical_challenges_brand_id_idx" ON "physical_challenges"("brand_id");

-- CreateIndex
CREATE INDEX "physical_challenges_discipline_id_idx" ON "physical_challenges"("discipline_id");

-- CreateIndex
CREATE INDEX "student_challenge_progress_student_id_idx" ON "student_challenge_progress"("student_id");

-- CreateIndex
CREATE INDEX "student_challenge_progress_challenge_id_idx" ON "student_challenge_progress"("challenge_id");

-- CreateIndex
CREATE INDEX "grade_exams_brand_id_idx" ON "grade_exams"("brand_id");

-- CreateIndex
CREATE INDEX "grade_exams_discipline_id_idx" ON "grade_exams"("discipline_id");

-- CreateIndex
CREATE INDEX "exam_evaluations_exam_id_idx" ON "exam_evaluations"("exam_id");

-- CreateIndex
CREATE INDEX "exam_evaluations_student_id_idx" ON "exam_evaluations"("student_id");

-- CreateIndex
CREATE INDEX "tournaments_brand_id_idx" ON "tournaments"("brand_id");

-- CreateIndex
CREATE INDEX "tournament_categories_tournament_id_idx" ON "tournament_categories"("tournament_id");

-- CreateIndex
CREATE INDEX "tournament_matches_category_id_idx" ON "tournament_matches"("category_id");

-- CreateIndex
CREATE INDEX "tournament_matches_red_student_id_idx" ON "tournament_matches"("red_student_id");

-- CreateIndex
CREATE INDEX "tournament_matches_blue_student_id_idx" ON "tournament_matches"("blue_student_id");

-- CreateIndex
CREATE INDEX "tournament_matches_winner_student_id_idx" ON "tournament_matches"("winner_student_id");

-- AddForeignKey
ALTER TABLE "disciplines" ADD CONSTRAINT "disciplines_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "belts" ADD CONSTRAINT "belts_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "disciplines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_profiles" ADD CONSTRAINT "parent_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parent_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_current_belt_id_fkey" FOREIGN KEY ("current_belt_id") REFERENCES "belts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "disciplines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_challenges" ADD CONSTRAINT "physical_challenges_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_challenges" ADD CONSTRAINT "physical_challenges_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "disciplines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_challenges" ADD CONSTRAINT "physical_challenges_target_belt_id_fkey" FOREIGN KEY ("target_belt_id") REFERENCES "belts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_challenge_progress" ADD CONSTRAINT "student_challenge_progress_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_challenge_progress" ADD CONSTRAINT "student_challenge_progress_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "physical_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_exams" ADD CONSTRAINT "grade_exams_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_exams" ADD CONSTRAINT "grade_exams_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "disciplines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_evaluations" ADD CONSTRAINT "exam_evaluations_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "grade_exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_evaluations" ADD CONSTRAINT "exam_evaluations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_evaluations" ADD CONSTRAINT "exam_evaluations_target_belt_id_fkey" FOREIGN KEY ("target_belt_id") REFERENCES "belts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "disciplines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_categories" ADD CONSTRAINT "tournament_categories_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "tournament_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_red_student_id_fkey" FOREIGN KEY ("red_student_id") REFERENCES "student_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_blue_student_id_fkey" FOREIGN KEY ("blue_student_id") REFERENCES "student_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_winner_student_id_fkey" FOREIGN KEY ("winner_student_id") REFERENCES "student_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
