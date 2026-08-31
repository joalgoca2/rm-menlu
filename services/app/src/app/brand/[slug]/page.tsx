import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicBrandPortalAction } from "@/actions/brand-portal";
import { BrandPortalClient } from "@/components/brand-portal/brand-portal-client";

interface BrandPortalPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BrandPortalPageProps): Metadata {
  const { slug } = await params;
  const res = await getPublicBrandPortalAction(slug);

  if (!res.success || !res.data) {
    return {
      title: "Portal no encontrado",
    };
  }

  const brand = res.data;
  return {
    title: `${brand.name} | Portal de Pagos & Membresías`,
    description: brand.description || `Portal oficial de pagos y servicios de ${brand.name}.`,
  };
}

export default async function BrandPortalPage({ params }: BrandPortalPageProps) {
  const { slug } = await params;
  const res = await getPublicBrandPortalAction(slug);

  if (!res.success || !res.data) {
    notFound();
  }

  return <BrandPortalClient brand={res.data} />;
}
