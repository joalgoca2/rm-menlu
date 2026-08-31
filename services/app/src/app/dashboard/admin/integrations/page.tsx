import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { IntegrationsClient } from "./integrations-client";

import { getBrandWebhookConfig } from "@/actions/integrations";

export default async function IntegrationsPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const userRoles = session.user.roles ?? [];
  const isAdmin =
    userRoles.includes("SUPER_ADMIN") || userRoles.includes("ADMIN");

  if (!isAdmin) {
    redirect("/dashboard");
  }

  // Active brand selection
  let targetBrandId = session.user.brandId;
  if (!targetBrandId) {
    const firstBrand = await prisma.brand.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    targetBrandId = firstBrand?.id ?? null;
  }

  let brandData = null;
  if (targetBrandId) {
    const brandRes = await getBrandWebhookConfig(targetBrandId);
    if (brandRes.success && brandRes.data) {
      brandData = brandRes.data;
    }
  }

  return (
    <div className="space-y-6">
      <IntegrationsClient
        initialBrand={brandData}
        userBrandId={targetBrandId}
      />
    </div>
  );
}
