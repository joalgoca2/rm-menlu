import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";

export async function GET(req: Request) {
  return handleBrandStatus(req);
}

export async function POST(req: Request) {
  return handleBrandStatus(req);
}

async function handleBrandStatus(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");
    const apiKeyHeader = req.headers.get("x-api-key");
    const apiKey = apiKeyHeader || authHeader;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "API Key no proporcionada (Use el encabezado X-API-Key).",
        },
        { status: 401 }
      );
    }

    const allBrands = await prisma.brand.findMany({
      where: { apiKey: { not: null } },
      select: {
        id: true,
        name: true,
        defaultLocale: true,
        timezone: true,
        isWebhookEnabled: true,
        apiKey: true,
      },
    });

    const brand = allBrands.find(
      (b) => b.apiKey && (b.apiKey === apiKey || decryptSecret(b.apiKey) === apiKey)
    );

    if (!brand) {
      return NextResponse.json(
        { success: false, error: "API Key de marca inválida." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        brandId: brand.id,
        brandName: brand.name,
        locale: brand.defaultLocale,
        timezone: brand.timezone,
        isWebhookEnabled: brand.isWebhookEnabled,
        serverTimeUtc: new Date().toISOString(),
        status: "OPERATIONAL",
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error interno del servidor.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
