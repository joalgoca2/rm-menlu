export interface TourStep {
  titleKey: string;
  defaultTitle: string;
  descKey: string;
  defaultDesc: string;
  targetSelector?: string;
}

export interface PageTour {
  pathname: string;
  pageTitleKey: string;
  defaultPageTitle: string;
  steps: TourStep[];
}

export const DASHBOARD_TOURS: Record<string, PageTour> = {
  "/dashboard": {
    pathname: "/dashboard",
    pageTitleKey: "tour.dashboard.title",
    defaultPageTitle: "Dashboard del Dojo",
    steps: [
      {
        titleKey: "tour.dashboard.step1.title",
        defaultTitle: "¡Bienvenido a Menlu Dojo!",
        descKey: "tour.dashboard.step1.desc",
        defaultDesc:
          "Este panel te ofrece una vista global e inteligente del estado de tu escuela de artes marciales.",
      },
      {
        titleKey: "tour.dashboard.step2.title",
        defaultTitle: "Métricas Principales",
        descKey: "tour.dashboard.step2.desc",
        defaultDesc:
          "Monitorea en tiempo real el total de alumnos activos, exámenes vigentes y rachas de esfuerzo.",
      },
      {
        titleKey: "tour.dashboard.step3.title",
        defaultTitle: "Navegación y Gestión",
        descKey: "tour.dashboard.step3.desc",
        defaultDesc:
          "Usa el menú lateral para gestionar grupos, graduaciones, torneos y cobros de tu Dojo.",
      },
    ],
  },
  "/dashboard/groups": {
    pathname: "/dashboard/groups",
    pageTitleKey: "tour.groups.title",
    defaultPageTitle: "Grupos y Clases",
    steps: [
      {
        titleKey: "tour.groups.step1.title",
        defaultTitle: "Gestión de Grupos y Nivel",
        descKey: "tour.groups.step1.desc",
        defaultDesc:
          "Organiza a tus alumnos por horarios o rango de edad (ej. Adultos o Infantiles) en grupos de entrenamiento.",
      },
      {
        titleKey: "tour.groups.step2.title",
        defaultTitle: "Combinación Multi-Disciplina",
        descKey: "tour.groups.step2.desc",
        defaultDesc:
          "¡Un mismo grupo puede practicar varias disciplinas! Activa con la casilla (☑) las artes marciales que entrena la clase (ej. Tai Chi los Martes y Sanda los Jueves).",
      },
      {
        titleKey: "tour.groups.step3.title",
        defaultTitle: "Asignación de Alumnos",
        descKey: "tour.groups.step3.desc",
        defaultDesc:
          "Usa el botón 'Gestionar Alumnos' para inscribir o desinscribir practicantes en el grupo fácilmente.",
      },
      {
        titleKey: "tour.groups.step4.title",
        defaultTitle: "Acciones en Lote y Vistas",
        descKey: "tour.groups.step4.desc",
        defaultDesc:
          "Alterna entre vista en Tabla y Tarjetas. Selecciona múltiples grupos para activarlos, desactivarlos o eliminarlos en masa.",
      },
    ],
  },
  "/dashboard/students": {
    pathname: "/dashboard/students",
    pageTitleKey: "tour.students.title",
    defaultPageTitle: "Padrón de Alumnos",
    steps: [
      {
        titleKey: "tour.students.step1.title",
        defaultTitle: "Alta y Expediente Digital",
        descKey: "tour.students.step1.desc",
        defaultDesc:
          "Registra alumnos con su fotografía de perfil, ficha médica de emergencia, contacto de tutor y seguro.",
      },
      {
        titleKey: "tour.students.step2.title",
        defaultTitle: "Importación Masiva (CSV)",
        descKey: "tour.students.step2.desc",
        defaultDesc:
          "Carga tu lista completa de practicantes desde Excel o CSV en un solo clic (el Asistente Virtual Sensei te guía).",
      },
      {
        titleKey: "tour.students.step3.title",
        defaultTitle: "Cuentas de Acceso al Portal",
        descKey: "tour.students.step3.desc",
        defaultDesc:
          "Crea accesos digitales para que alumnos y tutores consulten sus avances y rachas desde su aplicación.",
      },
      {
        titleKey: "tour.students.step4.title",
        defaultTitle: "Búsqueda y Filtros Rápidos",
        descKey: "tour.students.step4.desc",
        defaultDesc:
          "Encuentra practicantes al instante filtrando por disciplina activa o buscando por nombre, email o seguro.",
      },
      {
        titleKey: "tour.students.step5.title",
        defaultTitle: "Credencial Oficial del Tatami",
        descKey: "tour.students.step5.desc",
        defaultDesc:
          "Imprime credenciales oficiales con código QR y código de barras directamente desde el expediente del alumno.",
      },
      {
        titleKey: "tour.students.step6.title",
        defaultTitle: "Gamificación & Promoción",
        descKey: "tour.students.step6.desc",
        defaultDesc:
          "Monitorea los Puntos XP del Camino del Esfuerzo, racha de clases y promueve de grado o cinturón al alumno.",
      },
    ],
  },
  "/dashboard/exams": {
    pathname: "/dashboard/exams",
    pageTitleKey: "tour.exams.title",
    defaultPageTitle: "Exámenes de Grado",
    steps: [
      {
        titleKey: "tour.exams.step1.title",
        defaultTitle: "Programación de Convocatorias",
        descKey: "tour.exams.step1.desc",
        defaultDesc:
          "Crea convocatorias especificando fecha, cuota/derecho a examen, sinodal encargado, " +
          "rango de edad elegible (mín/máx) y la plantilla de rúbrica a usar.",
      },
      {
        titleKey: "tour.exams.step2.title",
        defaultTitle: "Filtros Avanzados y Vistas",
        descKey: "tour.exams.step2.desc",
        defaultDesc:
          "Filtra exámenes por convocatoria activa o histórica, cinturones objetivos o rangos " +
          "de edad. Alterna libremente entre vista de Tarjetas y Tabla.",
      },
      {
        titleKey: "tour.exams.step3.title",
        defaultTitle: "Candidatos Elegibles y Padrón",
        descKey: "tour.exams.step3.desc",
        defaultDesc:
          "Consulta al instante los practicantes convocados, aprueba su derecho a examen y " +
          "verifica el cumplimiento de requisitos de asistencia y antigüedad.",
      },
      {
        titleKey: "tour.exams.step4.title",
        defaultTitle: "Evaluación Tatami (Semáforo)",
        descKey: "tour.exams.step4.desc",
        defaultDesc:
          "Califica rápido en tatami desde tu móvil o tablet con los 3 botones del semáforo: " +
          "🟩 Dominado (100%), 🟡 En Proceso (75%), 🔴 No Apto (0%).",
      },
      {
        titleKey: "tour.exams.step5.title",
        defaultTitle: "Certificados PDF & Diplomas",
        descKey: "tour.exams.step5.desc",
        defaultDesc:
          "Al finalizar la evaluación, genera e imprime diplomas digitales oficiales de " +
          "graduación en PDF con firmas y código QR para los aprobados.",
      },
      {
        titleKey: "tour.exams.step6.title",
        defaultTitle: "Protección de Registros",
        descKey: "tour.exams.step6.desc",
        defaultDesc:
          "El sistema previene la eliminación accidental de convocatorias si ya existen " +
          "evaluaciones o actas de grado dependientes.",
      },
    ],
  },
  "/dashboard/tournaments": {
    pathname: "/dashboard/tournaments",
    pageTitleKey: "tour.tournaments.title",
    defaultPageTitle: "Torneos Internos",
    steps: [
      {
        titleKey: "tour.tournaments.step1.title",
        defaultTitle: "Competencias del Dojo",
        descKey: "tour.tournaments.step1.desc",
        defaultDesc:
          "Crea torneos de Kumite, Formas (Kata/Taolu) o Sanda para motivar el espíritu competitivo.",
      },
      {
        titleKey: "tour.tournaments.step2.title",
        defaultTitle: "Llaves de Combate",
        descKey: "tour.tournaments.step2.desc",
        defaultDesc:
          "Genera automáticamente las llaves de eliminación y registra los ganadores de cada ronda.",
      },
    ],
  },
  "/dashboard/disciplines": {
    pathname: "/dashboard/disciplines",
    pageTitleKey: "tour.disciplines.title",
    defaultPageTitle: "Disciplinas y Cintas",
    steps: [
      {
        titleKey: "tour.disciplines.step1.title",
        defaultTitle: "Configuración de Marcialidad",
        descKey: "tour.disciplines.step1.desc",
        defaultDesc:
          "Define tus artes marciales (Tai Chi, Karate, Taekwondo, BJJ) y su jerarquía de grados.",
      },
      {
        titleKey: "tour.disciplines.step2.title",
        defaultTitle: "Escala de Cinturones",
        descKey: "tour.disciplines.step2.desc",
        defaultDesc:
          "Asigna los colores de cintas, requisitos de tiempo y clases mínimas para graduarse.",
      },
      {
        titleKey: "tour.disciplines.step3.title",
        defaultTitle: "Plantillas Estándar",
        descKey: "tour.disciplines.step3.desc",
        defaultDesc:
          "Usa el botón 'Cargar Plantilla' para importar en 1-clic la estructura de cinturones " +
          "de artes marciales conocidas.",
      },
      {
        titleKey: "tour.disciplines.step4.title",
        defaultTitle: "Jerarquía y Estado",
        descKey: "tour.disciplines.step4.desc",
        defaultDesc:
          "Usa las flechas (▲/▼) de cada cinturón para ajustar el orden jerárquico de graduación, " +
          "o marca la disciplina como Inactiva.",
      },
    ],
  },
  "/dashboard/evaluations/templates": {
    pathname: "/dashboard/evaluations/templates",
    pageTitleKey: "tour.rubrics.title",
    defaultPageTitle: "Plantillas de Evaluación",
    steps: [
      {
        titleKey: "tour.rubrics.step1.title",
        defaultTitle: "Rúbricas Semafóricas Tatami",
        descKey: "tour.rubrics.step1.desc",
        defaultDesc:
          "Configura rúbricas de evaluación rápida en tatami con 3 estados visuales " +
          "(🟩 100% Dominado, 🟡 75% En proceso, 🔴 0% No Apto).",
      },
      {
        titleKey: "tour.rubrics.step2.title",
        defaultTitle: "Leyenda Visual de Evaluación",
        descKey: "tour.rubrics.step2.desc",
        defaultDesc:
          "Consulta en el panel superior la guía de los 3 estados semafóricos (Verde = Ejecución " +
          "impecable, Amarillo = Ajuste menor, Rojo = Mayor práctica).",
      },
      {
        titleKey: "tour.rubrics.step3.title",
        defaultTitle: "Categorías Marciales",
        descKey: "tour.rubrics.step3.desc",
        defaultDesc:
          "Clasifica cada criterio en TÉCNICA, ACTITUD, FÍSICO o GENERAL para obtener un " +
          "diagnóstico marcial completo del practicante.",
      },
      {
        titleKey: "tour.rubrics.step4.title",
        defaultTitle: "Carga Rápida de Criterios",
        descKey: "tour.rubrics.step4.desc",
        defaultDesc:
          "Al crear una plantilla nueva, el sistema te ofrece 4 criterios clave prediseñados " +
          "(Posturas/Kata, Golpes, Espíritu/Kiai y Condición Física).",
      },
      {
        titleKey: "tour.rubrics.step5.title",
        defaultTitle: "Asignación por Disciplina",
        descKey: "tour.rubrics.step5.desc",
        defaultDesc:
          "Asocia tus rúbricas a una disciplina marcial específica (Kung Fu, Sanda, Taekwondo, " +
          "BJJ) o mantenla general para todo tu Dojo.",
      },
    ],
  },
  "/student/effort-path": {
    pathname: "/student/effort-path",
    pageTitleKey: "tour.effortPath.title",
    defaultPageTitle: "El Camino del Esfuerzo",
    steps: [
      {
        titleKey: "tour.effortPath.step1.title",
        defaultTitle: "Gamificación Estilo Dojo",
        descKey: "tour.effortPath.step1.desc",
        defaultDesc:
          "Los alumnos completan lecciones teóricas y técnicas para mantener su racha de práctica.",
      },
      {
        titleKey: "tour.effortPath.step2.title",
        defaultTitle: "Rachas y Logros",
        descKey: "tour.effortPath.step2.desc",
        defaultDesc:
          "Premia la constancia con medallas virtuales y subidas de nivel en el ranking del Dojo.",
      },
    ],
  },
};
