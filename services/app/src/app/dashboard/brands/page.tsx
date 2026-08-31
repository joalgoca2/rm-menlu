"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  Users,
  Plus,
  Edit2,
  Search,
  X,
  Layers,
  CreditCard,
} from "lucide-react";
import { useTranslation } from "@/components/providers/i18n-provider";
import { BrandFormDialog } from "@/components/admin/brand-form-dialog";
import { BrandPaymentsDialog } from "@/components/admin/brand-payments-dialog";
import {
  getBrandsCatalog,
  type BrandWithUsersCount,
} from "@/actions/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormattedDate } from "@/components/ui/formatted-date";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { PaginationControl } from "@/components/ui/pagination-control";
import { Skeleton } from "@/components/ui/skeleton";

export default function BrandsCatalogPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const currentPage = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const currentSearch = searchParams.get("search") ?? "";

  const [brands, setBrands] = useState<BrandWithUsersCount[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Local input state for smooth typing before explicit search submit
  const [searchInput, setSearchInput] = useState(currentSearch);

  // Dialog controllers (matching Chesscoach architecture)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [brandToEdit, setBrandToEdit] = useState<BrandWithUsersCount | null>(null);

  const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
  const [brandForPayments, setBrandForPayments] = useState<BrandWithUsersCount | null>(null);

  const handleOpenCreate = () => {
    setBrandToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (b: BrandWithUsersCount) => {
    setBrandToEdit(b);
    setIsFormOpen(true);
  };

  const handleOpenPayments = (b: BrandWithUsersCount) => {
    setBrandForPayments(b);
    setIsPaymentsOpen(true);
  };

  // Helper to update URL search parameters
  const updateUrlParams = useCallback(
    (updates: { page?: number; search?: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.page !== undefined) {
        if (updates.page <= 1) params.delete("page");
        else params.set("page", updates.page.toString());
      }

      if (updates.search !== undefined) {
        if (!updates.search.trim()) params.delete("search");
        else params.set("search", updates.search.trim());
      }

      const queryString = params.toString();
      const newPath = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(newPath);
    },
    [pathname, router, searchParams]
  );

  const fetchBrands = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getBrandsCatalog({
        page: currentPage,
        limit: 10,
        search: currentSearch || undefined,
      });

      if (res.success && res.data) {
        setBrands(res.data.brands);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      } else {
        toast.error(res.error ?? t("toasts.errorOccurred", "No se pudieron cargar las marcas."));
      }
    } catch (_error: unknown) {
      toast.error(t("toasts.errorOccurred", "Error al conectar con la base de datos."));
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, currentSearch, t]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams({ search: searchInput, page: 1 });
  };

  const handleClearSearch = () => {
    setSearchInput("");
    updateUrlParams({ search: "", page: 1 });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            <span>{t("brands.title", "Catálogo de Marcas y Tenants")}</span>
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            {t(
              "brands.subtitle",
              "Gestión independiente de marcas, empresas e inquilinos de la plataforma"
            )}
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="gap-2 shrink-0 rounded-2xl font-bold px-5 py-2.5">
          <Plus className="h-4 w-4" />
          <span>{t("brands.newBrand", "Nueva Marca")}</span>
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {t("brands.totalBrands", "Total de Marcas")}
            </CardTitle>
            <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">{total}</div>
            <p className="text-xs text-zinc-500 mt-1">
              {t("brands.registeredEntities", "Entidades registradas en el sistema")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {t("brands.activeBrandsCard", "Marcas Activas")}
            </CardTitle>
            <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">{total}</div>
            <p className="text-xs text-zinc-500 mt-1">
              {t("brands.enabledForUsers", "Habilitadas para asignación de usuarios")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {t("brands.multitenantMode", "Modo Multitenant")}
            </CardTitle>
            <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">
              {t("brands.isolated", "Aislado")}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {t("brands.accessControl", "Control de acceso basado en marca")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar & Filter */}
      <form
        onSubmit={handleSearchSubmit}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full"
      >
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
          <Input
            placeholder={t("brands.searchPlaceholder", "Buscar marca por nombre o descripción...")}
            className="pl-10 h-10 w-full rounded-xl"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button type="submit" variant="secondary" className="gap-2 h-10 px-5 rounded-xl font-bold flex-1 sm:flex-none">
            <Search className="h-4 w-4" />
            <span>{t("common.search", "Buscar")}</span>
          </Button>
          {(currentSearch || searchInput) && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClearSearch}
              className="gap-1.5 h-10 px-4 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex-1 sm:flex-none"
            >
              <X className="h-4 w-4" />
              <span>{t("common.clear", "Limpiar")}</span>
            </Button>
          )}
        </div>
      </form>

      {/* Brands Data Table */}
      <div className="space-y-4">
        <Table>
          <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/80">
            <TableRow>
              <TableHead className="font-bold">{t("brands.idCol", "ID de Marca")}</TableHead>
              <TableHead className="font-bold">{t("brands.nameCol", "Nombre Comercial")}</TableHead>
              <TableHead className="font-bold">Plan Activo</TableHead>
              <TableHead className="text-center font-bold">{t("brands.assignedUsersCol", "Usuarios Asignados")}</TableHead>
              <TableHead className="text-right font-bold">{t("brands.regDateCol", "Fecha de Registro")}</TableHead>
              <TableHead className="text-right font-bold">{t("brands.actionsCol", "Acciones")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`brand-skel-${i}`}>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : brands.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                  {t("brands.noBrandsFound", "No se encontraron marcas registradas.")}
                </TableCell>
              </TableRow>
            ) : (
              brands.map((b) => (
                <TableRow key={b.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                  <TableCell className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    {b.id}
                  </TableCell>
                  <TableCell className="font-semibold text-zinc-900 dark:text-white">
                    {b.name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 rounded-full px-3 py-0.5"
                    >
                      {b.subscription?.planName || "Free"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-xs font-mono font-bold bg-zinc-100 dark:bg-zinc-800">
                      {b.usersCount} {t("brands.usersBadge", "usuarios")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500 dark:text-zinc-400 text-right font-mono">
                    <FormattedDate date={b.createdAt} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                        onClick={() => handleOpenPayments(b)}
                        title="Historial Financiero y Pagos"
                      >
                        <CreditCard className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                        onClick={() => handleOpenEdit(b)}
                        title="Editar Marca y Suscripción"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Server-Side Synchronized Pagination Control */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <PaginationControl
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(newPage) => updateUrlParams({ page: newPage })}
          />
        </div>
      </div>

      {/* Brand Form Dialog (Create / Edit Brand & Subscription) */}
      <BrandFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        brandToEdit={brandToEdit}
        onSuccess={() => {
          fetchBrands();
        }}
      />

      {/* Brand Payments Dialog (Financial Audit & Manual Payments) */}
      {isPaymentsOpen && brandForPayments && (
        <BrandPaymentsDialog
          open={isPaymentsOpen}
          onOpenChange={setIsPaymentsOpen}
          brand={brandForPayments}
          onSuccess={() => {
            fetchBrands();
          }}
        />
      )}
    </div>
  );
}
