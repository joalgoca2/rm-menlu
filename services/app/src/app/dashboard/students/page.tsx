"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "@/components/providers/i18n-provider";
import { useBrand } from "@/context/brand-context";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Flame,
  Award,
  Zap,
  Eye,
  X,
  UserCheck,
  UserX,
  AlertTriangle,
  Camera,
  User,
  Baby,
  FileText,
  HeartPulse,
  CreditCard,
  Printer,
  Swords,
  DollarSign,
  MoreVertical,
  Check,
  UserPlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { QRCode } from "@/components/ui/qr-code";
import { printStudentCredentials } from "@/lib/print-utils";
import { getStudentPhotoUrl, cn } from "@/lib/utils";
import { DiplomaBuilderModal } from "@/components/students/diploma-builder-modal";
import { CSVImportModal } from "@/components/students/csv-import-modal";
import { RegisterStudentPaymentModal } from "@/components/students/register-payment-modal";
import { PaginationControl } from "@/components/ui/pagination-control";
import {
  getStudentsAction,
  createStudentAction,
  updateStudentAction,
  deleteStudentAction,
  bulkDeleteStudentsAction,
  toggleStudentActiveAction,
  bulkToggleStudentsActiveAction,
  getStudentExpedienteAction,
  getStudentPaymentsPaginatedAction,
  uploadStudentPhotoAction,
  createStudentUserAccountAction,
} from "@/actions/students";
import {
  getDisciplinesByBrandAction,
  getBeltsByDisciplinesAction,
} from "@/actions/disciplines";
import {
  createStudentSchema,
  updateStudentSchema,
  type CreateStudentInput,
  type UpdateStudentInput,
} from "@/lib/validations/students";
import type {
  StudentWithDetails,
  StudentExpediente,
  StudentExpedientePayment,
  Discipline,
  Belt,
} from "@/types";
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

