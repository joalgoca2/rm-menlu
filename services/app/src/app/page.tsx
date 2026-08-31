"use client";

import Link from "next/link";
import { Swords, Flame, Trophy, Award, CreditCard, Shield, Users, ArrowRight } from "lucide-react";
import { useTranslation } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-zinc-950 text-white selection:bg-amber-500 selection:text-zinc-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-12 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-semibold backdrop-blur-xl">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          Plataforma B2B SaaS para Escuelas de Artes Marciales en Latinoamérica
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-5xl bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent leading-tight">
          Menlu 门路 <br />
          <span className="text-amber-500">Gestión Inteligente & Gamificación</span> para tu Dojo
        </h1>

        <p className="text-zinc-400 max-w-2xl text-base sm:text-lg leading-relaxed">
          Administra múltiples disciplinas (Tai Chi, Sanda, Wing Chun, Taekwondo, Karate, BJJ), automatiza los cobros en efectivo o pasarelas locales, y motiva a tus alumnos con la app gamificada **"El Camino del Esfuerzo"**.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Link href="/dashboard">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-2xl px-8 shadow-lg shadow-amber-500/20 text-base">
              Ir al Dashboard del Dojo <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
          <Link href="/student/effort-path">
            <Button size="lg" variant="outline" className="border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-white rounded-2xl px-8 text-base">
              🎮 Ver Portal Gamificado (Alumno)
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid de Características Clave */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/50 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Swords className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Multi-Disciplina Nativa</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Administra cursos de Tai Chi, Sanda, Wing Chun o Karate de forma independiente, con sus propias escalas de cinturones y requisitos.
          </p>
        </div>

        <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/50 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
            <Flame className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white">El Camino del Esfuerzo</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Gamificación estilo Duolingo con rachas de asistencia, retos físicos por edad (flexiones, sentadillas) y canje de premios en la Tienda del Dojo.
          </p>
        </div>

        <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/50 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Trophy className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Torneos Internos & Brackets</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Generación automática de gráficas de eliminación directa (brackets) por peso, edad y cinturón con premiación directa en XP.
          </p>
        </div>
      </div>

      {/* Sección de Precios LatAm */}
      <div className="max-w-7xl mx-auto px-6 py-16 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-white">Planes Flexibles para tu Escuela</h2>
          <p className="text-xs text-zinc-400">Precios ajustados a la capacidad de pago del mercado latinoamericano.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Plan Starter */}
          <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/40 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">Menlu Starter</h3>
                <p className="text-xs text-zinc-400">Ideal para dojos independientes</p>
              </div>
              <div className="text-3xl font-black text-amber-400">
                $19 USD <span className="text-xs text-zinc-500 font-normal">/ mes (~$380 MXN)</span>
              </div>
              <ul className="text-xs text-zinc-300 space-y-2">
                <li>✓ Hasta 50 Alumnos</li>
                <li>✓ 1 Disciplina</li>
                <li>✓ Pagos en Efectivo / Transferencia</li>
                <li>✓ Control de Asistencia</li>
              </ul>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full rounded-xl border-zinc-800">Comenzar Prueba</Button>
            </Link>
          </div>

          {/* Plan Pro */}
          <div className="p-6 rounded-3xl border-2 border-amber-500 bg-gradient-to-b from-amber-500/10 to-zinc-900/80 space-y-6 flex flex-col justify-between shadow-xl shadow-amber-500/10">
            <div className="space-y-4">
              <div className="inline-block px-3 py-0.5 rounded-full bg-amber-500 text-zinc-950 font-extrabold text-[10px] uppercase">
                Más Popular
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Menlu Pro</h3>
                <p className="text-xs text-zinc-400">Para escuelas multi-disciplina</p>
              </div>
              <div className="text-3xl font-black text-amber-400">
                $39 USD <span className="text-xs text-zinc-500 font-normal">/ mes (~$780 MXN)</span>
              </div>
              <ul className="text-xs text-zinc-200 space-y-2 font-medium">
                <li>✓ Hasta 150 Alumnos</li>
                <li>✓ Multi-Disciplina (Ilimitada)</li>
                <li>✓ Pasarelas (Clip, MercadoPago, SPEI, PSE)</li>
                <li>✓ "El Camino del Esfuerzo" Gamificación</li>
                <li>✓ Torneos Internos con Brackets</li>
              </ul>
            </div>
            <Link href="/dashboard">
              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl">Elegir Plan Pro</Button>
            </Link>
          </div>

          {/* Plan Master */}
          <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/40 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">Menlu Master</h3>
                <p className="text-xs text-zinc-400">Para franquicias y varias sedes</p>
              </div>
              <div className="text-3xl font-black text-amber-400">
                $79 USD <span className="text-xs text-zinc-500 font-normal">/ mes (~$1,580 MXN)</span>
              </div>
              <ul className="text-xs text-zinc-300 space-y-2">
                <li>✓ Alumnos Ilimitados</li>
                <li>✓ Multi-Sede y Franquicias</li>
                <li>✓ Reportes Financieros Avanzados</li>
                <li>✓ App Personalizada Marca Blanca</li>
              </ul>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full rounded-xl border-zinc-800">Contactar Ventas</Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
