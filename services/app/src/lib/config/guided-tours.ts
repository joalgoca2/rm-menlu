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
        defaultTitle: "Gestión de Grupos",
        descKey: "tour.groups.step1.desc",
        defaultDesc:
          "Organiza a tus alumnos por disciplinas, edades u horarios en grupos de entrenamiento.",
      },
      {
        titleKey: "tour.groups.step2.title",
        defaultTitle: "Crear Nuevo Grupo",
        descKey: "tour.groups.step2.desc",
        defaultDesc:
          "Haz clic en '+ Nuevo Grupo' para registrar una nueva clase asignando su disciplina y cupos.",
      },
      {
        titleKey: "tour.groups.step3.title",
        defaultTitle: "Asignación de Alumnos",
        descKey: "tour.groups.step3.desc",
        defaultDesc:
          "Desde la tabla o vista en tarjetas, puedes inscribir alumnos y consultar la asistencia.",
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
        defaultTitle: "Directorio de Alumnos",
        descKey: "tour.students.step1.desc",
        defaultDesc:
          "Visualiza la lista completa de practicantes, sus cintas actuales y estado de inscripción.",
      },
      {
        titleKey: "tour.students.step2.title",
        defaultTitle: "Ficha & Credenciales",
        descKey: "tour.students.step2.desc",
        defaultDesc:
          "Accede al perfil de cada alumno para imprimir su credencial oficial o promover su rango.",
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
          "Asigna los colores de cintas, requisitos de tiempo y conocimientos para graduarse.",
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