// Helper function to calculate exact age from birthdate
function calculateAge(birthDateInput: string | Date | null | undefined): number | null {
  if (!birthDateInput) return null;
  const birth = new Date(birthDateInput);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function StudentsTableContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { selectedBrandId } = useBrand();

  // URL State query synchronization
  const currentPage = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const currentLimit = Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10));
  const currentSearch = searchParams.get("search") ?? "";
  const currentDiscipline = searchParams.get("disciplineId") ?? "ALL";
  const currentPaymentStatus = (searchParams.get("paymentStatus") as "ALL" | "PAID" | "DUE_SOON" | "UNPAID") || "ALL";

  // State
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [belts, setBelts] = useState<Belt[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [activeCount, setActiveCount] = useState(0);
  const [minorsCount, setMinorsCount] = useState(0);
  const [totalXpPoints, setTotalXpPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Multi-discipline selection states
  const [selectedCreateDisciplineIds, setSelectedCreateDisciplineIds] = useState<string[]>([]);
  const [selectedEditDisciplineIds, setSelectedEditDisciplineIds] = useState<string[]>([]);

  // Photo Preview State for Creation Form
  const [createPhotoPreview, setCreatePhotoPreview] = useState<string | null>(null);

  // Selection state for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Modals & Dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<StudentWithDetails | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentWithDetails | null>(null);
  const [studentForCredential, setStudentForCredential] = useState<StudentWithDetails | null>(null);
  const [studentToPay, setStudentToPay] = useState<{
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null>(null);
  const [isDiplomaBuilderOpen, setIsDiplomaBuilderOpen] = useState(false);

  // Expediente 360° Drawer & Tabs State
  const [expedienteStudent, setExpedienteStudent] = useState<StudentExpediente | null>(null);
  const [_isLoadingExpediente, setIsLoadingExpediente] = useState(false);
  const [expedienteTab, setExpedienteTab] = useState<"general" | "payments">("general");
  const [expedientePaymentSearch, setExpedientePaymentSearch] = useState<string>("");
  const [expedientePayments, setExpedientePayments] = useState<StudentExpedientePayment[]>([]);
  const [expedientePaymentPage, setExpedientePaymentPage] = useState<number>(1);
  const [expedientePaymentTotalPages, setExpedientePaymentTotalPages] = useState<number>(1);
  const [expedientePaymentTotalCount, setExpedientePaymentTotalCount] = useState<number>(0);
  const [expedientePaymentTotalAmount, setExpedientePaymentTotalAmount] = useState<number>(0);
  const [expedientePaymentCurrency, setExpedientePaymentCurrency] = useState<string>("COP");
  const [isExpedientePaymentsLoading, setIsExpedientePaymentsLoading] = useState<boolean>(false);

  // User Account Modal State (Post-creation)
  const [userAccountStudent, setUserAccountStudent] = useState<StudentWithDetails | null>(null);
  const [userAccountEmail, setUserAccountEmail] = useState<string>("");
  const [userAccountPassword, setUserAccountPassword] = useState<string>("");
  const [isUserAccountLoading, setIsUserAccountLoading] = useState<boolean>(false);

  const handleOpenUserAccountModal = (student: StudentWithDetails) => {
    setUserAccountStudent(student);
    setUserAccountEmail(student.email || "");
    setUserAccountPassword("");
  };

  const handleCreateUserAccount = async () => {
    if (!userAccountStudent) return;
    if (!userAccountEmail || !userAccountEmail.includes("@")) {
      toast.error("Ingresa un correo electrónico válido.");
      return;
    }
    if (!userAccountPassword || userAccountPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsUserAccountLoading(true);
    const res = await createStudentUserAccountAction({
      studentId: userAccountStudent.id,
      email: userAccountEmail,
      password: userAccountPassword,
    });
    setIsUserAccountLoading(false);

    if (res.success) {
      toast.success("Cuenta de usuario creada exitosamente para el alumno.");
      setUserAccountStudent(null);
      fetchStudents();
    } else {
      toast.error(res.error || "Error al crear la cuenta de usuario.");
    }
  };

  // Filter states
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [disciplineInput, setDisciplineInput] = useState(currentDiscipline);
  const [paymentStatusInput, setPaymentStatusInput] = useState<"ALL" | "PAID" | "DUE_SOON" | "UNPAID">(currentPaymentStatus);

  // Forms
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    setValue: setValueCreate,
    watch: watchCreate,
    formState: { errors: errorsCreate, isSubmitting: isSubmittingCreate },
  } = useForm<CreateStudentInput>({
    resolver: zodResolver(createStudentSchema) as unknown as Resolver<CreateStudentInput>,
    defaultValues: {
      brandId: selectedBrandId === "ALL" ? "seed-brand-general" : selectedBrandId,
      name: "",
      email: "",
      birthDate: "",
      emergencyContact: "",
      idNumber: "",
      nationality: "",
      healthInsuranceProvider: "",
      healthInsurancePolicyNumber: "",
      medicalConditions: "",
      medications: "",
      disciplineIds: [],
      beltId: "",
      parentName: "",
      parentEmail: "",
      parentPhone: "",
      image: "",
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setValueEdit,
    watch: watchEdit,
    formState: { errors: errorsEdit, isSubmitting: isSubmittingEdit },
  } = useForm<UpdateStudentInput>({
    resolver: zodResolver(updateStudentSchema),
  });

  // Watch birthdates for automatic age detection
  const createBirthDateValue = watchCreate("birthDate");
  const createAge = calculateAge(createBirthDateValue);
  const isCreateMinor = createAge === null || createAge < 18;

  const editBirthDateValue = watchEdit("birthDate");
  const editAge = calculateAge(editBirthDateValue);
  const isEditMinor = editAge === null ? (studentToEdit?.parentId ? true : false) : editAge < 18;

  // Fetch Disciplines and Belts
  const fetchDisciplines = useCallback(async () => {
    const brandToUse = selectedBrandId === "ALL" ? "seed-brand-general" : selectedBrandId;
    const res = await getDisciplinesByBrandAction(brandToUse);
    if (res.success && res.data) {
      setDisciplines(res.data);
      if (res.data.length > 0) {
        const allDiscIds = res.data.map((d) => d.id);
        setSelectedCreateDisciplineIds([res.data[0].id]);
        setValueCreate("disciplineIds", [res.data[0].id]);
        const beltRes = await getBeltsByDisciplinesAction(allDiscIds);
        if (beltRes.success && beltRes.data) {
          setBelts(beltRes.data);
        }
      }
    }
  }, [selectedBrandId, setValueCreate]);

  // Fetch Students list from DB
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    const brandToUse = selectedBrandId === "ALL" ? "seed-brand-general" : selectedBrandId;
    const res = await getStudentsAction({
      brandId: brandToUse,
      search: currentSearch,
      disciplineId: currentDiscipline,
      paymentStatus: currentPaymentStatus,
      page: currentPage,
      limit: currentLimit,
    });

    if (res.success && res.data) {
      setStudents(res.data.students);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
      setActiveCount(res.data.activeCount);
      setMinorsCount(res.data.minorsCount || 0);
      setTotalXpPoints(res.data.totalXpPoints);
    } else if (res.error) {
      toast.error(res.error);
    }

    setIsLoading(false);
  }, [
    selectedBrandId,
    currentSearch,
    currentDiscipline,
    currentPaymentStatus,
    currentPage,
    currentLimit,
  ]);

  useEffect(() => {
    fetchDisciplines();
  }, [fetchDisciplines]);

  useEffect(() => {
    fetchStudents();
    setSelectedIds([]);
  }, [fetchStudents]);

  // Sync Search Query with URL
  const updateUrlParams = (params: Record<string, string | number | null>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all" || value === "ALL") {
        current.delete(key);
      } else {
        current.set(key, String(value));
      }
    });
    const searchString = current.toString();
    const query = searchString ? `?${searchString}` : "";
    router.push(`${pathname}${query}`, { scroll: false });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams({
      search: searchInput,
      disciplineId: disciplineInput,
      paymentStatus: paymentStatusInput,
      page: 1,
    });
  };

  const _handleDisciplineFilter = (value: string) => {
    updateUrlParams({ disciplineId: value, page: 1 });
  };

  const handlePageChange = (page: number) => {
    updateUrlParams({ page });
  };

  const handlePageSizeChange = (limit: number) => {
    updateUrlParams({ limit, page: 1 });
  };

  // Multi-Select Logic
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(students.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  // Toggle Single Student Active/Inactive status
  const handleToggleActive = async (studentId: string, currentIsActive: boolean) => {
    const nextState = !currentIsActive;
    const res = await toggleStudentActiveAction(studentId, nextState);
    if (res.success) {
      toast.success(
        nextState ? "Alumno activado correctamente." : "Alumno desactivado correctamente."
      );
      fetchStudents();
    } else {
      toast.error(res.error || "No se pudo cambiar el estado del alumno.");
    }
  };

  // Toggle Bulk Students Active/Inactive status
  const handleBulkToggleActive = async (targetIsActive: boolean) => {
    if (selectedIds.length === 0) return;
    const actionLabel = targetIsActive ? "activar" : "desactivar";
    if (
      !confirm(
        `¿Estás seguro de que deseas ${actionLabel} ${selectedIds.length} alumno(s) seleccionado(s)?`
      )
    ) {
      return;
    }

    const res = await bulkToggleStudentsActiveAction(selectedIds, targetIsActive);
    if (res.success) {
      toast.success(
        `${res.data} alumno(s) ${targetIsActive ? "activados" : "desactivados"} correctamente.`
      );
      setSelectedIds([]);
      fetchStudents();
    } else {
      toast.error(res.error || "No se pudo realizar la acción masiva.");
    }
  };

  // Photo Upload Handler (FileReader -> Base64 -> Action)
  const handlePhotoFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit = false,
    studentId?: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen elegida supera el límite de 5 MB. Selecciona una imagen más liviana.");
      return;
    }

    const processImage = (imageFile: File): Promise<string> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            const maxDim = 400; // Optimal 400px avatar size for badges & UI

            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              // Compressed JPEG at 75% quality (~30-50 KB per photo)
              resolve(canvas.toDataURL("image/jpeg", 0.75));
            } else {
              resolve(event.target?.result as string);
            }
          };
          img.onerror = () => resolve(event.target?.result as string);
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(imageFile);
      });
    };

    processImage(file).then(async (base64) => {
      if (isEdit && studentId) {
        const res = await uploadStudentPhotoAction(studentId, base64);
        if (res.success && res.data) {
          const updatedImageUrl = res.data.imageUrl;
          toast.success("Fotografía del alumno actualizada.");

          setStudents((prev) =>
            prev.map((s) =>
              s.id === studentId
                ? {
                    ...s,
                    photoUrl: updatedImageUrl,
                    user: s.user ? { ...s.user, image: updatedImageUrl } : s.user,
                  }
                : s
            )
          );

          setStudentToEdit((prev) =>
            prev && prev.id === studentId
              ? {
                  ...prev,
                  photoUrl: updatedImageUrl,
                  user: prev.user ? { ...prev.user, image: updatedImageUrl } : prev.user,
                }
              : prev
          );

          setExpedienteStudent((prev) =>
            prev && prev.id === studentId
              ? {
                  ...prev,
                  photoUrl: updatedImageUrl,
                  user: prev.user ? { ...prev.user, image: updatedImageUrl } : prev.user,
                }
              : prev
          );

          setStudentForCredential((prev) =>
            prev && prev.id === studentId
              ? {
                  ...prev,
                  photoUrl: updatedImageUrl,
                  user: prev.user ? { ...prev.user, image: updatedImageUrl } : prev.user,
                }
              : prev
          );

          fetchStudents();
        } else if (res.error) {
          toast.error(res.error);
        }
      } else {
        setCreatePhotoPreview(base64);
        setValueCreate("image", base64);
      }
    });
  };

  // Create Student Handler
  const onCreateSubmit = async (data: CreateStudentInput) => {
    const finalData = { ...data };
    if (createAge !== null && createAge >= 18) {
      finalData.parentName = "";
      finalData.parentEmail = "";
      finalData.parentPhone = "";
    }

    const res = await createStudentAction({
      ...finalData,
      brandId: selectedBrandId === "ALL" ? "seed-brand-general" : selectedBrandId,
    });

    if (res.success && res.data) {
      toast.success(`Alumno "${data.name}" registrado exitosamente.`);
      setIsCreateOpen(false);
      resetCreate();
      setCreatePhotoPreview(null);
      fetchStudents();
    } else if (res.error) {
      toast.error(res.error);
    }
  };

  // Edit Student Handler
  const openEditModal = (student: StudentWithDetails) => {
    setStudentToEdit(student);
    const dateStr = student.birthDate
      ? new Date(student.birthDate).toISOString().split("T")[0]
      : "";
    const activeDiscIds = student.enrollments.map((e) => e.disciplineId);
    setSelectedEditDisciplineIds(activeDiscIds);

    const studentName =
      student.user?.name ||
      `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
      "";
    const studentEmail = student.user?.email || student.email || "";

    setValueEdit("studentId", student.id);
    setValueEdit("name", studentName);
    setValueEdit("email", studentEmail);
    setValueEdit("birthDate", dateStr);
    setValueEdit("emergencyContact", student.emergencyContact || "");
    setValueEdit("idNumber", student.idNumber || "");
    setValueEdit("nationality", student.nationality || "");
    setValueEdit("healthInsuranceProvider", student.healthInsuranceProvider || "");
    setValueEdit("healthInsurancePolicyNumber", student.healthInsurancePolicyNumber || "");
    setValueEdit("medicalConditions", student.medicalConditions || "");
    setValueEdit("medications", student.medications || "");
    setValueEdit("beltId", student.currentBeltId || "");
    setValueEdit("disciplineIds", activeDiscIds);
    setValueEdit("effortPoints", student.effortPoints);
    setValueEdit("currentStreak", student.currentStreak);
    setValueEdit("shieldsAvailable", student.shieldsAvailable);
    setValueEdit("parentName", student.parent?.user?.name || "");
    setValueEdit("parentEmail", student.parent?.user?.email || "");
    setValueEdit("parentPhone", student.parent?.phoneNumber || "");
  };

  const onEditSubmit = async (data: UpdateStudentInput) => {
    const finalData = { ...data };
    if (editAge !== null && editAge >= 18) {
      finalData.parentName = "";
      finalData.parentEmail = "";
      finalData.parentPhone = "";
    }

    const res = await updateStudentAction({
      ...finalData,
      disciplineIds: selectedEditDisciplineIds,
    });
    if (res.success) {
      toast.success("Expediente del alumno actualizado.");
      setStudentToEdit(null);
      resetEdit();
      fetchStudents();
    } else if (res.error) {
      toast.error(res.error);
    }
  };

  // Delete Handlers
  const handleDeleteSingle = async () => {
    if (!studentToDelete) return;
    const delName =
      studentToDelete.user?.name ||
      `${studentToDelete.firstName || ""} ${studentToDelete.lastName || ""}`.trim() ||
      "Alumno";
    const res = await deleteStudentAction(studentToDelete.id);
    if (res.success) {
      toast.success(`Alumno "${delName}" eliminado del sistema.`);
      setStudentToDelete(null);
      fetchStudents();
    } else if (res.error) {
      toast.error(res.error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    const res = await bulkDeleteStudentsAction(selectedIds);
    if (res.success && res.data) {
      toast.success(`Se eliminaron ${res.data} alumnos seleccionados.`);
      setSelectedIds([]);
      fetchStudents();
    } else if (res.error) {
      toast.error(res.error);
    }
    setIsBulkDeleting(false);
  };

  // Expediente 360° Handler & Payments Fetcher
  const fetchExpedientePayments = useCallback(
    async (studentIdToFetch: string, pageToFetch = 1, searchQuery?: string) => {
      setIsExpedientePaymentsLoading(true);
      const res = await getStudentPaymentsPaginatedAction({
        studentId: studentIdToFetch,
        search: searchQuery ?? expedientePaymentSearch,
        page: pageToFetch,
        limit: 5,
      });
      if (res.success && res.data) {
        setExpedientePayments(res.data.payments);
        setExpedientePaymentPage(res.data.currentPage);
        setExpedientePaymentTotalPages(res.data.totalPages);
        setExpedientePaymentTotalCount(res.data.total);
        setExpedientePaymentTotalAmount(res.data.totalPaidAmount);
        setExpedientePaymentCurrency(res.data.currency);
      } else if (res.error) {
        toast.error(res.error);
      }
      setIsExpedientePaymentsLoading(false);
    },
    [expedientePaymentSearch]
  );

  const handleOpenExpediente = async (studentId: string) => {
    setIsLoadingExpediente(true);
    setExpedienteTab("general");
    setExpedientePaymentSearch("");
    setExpedientePaymentPage(1);
    const res = await getStudentExpedienteAction(studentId);
    if (res.success && res.data) {
      setExpedienteStudent(res.data);
      await fetchExpedientePayments(res.data.id, 1, "");
    } else if (res.error) {
      toast.error(res.error);
    }
    setIsLoadingExpediente(false);
  };

  const allSelected = students.length > 0 && selectedIds.length === students.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Users className="h-7 w-7 text-amber-500" />
            {t("dojo.studentsTitle", "Gestión de Alumnos & Expedientes")}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t("dojo.studentsSub", "Administra expedientes completos de estudiantes, ficha médica, seguro, identificación, grados y gamificación.")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CSVImportModal brandId={selectedBrandId || "ALL"} onSuccess={fetchStudents} />
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-sm font-bold text-xs"
          >
            <Plus className="h-4 w-4 mr-2" /> {t("dojo.createStudent", "Alta de Alumno")}
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              {t("dojo.kpiRegisteredStudents", "Alumnos Registrados")}
            </CardTitle>
            <Users className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-zinc-900 dark:text-white font-mono">{total}</div>
            <p className="text-[11px] text-zinc-500 mt-1">{t("dojo.kpiRegisteredStudentsSub", "Expedientes activos en el dojo")}</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              {t("dojo.kpiActiveStudents", "Alumnos Activos")}
            </CardTitle>
            <UserCheck className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {activeCount}
              </span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                👦 {minorsCount} {t("dojo.minorsTag", "menores (<18)")}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">{t("dojo.kpiActiveStudentsSub", "Con membresía y cuenta al día")}</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              {t("dojo.kpiXpPoints", "Puntos XP Acumulados")}
            </CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              ⚡ {totalXpPoints} XP
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">{t("dojo.kpiXpPointsSub", "El Camino del Esfuerzo")}</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              {t("dojo.kpiActiveDisciplines", "Disciplinas Activas")}
            </CardTitle>
            <Award className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
              {disciplines.length}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">{t("dojo.kpiActiveDisciplinesSub", "Cursos multi-disciplina")}</p>
          </CardContent>
        </Card>
      </div>

      {/* SERVER-SIDE FILTER BAR WITH 'BUSCAR' BUTTON */}
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/60 backdrop-blur shadow-xs rounded-2xl p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full flex-1">
            <div className="relative flex-1 min-w-[220px] w-full h-10 flex items-center">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder={t("dojo.searchStudentPlaceholder", "Buscar alumno por nombre, email, id o seguro...")}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-10 pl-9 pr-3 text-xs border border-zinc-200 dark:border-zinc-700/80 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
              />
            </div>

            <select
              value={disciplineInput}
              onChange={(e) => setDisciplineInput(e.target.value)}
              className="h-10 px-3 text-xs border border-zinc-200 dark:border-zinc-700/80 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-2xs w-full sm:w-auto shrink-0"
            >
              <option value="ALL">{t("dojo.allDisciplines", "Todas las Disciplinas")}</option>
              {disciplines.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.code ? `(${d.code})` : ""}
                </option>
              ))}
            </select>

            <select
              value={paymentStatusInput}
              onChange={(e) =>
                setPaymentStatusInput(
                  e.target.value as "ALL" | "PAID" | "DUE_SOON" | "UNPAID"
                )
              }
              className="h-10 px-3 text-xs border border-zinc-200 dark:border-zinc-700/80 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-2xs w-full sm:w-auto shrink-0"
            >
              <option value="ALL">{t("dojo.allPaymentStatuses", "Todos los Estados")}</option>
              <option value="PAID">🟢 {t("dojo.statusPaid", "Al Día")}</option>
              <option value="DUE_SOON">🟡 {t("dojo.statusDueSoon", "Por Vencer")}</option>
              <option value="UNPAID">🔴 {t("dojo.statusUnpaid", "Pago Pendiente")}</option>
            </select>

            <Button
              type="submit"
              className="h-10 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-extrabold rounded-xl text-xs px-5 cursor-pointer shrink-0 shadow-xs flex items-center justify-center gap-1.5 w-full sm:w-auto"
            >
              <Search className="h-3.5 w-3.5" /> {t("dojo.searchBtn", "Buscar")}
            </Button>
          </div>
        </form>
      </Card>

      {/* Main Table */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/60 backdrop-blur">
        <div>
          <Table>
            <TableHeader className="bg-zinc-50/80 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
              <TableRow>
                <TableHead className="w-8 text-center whitespace-nowrap" />
                <TableHead className="w-8 text-center whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 accent-amber-500 rounded cursor-pointer"
                  />
                </TableHead>
                <TableHead className="font-bold text-xs whitespace-nowrap">{t("dojo.studentCol", "Alumno")}</TableHead>
                <TableHead className="font-bold text-xs whitespace-nowrap">{t("dojo.disciplinesGradesCol", "Disciplinas & Grados")}</TableHead>
                <TableHead className="font-bold text-xs text-right whitespace-nowrap w-16">{t("dojo.actionsCol", "Acciones")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skel-${i}`}>
                    <TableCell colSpan={5} className="p-4">
                      <Skeleton className="h-8 w-full rounded-xl" />
                    </TableCell>
                  </TableRow>
                ))
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-zinc-500 text-xs font-medium">
                    No se encontraron alumnos con los criterios seleccionados.
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => {
                  const isSelected = selectedIds.includes(student.id);
                  const age = calculateAge(student.birthDate);

                  return (
                    <TableRow
                      key={student.id}
                      className={isSelected ? "bg-amber-500/5 dark:bg-amber-500/10" : undefined}
                    >
                      <TableCell className="text-center whitespace-nowrap w-8">
                        {student.paymentStatus === "PAID" ? (
                          <span
                            className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs ring-2 ring-emerald-500/20 shrink-0 inline-block cursor-help"
                            title="Al Día / Mensualidad Cubierta"
                          />
                        ) : student.paymentStatus === "DUE_SOON" ? (
                          <span
                            className="w-3 h-3 rounded-full bg-amber-500 shadow-xs ring-2 ring-amber-500/20 shrink-0 inline-block cursor-help"
                            title="Por Vencer (Último pago entre 25 y 30 días)"
                          />
                        ) : (
                          <span
                            className="w-3 h-3 rounded-full bg-rose-500 shadow-xs ring-2 ring-rose-500/20 shrink-0 inline-block cursor-help"
                            title="Pago Pendiente / Moroso (>30 días sin pago)"
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap w-8">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectOne(student.id, e.target.checked)}
                          className="h-4 w-4 accent-amber-500 rounded cursor-pointer shrink-0"
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleOpenExpediente(student.id)}
                            className="relative group cursor-pointer focus:outline-none shrink-0"
                            title="Ver Expediente Completo 360°"
                          >
                            {getStudentPhotoUrl(student) ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={getStudentPhotoUrl(student)!}
                                alt={student.user?.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || "Alumno"}
                                className="w-10 h-10 rounded-full object-cover border border-amber-500/40 shrink-0 shadow-xs group-hover:border-amber-500 group-hover:scale-105 transition-all"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black text-xs flex items-center justify-center border border-amber-500/30 shrink-0 group-hover:bg-amber-500/30 group-hover:scale-105 transition-all">
                                {(student.user?.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || "Alumno").slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </button>
                          <div className="space-y-0.5">
                            <button
                              type="button"
                              onClick={() => handleOpenExpediente(student.id)}
                              className="font-bold text-zinc-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 hover:underline text-sm whitespace-nowrap text-left transition-colors cursor-pointer flex items-center gap-1.5 group/name focus:outline-none"
                              title="Ver Expediente Completo 360°"
                            >
                              <span>
                                {student.user?.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || "Alumno"}
                              </span>
                              <Eye className="h-3.5 w-3.5 text-zinc-400 group-hover/name:text-amber-500 opacity-0 group-hover/name:opacity-100 transition-all shrink-0" />
                            </button>
                            <div className="text-xs text-zinc-500 flex items-center gap-1.5 whitespace-nowrap">
                              <span>
                                {student.user?.email || student.email || (student.parent?.user ? `Tutor: ${student.parent.user.name}` : t("dojo.noUserAccount", "Sin cuenta de usuario"))}
                              </span>
                              {age !== null && (
                                <span className="text-amber-600/90 dark:text-amber-400/90 font-bold">
                                  • {age} {t("dojo.yearsOld", "años")}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 pt-0.5 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold text-[11px] border border-orange-500/20 whitespace-nowrap">
                                <Flame className="h-3 w-3 fill-orange-500 text-orange-500" />
                                {student.currentStreak} {t("dojo.weeksAbbr", "sem")}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-[11px] border border-amber-500/20 font-mono whitespace-nowrap">
                                ⚡ {student.effortPoints} XP
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          {student.enrollments.map((enr) => {
                            const hasMatchingBelt = student.currentBelt && (
                              student.currentBelt.disciplineId === enr.disciplineId ||
                              student.enrollments.length === 1
                            );
                            const beltToDisplay = hasMatchingBelt ? student.currentBelt : null;

                            return (
                              <Badge
                                key={enr.id}
                                variant="outline"
                                className="bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200 font-bold px-2.5 py-0.5 text-xs flex items-center gap-1.5 rounded-xl whitespace-nowrap"
                              >
                                {beltToDisplay ? (
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0 border border-zinc-400/50 shadow-xs"
                                    style={{ backgroundColor: beltToDisplay.colorHex }}
                                    title={beltToDisplay.name}
                                  />
                                ) : (
                                  <span className="w-2 h-2 rounded-full shrink-0 bg-zinc-400/50" />
                                )}
                                <span className="whitespace-nowrap">
                                  {enr.discipline.name}
                                  {beltToDisplay && (
                                    <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 ml-1">
                                      • {beltToDisplay.name}
                                    </span>
                                  )}
                                </span>
                              </Badge>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap w-16">
                        <div className="flex items-center justify-end whitespace-nowrap">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer border border-zinc-200/80 dark:border-zinc-700/80"
                                title="Opciones del Alumno"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800">
                              <DropdownMenuItem
                                onClick={() =>
                                  setStudentToPay({
                                    id: student.id,
                                    firstName:
                                      student.firstName ||
                                      student.user?.name?.split(" ")[0] ||
                                      "Alumno",
                                    lastName:
                                      student.lastName ||
                                      student.user?.name?.split(" ").slice(1).join(" ") ||
                                      "",
                                    email: student.email || student.user?.email || null,
                                  })
                                }
                                className="gap-2.5 font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer"
                              >
                                <DollarSign className="h-4 w-4 text-emerald-500" />
                                <span>Registrar Pago / Mensualidad</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => setStudentForCredential(student)}
                                className="gap-2.5 font-medium cursor-pointer"
                              >
                                <CreditCard className="h-4 w-4 text-blue-500" />
                                <span>Credencial QR</span>
                              </DropdownMenuItem>

                              {student.user ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleToggleActive(
                                      student.id,
                                      student.user?.isActive ?? true
                                    )
                                  }
                                  className="gap-2.5 font-medium cursor-pointer"
                                >
                                  {student.user.isActive ? (
                                    <>
                                      <UserX className="h-4 w-4 text-amber-500" />
                                      <span>Desactivar Alumno</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="h-4 w-4 text-emerald-500" />
                                      <span>Activar Alumno</span>
                                    </>
                                  )}
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleOpenUserAccountModal(student)}
                                  className="gap-2.5 font-medium cursor-pointer"
                                >
                                  <UserPlus className="h-4 w-4 text-amber-500" />
                                  <span>Crear Cuenta Usuario</span>
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => openEditModal(student)}
                                className="gap-2.5 font-medium cursor-pointer"
                              >
                                <Edit2 className="h-4 w-4 text-amber-500" />
                                <span>Editar Expediente</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => setStudentToDelete(student)}
                                className="gap-2.5 font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4 text-rose-500" />
                                <span>Eliminar Alumno</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mandatory Pagination with Page Size Options */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-center">
          <PaginationControl
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            pageSize={currentLimit}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </div>
      </Card>

      {/* Modern Homogenized Floating Bulk Action Bar (No Scrollbars) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-950/95 dark:bg-zinc-900/95 backdrop-blur-md border border-amber-500/30 text-white p-2 px-3 rounded-2xl shadow-2xl flex items-center justify-center gap-2 z-50 animate-in slide-in-from-bottom-4 duration-200 max-w-[95vw] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[11px] font-black uppercase px-2.5 py-1 rounded-xl whitespace-nowrap shrink-0">
            {selectedIds.length} selec.
          </span>

          <div className="h-4 w-[1px] bg-white/10 shrink-0" />

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            <button
              type="button"
              onClick={() => handleBulkToggleActive(true)}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" /> Activar ({selectedIds.length})
            </button>

            <button
              type="button"
              onClick={() => handleBulkToggleActive(false)}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <UserX className="w-3.5 h-3.5" /> Desactivar ({selectedIds.length})
            </button>

            <button
              type="button"
              onClick={() => {
                const selected = students.filter((s) => selectedIds.includes(s.id));
                printStudentCredentials(selected);
              }}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Credenciales ({selectedIds.length})
            </button>

            <button
              type="button"
              onClick={() => setIsDiplomaBuilderOpen(true)}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" /> Diplomas ({selectedIds.length})
            </button>

            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-all flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> {isBulkDeleting ? "Eliminando..." : `Eliminar (${selectedIds.length})`}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="p-1 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all shrink-0 cursor-pointer"
            title="Deseleccionar todos"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* DIÁLOGO ALTA DE ALUMNO CON FICHA MÉDICA E IDENTIFICACIÓN */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[85vh] p-0 overflow-hidden flex flex-col border border-zinc-200 dark:border-zinc-800 shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900">
            <DialogTitle className="text-lg font-bold">Alta de Nuevo Alumno</DialogTitle>
            <DialogDescription className="text-xs">
              Registra la cuenta del estudiante, identificación, seguro médico, alergias,
              disciplinas y tutor si es menor.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitCreate(onCreateSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4 pr-5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full">
            {/* Fotografía Uploader */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-500/40 bg-zinc-200 dark:bg-zinc-700 shrink-0 flex items-center justify-center">
                {createPhotoPreview ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={createPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="h-6 w-6 text-zinc-400" />
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold block">Fotografía del Alumno (Servidor /uploads)</Label>
                <p className="text-[11px] text-zinc-400">Se guardará como [id_alumno].jpg en el volumen de uploads.</p>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => handlePhotoFileChange(e)}
                  className="text-xs text-zinc-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-500/20 file:text-amber-600 hover:file:bg-amber-500/30 cursor-pointer"
                />
              </div>
            </div>

            {/* Datos Personales Básicos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Nombre Completo del Alumno *</Label>
                <Input {...registerCreate("name")} placeholder="ej. Carlos Mendoza" className="mt-1 text-xs rounded-xl" />
                {errorsCreate.name && <p className="text-[11px] text-rose-500 mt-0.5">{errorsCreate.name.message}</p>}
              </div>
              <div>
                <Label className="text-xs font-semibold">Correo Electrónico *</Label>
                <Input {...registerCreate("email")} placeholder="ej. carlos@ejemplo.com" className="mt-1 text-xs rounded-xl" />
                {errorsCreate.email && <p className="text-[11px] text-rose-500 mt-0.5">{errorsCreate.email.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Fecha de Nacimiento</Label>
                  {createAge !== null && (
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      createAge < 18 ? "bg-purple-500/10 text-purple-600" : "bg-blue-500/10 text-blue-600"
                    }`}>
                      {createAge < 18 ? `👶 Menor (${createAge}a)` : `🧑 Mayor (${createAge}a)`}
                    </span>
                  )}
                </div>
                <Input type="date" {...registerCreate("birthDate")} className="mt-1 text-xs rounded-xl" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Contacto de Emergencia *</Label>
                <Input {...registerCreate("emergencyContact")} placeholder="ej. Tel: 555-0192 (Mamá)" className="mt-1 text-xs rounded-xl" />
              </div>
            </div>

            {/* Identificación & Nacionalidad */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 space-y-3">
              <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-4 w-4" /> Identificación & Nacionalidad
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">No. Identificación / Pasaporte / CURP</Label>
                  <Input {...registerCreate("idNumber")} placeholder="ej. PAS-982312 o CURP" className="mt-1 text-xs rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs">Nacionalidad</Label>
                  <Input {...registerCreate("nationality")} placeholder="ej. Mexicana, Española, etc." className="mt-1 text-xs rounded-xl" />
                </div>
              </div>
            </div>

            {/* Ficha Médica & Seguro */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 space-y-3">
              <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <HeartPulse className="h-4 w-4 text-rose-500" /> Ficha Médica & Seguro de Salud
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Institución / Aseguradora Médica</Label>
                  <Input {...registerCreate("healthInsuranceProvider")} placeholder="ej. AXA, IMSS, GNP" className="mt-1 text-xs rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs">No. de Póliza / Afiliación</Label>
                  <Input {...registerCreate("healthInsurancePolicyNumber")} placeholder="ej. POL-998231" className="mt-1 text-xs rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Condiciones Médicas / Alergias</Label>
                  <Input {...registerCreate("medicalConditions")} placeholder="ej. Asma, alergia a penicilina..." className="mt-1 text-xs rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs">Medicamentos Actuales</Label>
                  <Input {...registerCreate("medications")} placeholder="ej. Inhalador salbutamol..." className="mt-1 text-xs rounded-xl" />
                </div>
              </div>
            </div>

            {/* Multi-Disciplina & Cinturones Agrupados */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="h-4 w-4" /> Graduación & Inscripción por Disciplina
                </h4>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                  Asigna el cinturón de grado correspondiente a cada disciplina
                </span>
              </div>

              <div className="space-y-2.5">
                {disciplines.map((d) => {
                  const isChecked = selectedCreateDisciplineIds.includes(d.id);
                  const disciplineBelts = belts.filter((b) => b.disciplineId === d.id);
                  const currentSelectedBeltId = watchCreate("beltId");

                  return (
                    <div
                      key={d.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isChecked
                          ? "bg-amber-500/5 border-amber-500/30 dark:bg-amber-500/10 dark:border-amber-500/30"
                          : "bg-zinc-50 border-zinc-200 dark:bg-zinc-800/40 dark:border-zinc-700/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const updated = e.target.checked
                                ? [...selectedCreateDisciplineIds, d.id]
                                : selectedCreateDisciplineIds.filter((id) => id !== d.id);
                              setSelectedCreateDisciplineIds(updated);
                              setValueCreate("disciplineIds", updated);
                            }}
                            className="h-4 w-4 accent-amber-500 rounded cursor-pointer"
                          />
                          <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                            🥋 {d.name}
                          </span>
                        </label>

                        {isChecked ? (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            Inscrito(a)
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400">No inscrito</span>
                        )}
                      </div>

                      {/* Selector de Cinturón Específico para esta Disciplina */}
                      {isChecked && (
                        <div className="mt-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-semibold flex items-center gap-1">
                            <Award className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            Cinturón de Grado en {d.name}:
                          </span>
                          <select
                            value={
                              currentSelectedBeltId &&
                              disciplineBelts.some((b) => b.id === currentSelectedBeltId)
                                ? currentSelectedBeltId
                                : ""
                            }
                            onChange={(e) => setValueCreate("beltId", e.target.value)}
                            className="text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-1.5 px-2.5 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 cursor-pointer max-w-xs"
                          >
                            <option value="">-- Sin Grado / Cinturón Inicial --</option>
                            {disciplineBelts.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Datos del Tutor si es Menor */}
            {isCreateMinor ? (
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Baby className="h-4 w-4" /> Datos del Tutor / Guardián (Requerido para Menores)
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Nombre del Tutor</Label>
                    <Input {...registerCreate("parentName")} placeholder="Nombre Tutor" className="mt-1 text-xs rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-xs">Email del Tutor</Label>
                    <Input {...registerCreate("parentEmail")} placeholder="tutor@ejemplo.com" className="mt-1 text-xs rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-xs">Teléfono</Label>
                    <Input {...registerCreate("parentPhone")} placeholder="Teléfono" className="mt-1 text-xs rounded-xl" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-200 text-xs flex items-center gap-2 font-semibold">
                <User className="h-4 w-4 text-blue-500 shrink-0" />
                <span>
                  El alumno es{" "}
                  <strong>Mayor de Edad ({createAge} años)</strong>. No requiere
                  datos de tutor.
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl text-xs">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmittingCreate} className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold">
                {isSubmittingCreate ? "Guardando..." : "Guardar Alumno"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO EDITAR EXPEDIENTE COMPLETO DEL ALUMNO (360° EDIT) */}
      {studentToEdit && (
        <Dialog open={!!studentToEdit} onOpenChange={() => setStudentToEdit(null)}>
          <DialogContent className="max-w-2xl rounded-2xl max-h-[85vh] p-0 overflow-hidden flex flex-col border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <DialogHeader className="p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-amber-500" />
                Editar Expediente Completo de Alumno:{" "}
                {studentToEdit.user?.name ||
                  `${studentToEdit.firstName || ""} ${studentToEdit.lastName || ""}`.trim() ||
                  "Alumno"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Modifica datos personales, ficha médica, seguro, identificación, grados,
                gamificación y tutor.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmitEdit(onEditSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4 pr-5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full">
              {/* Sección 1: Fotografía Oficial */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-500/40 bg-zinc-200 shrink-0">
                  {getStudentPhotoUrl(studentToEdit) ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={getStudentPhotoUrl(studentToEdit)!} alt={studentToEdit.user?.name || `${studentToEdit.firstName || ''} ${studentToEdit.lastName || ''}`.trim() || "Alumno"} className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-zinc-400 m-5" />
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold block">Fotografía Oficial del Alumno</Label>
                  <p className="text-[11px] text-zinc-400">Actualiza la foto oficial en el servidor /uploads.</p>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={(e) => handlePhotoFileChange(e, true, studentToEdit.id)}
                    className="text-xs text-zinc-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-amber-500/20 file:text-amber-600 hover:file:bg-amber-500/30 cursor-pointer"
                  />
                </div>
              </div>

              {/* Sección 2: Datos Personales & Emergencia */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Nombre Completo del Alumno *</Label>
                  <Input {...registerEdit("name")} className="mt-1 text-xs rounded-xl" />
                  {errorsEdit.name && <p className="text-[11px] text-rose-500 mt-0.5">{errorsEdit.name.message}</p>}
                </div>
                <div>
                  <Label className="text-xs font-semibold">Correo Electrónico *</Label>
                  <Input {...registerEdit("email")} className="mt-1 text-xs rounded-xl" />
                  {errorsEdit.email && <p className="text-[11px] text-rose-500 mt-0.5">{errorsEdit.email.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Fecha de Nacimiento</Label>
                    {editAge !== null && (
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        editAge < 18 ? "bg-purple-500/10 text-purple-600" : "bg-blue-500/10 text-blue-600"
                      }`}>
                        {editAge < 18 ? `👶 Menor (${editAge}a)` : `🧑 Mayor (${editAge}a)`}
                      </span>
                    )}
                  </div>
                  <Input type="date" {...registerEdit("birthDate")} className="mt-1 text-xs rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Contacto de Emergencia</Label>
                  <Input {...registerEdit("emergencyContact")} className="mt-1 text-xs rounded-xl" />
                </div>
              </div>

              {/* Sección 3: Identificación & Nacionalidad */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 space-y-3">
                <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-4 w-4" /> Identificación & Nacionalidad
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">No. Identificación / Pasaporte / CURP</Label>
                    <Input {...registerEdit("idNumber")} placeholder="ej. PAS-982312" className="mt-1 text-xs rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-xs">Nacionalidad</Label>
                    <Input {...registerEdit("nationality")} placeholder="ej. Mexicana, Española" className="mt-1 text-xs rounded-xl" />
                  </div>
                </div>
              </div>

              {/* Sección 4: Ficha Médica & Seguro */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 space-y-3">
                <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <HeartPulse className="h-4 w-4 text-rose-500" /> Ficha Médica & Seguro de Salud
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Institución / Aseguradora Médica</Label>
                    <Input {...registerEdit("healthInsuranceProvider")} placeholder="ej. AXA, IMSS" className="mt-1 text-xs rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-xs">No. de Póliza / Afiliación</Label>
                    <Input {...registerEdit("healthInsurancePolicyNumber")} placeholder="ej. POL-998231" className="mt-1 text-xs rounded-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Condiciones Médicas / Alergias</Label>
                    <Input {...registerEdit("medicalConditions")} placeholder="ej. Asma, alergia a penicilina" className="mt-1 text-xs rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-xs">Medicamentos Actuales</Label>
                    <Input {...registerEdit("medications")} placeholder="ej. Inhalador salbutamol" className="mt-1 text-xs rounded-xl" />
                  </div>
                </div>
              </div>

              {/* Sección 5: Graduación & Disciplinas Agrupadas */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="h-4 w-4" /> Graduación & Inscripción por Disciplina
                  </h4>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                    Asigna el cinturón de grado correspondiente a cada disciplina
                  </span>
                </div>

                <div className="space-y-2.5">
                  {disciplines.map((d) => {
                    const isChecked = selectedEditDisciplineIds.includes(d.id);
                    const disciplineBelts = belts.filter((b) => b.disciplineId === d.id);
                    const currentSelectedBeltId = watchEdit("beltId");

                    return (
                      <div
                        key={d.id}
                        className={`p-3 rounded-xl border transition-all ${
                          isChecked
                            ? "bg-amber-500/5 border-amber-500/30 dark:bg-amber-500/10 dark:border-amber-500/30"
                            : "bg-zinc-50 border-zinc-200 dark:bg-zinc-800/40 dark:border-zinc-700/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const updated = e.target.checked
                                  ? [...selectedEditDisciplineIds, d.id]
                                  : selectedEditDisciplineIds.filter((id) => id !== d.id);
                                setSelectedEditDisciplineIds(updated);
                                setValueEdit("disciplineIds", updated);
                              }}
                              className="h-4 w-4 accent-amber-500 rounded cursor-pointer"
                            />
                            <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                              🥋 {d.name}
                            </span>
                          </label>

                          {isChecked ? (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                              Inscrito(a)
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-400">No inscrito</span>
                          )}
                        </div>

                        {/* Selector de Cinturón Específico para esta Disciplina */}
                        {isChecked && (
                          <div className="mt-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-semibold flex items-center gap-1">
                              <Award className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              Cinturón de Grado en {d.name}:
                            </span>
                            <select
                              value={
                                currentSelectedBeltId &&
                                disciplineBelts.some((b) => b.id === currentSelectedBeltId)
                                  ? currentSelectedBeltId
                                  : ""
                              }
                              onChange={(e) => setValueEdit("beltId", e.target.value)}
                              className="text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-1.5 px-2.5 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 cursor-pointer max-w-xs"
                            >
                              <option value="">-- Sin Grado / Cinturón Inicial --</option>
                              {disciplineBelts.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sección 6: Gamificación El Camino del Esfuerzo */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 space-y-3">
                <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  El Camino del Esfuerzo (Gamificación & Racha)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Puntos XP de Esfuerzo</Label>
                    <Input type="number" {...registerEdit("effortPoints")} className="mt-1 text-xs rounded-xl font-mono" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Racha Actual (Semanas)</Label>
                    <Input type="number" {...registerEdit("currentStreak")} className="mt-1 text-xs rounded-xl font-mono" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Escudos Disponibles</Label>
                    <Input type="number" {...registerEdit("shieldsAvailable")} className="mt-1 text-xs rounded-xl font-mono" />
                  </div>
                </div>
              </div>

              {/* Sección 7: Datos del Tutor Responsable (SÓLO SI ES MENOR DE EDAD) */}
              {isEditMinor ? (
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Baby className="h-4 w-4" /> Datos del Tutor / Guardián Responsable (Menor de Edad)
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Nombre Tutor</Label>
                      <Input {...registerEdit("parentName")} placeholder="Nombre Tutor" className="mt-1 text-xs rounded-xl" />
                    </div>
                    <div>
                      <Label className="text-xs">Email Tutor</Label>
                      <Input {...registerEdit("parentEmail")} placeholder="tutor@ejemplo.com" className="mt-1 text-xs rounded-xl" />
                    </div>
                    <div>
                      <Label className="text-xs">Teléfono</Label>
                      <Input {...registerEdit("parentPhone")} placeholder="Teléfono" className="mt-1 text-xs rounded-xl" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-200 text-xs flex items-center gap-2 font-semibold">
                  <User className="h-4 w-4 text-blue-500 shrink-0" />
                  <span>
                    El alumno es{" "}
                    <strong>Mayor de Edad ({editAge} años)</strong>. Los datos de
                    tutor no son requeridos.
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <Button type="button" variant="outline" onClick={() => setStudentToEdit(null)} className="rounded-xl text-xs font-semibold">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmittingEdit} className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs">
                  {isSubmittingEdit ? "Guardando..." : "Guardar Expediente Completo"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* DIÁLOGO CONFIRMAR ELIMINAR */}
      {studentToDelete && (
        <AlertDialog open={!!studentToDelete} onOpenChange={() => setStudentToDelete(null)}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <div className="flex items-center gap-2 text-rose-500">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <AlertDialogTitle>¿Eliminar Expediente del Alumno?</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-xs mt-2">
                Estás a punto de eliminar a{" "}
                <strong className="text-zinc-900 dark:text-white">
                  {studentToDelete.user?.name ||
                    `${studentToDelete.firstName || ""} ${studentToDelete.lastName || ""}`.trim() ||
                    "Alumno"}
                </strong>{" "}
                y su expediente del sistema. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="pt-3">
              <AlertDialogCancel className="rounded-xl text-xs">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteSingle} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold">
                Sí, Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* EXPEDIENTE 360° MODAL CON FICHA MÉDICA Y HISTORIAL DE PAGOS DEL ALUMNO */}
      {expedienteStudent && (
        <Dialog open={!!expedienteStudent} onOpenChange={() => setExpedienteStudent(null)}>
          <DialogContent className="max-w-3xl rounded-3xl max-h-[88vh] p-0 overflow-hidden flex flex-col border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <DialogHeader className="p-6 pb-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Eye className="h-5 w-5 text-indigo-500" /> Expediente Completo 360°:{" "}
                {expedienteStudent.user?.name ||
                  `${expedienteStudent.firstName || ""} ${expedienteStudent.lastName || ""}`.trim() ||
                  "Alumno"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Resumen de cuenta, datos personales, ficha médica, seguro,
                identificación, historial de pagos y avance en El Camino del Esfuerzo.
              </DialogDescription>
            </DialogHeader>

            {/* BARRA DE PESTAÑAS DEL EXPEDIENTE 360° */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 px-6 pt-2 shrink-0 gap-6">
              <button
                type="button"
                onClick={() => setExpedienteTab("general")}
                className={cn(
                  "pb-3 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 cursor-pointer focus:outline-none",
                  expedienteTab === "general"
                    ? "border-amber-500 text-amber-600 dark:text-amber-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                )}
              >
                <User className="h-4 w-4" />
                General & Ficha Médica
              </button>
              <button
                type="button"
                onClick={() => setExpedienteTab("payments")}
                className={cn(
                  "pb-3 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 cursor-pointer focus:outline-none",
                  expedienteTab === "payments"
                    ? "border-amber-500 text-amber-600 dark:text-amber-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                )}
              >
                <CreditCard className="h-4 w-4" />
                Historial de Pagos ({expedienteStudent.payments?.length || 0})
              </button>
            </div>

            {expedienteTab === "general" ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-4 pr-5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full text-xs">
                {/* Header de Foto del Alumno */}
                <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-amber-500 shrink-0 shadow-md">
                    {getStudentPhotoUrl(expedienteStudent) ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={getStudentPhotoUrl(expedienteStudent)!} alt={expedienteStudent.user?.name || `${expedienteStudent.firstName || ''} ${expedienteStudent.lastName || ''}`.trim() || "Alumno"} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-amber-500/20 text-amber-600 font-black text-xl flex items-center justify-center">
                        {(expedienteStudent.user?.name || `${expedienteStudent.firstName || ''} ${expedienteStudent.lastName || ''}`.trim() || "Alumno").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                      {expedienteStudent.user?.name || `${expedienteStudent.firstName || ''} ${expedienteStudent.lastName || ''}`.trim() || "Alumno"}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {expedienteStudent.user?.email || expedienteStudent.email || "Sin cuenta de usuario"}
                    </p>
                    <label className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 cursor-pointer hover:bg-amber-500/20">
                      <Camera className="h-3.5 w-3.5" />
                      Actualizar Fotografía
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={(e) => handlePhotoFileChange(e, true, expedienteStudent.id)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Ficha de Identificación, Salud y Emergencia */}
                <div className="grid grid-cols-2 gap-3 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div>
                    <span className="text-zinc-400 font-bold block">Puntos XP / Racha:</span>
                    <span className="font-bold text-amber-500">⚡ {expedienteStudent.effortPoints} XP | 🔥 {expedienteStudent.currentStreak} semanas</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-bold block">Contacto de Emergencia:</span>
                    <span className="font-bold text-zinc-900 dark:text-white">{expedienteStudent.emergencyContact || "No especificado"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-bold block">Edad & Clasificación:</span>
                    {(() => {
                      const age = calculateAge(expedienteStudent.birthDate);
                      if (age === null) return <span>No registrada</span>;
                      return (
                        <span className="font-bold text-zinc-900 dark:text-white">
                          {age} años {age < 18 ? "(Menor de edad)" : "(Mayor de edad)"}
                        </span>
                      );
                    })()}
                  </div>
                  <div>
                    <span className="text-zinc-400 font-bold block">Identificación / Pasaporte:</span>
                    <span>{expedienteStudent.idNumber || "Sin registrar"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-bold block">Nacionalidad:</span>
                    <span>{expedienteStudent.nationality || "Sin registrar"}</span>
                  </div>
                  {calculateAge(expedienteStudent.birthDate) !== null &&
                    (calculateAge(expedienteStudent.birthDate) ?? 0) < 18 && (
                      <div>
                        <span className="text-zinc-400 font-bold block">Tutor Responsable:</span>
                        <span>{expedienteStudent.parent?.user?.name || "Sin tutor registrado"}</span>
                      </div>
                    )}
                </div>

                {/* Sección Médica Destacada */}
                <div className="p-3.5 rounded-xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 space-y-2">
                  <h4 className="font-bold text-rose-600 dark:text-rose-400 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                    <HeartPulse className="h-4 w-4" /> Información Médica & Seguro
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-zinc-400 font-bold block">Aseguradora / Seguro Médico:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {expedienteStudent.healthInsuranceProvider ? (
                          `${expedienteStudent.healthInsuranceProvider} (${expedienteStudent.healthInsurancePolicyNumber || "Sin no. póliza"})`
                        ) : (
                          "Sin seguro registrado"
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 font-bold block">Condiciones Médicas / Alergias:</span>
                      <span className="font-semibold text-rose-600 dark:text-rose-400">
                        {expedienteStudent.medicalConditions || "Ninguna declarada"}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-zinc-400 font-bold block">Medicamentos Actuales:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {expedienteStudent.medications || "Ninguno"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Disciplinas & Grados */}
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-white mb-2">Disciplinas & Grados Inscritos:</h4>
                  <div className="flex flex-wrap gap-2">
                    {expedienteStudent.enrollments.map((enr) => {
                      const hasMatchingBelt = expedienteStudent.currentBelt && (
                        expedienteStudent.currentBelt.disciplineId === enr.disciplineId ||
                        expedienteStudent.enrollments.length === 1
                      );
                      const beltToDisplay = hasMatchingBelt ? expedienteStudent.currentBelt : null;

                      return (
                        <Badge
                          key={enr.id}
                          variant="outline"
                          className="bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200 font-bold px-3 py-1 text-xs flex items-center gap-2 rounded-xl"
                        >
                          {beltToDisplay ? (
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0 border border-zinc-400/50 shadow-xs"
                              style={{ backgroundColor: beltToDisplay.colorHex }}
                              title={beltToDisplay.name}
                            />
                          ) : (
                            <span className="w-2 h-2 rounded-full shrink-0 bg-zinc-400/50" />
                          )}
                          <span>
                            {enr.discipline.name}
                            {beltToDisplay && (
                              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 ml-1">
                                • {beltToDisplay.name}
                              </span>
                            )}
                          </span>
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {/* Exámenes Certificados */}
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-white mb-2">Historial de Exámenes Certificados:</h4>
                  {expedienteStudent.examEvaluations.length === 0 ? (
                    <p className="text-zinc-400 italic">No presenta exámenes registrados aún.</p>
                  ) : (
                    <div className="space-y-1">
                      {expedienteStudent.examEvaluations.map((ev) => (
                        <div key={ev.id} className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 flex justify-between">
                          <span>{ev.examTitle} ({ev.beltTargetName})</span>
                          <span className="font-bold text-emerald-500">{ev.status} - Score: {ev.score ?? "N/A"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-4 pr-5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full text-xs">
                {/* TARJETA RESUMEN FINANCIERO DEL ALUMNO */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-zinc-500 dark:text-zinc-400 font-semibold block text-[11px]">Total Histórico Invertido</span>
                    <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                      ${expedientePaymentTotalAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {expedientePaymentCurrency}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                    <span className="text-zinc-500 dark:text-zinc-400 font-semibold block text-[11px]">Total Transacciones</span>
                    <span className="text-lg font-black text-zinc-900 dark:text-white">
                      {expedientePaymentTotalCount} recibos
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-center">
                    <span className="text-zinc-500 dark:text-zinc-400 font-semibold block text-[11px]">Estado Actual</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      Colegiaturas al Día
                    </span>
                  </div>
                </div>

                {/* BUSCADOR DE PAGOS CON BOTÓN DE BÚSQUEDA AL SERVIDOR */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (expedienteStudent) {
                      fetchExpedientePayments(expedienteStudent.id, 1, expedientePaymentSearch);
                    }
                  }}
                  className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1"
                >
                  <div className="flex items-center gap-2 flex-1 w-full">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                      <Input
                        value={expedientePaymentSearch}
                        onChange={(e) => setExpedientePaymentSearch(e.target.value)}
                        placeholder="Buscar en historial por concepto o método..."
                        className="pl-9 text-xs rounded-xl h-9 border-zinc-200 dark:border-zinc-700"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isExpedientePaymentsLoading}
                      className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs h-9 px-4 gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Search className="h-3.5 w-3.5" />
                      {isExpedientePaymentsLoading ? "Buscando..." : "Buscar"}
                    </Button>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setStudentToPay({
                        id: expedienteStudent.id,
                        firstName: expedienteStudent.firstName || expedienteStudent.user?.name?.split(" ")[0] || "Alumno",
                        lastName: expedienteStudent.lastName || expedienteStudent.user?.name?.split(" ").slice(1).join(" ") || "",
                        email: expedienteStudent.email || expedienteStudent.user?.email || null,
                      });
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-9 gap-1.5 shrink-0 cursor-pointer w-full sm:w-auto"
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    Registrar Nuevo Pago
                  </Button>
                </form>

                {/* TABLA DE HISTORIAL DE PAGOS */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
                  <Table>
                    <TableHeader className="bg-zinc-50 dark:bg-zinc-900/80">
                      <TableRow>
                        <TableHead className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">Fecha</TableHead>
                        <TableHead className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">Concepto</TableHead>
                        <TableHead className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 text-right">Monto</TableHead>
                        <TableHead className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">Método</TableHead>
                        <TableHead className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 text-center">Estatus</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isExpedientePaymentsLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-zinc-400 italic">
                            Cargando historial de pagos del servidor...
                          </TableCell>
                        </TableRow>
                      ) : expedientePayments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-zinc-400 italic">
                            No hay registros de pago encontrados para este alumno.
                          </TableCell>
                        </TableRow>
                      ) : (
                        expedientePayments.map((p) => {
                          const payDate = new Date(p.createdAt);
                          const dateFormatted = isNaN(payDate.getTime())
                            ? String(p.createdAt)
                            : payDate.toLocaleDateString("es-MX", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              });

                          return (
                            <TableRow key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                              <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                                {dateFormatted}
                              </TableCell>
                              <TableCell className="font-medium text-zinc-800 dark:text-zinc-200">
                                {p.concept}
                                {p.description && (
                                  <span className="block text-[10px] text-zinc-400 font-normal">
                                    {p.description}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                ${p.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {p.currency}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-[10px] uppercase border border-zinc-200 dark:border-zinc-700">
                                  {p.gatewayProvider || "Manual"}
                                </span>
                              </TableCell>
                              <TableCell className="text-center whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                                  <Check className="h-3 w-3" />
                                  Pagado
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* PAGINADO DEL SERVIDOR */}
                <PaginationControl
                  currentPage={expedientePaymentPage}
                  totalPages={expedientePaymentTotalPages}
                  onPageChange={(newPage) => {
                    if (expedienteStudent) {
                      fetchExpedientePayments(expedienteStudent.id, newPage);
                    }
                  }}
                  className="pt-2 pb-0"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL CREDENCIAL OFICIAL DE ALUMNO (CARNET INDIVIDUAL TAMAÑO TARJETA DE CRÉDITO) */}
      {studentForCredential && (
        <Dialog open={!!studentForCredential} onOpenChange={() => setStudentForCredential(null)}>
          <DialogContent className="max-w-xl rounded-3xl p-0 overflow-hidden flex flex-col border border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
            <DialogHeader className="p-5 pb-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-50 dark:bg-zinc-800/60 flex flex-row items-center justify-between">
              <div>
                <DialogTitle className="text-base font-extrabold flex items-center gap-2 text-amber-500">
                  <CreditCard className="h-5 w-5" /> Credencial Oficial de Alumno
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                  Carnet digital con código QR (Estándar ISO/IEC 7810 ID-1: 85.6mm x 54mm)
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="p-6 space-y-6 flex flex-col items-center justify-center">
              {/* ÁREA DE IMPRESIÓN INDIVIDUAL */}
              <div className="credential-print-area flex justify-center">
                {/* CARNET TAMAÑO TARJETA DE CRÉDITO REAL (85.6mm x 54mm) */}
                <div className="credential-card-print-item w-[85.6mm] h-[54mm] min-w-[85.6mm] max-w-[85.6mm] min-h-[54mm] max-h-[54mm] rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border-2 border-amber-500/40 p-3 shadow-2xl relative overflow-hidden flex flex-col justify-between select-none text-white font-sans shrink-0">
                  {/* Background Ambient Radial */}
                  <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-28 h-28 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />

                  {/* Header del Carnet: Logo Dojo + Nombre de Escuela */}
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-1 z-10">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 font-black text-xs shadow-xs shrink-0">
                        <Swords className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black tracking-tight text-white leading-none">
                          Menlu <span className="text-amber-400 font-normal">门路</span>
                        </span>
                        <span className="text-[7.5px] font-bold text-amber-500/90 tracking-widest uppercase leading-none mt-0.5">
                          Academia de Artes Marciales
                        </span>
                      </div>
                    </div>
                    <div className="px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 font-extrabold text-[7.5px] uppercase tracking-wider leading-none">
                      MEMBRESÍA OFICIAL
                    </div>
                  </div>

                  {/* Cuerpo del Carnet: Foto + Datos Alumno + QR Code */}
                  <div className="grid grid-cols-12 gap-2 items-center my-auto z-10">
                    {/* Foto del Alumno */}
                    <div className="col-span-3 flex justify-center">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-amber-400 shadow-md bg-zinc-800 flex items-center justify-center shrink-0">
                        {getStudentPhotoUrl(studentForCredential) ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={getStudentPhotoUrl(studentForCredential)!}
                            alt={studentForCredential.user?.name || `${studentForCredential.firstName || ''} ${studentForCredential.lastName || ''}`.trim() || "Alumno"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6 text-zinc-500" />
                        )}
                      </div>
                    </div>

                    {/* Datos Principales */}
                    <div className="col-span-5 space-y-0.5 min-w-0">
                      <h4 className="text-[11px] font-black text-white leading-tight truncate" title={studentForCredential.user?.name || `${studentForCredential.firstName || ''} ${studentForCredential.lastName || ''}`.trim() || "Alumno"}>
                        {studentForCredential.user?.name || `${studentForCredential.firstName || ''} ${studentForCredential.lastName || ''}`.trim() || "Alumno"}
                      </h4>
                      <p className="text-[9px] font-mono font-bold text-amber-400 leading-none">
                        ID: STU-{studentForCredential.id.slice(-6).toUpperCase()}
                      </p>

                      {/* Insignia de Disciplinas */}
                      <div className="pt-0.5 flex flex-wrap gap-0.5 max-h-7 overflow-hidden">
                        {studentForCredential.enrollments &&
                        studentForCredential.enrollments.length > 0 ? (
                          studentForCredential.enrollments.slice(0, 2).map((enr) => (
                            <span
                              key={enr.id}
                              className="inline-flex items-center gap-1 px-1 py-0.2 rounded bg-zinc-800/90 border border-zinc-700 text-[7.5px] font-semibold text-zinc-200 truncate"
                            >
                              <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                              <span className="truncate">{enr.discipline?.name}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-[7.5px] text-zinc-400">Sin disciplina</span>
                        )}
                      </div>

                      {studentForCredential.currentBelt && (
                        <div className="inline-flex items-center gap-1 text-[8px] font-bold text-amber-300">
                          <span
                            className="w-1.5 h-1.5 rounded-full border border-zinc-900 shrink-0"
                            style={{ backgroundColor: studentForCredential.currentBelt.colorHex || "#e4e4e7" }}
                          />
                          <span className="truncate">{studentForCredential.currentBelt.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Código QR Escaneable */}
                    <div className="col-span-4 flex flex-col items-center justify-center space-y-0.5 bg-white p-1 rounded-xl shadow-md text-zinc-950 shrink-0">
                      <QRCode
                        value={`MENLU:STUDENT:${studentForCredential.id}`}
                        size={52}
                        bgColor="#ffffff"
                        fgColor="#09090b"
                      />
                      <span className="text-[7px] font-mono font-bold text-zinc-700 uppercase tracking-tighter text-center leading-none">
                        Escanear Tatami
                      </span>
                    </div>
                  </div>

                  {/* Footer del Carnet */}
                  <div className="flex items-center justify-between border-t border-zinc-800/80 pt-1 text-[8px] text-zinc-400 z-10 leading-none">
                    <span className="truncate max-w-[190px]">
                      Emergencia: <strong className="text-zinc-200">{studentForCredential.emergencyContact || "No Registrado"}</strong>
                    </span>
                    <span className="font-mono text-amber-400/80 text-[7.5px]">MENLU-PASS</span>
                  </div>
                </div>
              </div>

              {/* Acciones de Imprimir */}
              <div className="flex items-center justify-center gap-3 w-full pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <Button
                  type="button"
                  onClick={() => printStudentCredentials([studentForCredential])}
                  className="rounded-xl text-xs gap-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold shadow-xs cursor-pointer"
                >
                  <Printer className="h-4 w-4" /> Imprimir Credencial
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStudentForCredential(null)}
                  className="rounded-xl text-xs border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL POST-CREACIÓN PARA GENERAR CUENTA DE USUARIO */}
      {userAccountStudent && (
        <Dialog
          open={!!userAccountStudent}
          onOpenChange={(open) => !open && setUserAccountStudent(null)}
        >
          <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-white">
                <UserPlus className="h-5 w-5 text-amber-500" />
                Generar Acceso de Usuario
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                Crea credenciales de inicio de sesión para el alumno{" "}
                <strong>
                  {userAccountStudent.user?.name ||
                    `${userAccountStudent.firstName || ""} ${userAccountStudent.lastName || ""}`.trim() ||
                    "Alumno"}
                </strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{t("dojo.userEmailLabel", "Correo Electrónico")}</Label>
                <Input
                  type="email"
                  value={userAccountEmail}
                  onChange={(e) => setUserAccountEmail(e.target.value)}
                  placeholder="alumno@ejemplo.com"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{t("dojo.userPasswordLabel", "Contraseña")}</Label>
                <Input
                  type="password"
                  value={userAccountPassword}
                  onChange={(e) => setUserAccountPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setUserAccountStudent(null)}
                className="rounded-xl text-xs cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleCreateUserAccount}
                disabled={isUserAccountLoading}
                className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer"
              >
                {isUserAccountLoading ? "Creando..." : "Crear Cuenta"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* CONSTRUCTOR Y DISEÑADOR DE DIPLOMAS DEL DOJO */}
      {isDiplomaBuilderOpen && (
        <DiplomaBuilderModal
          open={isDiplomaBuilderOpen}
          onOpenChange={setIsDiplomaBuilderOpen}
          students={students.filter((s) => selectedIds.includes(s.id))}
          activeFilterDisciplineName={
            currentDiscipline !== "ALL"
              ? disciplines.find((d) => d.id === currentDiscipline)?.name
              : undefined
          }
        />
      )}

      {/* MODAL DE REGISTRO MANUAL DE PAGOS Y COLEGIATURAS */}
      <RegisterStudentPaymentModal
        isOpen={!!studentToPay}
        onOpenChange={(open) => !open && setStudentToPay(null)}
        student={studentToPay}
        onSuccess={fetchStudents}
      />
    </div>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-zinc-500">Cargando gestión de alumnos...</div>}>
      <StudentsTableContent />
    </Suspense>
  );
}
