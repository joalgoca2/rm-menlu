-- CreateTable
CREATE TABLE "diploma_configs" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "template" TEXT NOT NULL DEFAULT 'classic',
    "layout" TEXT NOT NULL DEFAULT '1perpage',
    "is_blank_mode" BOOLEAN NOT NULL DEFAULT false,
    "institution_name" TEXT DEFAULT 'Menlu 门路 • Academia de Artes Marciales',
    "reason_text" TEXT DEFAULT 'Por su sobresaliente constancia, disciplina y destacado avance en El Camino del Esfuerzo.',
    "date_text" TEXT,
    "school_logo_subtext" TEXT DEFAULT 'Academia de Artes Marciales',
    "sig1_name" TEXT DEFAULT 'Sensei Principal / Director',
    "sig1_role" TEXT DEFAULT 'Director General del Dojo',
    "sig2_name" TEXT DEFAULT 'Comité de Grados',
    "sig2_role" TEXT DEFAULT 'Certificación Oficial',
    "sig3_name" TEXT,
    "sig3_role" TEXT,
    "sig4_name" TEXT,
    "sig4_role" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diploma_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "diploma_configs_brand_id_key" ON "diploma_configs"("brand_id");

-- AddForeignKey
ALTER TABLE "diploma_configs" ADD CONSTRAINT "diploma_configs_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
