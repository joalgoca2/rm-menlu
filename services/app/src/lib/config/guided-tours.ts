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
        defaultTitle: "Convocatorias a Examen",
        descKey: "tour.exams.step1.desc",
        defaultDesc:
          "Programa convocatorias de graduación y asigna los sinodales encargados de la evaluación.",
      },
      {
        titleKey: "tour.exams.step2.title",
        defaultTitle: "Evaluación & Rúbricas",
        descKey: "tour.exams.step2.desc",
        defaultDesc:
          "Califica a los alumnos usando las plantillas de rúbricas configuradas para su disciplina.",
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
          "Usa el botón 'Cargar Plantilla' para importar en 1-clic la estructura de cinturones de artes marciales conocidas.",
      },
      {
        titleKey: "tour.disciplines.step4.title",
        defaultTitle: "Jerarquía y Estado",
        descKey: "tour.disciplines.step4.desc",
        defaultDesc:
          "Usa las flechas (▲/▼) de cada cinturón para ajustar el orden jerárquico de graduación, o marca la disciplina como Inactiva.",
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
        defaultTitle: "Plantillas y Rúbricas",
        descKey: "tour.rubrics.step1.desc",
        defaultDesc:
          "Diseña rúbricas estandarizadas para evaluar formas, técnica y acondicionamiento físico.",
      },
      {
        titleKey: "tour.rubrics.step2.title",
        defaultTitle: "Criterios Personalizados",
        descKey: "tour.rubrics.step2.desc",
        defaultDesc:
          "Crea criterios de evaluación con puntajes específicos para cada grado o cinturón.",
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
