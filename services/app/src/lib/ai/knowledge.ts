export interface UserContextForAi {
  userName?: string | null;
  userEmail?: string | null;
  userRole?: string;
  brandName?: string | null;
  brandCurrency?: string;
  planName?: string | null;
  subscriptionEndDate?: string | null;
  hasAiAgentAccess?: boolean;
  locale?: string;
}

export const APP_BUSINESS_KNOWLEDGE = {
  appName: "Next.js Enterprise SaaS Platform",
  targetAudience: "Gestión Multi-tenant B2B y Usuarios Finales",
  modules: [
    {
      name: "Marcas (Brands)",
      description: "Aislamiento multi-tenant con configuración de moneda, i18n y API Keys.",
    },
    {
      name: "Facturación (Billing & Subscriptions)",
      description: "Planes mensuales/anuales, prorrateos y cambio de plan con pasarelas de pago.",
    },
    {
      name: "Motor de Pagos (Payment Engine)",
      description: "Integración con Clip, Stripe, MercadoPago, PSE y simulador Mock.",
    },
    {
      name: "Seguridad & Roles (RBAC)",
      description: "Control de acceso granular por roles, permisos y PIN de seguridad.",
    },
  ],
  adminGuide: [
    "Gestión de marcas y configuración de API Keys.",
    "Monitoreo de logs de webhooks y sincronización de pasarelas de pago.",
    "Administración de usuarios, roles y auditoría de accesos.",
  ],
  userGuide: [
    "Consulta de plan activo y actualización de suscripción.",
    "Configuración de perfil, idioma y zona horaria.",
    "Seguridad de la cuenta y PIN de acceso.",
  ],
};

export function buildSystemPrompt(context: UserContextForAi): string {
  const roleName = context.userRole || "USER";
  const isAdmin = roleName.includes("ADMIN");

  const roleInstructions = isAdmin
    ? "El usuario es ADMINISTRADOR. Enfócate en gestión de marcas, cobros, usuarios y ajustes."
    : "El usuario es MIEMBRO/CLIENTE. Enfócate en su perfil, suscripción activa y uso básico.";

  const guideList = isAdmin
    ? APP_BUSINESS_KNOWLEDGE.adminGuide
    : APP_BUSINESS_KNOWLEDGE.userGuide;

  return [
    `Eres el Asistente de IA oficial de ${APP_BUSINESS_KNOWLEDGE.appName}.`,
    roleInstructions,
    "",
    "DATOS EN TIEMPO REAL DEL USUARIO (SISTEMA):",
    `- Nombre: ${context.userName || "Usuario"}`,
    `- Email: ${context.userEmail || "N/A"}`,
    `- Rol: ${roleName}`,
    `- Marca Activa: ${context.brandName || "Sin Marca"}`,
    `- Plan Actual: ${context.planName || "Free"}`,
    `- Vencimiento Plan: ${context.subscriptionEndDate || "N/A"}`,
    `- Moneda: ${context.brandCurrency || "USD"}`,
    "",
    "GUÍA DE NEGOCIO:",
    ...guideList.map((g) => `- ${g}`),
    "",
    "INSTRUCCIONES Y LÍMITES DE DOMINIO (GUARDRAILS):",
    "1. Responde de forma amable, clara y concisa en el idioma del usuario.",
    "2. Usa formato Markdown (negritas, listas, código si aplica).",
    "3. No inventes funcionalidades fuera del sistema.",
    "4. LÍMITE DE DOMINIO: Eres EXCLUSIVAMENTE un asistente de esta aplicación. Si el usuario te pregunta sobre temas no relacionados con la aplicación o su negocio (por ejemplo: política, deportes, noticias, entretenimiento u opiniones personales), DEBES responder amablemente declinando la respuesta y reorientándolo a las funciones y soporte del sistema.",
  ].join("\n");
}
