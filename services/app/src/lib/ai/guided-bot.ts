import type { UserContextForAi } from "./knowledge";

interface GuidedTranslations {
  mainMenu: string;
  route1: string;
  route1_1: string;
  route1_2: string;
  route2: string;
  route2_1: string;
  route3: string;
  route4: string;
  unrecognized: string;
}

function getGuidedTranslations(
  userContext: UserContextForAi
): GuidedTranslations {
  const lang = (userContext.locale || "es").toLowerCase();
  const name = userContext.userName || "Usuario";
  const plan = userContext.planName || "Free";
  const brand = userContext.brandName || "Marca";
  const currency = userContext.brandCurrency || "USD";
  const role = userContext.userRole || "USER";
  const end = userContext.subscriptionEndDate || "N/A";

  if (lang.startsWith("en")) {
    return {
      mainMenu:
        `🤖 **Guided Bot Menu (Structured Mode)**\n\n` +
        `Hello, **${name}**! Select a number or type an option:\n\n` +
        `**[1]** 💳 Subscription Status & Billing\n` +
        `**[2]** 🏢 Brand Settings & Gateways\n` +
        `**[3]** 🔑 Profile, Security & PIN\n` +
        `**[4]** 📞 Technical Support & Help\n\n` +
        `*Reply with the number of your choice (e.g., 1, 2, 3).*`,

      route1:
        `💳 **[Route 1 - Billing & Plans]**\n\n` +
        `Current brand: **${brand}**\n` +
        `• **Active Plan:** ${plan}\n` +
        `• **Currency:** ${currency}\n` +
        `• **Expiration:** ${end}\n\n` +
        `Available options:\n` +
        `• Type **1.1** to learn how to change plans.\n` +
        `• Type **1.2** to view receipt history.\n` +
        `• Type **0** to return to the main menu.`,

      route1_1:
        `ℹ️ **[Route 1.1 - Change Plan]**\n\n` +
        `To change your subscription:\n` +
        `1. Go to **Billing** in the sidebar menu.\n` +
        `2. Select a new plan (Monthly or Yearly).\n` +
        `3. Complete checkout using Clip, Stripe, or MercadoPago.\n\n` +
        `Type **0** to return to the main menu.`,

      route1_2:
        `📜 **[Route 1.2 - Receipt History]**\n\n` +
        `Your past payment receipts are recorded under **Billing > History**.\n\n` +
        `Type **0** to return to the main menu.`,

      route2:
        `🏢 **[Route 2 - Brand Management]**\n\n` +
        `Active brand: **${brand}**\n\n` +
        `• **Payment Gateways:** Connect Clip, Stripe, or MercadoPago.\n` +
        `• **API Key:** Available for external integrations.\n\n` +
        `Available options:\n` +
        `• Type **2.1** to learn how to connect a gateway.\n` +
        `• Type **0** to return to the main menu.`,

      route2_1:
        `⚙️ **[Route 2.1 - Connect Payment Gateway]**\n\n` +
        `To enter private credentials:\n` +
        `1. Go to **Payment Engine** in the sidebar.\n` +
        `2. Click "Add Gateway".\n` +
        `3. Enter your Public Key and Secret Key.\n\n` +
        `Type **0** to return to the main menu.`,

      route3:
        `🔑 **[Route 3 - Security & Profile]**\n\n` +
        `• **User:** ${name}\n` +
        `• **Role:** ${role}\n` +
        `• **Security PIN:** Enabled\n\n` +
        `To update your security PIN or password, visit **Settings**.\n\n` +
        `Type **0** to return to the main menu.`,

      route4:
        `📞 **[Route 4 - Technical Support]**\n\n` +
        `Need human assistance or want to report an issue?\n` +
        `• **Email:** support@example.com\n` +
        `• **Hours:** Monday to Friday (9:00 AM - 6:00 PM UTC)\n\n` +
        `Type **0** to return to the main menu.`,

      unrecognized: `⚠️ Option not recognized.`,
    };
  }

  if (lang.startsWith("pt")) {
    return {
      mainMenu:
        `🤖 **Menu do Bot Guiado (Modo Estruturado)**\n\n` +
        `Olá, **${name}**! Selecione um número ou digite uma opção:\n\n` +
        `**[1]** 💳 Status da Assinatura e Faturamento\n` +
        `**[2]** 🏢 Configurações da Marca e Gateways\n` +
        `**[3]** 🔑 Perfil, Segurança e PIN\n` +
        `**[4]** 📞 Suporte Técnico e Ajuda\n\n` +
        `*Responda com o número desejado (ex. 1, 2, 3).*`,

      route1:
        `💳 **[Rota 1 - Faturamento & Planos]**\n\n` +
        `Marca ativa: **${brand}**\n` +
        `• **Plano Ativo:** ${plan}\n` +
        `• **Moeda:** ${currency}\n` +
        `• **Vencimento:** ${end}\n\n` +
        `Opções disponíveis:\n` +
        `• Digite **1.1** para saber como alterar o plano.\n` +
        `• Digite **1.2** para ver histórico de recibos.\n` +
        `• Digite **0** para voltar ao menu principal.`,

      route1_1:
        `ℹ️ **[Rota 1.1 - Alterar Plano]**\n\n` +
        `Para alterar sua assinatura:\n` +
        `1. Vá para **Faturamento** no menu lateral.\n` +
        `2. Selecione o novo plano (Mensal ou Anual).\n` +
        `3. Conclua o pagamento via Clip, Stripe ou MercadoPago.\n\n` +
        `Digite **0** para voltar ao menu principal.`,

      route1_2:
        `📜 **[Rota 1.2 - Histórico de Recibos]**\n\n` +
        `Seus recibos anteriores estão registrados em **Faturamento > Histórico**.\n\n` +
        `Digite **0** para voltar ao menu principal.`,

      route2:
        `🏢 **[Rota 2 - Gestão da Marca]**\n\n` +
        `Marca ativa: **${brand}**\n\n` +
        `• **Gateways de Pagamento:** Conecte Clip, Stripe ou MercadoPago.\n` +
        `• **Chave de API:** Disponível para integrações externas.\n\n` +
        `Opções disponíveis:\n` +
        `• Digite **2.1** para saber como conectar um gateway.\n` +
        `• Digite **0** para voltar ao menu principal.`,

      route2_1:
        `⚙️ **[Rota 2.1 - Conectar Gateway de Pagamento]**\n\n` +
        `Para inserir credenciais privadas:\n` +
        `1. Vá para **Motor de Pagamentos** no menu lateral.\n` +
        `2. Clique em "Adicionar Gateway".\n` +
        `3. Insira sua Chave Pública e Secret Key.\n\n` +
        `Digite **0** para voltar ao menu principal.`,

      route3:
        `🔑 **[Rota 3 - Segurança e Perfil]**\n\n` +
        `• **Usuário:** ${name}\n` +
        `• **Função:** ${role}\n` +
        `• **PIN de Segurança:** Ativo\n\n` +
        `Para atualizar seu PIN ou senha, acesse **Configurações**.\n\n` +
        `Digite **0** para voltar ao menu principal.`,

      route4:
        `📞 **[Rota 4 - Suporte Técnico]**\n\n` +
        `Precisa de suporte humano ou quer relatar um problema?\n` +
        `• **E-mail:** suporte@empresa.com\n` +
        `• **Horário:** Segunda a Sexta (9:00 - 18:00 UTC)\n\n` +
        `Digite **0** para voltar ao menu principal.`,

      unrecognized: `⚠️ Opção não reconhecida.`,
    };
  }

  // Spanish (default fallback)
  return {
    mainMenu:
      `🤖 **Menú del Bot Guiado (Modo Estructurado)**\n\n` +
      `¡Hola, **${name}**! Selecciona un número o escribe una opción:\n\n` +
      `**[1]** 💳 Estado de Suscripción y Facturación\n` +
      `**[2]** 🏢 Configuración de Marca y Pasarelas\n` +
      `**[3]** 🔑 Perfil, Seguridad y PIN\n` +
      `**[4]** 📞 Soporte Técnico y Ayuda\n\n` +
      `*Responde con el número de la opción deseada (ej. 1, 2, 3).*`,

    route1:
      `💳 **[Ruta 1 - Facturación & Planes]**\n\n` +
      `Actualmente estás en la marca **${brand}**:\n` +
      `• **Plan Activo:** ${plan}\n` +
      `• **Moneda:** ${currency}\n` +
      `• **Vencimiento:** ${end}\n\n` +
      `Opciones disponibles:\n` +
      `• Escribe **1.1** para saber cómo cambiar de plan.\n` +
      `• Escribe **1.2** para ver tus recibos de pago.\n` +
      `• Escribe **0** para regresar al menú principal.`,

    route1_1:
      `ℹ️ **[Ruta 1.1 - Cambiar de Plan]**\n\n` +
      `Para cambiar tu suscripción:\n` +
      `1. Dirígete a la sección **Facturación** en el menú lateral.\n` +
      `2. Selecciona el nuevo plan (Monthly o Yearly).\n` +
      `3. Completa el pago con tu pasarela preferida (Clip, Stripe, MercadoPago).\n\n` +
      `Escribe **0** para regresar al menú principal.`,

    route1_2:
      `📜 **[Ruta 1.2 - Historial de Recibos]**\n\n` +
      `Tus últimos recibos de pago se registran automáticamente en la sección **Facturación > Historial**.\n\n` +
      `Escribe **0** para regresar al menú principal.`,

    route2:
      `🏢 **[Ruta 2 - Gestión de Marca]**\n\n` +
      `Marca activa: **${brand}**\n\n` +
      `• **Pasarelas de Pago:** Puedes conectar Clip, Stripe o MercadoPago.\n` +
      `• **API Key:** Disponibles para integraciones externas.\n\n` +
      `Opciones disponibles:\n` +
      `• Escribe **2.1** para saber cómo conectar una pasarela.\n` +
      `• Escribe **0** para regresar al menú principal.`,

    route2_1:
      `⚙️ **[Ruta 2.1 - Conectar Pasarelas de Pago]**\n\n` +
      `Para ingresar tus credenciales privadas:\n` +
      `1. Ve a **Motor de Pagos** en la barra lateral.\n` +
      `2. Haz clic en "Agregar Pasarela".\n` +
      `3. Ingresa tu Llave Pública y Secret Key.\n\n` +
      `Escribe **0** para regresar al menú principal.`,

    route3:
      `🔑 **[Ruta 3 - Seguridad & Perfil]**\n\n` +
      `• **Usuario:** ${name}\n` +
      `• **Rol Asignado:** ${role}\n` +
      `• **PIN de Seguridad:** Habilitado\n\n` +
      `Para modificar tu PIN de seguridad o cambiar tu contraseña, ve al menú **Configuración**.\n\n` +
      `Escribe **0** para regresar al menú principal.`,

    route4:
      `📞 **[Ruta 4 - Soporte Técnico]**\n\n` +
      `Si requieres asistencia humana o reportar un incidente:\n` +
      `• **Email:** soporte@empresa.com\n` +
      `• **Horario:** Lunes a Viernes (9:00 AM - 6:00 PM UTC)\n\n` +
      `Escribe **0** para regresar al menú principal.`,

    unrecognized: `⚠️ No reconocí la opción.`,
  };
}

export function processGuidedBotResponse(
  userMessage: string,
  userContext: UserContextForAi
): string {
  const msg = userMessage.trim().toLowerCase();
  const t = getGuidedTranslations(userContext);

  if (
    msg === "0" ||
    msg === "menu" ||
    msg === "menú" ||
    msg.includes("hola") ||
    msg.includes("hello") ||
    msg.includes("oi") ||
    msg.includes("inicio")
  ) {
    return t.mainMenu;
  }

  if (msg === "1" || msg.includes("factura") || msg.includes("plan") || msg.includes("pago")) {
    return t.route1;
  }
  if (msg === "1.1") return t.route1_1;
  if (msg === "1.2") return t.route1_2;

  if (msg === "2" || msg.includes("marca") || msg.includes("brand") || msg.includes("gateway")) {
    return t.route2;
  }
  if (msg === "2.1") return t.route2_1;

  if (msg === "3" || msg.includes("seguridad") || msg.includes("pin") || msg.includes("rol")) {
    return t.route3;
  }

  if (msg === "4" || msg.includes("soporte") || msg.includes("ayuda") || msg.includes("contacto")) {
    return t.route4;
  }

  return `${t.unrecognized} "*${userMessage}*"\n\n${t.mainMenu}`;
}
