"use client";

import Link from "next/link";
import {
  Swords,
  Flame,
  Trophy,
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle2,
  Zap,
  Award,
  ShieldCheck,
  Calendar,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/providers/i18n-provider";

export default function HomePage() {
  const { t, locale } = useTranslation();
  const isBillingEnabled = process.env.NEXT_PUBLIC_ENABLE_BILLING !== "false";

  return (
    <main
      key={locale}
      className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white transition-colors duration-200 selection:bg-amber-500 selection:text-zinc-950"
    >
      {/* 1. Hero Section */}
      <div className="relative overflow-hidden pt-12 pb-16 px-6 max-w-7xl mx-auto flex flex-col items-center text-center space-y-8">
        {/* Transparent Martial Arts Collage Background */}
        <div className="absolute inset-0 -z-10 pointer-events-none flex items-center justify-center overflow-hidden">
          <img
            src="/images/dojo-hero-bg.png"
            alt="Kung Fu, BJJ & Taekwondo"
            className="w-full h-full max-w-6xl object-cover opacity-60 dark:opacity-75 rounded-3xl"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/40 via-zinc-50/10 to-zinc-50 dark:from-zinc-950/50 dark:via-zinc-950/20 dark:to-zinc-950" />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold backdrop-blur-xl">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          {t("landing.badge", "Plataforma B2B SaaS para Escuelas de Artes Marciales en Latinoamérica")}
        </div>

        <h1
          className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-5xl bg-gradient-to-b from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500 bg-clip-text text-transparent leading-tight"
        >
          Menlu 门路 <br />
          <span className="text-amber-500">
            {t("landing.heroTitlePre", "Gestión Inteligente & Gamificación")}
          </span>{" "}
          {t("landing.heroTitlePost", "para tu Dojo")}
        </h1>

        <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl text-base sm:text-lg leading-relaxed">
          {t(
            "landing.heroDesc",
            "Administra múltiples disciplinas (Tai Chi, Sanda, Wing Chun, Taekwondo, Karate, BJJ), automatiza los cobros en efectivo o pasarelas locales, y motiva a tus alumnos con la app gamificada 'El Camino del Esfuerzo'."
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Button
            asChild
            size="lg"
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-2xl px-10 shadow-xl shadow-amber-500/25 text-base hover:scale-105 transition-all"
          >
            <Link href="/dashboard">
              {t("landing.heroCta", "Ir al Dashboard del Dojo")} <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Real UI Preview: Dashboard Summary Card */}
        <div className="w-full max-w-5xl mt-6 p-5 sm:p-6 rounded-3xl border border-amber-500/30 bg-white dark:bg-zinc-900/90 backdrop-blur-2xl shadow-2xl space-y-6 text-left">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-black border border-amber-500/40">
                <Swords className="h-5 w-5" />
              </div>
              <div>
                <div className="font-extrabold text-base text-zinc-900 dark:text-white">
                  {t("landing.previewAdminHello", "Hola, Admin")}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t("landing.previewAdminSub", "Resumen global del sistema, gobierno de marcas y auditoría")}
                </div>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/30">
              SUPER_ADMIN
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-950/80 border border-amber-500/20">
              <div className="text-[11px] font-bold tracking-wider uppercase text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                <span>{t("dashboard.totalUsers", "Usuarios Totales")}</span>
                <Users className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-zinc-900 dark:text-white mt-2">
                4
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">{t("dashboard.usersInScope", "Cuentas en el alcance activo")}</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-950/80 border border-amber-500/20">
              <div className="text-[11px] font-bold tracking-wider uppercase text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                <span>{t("dojo.examsTitle", "Exámenes de Grado")}</span>
                <Award className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-500 mt-2">
                3
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">{t("landing.previewActiveExams", "Convocatorias activas")}</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-950/80 border border-amber-500/20">
              <div className="text-[11px] font-bold tracking-wider uppercase text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                <span>{t("landing.previewAvgStreak", "Racha Promedio")}</span>
                <Flame className="h-4 w-4 text-orange-500" />
              </div>
              <div className="text-2xl font-black text-orange-500 mt-2">
                4 sem
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">{t("landing.previewConstancy", "Constancia de alumnos")}</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-950/80 border border-amber-500/20">
              <div className="text-[11px] font-bold tracking-wider uppercase text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                <span>{t("dashboard.systemStatus", "Estado del Servicio")}</span>
                <Activity className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-sm font-black text-emerald-500 mt-2 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {t("dashboard.operational", "Operativo 100%")}
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">{t("dashboard.dbStatus", "Servicios activos en UTC")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Grid de Características Clave */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 rounded-3xl border border-amber-500/20 bg-white dark:bg-zinc-900/50 shadow-xs dark:shadow-none space-y-3 hover:border-amber-500/40 transition-all text-left">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Swords className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
            {t("dojo.disciplinesTitle", "Disciplinas & Cursos")}
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {t(
              "landing.featMultiDesc",
              "Administra cursos de Tai Chi, Sanda, Wing Chun o Karate de forma independiente, con sus propias escalas de cinturones y requisitos."
            )}
          </p>
        </div>

        <div className="p-6 rounded-3xl border border-amber-500/20 bg-white dark:bg-zinc-900/50 shadow-xs dark:shadow-none space-y-3 hover:border-orange-500/40 transition-all text-left">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <Flame className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
            {t("dojo.effortPathTitle", "El Camino del Esfuerzo")}
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {t(
              "landing.featEffortDesc",
              "Gamificación estilo Duolingo con rachas de asistencia, retos físicos por edad (flexiones, sentadillas) y canje de premios en la Tienda del Dojo."
            )}
          </p>
        </div>

        <div className="p-6 rounded-3xl border border-amber-500/20 bg-white dark:bg-zinc-900/50 shadow-xs dark:shadow-none space-y-3 hover:border-indigo-500/40 transition-all text-left">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Trophy className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
            {t("dojo.tournamentsTitle", "Torneos Internos")}
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {t(
              "landing.featTournamentsDesc",
              "Generación automática de gráficas de eliminación directa (brackets) por peso, edad y cinturón con premiación directa en XP."
            )}
          </p>
        </div>
      </div>

      {/* Visual Showcase Banner with Martial Arts Artwork */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 shadow-2xl bg-zinc-950 text-white p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute inset-0 -z-0 opacity-50">
            <img
              src="/images/dojo-hero-bg.png"
              alt="Martial Arts Collage"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
          </div>

          <div className="relative z-10 space-y-4 max-w-xl text-left">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {t("landing.bannerBadge", "Todas las Disciplinas en Un Solo Lugar")}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              {t("landing.bannerTitle", "Kung Fu • Brazilian Jiu-Jitsu • Taekwondo • Karate")}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {t(
                "landing.bannerDesc",
                "Diseñado específicamente para escuelas que imparten artes marciales mixtas o tradicionales, respetando la filosofía de honor, constancia y superación de cada movimiento."
              )}
            </p>
          </div>

          <div className="relative z-10 shrink-0">
            <Button
              asChild
              size="lg"
              className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-2xl px-6 text-sm shadow-lg shadow-amber-500/20"
            >
              <Link href="/dashboard">
                {t("landing.bannerCta", "Explorar Plataforma")} <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Real UI Showcase: El Camino del Esfuerzo */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="p-8 md:p-12 rounded-3xl border border-amber-500/30 bg-gradient-to-tr from-amber-500/10 via-zinc-900/40 to-zinc-950 text-left grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">
              <Flame className="h-4 w-4" /> {t("landing.gamificationBadge", "Gamificación Exclusiva de Menlu")}
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
              {t("landing.gamificationTitle", "Motiva a tus Alumnos a no faltar jamás al Dojo")}
            </h2>

            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {t(
                "landing.gamificationDesc",
                "'El Camino del Esfuerzo' convierte la disciplina diaria en un juego estimulante. Los alumnos acumulan XP asistiendo a clase, registrando retos físicos supervisados y desbloqueando parches y reconocimientos en su expediente."
              )}
            </p>

            <div className="space-y-3 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span>{t("landing.gamificationItem1", "Rachas de asistencia semanales con escudos de protección")}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span>{t("landing.gamificationItem2", "Retos físicos personalizados por grupo de edad (flexiones, sentadillas)")}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span>{t("landing.gamificationItem3", "Tienda del Dojo para canjear XP por premios y parches oficiales")}</span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                asChild
                size="lg"
                className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-extrabold rounded-2xl px-6 text-xs sm:text-sm"
              >
                <Link href="/student/effort-path">
                  {t("landing.gamificationBtn", "🎮 Probar Vista del Alumno")} <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Student Profile Card Showcase */}
          <div className="p-6 rounded-3xl border border-amber-500/30 bg-zinc-950/90 shadow-2xl space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-2xl font-black border border-amber-500/30">
                  🥋
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Carlos Mendoza</div>
                  <div className="text-xs text-amber-400 font-semibold">
                    {t("landing.yellowBeltLabel", "Cinturón Amarillo • Sanda (Sanshou)")}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-zinc-950 px-4 py-2 rounded-xl border border-amber-500/20 text-xs">
                <div className="flex items-center gap-1 text-amber-400 font-bold">
                  <Sparkles className="h-4 w-4" /> 340 XP
                </div>
                <div className="h-4 w-px bg-zinc-800" />
                <div className="flex items-center gap-1 text-orange-400 font-bold">
                  <Flame className="h-4 w-4 fill-orange-500" /> 4 sem
                </div>
                <div className="h-4 w-px bg-zinc-800" />
                <div className="flex items-center gap-1 text-cyan-400 font-bold">
                  <ShieldCheck className="h-4 w-4" /> 1
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="font-semibold text-amber-200">
                    {t("landing.attendanceClass1", "Pase de Lista - Clase 1")}
                  </span>
                </div>
                <span className="font-bold text-emerald-400">+20 XP</span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="font-semibold text-amber-200">
                    {t("landing.pushupsTask", "10 Flexiones de Pecho")}
                  </span>
                </div>
                <span className="font-bold text-emerald-400">+30 XP</span>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-900 border border-amber-500/20 flex items-center justify-between text-xs opacity-80">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-400" />
                  <span className="font-semibold text-white">
                    {t("landing.squatsTask", "20 Sentadillas Explosivas (En progreso)")}
                  </span>
                </div>
                <span className="font-bold text-amber-400">+40 XP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Exámenes de Grado & Torneos Internos Showcase */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
        <div className="p-6 rounded-3xl border border-amber-500/20 bg-white dark:bg-zinc-900/50 space-y-4 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider">
              <Award className="h-4 w-4" /> {t("landing.rubricsHeader", "Exámenes de Grado & Rúbricas")}
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-extrabold border border-amber-500/30">
              {t("landing.rubricsBadge", "CONVOCATORIA")}
            </span>
          </div>

          <h3 className="text-xl font-black text-zinc-900 dark:text-white">
            {t("landing.rubricsTitle", "Rúbricas Semafóricas & Certificación")}
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {t(
              "landing.rubricsDesc",
              "Evalúa posturas, katas y marcialidad con semáforo visual (🟩 100%, 🟡 75%, 🔴 0%) y emite diplomas digitales en PDF listos para imprimir."
            )}
          </p>

          <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-950 border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-white">
              <span>{t("landing.autumnExamTitle", "Examen de Grado Otoño")}</span>
              <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                Tai Chi
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-amber-500" /> 2026-10-15
              </span>
              <span>{t("landing.examFeeLabel", "Derecho: $1,000 MXN")}</span>
            </div>
            <div className="pt-1">
              <div className="w-full py-2 bg-amber-500/10 border border-amber-500/30 text-amber-500 font-bold rounded-xl text-xs text-center">
                {t("landing.viewResultsBtn", "✓ Ver Resultados & Certificados")}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-amber-500/20 bg-white dark:bg-zinc-900/50 space-y-4 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Trophy className="h-4 w-4" /> {t("landing.weighInHeader", "Torneos Internos & Pesaje")}
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-extrabold border border-emerald-500/30">
              {t("landing.weighInBadge", "PASO 1: PESAJE")}
            </span>
          </div>

          <h3 className="text-xl font-black text-zinc-900 dark:text-white">
            {t("landing.bracketsTitle", "Brackets Automáticos & Marcador")}
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {t(
              "landing.bracketsDesc",
              "Gestiona la confirmación de asistencia, pesaje de competidores, llaves de eliminación directa y marcadores en vivo para tu Dojo."
            )}
          </p>

          <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-950 border border-amber-500/20 space-y-3">
            <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center justify-between">
              <span>Otoño 2026</span>
              <span className="text-[10px] text-amber-500 font-bold">
                {t("landing.autumnCategory", "Sanda Infantil -35Kg")}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 font-bold flex items-center justify-between">
                <span>Carlos Mendoza</span>
                <span className="text-[9px] text-emerald-400">{t("landing.presentStatus", "PRESENTE")}</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 font-bold flex items-center justify-between">
                <span>Sofía Ramírez</span>
                <span className="text-[9px] text-emerald-400">{t("landing.presentStatus", "PRESENTE")}</span>
              </div>
            </div>

            <div className="pt-1">
              <div className="w-full py-2 bg-emerald-500 text-zinc-950 font-black rounded-xl text-xs text-center">
                {t("landing.startFightsBtn", "🚀 Iniciar Combates")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Sección de Precios LatAm */}
      {isBillingEnabled && (
        <div className="max-w-7xl mx-auto px-6 py-16 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-zinc-900 dark:text-white">
              {t("landing.pricingTitle", "Planes Flexibles para tu Escuela")}
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {t("landing.pricingDesc", "Precios ajustados a la capacidad de pago del mercado latinoamericano.")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Plan Starter */}
            <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-xs dark:shadow-none space-y-6 flex flex-col justify-between">
              <div className="space-y-4 text-left">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                    {t("landing.planStarterTitle", "Menlu Starter")}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {t("landing.planStarterSub", "Ideal para dojos independientes")}
                  </p>
                </div>
                <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
                  $19 USD{" "}
                  <span className="text-xs text-zinc-500 font-normal">
                    / mes (~$380 MXN)
                  </span>
                </div>
                <ul className="text-xs text-zinc-700 dark:text-zinc-300 space-y-2">
                  <li>{t("landing.planStarterF1", "✓ Hasta 50 Alumnos")}</li>
                  <li>{t("landing.planStarterF2", "✓ 1 Disciplina")}</li>
                  <li>{t("landing.planStarterF3", "✓ Pagos en Efectivo / Transferencia")}</li>
                  <li>{t("landing.planStarterF4", "✓ Control de Asistencia")}</li>
                </ul>
              </div>
              <Button
                asChild
                variant="outline"
                className="w-full rounded-xl border-zinc-300 dark:border-zinc-800"
              >
                <Link href="/dashboard">
                  {t("landing.planStarterBtn", "Comenzar Prueba")}
                </Link>
              </Button>
            </div>

            {/* Plan Pro */}
            <div className="p-6 rounded-3xl border-2 border-amber-500 bg-gradient-to-b from-amber-500/10 to-zinc-100 dark:to-zinc-900/80 space-y-6 flex flex-col justify-between shadow-xl shadow-amber-500/10">
              <div className="space-y-4 text-left">
                <div className="inline-block px-3 py-0.5 rounded-full bg-amber-500 text-zinc-950 font-extrabold text-[10px] uppercase">
                  {t("landing.popularBadge", "Más Popular")}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                    {t("landing.planProTitle", "Menlu Pro")}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {t("landing.planProSub", "Para escuelas multi-disciplina")}
                  </p>
                </div>
                <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
                  $39 USD{" "}
                  <span className="text-xs text-zinc-500 font-normal">
                    / mes (~$780 MXN)
                  </span>
                </div>
                <ul className="text-xs text-zinc-800 dark:text-zinc-200 space-y-2 font-medium">
                  <li>{t("landing.planProF1", "✓ Hasta 150 Alumnos")}</li>
                  <li>{t("landing.planProF2", "✓ Multi-Disciplina (Ilimitada)")}</li>
                  <li>{t("landing.planProF3", "✓ Pasarelas (Clip, MercadoPago, SPEI, PSE)")}</li>
                  <li>{t("landing.planProF4", "✓ 'El Camino del Esfuerzo' Gamificación")}</li>
                  <li>{t("landing.planProF5", "✓ Torneos Internos con Brackets")}</li>
                </ul>
              </div>
              <Button
                asChild
                className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl"
              >
                <Link href="/dashboard">
                  {t("landing.planProBtn", "Elegir Plan Pro")}
                </Link>
              </Button>
            </div>

            {/* Plan Master */}
            <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-xs dark:shadow-none space-y-6 flex flex-col justify-between">
              <div className="space-y-4 text-left">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                    {t("landing.planMasterTitle", "Menlu Master")}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {t("landing.planMasterSub", "Para franquicias y varias sedes")}
                  </p>
                </div>
                <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
                  $79 USD{" "}
                  <span className="text-xs text-zinc-500 font-normal">
                    / mes (~$1,580 MXN)
                  </span>
                </div>
                <ul className="text-xs text-zinc-700 dark:text-zinc-300 space-y-2">
                  <li>{t("landing.planMasterF1", "✓ Alumnos Ilimitados")}</li>
                  <li>{t("landing.planMasterF2", "✓ Multi-Sede y Franquicias")}</li>
                  <li>{t("landing.planMasterF3", "✓ Reportes Financieros Avanzados")}</li>
                  <li>{t("landing.planMasterF4", "✓ App Personalizada Marca Blanca")}</li>
                </ul>
              </div>
              <Button
                asChild
                variant="outline"
                className="w-full rounded-xl border-zinc-300 dark:border-zinc-800"
              >
                <Link href="/dashboard">
                  {t("landing.planMasterBtn", "Contactar Ventas")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
