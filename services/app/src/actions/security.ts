"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

export async function updateSecurityPinAction(
  pin: string
): Promise<ApiResponse<boolean>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const trimmedPin = pin.trim();
    if (!/^\d{4,6}$/.test(trimmedPin)) {
      return { success: false, error: "PIN must be 4 to 6 numeric digits" };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { securityPin: trimmedPin },
    });

    return { success: true, data: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update PIN";
    return { success: false, error: msg };
  }
}

export async function verifySecurityPinAction(
  pin: string
): Promise<ApiResponse<boolean>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { securityPin: true },
    });

    if (!user?.securityPin) {
      return { success: false, error: "No security PIN configured" };
    }

    const isValid = user.securityPin === pin.trim();
    return { success: true, data: isValid };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "PIN verification failed";
    return { success: false, error: msg };
  }
}

import * as bcrypt from "bcryptjs";

export async function verifyPasswordAction(
  password: string
): Promise<ApiResponse<boolean>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user || !user.password) {
      return { success: false, error: "User has no password configured" };
    }

    const isValid = await bcrypt.compare(password, user.password);
    return { success: true, data: isValid };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Password verification failed";
    return { success: false, error: msg };
  }
}

export async function saveWebAuthnCredentialAction(
  credentialId: string
): Promise<ApiResponse<boolean>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { webauthnCredential: credentialId },
    });

    return { success: true, data: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to save credential";
    return { success: false, error: msg };
  }
}

export async function getSecurityConfigAction(): Promise<
  ApiResponse<{ hasPin: boolean; hasWebAuthn: boolean }>
> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { securityPin: true, webauthnCredential: true },
    });

    return {
      success: true,
      data: {
        hasPin: Boolean(user?.securityPin),
        hasWebAuthn: Boolean(user?.webauthnCredential),
      },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch security config";
    return { success: false, error: msg };
  }
}

export async function disableSecurityPinAction(): Promise<ApiResponse<boolean>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { securityPin: null },
    });

    return { success: true, data: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to disable PIN";
    return { success: false, error: msg };
  }
}

export async function disableWebAuthnAction(): Promise<ApiResponse<boolean>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { webauthnCredential: null },
    });

    return { success: true, data: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to disable biometrics";
    return { success: false, error: msg };
  }
}
