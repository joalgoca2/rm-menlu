# 🛠️ Especificación Técnica y Funcional del Producto
## Platform: Menlu 门路 (SaaS B2B para Escuelas de Artes Marciales)

---

## 1. 🏗️ Arquitectura General del Sistema

**Menlu** está construido sobre una arquitectura **Multi-Tenant (Brand-Isolated)**, donde cada escuela de artes marciales es una entidad independiente (`Brand`) que administra sus propias disciplinas, miembros, instructores, cobros, torneos y catálogo.

```
                    ┌──────────────────────────────────────────┐
                    │               SUPER ADMIN                │
                    │   (Gestión SaaS, Planes, Pasarelas)      │
                    └────────────────────┬─────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
     ┌───────────▼───────────┐                       ┌───────────▼───────────┐
     │   BRAND: ACADEMIA A   │                       │   BRAND: ACADEMIA B   │
     │  (Sensei / Dojo Admin)│                       │  (Sensei / Dojo Admin)│
     └───────────┬───────────┘                       └───────────┬───────────┘
                 │                                               │
    ┌────────────┼────────────┐                     ┌────────────┼────────────┐
    │            │            │                     │            │            │
┌───▼───┐    ┌───▼───┐    ┌───▼───┐             ┌───▼───┐    ┌───▼───┐    ┌───▼───┐
│Tai Chi│    │ Sanda │    │Wing Ch│             │Karate │    │  BJJ  │    │ Judo  │
└───┬───┘    └───┬───┘    └───┬───┘             └───┬───┘    └───┬───┘    └───┬───┘
    │            │            │                     │            │            │
 ┌──▼────────────▼────────────▼──┐               ┌──▼────────────▼────────────▼──┐
 │  ESTUDIANTES & TUTORES (PADRES)│               │  ESTUDIANTES & TUTORES (PADRES)│
 └───────────────────────────────┘               └───────────────────────────────┘

       ▲                                                               ▲
       │                                                               │
       └────────────── API Sync de Resultados y Puntos XP ─────────────┘
                                       ▲
                                       │
                ┌──────────────────────┴──────────────────────┐
                │   MENLU TOURNAMENT EDITION (Standalone App) │
                │  (Macro-Torneos, Marcadores TV, Básculas QR)│
                └─────────────────────────────────────────────┘
```

---

## 2. 👥 Roles y Permisos (RBAC System)

1. **Super Admin**:
   - Monitoreo global de la infraestructura SaaS.
   - Creación de planes de suscripción de la plataforma **Menlu**.
   - Habilitación de integraciones de pasarelas globales (Stripe, Clip, MercadoPago, PSE).
2. **Dojo Admin / Sensei Principal**:
   - Configuración del Dojo, logo, moneda local y pasarelas preferidas.
   - Alta de disciplinas (Tai Chi, Sanda, Wing Chun, etc.) y definición de programas de cinturones.
   - Control financiero, cobro de mensualidades y reporte de caja (efectivo vs digital).
   - Creación y administración de Torneos Internos con llaves (brackets) de combate.
3. **Instructor / Coach**:
   - Registro de pases de lista y asistencia rápida en Tatami.
   - Creación de retos físicos parametrizados por edad y grado (ej. 10 flexiones para 8-12 años).
   - Evaluación digital en exámenes de grado y arbitraje de combates.
4. **Estudiante (Alumno)**:
   - Acceso al mapa del "Camino del Esfuerzo" (Gamificación).
   - Visualización de su racha de asistencia, XP, medallas de torneo y tienda de recompensas.
   - Envío de evidencia o marca de retos físicos completados.
5. **Tutor / Padre de Familia**:
   - Gestión multi-perfil: Un solo usuario para controlar y pagar la mensualidad de 2 o más hijos.
   - Inscripción de hijos a torneos internos y revisión de progreso.

---

## 3. 🎯 Módulo Gamificado: "El Camino del Esfuerzo"

### A. Mecánicas de Juego (Game Loop)
* **Racha de Asistencia (Streaks)**: El estudiante debe asistir al menos X días a la semana para mantener su racha encendida.
* **Escudos de Racha (Streak Freeze)**: Otorgados al cumplir metas o canjeables por Puntos de Esfuerzo (XP) para evitar perder la racha en caso de enfermedad o viaje.
* **Retos Físicos Adaptativos**:
  - Segmentados automáticamente por **Edad** (`minAge` / `maxAge`) y **Grado** (`targetBeltId`).
  - Ejemplo 1: Alumno de 6 años ➔ Reto de 10 saltos de rana (30 XP).
  - Ejemplo 2: Alumno de 22 años ➔ Reto de 30 flexiones de pecho diamantadas (50 XP).

### B. Canje de Recompensas (Honor Shop)
* **Premios Físicos**: Parches bordados para el gi/dobok, llaveros, cintas especiales, pegatinas.
* **Premios de Honor**: Ser el monitor de la clase, elegir la música de entrenamiento, 10% de descuento en el próximo examen de grado.

---

## 4. 🏆 Módulo de Torneos (Internos y Standalone)

### A. Torneos Internos en Menlu Core
- Creación de categorías por **Edad, Género, Rango de Cinturón y Peso**.
- Generación automática de **Brackets de Eliminación Directa**.
- Asignación instantánea de **+100 XP** y medalla digital al perfil del alumno ganador.

### B. Menlu Tournament Edition (Futuro Standalone App)
- Desarrollo independiente en **Next.js** para aislar picos masivos de tráfico en fin de semana.
- **Scoreboard Digital para TVs en Tatami**: Control de cronómetro, puntos y faltas (esquina roja vs. azul).
- **Módulo de Pesaje con Código QR**: Confirmación de peso en báscula antes del combate.
- Sincronización vía API con las cuentas de los alumnos en Menlu.

---

## 5. 💳 Motor de Pagos e Inventarios

* **Pagos en Efectivo / Caja**: El recepcionista o Sensei registra pagos presenciales con emisión instantánea de comprobante digital.
* **Pasarelas de Pago**: Integración nativa con **Clip, Stripe, MercadoPago, SPEI y PSE**. El dinero va directamente a la cuenta del Dojo.
* **Venta de Uniformes e Insumos**: Punto de venta (POS) integrado para registrar ventas de equipo (Gis, bucales, espinilleras) asociado a la cuenta del alumno.

---

## 6. 🌐 Soporte Multi-Idioma (i18n) y Temas

* Sistema preparado desde la base para **Español (`es`)** e **Inglés (`en`)**.
* Soporte nativo para **Light Mode** y **Dark Mode** con Tailwind CSS v4 para uso cómodo en ambientes de dojo o uso nocturno de los alumnos.
