import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const SECRET =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "default_32_byte_secret_key_for_aes_encryption_12345";

function getMasterKey(): Buffer {
  return crypto.createHash("sha256").update(SECRET).digest();
}

function encryptSecret(plainText: string): string {
  if (!plainText) return "";
  const iv = crypto.randomBytes(12);
  const key = getMasterKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed (Upserts standard)...");

  // 1. Seed Roles
  console.log("  -> Seeding roles...");
  const superAdminRole = await prisma.role.upsert({
    where: { name: "SUPER_ADMIN" },
    update: {},
    create: {
      name: "SUPER_ADMIN",
      description: "System super administrator with unrestricted privileges.",
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: {
      name: "ADMIN",
      description: "Administrator role for tenant and user management.",
    },
  });

  await prisma.role.upsert({
    where: { name: "USER" },
    update: {},
    create: {
      name: "USER",
      description: "Standard end-user role.",
    },
  });

  // 2. Seed Permissions
  console.log("  -> Seeding permissions...");
  const permissionsList = [
    { name: "users:manage", description: "Create, edit, and delete users" },
    { name: "users:read", description: "View user list and details" },
    { name: "settings:manage", description: "Configure application settings" },
    { name: "billing:manage", description: "Manage subscriptions and billing" },
  ];

  for (const perm of permissionsList) {
    const createdPerm = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: createdPerm.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: createdPerm.id,
      },
    });
  }

  // 3. Seed Default Brand / Tenant
  console.log("  -> Seeding Brand 'General'...");
  const generalBrand = await prisma.brand.upsert({
    where: { id: "brand-general" },
    update: {
      name: "General",
      slug: "general",
      isSlugLocked: true,
      currency: "MXN",
    },
    create: {
      id: "brand-general",
      name: "General",
      slug: "general",
      isSlugLocked: true,
      currency: "MXN",
    },
  });

  // Seed Sample Brand Membership Plans (BrandPlanConfig)
  await prisma.brandPlanConfig.upsert({
    where: { id: "bplan-general-basic" },
    update: {},
    create: {
      id: "bplan-general-basic",
      brandId: generalBrand.id,
      name: "Membresía General Gimnasio",
      description: "Acceso libre a pesas y cardio de Lunes a Sábado.",
      priceMonthly: 500,
      priceYearly: 5000,
      currency: "MXN",
      isActive: true,
    },
  });

  await prisma.brandPlanConfig.upsert({
    where: { id: "bplan-general-pro" },
    update: {},
    create: {
      id: "bplan-general-pro",
      brandId: generalBrand.id,
      name: "Pase All-Inclusive + Alberca & Dojo",
      description: "Acceso ilimitado a pesas, alberca olímpica y clases de artes marciales.",
      priceMonthly: 900,
      priceYearly: 9000,
      currency: "MXN",
      isActive: true,
    },
  });

  // 4. Seed Initial Admin User
  const hashedPassword = await bcrypt.hash("password123", 10);
  const adminEmail = "admin@remotemonkeys.ai";

  console.log(`  -> Seeding admin user (${adminEmail})...`);
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      brandId: null,
    },
    create: {
      email: adminEmail,
      name: "Admin Global",
      password: hashedPassword,
      isActive: true,
      brandId: null,
    },
  });

  // Remove redundant ADMIN role from SUPER_ADMIN if present
  await prisma.userRole.deleteMany({
    where: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: superAdminRole.id,
    },
  });

  // 4.1 Seed Brand Admin User (brand-general)
  const brandAdminEmail = "admin.brand@remotemonkeys.ai";
  console.log(`  -> Seeding brand admin user (${brandAdminEmail})...`);
  const brandAdminUser = await prisma.user.upsert({
    where: { email: brandAdminEmail },
    update: {
      brandId: generalBrand.id,
    },
    create: {
      email: brandAdminEmail,
      name: "Admin Marca General",
      password: hashedPassword,
      isActive: true,
      brandId: generalBrand.id,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: brandAdminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: brandAdminUser.id,
      roleId: adminRole.id,
    },
  });

  // 4.2 Seed Standard Brand User (brand-general)
  const userRole = await prisma.role.findUnique({
    where: { name: "USER" },
  });

  const brandUserEmail = "user.brand@remotemonkeys.ai";
  console.log(`  -> Seeding standard brand user (${brandUserEmail})...`);
  const standardBrandUser = await prisma.user.upsert({
    where: { email: brandUserEmail },
    update: {
      brandId: generalBrand.id,
    },
    create: {
      email: brandUserEmail,
      name: "Usuario Marca General",
      password: hashedPassword,
      isActive: true,
      brandId: generalBrand.id,
    },
  });

  if (userRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: standardBrandUser.id,
          roleId: userRole.id,
        },
      },
      update: {},
      create: {
        userId: standardBrandUser.id,
        roleId: userRole.id,
      },
    });
  }

  // 5. Seed Subscription for Admin User
  console.log("  -> Seeding Subscription...");
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  await prisma.subscription.upsert({
    where: { id: "sub-admin-test" },
    update: {
      brandId: generalBrand.id,
    },
    create: {
      id: "sub-admin-test",
      brandId: generalBrand.id,
      userId: brandAdminUser.id,
      planName: "Pro",
      status: "ACTIVE",
      billingCycle: "YEARLY",
      startDate: new Date(),
      endDate: oneYearFromNow,
      price: 29,
      discount: 0,
      finalPrice: 29,
    },
  });

  // 6. Seed Plan Configurations
  console.log("  -> Seeding Plan Configurations...");
  await prisma.planConfig.upsert({
    where: { planName: "Free" },
    update: { currency: "USD", hasAiAgent: false },
    create: {
      planName: "Free",
      priceMonthly: 0,
      priceYearly: 0,
      currency: "USD",
      maxProjects: 3,
      allowCSVImportExport: false,
      hasLiveSupport: false,
      hasAiAgent: false,
    },
  });

  await prisma.planConfig.upsert({
    where: { planName: "Pro" },
    update: { currency: "USD", hasAiAgent: true },
    create: {
      planName: "Pro",
      priceMonthly: 19,
      priceYearly: 190,
      currency: "USD",
      maxProjects: 25,
      allowCSVImportExport: true,
      hasLiveSupport: true,
      hasAiAgent: true,
    },
  });

  await prisma.planConfig.upsert({
    where: { planName: "Enterprise" },
    update: { currency: "USD", hasAiAgent: true },
    create: {
      planName: "Enterprise",
      priceMonthly: 99,
      priceYearly: 990,
      currency: "USD",
      maxProjects: 999999,
      allowCSVImportExport: true,
      hasLiveSupport: true,
      hasAiAgent: true,
    },
  });

  const proPlan = await prisma.planConfig.findUnique({
    where: { planName: "Pro" },
  });

  if (proPlan) {
    await prisma.subscription.upsert({
      where: { id: "sub-brand-admin-pro" },
      update: {
        brandId: generalBrand.id,
        planName: proPlan.planName,
        status: "ACTIVE",
      },
      create: {
        id: "sub-brand-admin-pro",
        brandId: generalBrand.id,
        userId: brandAdminUser.id,
        planName: proPlan.planName,
        status: "ACTIVE",
        billingCycle: "MONTHLY",
        startDate: new Date(),
        endDate: oneYearFromNow,
        price: proPlan.priceMonthly,
        finalPrice: proPlan.priceMonthly,
      },
    });
  }

  // 7. Seed Exchange Rates (Aligned with Locales & Timezones)
  console.log("  -> Seeding Exchange Rates (Aligned with Locales & Timezones)...");
  const defaultRates = [
    {
      code: "USD",
      name: "Dólar Estadounidense",
      symbol: "$",
      rateAgainstUsd: 1.0,
      isDefault: true,
    },
    {
      code: "MXN",
      name: "Peso Mexicano",
      symbol: "$",
      rateAgainstUsd: 20.0,
      isDefault: false,
    },
    {
      code: "EUR",
      name: "Euro",
      symbol: "€",
      rateAgainstUsd: 0.92,
      isDefault: false,
    },
    {
      code: "BRL",
      name: "Real Brasileño",
      symbol: "R$",
      rateAgainstUsd: 5.5,
      isDefault: false,
    },
    {
      code: "COP",
      name: "Peso Colombiano",
      symbol: "$",
      rateAgainstUsd: 4000.0,
      isDefault: false,
    },
    {
      code: "ARS",
      name: "Peso Argentino",
      symbol: "$",
      rateAgainstUsd: 1000.0,
      isDefault: false,
    },
    {
      code: "CLP",
      name: "Peso Chileno",
      symbol: "$",
      rateAgainstUsd: 950.0,
      isDefault: false,
    },
    {
      code: "GBP",
      name: "Libra Esterlina",
      symbol: "£",
      rateAgainstUsd: 0.78,
      isDefault: false,
    },
  ];

  for (const r of defaultRates) {
    await prisma.exchangeRate.upsert({
      where: { code: r.code },
      update: {
        name: r.name,
        symbol: r.symbol,
        rateAgainstUsd: r.rateAgainstUsd,
        isDefault: r.isDefault,
      },
      create: r,
    });
  }

  // 8. Seed Payment Gateway Configuration for General Brand
  console.log("  -> Seeding Payment Gateway Config for General Brand (Clip)...");
  await prisma.brandPaymentConfig.upsert({
    where: {
      brandId_gatewayType: {
        brandId: generalBrand.id,
        gatewayType: "CLIP",
      },
    },
    update: {
      gatewayType: "CLIP",
      publicKey: "test_clip_pk_general_brand_12345",
      encryptedSecretKey: encryptSecret("test_clip_sk_general_brand_67890"),
      isActive: true,
    },
    create: {
      brandId: generalBrand.id,
      gatewayType: "CLIP",
      publicKey: "test_clip_pk_general_brand_12345",
      encryptedSecretKey: encryptSecret("test_clip_sk_general_brand_67890"),
      isActive: true,
    },
  });

  // 9. Seed Menlu Martial Arts Disciplines (Tai Chi, Sanda, Wing Chun)
  console.log("  -> Seeding Menlu Disciplines (Tai Chi, Sanda, Wing Chun)...");
  const taichiDiscipline = await prisma.discipline.upsert({
    where: { id: "seed-discipline-taichi" },
    update: { name: "Tai Chi", code: "TC", description: "Arte marcial interno enfocado en la meditación y energía." },
    create: {
      id: "seed-discipline-taichi",
      brandId: generalBrand.id,
      name: "Tai Chi",
      code: "TC",
      description: "Arte marcial interno enfocado en la meditación y energía.",
    },
  });

  const sandaDiscipline = await prisma.discipline.upsert({
    where: { id: "seed-discipline-sanda" },
    update: { name: "Sanda (Sanshou)", code: "SND", description: "Combate libre chino con proyecciones y pateo." },
    create: {
      id: "seed-discipline-sanda",
      brandId: generalBrand.id,
      name: "Sanda (Sanshou)",
      code: "SND",
      description: "Combate libre chino con proyecciones y pateo.",
    },
  });

  await prisma.discipline.upsert({
    where: { id: "seed-discipline-wingchun" },
    update: { name: "Wing Chun", code: "WC", description: "Sistema de defensa personal a corta distancia." },
    create: {
      id: "seed-discipline-wingchun",
      brandId: generalBrand.id,
      name: "Wing Chun",
      code: "WC",
      description: "Sistema de defensa personal a corta distancia.",
    },
  });

  // 10. Seed Sample Belts for Sanda
  console.log("  -> Seeding Belts for Sanda...");
  await prisma.belt.upsert({
    where: { id: "seed-belt-sanda-white" },
    update: { name: "Cinturón Blanco", colorHex: "#FFFFFF", orderIndex: 1, minClasses: 24, minMonths: 3 },
    create: {
      id: "seed-belt-sanda-white",
      disciplineId: sandaDiscipline.id,
      name: "Cinturón Blanco",
      colorHex: "#FFFFFF",
      orderIndex: 1,
      minClasses: 24,
      minMonths: 3,
    },
  });

  await prisma.belt.upsert({
    where: { id: "seed-belt-sanda-yellow" },
    update: { name: "Cinturón Amarillo", colorHex: "#FFE600", orderIndex: 2, minClasses: 36, minMonths: 4 },
    create: {
      id: "seed-belt-sanda-yellow",
      disciplineId: sandaDiscipline.id,
      name: "Cinturón Amarillo",
      colorHex: "#FFE600",
      orderIndex: 2,
      minClasses: 36,
      minMonths: 4,
    },
  });

  // 11. Seed Physical Challenges for Gamification
  console.log("  -> Seeding Physical Challenges...");
  await prisma.physicalChallenge.upsert({
    where: { id: "seed-challenge-pushups-kids" },
    update: { title: "10 Flexiones de Pecho (Infantil)", targetReps: 10, minAge: 4, maxAge: 12, xpReward: 30 },
    create: {
      id: "seed-challenge-pushups-kids",
      brandId: generalBrand.id,
      disciplineId: sandaDiscipline.id,
      title: "10 Flexiones de Pecho (Infantil)",
      description: "Realiza 10 flexiones de pecho con buena postura.",
      minAge: 4,
      maxAge: 12,
      targetReps: 10,
      metricType: "REPETITIONS",
      xpReward: 30,
      requiresValidation: true,
    },
  });

  await prisma.physicalChallenge.upsert({
    where: { id: "seed-challenge-squats-adults" },
    update: { title: "25 Sentadillas Explosivas (Adultos)", targetReps: 25, minAge: 13, maxAge: 99, xpReward: 50 },
    create: {
      id: "seed-challenge-squats-adults",
      brandId: generalBrand.id,
      disciplineId: taichiDiscipline.id,
      title: "25 Sentadillas Explosivas (Adultos)",
      description: "Realiza 25 sentadillas profundas manteniendo espalda recta.",
      minAge: 13,
      maxAge: 99,
      targetReps: 25,
      metricType: "REPETITIONS",
      xpReward: 50,
      requiresValidation: true,
    },
  });

  // 12. Seed Default Student Groups (Multi-discipline)
  console.log("  -> Seeding Default Student Groups...");
  const groupBeginners = await prisma.studentGroup.upsert({
    where: { id: "seed-group-adults-beginners" },
    update: {
      name: "Mayores Principiantes",
      minAge: 15,
      maxAge: 99,
      description: "Grupo de adultos nivel inicial en artes marciales.",
    },
    create: {
      id: "seed-group-adults-beginners",
      brandId: generalBrand.id,
      name: "Mayores Principiantes",
      code: "MAY-PRIN",
      description: "Grupo de adultos nivel inicial en artes marciales.",
      minAge: 15,
      maxAge: 99,
      isActive: true,
    },
  });

  await prisma.groupDiscipline.upsert({
    where: {
      groupId_disciplineId: {
        groupId: groupBeginners.id,
        disciplineId: taichiDiscipline.id,
      },
    },
    update: { scheduleText: "Mar y Jue 18:00 - 19:30" },
    create: {
      groupId: groupBeginners.id,
      disciplineId: taichiDiscipline.id,
      scheduleText: "Mar y Jue 18:00 - 19:30",
    },
  });

  await prisma.groupDiscipline.upsert({
    where: {
      groupId_disciplineId: {
        groupId: groupBeginners.id,
        disciplineId: sandaDiscipline.id,
      },
    },
    update: { scheduleText: "Lun y Mié 19:00 - 20:30" },
    create: {
      groupId: groupBeginners.id,
      disciplineId: sandaDiscipline.id,
      scheduleText: "Lun y Mié 19:00 - 20:30",
    },
  });

  const groupAdvanced = await prisma.studentGroup.upsert({
    where: { id: "seed-group-adults-advanced" },
    update: {
      name: "Mayores Avanzados",
      minAge: 15,
      maxAge: 99,
      description: "Grupo de adultos nivel avanzado en combate y formas.",
    },
    create: {
      id: "seed-group-adults-advanced",
      brandId: generalBrand.id,
      name: "Mayores Avanzados",
      code: "MAY-AVAN",
      description: "Grupo de adultos nivel avanzado en combate y formas.",
      minAge: 15,
      maxAge: 99,
      isActive: true,
    },
  });

  await prisma.groupDiscipline.upsert({
    where: {
      groupId_disciplineId: {
        groupId: groupAdvanced.id,
        disciplineId: sandaDiscipline.id,
      },
    },
    update: { scheduleText: "Lun, Mié y Vie 20:00 - 21:30" },
    create: {
      groupId: groupAdvanced.id,
      disciplineId: sandaDiscipline.id,
      scheduleText: "Lun, Mié y Vie 20:00 - 21:30",
    },
  });

  // 13. Seed Default 3-Tier Evaluation Rubric Template
  console.log("  -> Seeding Default Evaluation Rubric Template...");
  const defaultRubric = await prisma.evaluationTemplate.upsert({
    where: { id: "seed-template-kungfu-standard" },
    update: {
      title: "Rúbrica Estándar de Examen de Grado",
      isDefault: true,
    },
    create: {
      id: "seed-template-kungfu-standard",
      brandId: generalBrand.id,
      disciplineId: sandaDiscipline.id,
      title: "Rúbrica Estándar de Examen de Grado",
      description: "Plantilla visual semafórica (🟩 100%, 🟡 75%, 🔴 0%) para exámenes.",
      isDefault: true,
    },
  });

  const criteriaData = [
    {
      id: "seed-crit-1",
      name: "Posturas y Formas (Tao Lu / Kata)",
      category: "TECNICA",
      orderIndex: 1,
      description: "Estabilidad de Ma Bu, corrección lineal y ritmo.",
    },
    {
      id: "seed-crit-2",
      name: "Técnicas de Golpe y Patadas",
      category: "TECNICA",
      orderIndex: 2,
      description: "Precisión, extensión y potencia técnica.",
    },
    {
      id: "seed-crit-3",
      name: "Espíritu, Kiai y Actitud",
      category: "ACTITUD",
      orderIndex: 3,
      description: "Enfoque mental, respeto y marcialidad.",
    },
    {
      id: "seed-crit-4",
      name: "Resistencia y Condición Física",
      category: "FISICO",
      orderIndex: 4,
      description: "Desempeño bajo exigencia y recuperación.",
    },
  ];

  for (const crit of criteriaData) {
    await prisma.evaluationCriterion.upsert({
      where: { id: crit.id },
      update: { name: crit.name, description: crit.description, orderIndex: crit.orderIndex },
      create: {
        id: crit.id,
        templateId: defaultRubric.id,
        name: crit.name,
        category: crit.category,
        description: crit.description,
        orderIndex: crit.orderIndex,
      },
    });
  }

  console.log("✅ Database seeding finished cleanly with 100% Upserts.");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

