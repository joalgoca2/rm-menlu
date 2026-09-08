"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "@/components/providers/i18n-provider";
import { useBrand } from "@/context/brand-context";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Shield,
  Filter,
  Building2,
  Check,
  UserCheck,
  Info,
  X,
} from "lucide-react";
import {
  getUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  bulkToggleUserStatusAction,
  bulkDeleteUsersAction,
  type UserWithRoles,
} from "@/actions/auth";
import { getBrandsList } from "@/actions/brand";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/lib/validations/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { PaginationControl } from "@/components/ui/pagination-control";

function UsersTableContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  // Read state from URL search parameters for server-side syncing
  const currentPage = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const currentSearch = searchParams.get("search") ?? "";
  const currentRole = searchParams.get("role") ?? "all";

  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [activeCount, setActiveCount] = useState(0);
  const [adminsCount, setAdminsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Local input state for smooth typing before URL push
  const [searchInput, setSearchInput] = useState(currentSearch);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);

  // Bulk selection state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<"activate" | "deactivate" | "delete" | null>(null);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // Fetch available brands list for forms
  const loadBrands = useCallback(async () => {
    const res = await getBrandsList();
    if (res.success && res.data) {
      setBrands(res.data);
    }
  }, []);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  // Helper to update URL search parameters
  const updateUrlParams = useCallback(
    (updates: { page?: number; search?: string; role?: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.page !== undefined) {
        if (updates.page <= 1) params.delete("page");
        else params.set("page", updates.page.toString());
      }

      if (updates.search !== undefined) {
        if (!updates.search.trim()) params.delete("search");
        else params.set("search", updates.search.trim());
      }

      if (updates.role !== undefined) {
        if (updates.role === "all") params.delete("role");
        else params.set("role", updates.role);
      }

      const queryString = params.toString();
      const newPath = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(newPath);
    },
    [pathname, router, searchParams]
  );

  const { data: session } = useSession();
  const { selectedBrandId } = useBrand();

  const isSuperAdmin = session?.user?.roles?.includes("SUPER_ADMIN");
  const effectiveBrandId = isSuperAdmin
    ? selectedBrandId !== "ALL"
      ? selectedBrandId
      : undefined
    : session?.user?.brandId ?? undefined;

  // Server-side fetch triggered whenever URL parameters or brand context change
  const fetchServerUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getUsers({
        page: currentPage,
        limit: 10,
        search: currentSearch || undefined,
        role: currentRole !== "all" ? currentRole : undefined,
        brandId: effectiveBrandId,
      });

      if (res.success && res.data) {
        setUsers(res.data.users);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
        setActiveCount(res.data.activeCount ?? 0);
        setAdminsCount(res.data.adminsCount ?? 0);
      } else {
        toast.error(res.error ?? t("toasts.errorOccurred", "No se pudieron cargar los usuarios."));
      }
    } catch (_error: unknown) {
      toast.error(t("toasts.errorOccurred", "Error inesperado al consultar la base de datos."));
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, currentSearch, currentRole, effectiveBrandId, t]);

  useEffect(() => {
    fetchServerUsers();
  }, [fetchServerUsers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams({ search: searchInput, page: 1 });
  };

  const handleClearSearch = () => {
    setSearchInput("");
    updateUrlParams({ search: "", page: 1 });
  };

  const handleOpenCreate = async () => {
    setIsActionLoading(true);
    try {
      await loadBrands();
      setIsCreateOpen(true);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenEdit = async (user: UserWithRoles) => {
    setIsActionLoading(true);
    try {
      await loadBrands();
      setEditingUser(user);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleStatus = async (user: UserWithRoles) => {
    try {
      const res = await toggleUserStatus(user.id);
      if (res.success) {
        toast.success(res.message);
        fetchServerUsers();
      } else {
        toast.error(res.error ?? t("toasts.errorOccurred", "No se pudo cambiar el estado."));
      }
    } catch (_error: unknown) {
      toast.error(t("toasts.errorOccurred", "Error de servidor."));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUserId) return;
    setIsActionLoading(true);
    try {
      const res = await deleteUser(deletingUserId);
      if (res.success) {
        toast.success(res.message ?? t("toasts.userDeleted", "Usuario eliminado correctamente."));
        setDeletingUserId(null);
        fetchServerUsers();
      } else {
        toast.error(res.error ?? t("toasts.errorOccurred", "No se pudo eliminar el usuario."));
      }
    } catch (_error: unknown) {
      toast.error(t("toasts.errorOccurred", "Error al eliminar el usuario."));
    } finally {
      setIsActionLoading(false);
    }
  };

  // Filter users on current page eligible for selection (exclude SuperAdmin and caller self)
  const selectableUsersOnPage = users.filter(
    (u) =>
      !u.roles?.includes("SUPER_ADMIN") &&
      u.email !== "admin@remotemonkeys.ai" &&
      u.id !== session?.user?.id
  );

  const isAllSelected =
    selectableUsersOnPage.length > 0 &&
    selectableUsersOnPage.every((u) => selectedUserIds.includes(u.id));

  const handleSelectAllToggle = () => {
    if (isAllSelected) {
      setSelectedUserIds((prev) =>
        prev.filter((id) => !selectableUsersOnPage.some((u) => u.id === id))
      );
    } else {
      const newIds = selectableUsersOnPage.map((u) => u.id);
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...newIds])));
    }
  };

  const handleSelectRowToggle = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleBulkConfirm = async () => {
    if (!bulkAction || selectedUserIds.length === 0) return;
    setIsBulkLoading(true);
    try {
      if (bulkAction === "activate" || bulkAction === "deactivate") {
        const targetActive = bulkAction === "activate";
        const res = await bulkToggleUserStatusAction(selectedUserIds, targetActive);
        if (res.success) {
          toast.success(
            res.message ??
              t("users.bulkStatusSuccess", "Estado de usuarios actualizado correctamente.")
          );
          setSelectedUserIds([]);
          setBulkAction(null);
          fetchServerUsers();
        } else {
          toast.error(res.error ?? t("users.bulkError", "Error al procesar la acción en lote."));
        }
      } else if (bulkAction === "delete") {
        const res = await bulkDeleteUsersAction(selectedUserIds);
        if (res.success) {
          toast.success(
            res.message ??
              t("users.bulkDeleteSuccess", "Usuarios seleccionados eliminados correctamente.")
          );
          setSelectedUserIds([]);
          setBulkAction(null);
          fetchServerUsers();
        } else {
          toast.error(res.error ?? t("users.bulkError", "Error al procesar la acción en lote."));
        }
      }
    } catch (_err) {
      toast.error(t("users.bulkError", "Error al procesar la acción en lote."));
    } finally {
      setIsBulkLoading(false);
    }
  };

  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            <span>{t("users.title", "Gestión de Usuarios")}</span>
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            {t("users.subtitle", "Paginación y filtrado en servidor")} ({total} {t("brands.usersBadge", "usuarios")})
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsRolesModalOpen(true)}
            className="gap-2 rounded-2xl font-bold px-4 py-2.5"
          >
            <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t("users.rolesMatrix", "Matriz de Roles")}</span>
          </Button>

          <Button onClick={handleOpenCreate} className="gap-2 shrink-0 rounded-2xl font-bold px-5 py-2.5">
            <Plus className="h-4 w-4" />
            <span>{t("users.newUser", "Nuevo Usuario")}</span>
          </Button>
        </div>
      </div>

      {/* Overview Metric Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {t("users.totalUsers", "Total de Usuarios")}
            </CardTitle>
            <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">
                {total}
              </div>
            )}
            <p className="text-xs text-zinc-500 mt-1">
              {t("users.registeredAccounts", "Cuentas registradas en catálogo")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {t("users.adminAccounts", "Cuentas Administrativas")}
            </CardTitle>
            <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">
                {adminsCount}
              </div>
            )}
            <p className="text-xs text-zinc-500 mt-1">
              {t("users.superAdminsAndAdmins", "Superadmins y Administradores")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {t("users.activeUsers", "Usuarios Activos")}
            </CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">
                {activeCount}
              </div>
            )}
            <p className="text-xs text-zinc-500 mt-1">
              {t("users.enabledAccounts", "Cuentas con estado habilitado")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              placeholder={t("users.searchPlaceholder", "Buscar por nombre o correo...")}
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary" className="gap-1.5 shrink-0 font-bold">
            <Search className="h-4 w-4" />
            <span>{t("common.search", "Buscar")}</span>
          </Button>
          {(currentSearch || searchInput) && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClearSearch}
              className="gap-1 shrink-0 text-zinc-500"
            >
              <X className="h-4 w-4" />
              <span>{t("common.clear", "Limpiar")}</span>
            </Button>
          )}
        </form>

        <div className="w-full sm:w-48">
          <Select
            value={currentRole}
            onValueChange={(val) => updateUrlParams({ role: val, page: 1 })}
          >
            <SelectTrigger className="gap-2">
              <Filter className="h-4 w-4 text-zinc-500" />
              <SelectValue placeholder={t("users.filterRolePlaceholder", "Filtrar por rol")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("users.allRoles", "Todos los roles")}</SelectItem>
              <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
              <SelectItem value="ADMIN">ADMIN</SelectItem>
              <SelectItem value="USER">USER</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <div className="space-y-4">
        <Table>
          <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/80">
            <TableRow>
              <TableHead className="w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAllToggle}
                  disabled={selectableUsersOnPage.length === 0}
                  className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-40"
                  aria-label="Select all users on page"
                />
              </TableHead>
              <TableHead className="font-bold">{t("users.userCol", "Usuario")}</TableHead>
              <TableHead className="font-bold">{t("users.emailCol", "Correo")}</TableHead>
              <TableHead className="font-bold">{t("users.rolesCol", "Roles")}</TableHead>
              <TableHead className="font-bold">{t("users.tenantCol", "Marca / Tenant")}</TableHead>
              <TableHead className="font-bold">{t("users.statusCol", "Estado")}</TableHead>
              <TableHead className="text-right font-bold">{t("users.actionsCol", "Acciones")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                  <TableCell><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-zinc-500">
                  {t("users.noUsersFound", "No se encontraron usuarios coincidentes.")}
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const isSuperAdminUser = u.roles?.includes("SUPER_ADMIN") || u.email === "admin@remotemonkeys.ai";

                return (
                  <TableRow
                    key={u.id}
                    className={cn(
                      "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors",
                      selectedUserIds.includes(u.id) && "bg-emerald-500/5 dark:bg-emerald-500/10"
                    )}
                  >
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(u.id)}
                        onChange={() => handleSelectRowToggle(u.id)}
                        disabled={isSuperAdminUser || u.id === session?.user?.id}
                        className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label={`Select user ${u.email}`}
                      />
                    </TableCell>
                    <TableCell className="font-semibold text-zinc-900 dark:text-white">
                      {u.name ?? t("users.unnamed", "Sin Nombre")}
                    </TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-300 font-mono text-xs">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles?.map((r) => (
                          <Badge
                            key={r}
                            variant={r === "SUPER_ADMIN" ? "destructive" : "default"}
                          >
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {isSuperAdminUser ? (
                        <span className="text-zinc-500 font-mono italic">
                          {t("users.globalAccess", "Acceso Global")}
                        </span>
                      ) : (
                        <span className="font-medium text-zinc-900 dark:text-zinc-200">
                          {u.brand?.name ?? t("users.noBrand", "Sin Marca")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>{t("users.active", "Activo")}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-rose-500 dark:text-rose-400 font-medium">
                          <XCircle className="h-3.5 w-3.5" />
                          <span>{t("users.inactive", "Inactivo")}</span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                          onClick={() => handleOpenEdit(u)}
                          aria-label="Edit user"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        {isSuperAdminUser ? (
                          <span
                            className="inline-flex items-center p-2 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                            title={t(
                              "users.superAdminActiveFixed",
                              "El usuario SuperAdmin está siempre activo y protegido"
                            )}
                          >
                            <CheckCircle className="h-4 w-4 text-emerald-500 opacity-60" />
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400"
                            onClick={() => handleToggleStatus(u)}
                            aria-label="Toggle user status"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        )}
                        {isSuperAdminUser ? (
                          <span
                            className="inline-flex items-center p-1 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                            title={t(
                              "users.superAdminProtected",
                              "Los usuarios SuperAdmin están protegidos y no se pueden eliminar"
                            )}
                          >
                            <Shield className="h-4 w-4 opacity-40 text-amber-500" />
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400"
                            onClick={() => setDeletingUserId(u.id)}
                            aria-label="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Server-Side Synchronized Pagination Control */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <PaginationControl
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => updateUrlParams({ page: p })}
          />
        </div>
      </div>

      {/* Floating Bulk Action Bar (MonkesCRM Style) */}
      {selectedUserIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 px-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2 shrink-0">
            <Badge className="bg-emerald-600 text-white font-extrabold text-[10px] uppercase rounded-lg px-2.5 h-6">
              {selectedUserIds.length} {t("users.selectedCount", "seleccionados")}
            </Badge>
          </div>

          <div className="h-6 w-[1px] bg-zinc-200 dark:bg-zinc-800 shrink-0" />

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => setBulkAction("activate")}
              variant="outline"
              size="sm"
              className="text-xs font-bold rounded-xl h-9 px-3 gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              <span>{t("users.bulkActivateBtn", "Activar")}</span>
            </Button>

            <Button
              onClick={() => setBulkAction("deactivate")}
              variant="outline"
              size="sm"
              className="text-xs font-bold rounded-xl h-9 px-3 gap-1.5 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>{t("users.bulkDeactivateBtn", "Desactivar")}</span>
            </Button>

            <Button
              onClick={() => setBulkAction("delete")}
              variant="outline"
              size="sm"
              className="text-xs font-bold rounded-xl h-9 px-3 gap-1.5 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{t("users.bulkDeleteBtn", "Eliminar")}</span>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedUserIds([])}
            className="h-8 w-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-white shrink-0 ml-auto rounded-lg"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Bulk Action Confirmation Premium Dialog */}
      <AlertDialog
        open={Boolean(bulkAction)}
        onOpenChange={(open) => !open && setBulkAction(null)}
      >
        <AlertDialogContent className="rounded-3xl p-6 border-zinc-200 dark:border-zinc-800">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div
                className={cn(
                  "h-10 w-10 rounded-xl border flex items-center justify-center shrink-0",
                  bulkAction === "delete"
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                    : bulkAction === "deactivate"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                )}
              >
                {bulkAction === "delete" ? (
                  <Trash2 className="h-5 w-5" />
                ) : bulkAction === "deactivate" ? (
                  <XCircle className="h-5 w-5" />
                ) : (
                  <CheckCircle className="h-5 w-5" />
                )}
              </div>
              <div>
                <AlertDialogTitle className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                  {bulkAction === "activate"
                    ? t("users.confirmBulkActivateTitle", "¿Activar usuarios seleccionados?")
                    : bulkAction === "deactivate"
                    ? t("users.confirmBulkDeactivateTitle", "¿Desactivar usuarios seleccionados?")
                    : t("users.confirmBulkDeleteTitle", "¿Eliminar usuarios seleccionados?")}
                </AlertDialogTitle>
              </div>
            </div>
            <AlertDialogDescription className="text-xs text-zinc-500 font-semibold leading-relaxed">
              {bulkAction === "activate"
                ? t(
                    "users.confirmBulkActivateDesc",
                    "Se restaurará el acceso a la plataforma para los {count} usuarios seleccionados."
                  ).replace("{count}", String(selectedUserIds.length))
                : bulkAction === "deactivate"
                ? t(
                    "users.confirmBulkDeactivateDesc",
                    "Se suspenderá temporalmente el acceso a la plataforma para los {count} usuarios seleccionados."
                  ).replace("{count}", String(selectedUserIds.length))
                : t(
                    "users.confirmBulkDeleteDesc",
                    "Esta acción no se puede deshacer. Se eliminarán permanentemente los {count} usuarios seleccionados y sus accesos."
                  ).replace("{count}", String(selectedUserIds.length))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              onClick={() => setBulkAction(null)}
              className="rounded-xl font-bold text-xs"
            >
              {t("common.cancel", "Cancelar")}
            </AlertDialogCancel>
            <Button
              onClick={handleBulkConfirm}
              disabled={isBulkLoading}
              className={cn(
                "rounded-xl font-bold text-xs text-white px-5",
                bulkAction === "delete"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : bulkAction === "deactivate"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              {isBulkLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : bulkAction === "activate" ? (
                t("users.confirmBulkActivateBtn", "Confirmar Activación")
              ) : bulkAction === "deactivate" ? (
                t("users.confirmBulkDeactivateBtn", "Confirmar Desactivación")
              ) : (
                t("users.confirmDeleteBtn", "Confirmar Eliminación")
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Modal */}
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        brands={brands}
        isSuperAdmin={Boolean(isSuperAdmin)}
        userBrandId={session?.user?.brandId ?? null}
        onSuccess={fetchServerUsers}
      />

      {/* Edit Modal */}
      <EditUserModal
        user={editingUser}
        onClose={() => setEditingUser(null)}
        brands={brands}
        isSuperAdmin={Boolean(isSuperAdmin)}
        userBrandId={session?.user?.brandId ?? null}
        onSuccess={fetchServerUsers}
      />

      {/* Roles & Permissions Matrix Modal */}
      <RolesMatrixModal
        open={isRolesModalOpen}
        onOpenChange={setIsRolesModalOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={Boolean(deletingUserId)}
        onOpenChange={(open) => !open && setDeletingUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("users.confirmDeleteTitle", "¿Eliminar este usuario?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("users.confirmDeleteDesc", "Esta acción no se puede deshacer. Se eliminarán sus accesos a la plataforma.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel", "Cancelar")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isActionLoading}
              className="bg-rose-600 hover:bg-rose-700 font-bold"
            >
              {t("users.confirmDeleteBtn", "Confirmar Eliminación")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RoleRadioCards({
  selectedRole,
  onSelectRole,
  isSuperAdmin = true,
  allowSuperAdminSelect = false,
  isDisabled = false,
  error,
}: {
  selectedRole: "SUPER_ADMIN" | "ADMIN" | "USER";
  onSelectRole: (role: "SUPER_ADMIN" | "ADMIN" | "USER") => void;
  isSuperAdmin?: boolean;
  allowSuperAdminSelect?: boolean;
  isDisabled?: boolean;
  error?: string;
}) {
  const { t } = useTranslation();
  const baseRolesList: {
    id: "SUPER_ADMIN" | "ADMIN" | "USER";
    title: string;
    description: string;
  }[] = [
    {
      id: "USER",
      title: "USER",
      description: t("users.userRole", "Usuario Operativo"),
    },
    {
      id: "ADMIN",
      title: "ADMIN",
      description: t("users.adminRole", "Administrador de Marca"),
    },
  ];

  if (allowSuperAdminSelect || selectedRole === "SUPER_ADMIN") {
    baseRolesList.push({
      id: "SUPER_ADMIN",
      title: "SUPER_ADMIN",
      description: t("users.superAdminRole", "Super Administrador"),
    });
  }

  const rolesList = isSuperAdmin
    ? baseRolesList
    : baseRolesList.filter((r) => r.id === "USER");

  return (
    <div className="space-y-2">
      <Label>{t("users.rolesCol", "Roles")}</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {rolesList.map((r) => {
          const isSelected = selectedRole === r.id;

          return (
            <button
              key={r.id}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectRole(r.id)}
              className={cn(
                "flex flex-col justify-between p-3 rounded-xl border text-left transition-all",
                isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
                isSelected
                  ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100 shadow-sm ring-1 ring-emerald-500"
                  : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/50 text-zinc-900 dark:text-white"
              )}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold font-mono tracking-wide">
                  {r.title}
                </span>
                <div
                  className={cn(
                    "h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                    isSelected
                      ? "border-emerald-600 bg-emerald-600 dark:border-emerald-500 dark:bg-emerald-500"
                      : "border-zinc-300 dark:border-zinc-700"
                  )}
                >
                  {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                </div>
              </div>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {r.description}
              </span>
            </button>
          );
        })}
      </div>
      {error && (
        <p className="text-xs text-rose-500 dark:text-rose-400 font-medium mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

function CreateUserModal({
  isOpen,
  onClose,
  brands,
  isSuperAdmin = true,
  userBrandId,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  brands: { id: string; name: string }[];
  isSuperAdmin?: boolean;
  userBrandId?: string | null;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialBrandId = isSuperAdmin
    ? brands[0]?.id ?? ""
    : userBrandId ?? brands[0]?.id ?? "";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      roleName: "USER",
      brandId: initialBrandId,
    },
  });

  const selectedRole = watch("roleName");
  const selectedBrandId = watch("brandId");

  useEffect(() => {
    if (isOpen) {
      reset({
        name: "",
        email: "",
        password: "",
        roleName: "USER",
        brandId: isSuperAdmin
          ? brands[0]?.id ?? ""
          : userBrandId ?? brands[0]?.id ?? "",
      });
    }
  }, [isOpen, brands, isSuperAdmin, userBrandId, reset]);

  const handleRoleSelect = (role: "SUPER_ADMIN" | "ADMIN" | "USER") => {
    const targetRole = isSuperAdmin ? role : "USER";
    setValue("roleName", targetRole, { shouldValidate: true });
    if (targetRole === "SUPER_ADMIN") {
      setValue("brandId", null, { shouldValidate: true });
    } else if (!isSuperAdmin) {
      setValue("brandId", userBrandId ?? null, { shouldValidate: true });
    } else if (!selectedBrandId && brands.length > 0) {
      setValue("brandId", brands[0].id, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: CreateUserInput) => {
    setIsSubmitting(true);
    try {
      const res = await createUser({
        name: data.name,
        email: data.email,
        password: data.password,
        roleName: isSuperAdmin ? data.roleName : "USER",
        brandId: isSuperAdmin
          ? data.roleName === "SUPER_ADMIN"
            ? null
            : data.brandId
          : userBrandId,
      });

      if (res.success) {
        toast.success(res.message ?? "Usuario creado exitosamente.");
        onClose();
        onSuccess();
      } else if (res.error === "EMAIL_EXISTS" || res.error?.toLowerCase().includes("email")) {
        setError("email", {
          type: "manual",
          message: t(
            "users.emailExistsError",
            "Este correo electrónico ya está registrado por otro usuario."
          ),
        });
        toast.error(
          t("users.emailExistsToast", "El correo electrónico ya existe en la plataforma.")
        );
      } else {
        toast.error(res.error ?? "No se pudo crear el usuario.");
      }
    } catch (_error: unknown) {
      toast.error("Error al procesar la creación.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeBrandName =
    brands.find((b) => b.id === (userBrandId ?? selectedBrandId))?.name ??
    userBrandId ??
    "Marca Asignada";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] p-0 overflow-hidden flex flex-col border border-zinc-200 dark:border-zinc-800 shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900">
          <DialogTitle>{t("users.newUser", "Nuevo Usuario")}</DialogTitle>
          <DialogDescription>
            {t(
              "users.modalSubCreate",
              "Ingresa los datos obligatorios para registrar una nueva cuenta"
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-3 pr-5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="create-name">
                {t("settings.fullName", "Nombre Completo")}
              </Label>
              <Input
                id="create-name"
                placeholder="Ej. Juan Pérez"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-rose-500 dark:text-rose-400 font-medium mt-0.5">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-email">{t("users.emailCol", "Correo")}</Label>
              <Input
                id="create-email"
                type="email"
                placeholder="juan@empresa.com"
                className={cn(
                  errors.email &&
                    "border-rose-500 focus-visible:ring-rose-500/20 dark:border-rose-500"
                )}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-rose-500 dark:text-rose-400 font-medium mt-0.5">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-password">
              {t("auth.password", "Contraseña")}
            </Label>
            <Input
              id="create-password"
              type="password"
              placeholder={t(
                "auth.passwordPolicyPlaceholder",
                "Mínimo 8 caracteres, Mayús, Minús, Num, Especial"
              )}
              {...register("password")}
            />
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {t(
                "auth.passwordPolicyHint",
                "Debe contener mín. 8 caracteres, mayúscula, minúscula, número y carácter especial (@, #, $, !)."
              )}
            </p>
            {errors.password && (
              <p className="text-xs text-rose-500 dark:text-rose-400 font-medium mt-1">
                {t(errors.password.message ?? "")}
              </p>
            )}
          </div>

          <RoleRadioCards
            selectedRole={selectedRole}
            onSelectRole={handleRoleSelect}
            isSuperAdmin={isSuperAdmin}
            error={errors.roleName?.message}
          />

          <div className="space-y-2">
            <Label>{t("users.tenantCol", "Marca / Tenant")}</Label>
            {!isSuperAdmin ? (
              <Input
                disabled
                value={activeBrandName}
                className="bg-zinc-100 dark:bg-zinc-900 opacity-80 text-xs font-semibold cursor-not-allowed"
              />
            ) : selectedRole === "SUPER_ADMIN" ? (
              <Input
                disabled
                value={`N/A - ${t("users.globalAccess", "Acceso Global")}`}
                className="bg-zinc-100 dark:bg-zinc-900 opacity-80 text-xs font-semibold cursor-not-allowed"
              />
            ) : (
              <Select
                value={selectedBrandId ?? ""}
                onValueChange={(val) =>
                  setValue("brandId", val, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      "users.selectBrandPlaceholder",
                      "Selecciona una marca"
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {brands.length === 0 ? (
                    <SelectItem value="none" disabled>
                      {t("brands.noBrandsFound", "No hay marcas registradas")}
                    </SelectItem>
                  ) : (
                    brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
            {errors.brandId && selectedRole !== "SUPER_ADMIN" && isSuperAdmin && (
              <p className="text-xs text-rose-500 dark:text-rose-400 font-medium mt-1">
                {errors.brandId.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel", "Cancelar")}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="font-bold">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("common.save", "Guardar")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditUserModal({
  user,
  brands,
  isSuperAdmin = true,
  userBrandId,
  onClose,
  onSuccess,
}: {
  user: UserWithRoles | null;
  brands: { id: string; name: string }[];
  isSuperAdmin?: boolean;
  userBrandId?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
  });

  const selectedRole = watch("roleName");
  const selectedBrandId = watch("brandId");

  useEffect(() => {
    if (user) {
      const primaryRole = user.roles?.[0] as
        | "SUPER_ADMIN"
        | "ADMIN"
        | "USER"
        | undefined;
      const role = isSuperAdmin ? (primaryRole ?? "USER") : "USER";

      reset({
        name: user.name ?? "",
        email: user.email,
        password: "",
        roleName: role,
        isActive: user.isActive,
        brandId: isSuperAdmin
          ? role === "SUPER_ADMIN"
            ? null
            : user.brandId ?? brands[0]?.id ?? ""
          : userBrandId ?? user.brandId,
      });
    }
  }, [user, brands, isSuperAdmin, userBrandId, reset]);

  const handleRoleSelect = (role: "SUPER_ADMIN" | "ADMIN" | "USER") => {
    const targetRole = isSuperAdmin ? role : "USER";
    setValue("roleName", targetRole, { shouldValidate: true });
    if (targetRole === "SUPER_ADMIN") {
      setValue("brandId", null, { shouldValidate: true });
    } else if (!isSuperAdmin) {
      setValue("brandId", userBrandId ?? null, { shouldValidate: true });
    } else if (!selectedBrandId && brands.length > 0) {
      setValue("brandId", brands[0].id, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: UpdateUserInput) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const res = await updateUser(user.id, {
        name: data.name,
        email: data.email,
        password: data.password || undefined,
        roleName: isSuperAdmin ? data.roleName : "USER",
        isActive: data.isActive,
        brandId: isSuperAdmin
          ? data.roleName === "SUPER_ADMIN"
            ? null
            : data.brandId
          : userBrandId,
      });

      if (res.success) {
        toast.success(res.message ?? "Usuario actualizado exitosamente.");
        onClose();
        onSuccess();
      } else if (res.error === "EMAIL_EXISTS" || res.error?.toLowerCase().includes("email")) {
        setError("email", {
          type: "manual",
          message: t(
            "users.emailExistsError",
            "Este correo electrónico ya está registrado por otro usuario."
          ),
        });
        toast.error(
          t("users.emailExistsToast", "El correo electrónico ya existe en la plataforma.")
        );
      } else {
        toast.error(res.error ?? "No se pudo actualizar el usuario.");
      }
    } catch (_error: unknown) {
      toast.error("Error al procesar la actualización.");
    } finally {
      setIsSubmitting(false);
    }
  };
const activeBrandName =
    brands.find((b) => b.id === (userBrandId ?? selectedBrandId))?.name ??
    userBrandId ??
    "Marca Asignada";

  const isEditingSuperAdmin =
    user?.roles?.includes("SUPER_ADMIN") ||
    user?.email === "admin@remotemonkeys.ai";

  return (
    <Dialog open={Boolean(user)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] p-0 overflow-hidden flex flex-col border border-zinc-200 dark:border-zinc-800 shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900">
          <DialogTitle>{t("users.editUserTitle", "Editar Usuario")}</DialogTitle>
          <DialogDescription>
            {t("users.modalSubEdit", "Modifica los permisos y la empresa asociada de")} {user?.email}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto p-6 space-y-3 pr-5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          {isEditingSuperAdmin && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
              <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>Usuario SuperAdmin Protegido:</strong> Su rol y estado
                activo están fijos y no pueden modificarse.
              </span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">{t("settings.fullName", "Nombre Completo")}</Label>
              <Input id="edit-name" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-rose-500 dark:text-rose-400 font-medium mt-0.5">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-email">{t("users.emailCol", "Correo")}</Label>
              <Input
                id="edit-email"
                type="email"
                className={cn(
                  errors.email &&
                    "border-rose-500 focus-visible:ring-rose-500/20 dark:border-rose-500"
                )}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-rose-500 dark:text-rose-400 font-medium mt-0.5">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-password">
              {t("settings.changePassword", "Cambiar Contraseña")} ({t("brands.descOptional", "Opcional")})
            </Label>
            <Input
              id="edit-password"
              type="password"
              placeholder={t(
                "auth.passwordPolicyPlaceholderEdit",
                "Dejar en blanco para mantener la contraseña actual"
              )}
              {...register("password")}
            />
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {t(
                "auth.passwordPolicyHintEdit",
                "Si la cambias, debe tener mín. 8 caracteres, mayúscula, minúscula, número y carácter especial (@, #, $, !)."
              )}
            </p>
            {errors.password && (
              <p className="text-xs text-rose-500 dark:text-rose-400 font-medium mt-1">
                {t(errors.password.message ?? "")}
              </p>
            )}
          </div>

          <RoleRadioCards
            selectedRole={selectedRole}
            onSelectRole={isEditingSuperAdmin ? () => {} : handleRoleSelect}
            isSuperAdmin={isSuperAdmin}
            allowSuperAdminSelect={Boolean(isEditingSuperAdmin)}
            isDisabled={Boolean(isEditingSuperAdmin)}
            error={isEditingSuperAdmin ? undefined : errors.roleName?.message}
          />

          <div className="space-y-2">
            <Label>{t("users.tenantCol", "Marca / Tenant")}</Label>
            {!isSuperAdmin ? (
              <Input
                disabled
                value={activeBrandName}
                className="bg-zinc-100 dark:bg-zinc-900 opacity-80 text-xs font-semibold cursor-not-allowed"
              />
            ) : selectedRole === "SUPER_ADMIN" ? (
              <Input
                disabled
                value={`N/A - ${t("users.globalAccess", "Acceso Global")}`}
                className="bg-zinc-100 dark:bg-zinc-900 opacity-80 text-xs font-semibold cursor-not-allowed"
              />
            ) : (
              <Select
                value={selectedBrandId ?? ""}
                onValueChange={(val) =>
                  setValue("brandId", val, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("users.selectBrandPlaceholder", "Selecciona una marca")} />
                </SelectTrigger>
                <SelectContent>
                  {brands.length === 0 ? (
                    <SelectItem value="none" disabled>
                      {t("brands.noBrandsFound", "No hay marcas registradas")}
                    </SelectItem>
                  ) : (
                    brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
            {errors.brandId && selectedRole !== "SUPER_ADMIN" && isSuperAdmin && (
              <p className="text-xs text-rose-500 dark:text-rose-400 font-medium mt-1">
                {errors.brandId.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel", "Cancelar")}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="font-bold">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("billing.saveChanges", "Guardar Cambios")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function UsersManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        </div>
      }
    >
      <UsersTableContent />
    </Suspense>
  );
}

function RolesMatrixModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const systemRoles = [
    {
      name: "SUPER_ADMIN",
      label: t("users.superAdminRole", "Super Administrador"),
      badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      icon: Shield,
      description: t(
        "users.superAdminDesc",
        "Acceso global sin restricciones a todas las marcas, auditoría de seguridad y configuraciones globales."
      ),
      permissions: [
        t("users.superAdminPermGlobal", "* (Acceso Total Global)"),
        "brands:manage",
        "users:global",
        "audit:view",
        "system:config",
      ],
      brandBound: t("users.superAdminBound", "Desvinculado (Sin marca)"),
    },
    {
      name: "ADMIN",
      label: t("users.adminRole", "Administrador de Marca"),
      badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      icon: Building2,
      description: t(
        "users.adminDesc",
        "Gestión de usuarios e información corporativa dentro de la marca o empresa asignada."
      ),
      permissions: ["users:read", "users:write", "brand:read", "brand:write", "reports:view"],
      brandBound: t("users.adminBound", "Requerido (Marca asignada)"),
    },
    {
      name: "USER",
      label: t("users.userRole", "Usuario Operativo"),
      badgeClass: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20",
      icon: Users,
      description: t(
        "users.userDesc",
        "Acceso a funciones estándar y operaciones diarias dentro de su organización."
      ),
      permissions: ["profile:read", "profile:write", "dashboard:access"],
      brandBound: t("users.userBound", "Requerido (Marca asignada)"),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden flex flex-col border border-zinc-200 dark:border-zinc-800 shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
            <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span>{t("users.rolesModalTitle", "Matriz de Roles y Permisos del Sistema")}</span>
          </DialogTitle>
          <DialogDescription>
            {t("users.rolesModalSubtitle", "Definición de perfiles de privilegio y nodos de autorización del motor RBAC")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 pr-5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full">
          {systemRoles.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.name}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-zinc-200/60 dark:bg-zinc-800">
                      <Icon className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                        {role.label}
                      </h4>
                      <p className="text-[11px] font-mono text-zinc-500">
                        {t("users.roleKey", "Clave")}: {role.name}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs font-semibold px-2.5 py-0.5 ${role.badgeClass}`}>
                    {role.brandBound}
                  </Badge>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {role.description}
                </p>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                    {t("users.permissionNodes", "Nodos de Permiso Habilitados")}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions.map((perm) => (
                      <Badge
                        key={perm}
                        variant="secondary"
                        className="text-[10px] font-mono bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-none"
                      >
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl flex gap-3 items-start shadow-sm mt-4">
            <Info className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                {t("users.securityNoticeTitle", "Aviso de Protocolo de Seguridad")}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {t(
                  "users.securityNoticeBody",
                  "Los roles del sistema están resguardados por el motor RBAC de la plataforma. La asignación de roles a usuarios se realiza dinámicamente al crear o modificar usuarios."
                )}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
