"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  UserPlus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/components/providers/i18n-provider";
import { useBrand } from "@/context/brand-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  getTournamentParticipantsAction,
  enrollStudentParticipantAction,
  createExternalParticipantAction,
  deleteParticipantAction,
  getCategoriesByTournamentAction,
} from "@/actions/tournaments";
import { getStudentsByBrandAction } from "@/actions/students";
import { TournamentPaymentModal } from "@/components/tournaments/tournament-payment-modal";
import type { Tournament, TournamentParticipant, StudentProfile, TournamentCategory } from "@/types";

interface TournamentParticipantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament: Tournament | null;
  onSuccess?: () => void;
}

export function TournamentParticipantsDialog({
  open,
  onOpenChange,
  tournament,
  onSuccess,
}: TournamentParticipantsDialogProps) {
  const { t } = useTranslation();
  const { selectedBrandId } = useBrand();

  const [activeTab, setActiveTab] = useState<string>("enrolled");
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [dojoStudents, setDojoStudents] = useState<StudentProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [searchEnrolled, setSearchEnrolled] = useState<string>("");
  const [searchStudent, setSearchStudent] = useState<string>("");

  // Payment modal state
  const [payingParticipant, setPayingParticipant] =
    useState<TournamentParticipant | null>(null);

  // External Form state
  const [extFirstName, setExtFirstName] = useState<string>("");
  const [extLastName, setExtLastName] = useState<string>("");
  const [extAge, setExtAge] = useState<string>("");
  const [extGender, setExtGender] = useState<string>("MIXED");
  const [extWeightKg, setExtWeightKg] = useState<string>("");
  const [extDojoName, setExtDojoName] = useState<string>("");
  const [extBeltName, setExtBeltName] = useState<string>("");
  const [extEmail, setExtEmail] = useState<string>("");
  const [extPhone, setExtPhone] = useState<string>("");
  const [extEmergencyContact, setExtEmergencyContact] = useState<string>("");
  const [extCategoryId, setExtCategoryId] = useState<string>("");
  const [extFeeAmount, setExtFeeAmount] = useState<string>("0");
  const [extPaymentStatus, setExtPaymentStatus] = useState<"PENDING" | "PAID">(
    "PAID"
  );
  const [categories, setCategories] = useState<TournamentCategory[]>([]);

  useEffect(() => {
    if (open && tournament) {
      setExtFeeAmount(String(tournament.feeAmount || 0));
      loadParticipants();
      if (selectedBrandId) {
        loadDojoStudents();
      }
    }
  }, [open, tournament, selectedBrandId]);

  const loadParticipants = async () => {
    if (!tournament) return;
    setIsLoading(true);
    try {
      const [resP, resC] = await Promise.all([
        getTournamentParticipantsAction(tournament.id),
        getCategoriesByTournamentAction(tournament.id),
      ]);
      if (resP.success && resP.data) {
        setParticipants(resP.data);
      }
      if (resC.success && resC.data) {
        setCategories(resC.data);
      }
    } catch {
      toast.error(t("groups.loadError", "Error al cargar datos."));
    } finally {
      setIsLoading(false);
    }
  };

  const loadDojoStudents = async () => {
    if (!selectedBrandId) return;
    try {
      const res = await getStudentsByBrandAction(selectedBrandId);
      if (res.success && res.data) {
        setDojoStudents(res.data);
      }
    } catch {
      // silent catch
    }
  };

  const handleEnrollDojoStudent = async (student: StudentProfile) => {
    if (!tournament) return;
    setIsSubmitting(true);
    try {
      const res = await enrollStudentParticipantAction(
        tournament.id,
        student.id,
        undefined,
        undefined,
        tournament.feeAmount || 0,
        "PENDING"
      );

      if (res.success) {
        toast.success(
          t("groups.enrollSuccessSingle", "Alumno inscrito al torneo.")
        );
        loadParticipants();
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || t("groups.saveError", "Error al inscribir."));
      }
    } catch {
      toast.error(t("groups.saveError", "Error al inscribir."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterExternal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournament) return;
    if (!extFirstName.trim()) {
      toast.error(t("groups.firstNameRequired", "El nombre es obligatorio."));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        firstName: extFirstName.trim(),
        lastName: extLastName.trim() || undefined,
        email: extEmail.trim() || undefined,
        phone: extPhone.trim() || undefined,
        age: extAge ? parseInt(extAge, 10) : undefined,
        gender: extGender,
        weightKg: extWeightKg ? parseFloat(extWeightKg) : undefined,
        dojoName: extDojoName.trim() || undefined,
        beltName: extBeltName.trim() || undefined,
        emergencyContact: extEmergencyContact.trim() || undefined,
        feeAmount: extFeeAmount ? parseFloat(extFeeAmount) : 0,
        paymentStatus: extPaymentStatus,
        categoryId: extCategoryId || undefined,
      };

      const res = await createExternalParticipantAction(tournament.id, payload);

      if (res.success) {
        toast.success(
          t("groups.createdSuccess", "Competidor externo registrado.")
        );
        setExtFirstName("");
        setExtLastName("");
        setExtEmail("");
        setExtPhone("");
        setExtAge("");
        setExtWeightKg("");
        setExtDojoName("");
        setExtBeltName("");
        setExtEmergencyContact("");
        setExtCategoryId("");
        setExtBeltName("");
        loadParticipants();
        setActiveTab("enrolled");
        if (onSuccess) onSuccess();
      } else {
        toast.error(
          res.error || t("groups.saveError", "Error al registrar competidor.")
        );
      }
    } catch {
      toast.error(t("groups.saveError", "Error al registrar competidor."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnenroll = async (participantId: string) => {
    if (
      !confirm(
        t(
          "rubrics.confirmDelete",
          "¿Desvincular a este competidor del torneo?"
        )
      )
    )
      return;

    try {
      const res = await deleteParticipantAction(participantId);
      if (res.success) {
        toast.success(
          t("groups.unenrollSuccess", "Competidor desvinculado del torneo.")
        );
        loadParticipants();
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || t("groups.deleteError", "Error al desvincular."));
      }
    } catch {
      toast.error(t("groups.deleteError", "Error al desvincular."));
    }
  };

  const filteredParticipants = participants.filter((p) => {
    const query = searchEnrolled.toLowerCase();
    const name = `${p.firstName} ${p.lastName || ""}`.toLowerCase();
    const dojo = (p.dojoName || "").toLowerCase();
    return name.includes(query) || dojo.includes(query);
  });

  const enrolledStudentIds = new Set(
    participants.map((p) => p.studentId).filter(Boolean)
  );

  const filteredStudents = dojoStudents.filter((s) => {
    const query = searchStudent.toLowerCase();
    const name = `${s.firstName || ""} ${s.lastName || ""}`.toLowerCase();
    return name.includes(query);
  });

  if (!tournament) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white">
              <Users className="w-5 h-5 text-amber-500" />
              {t("groups.assignModalTitle", "Inscripción de Competidores")} -{" "}
              {tournament.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              {t(
                "groups.assignModalDesc",
                "Gestiona los participantes inscritos, busca alumnos del dojo o da de alta competidores externos."
              )}
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 w-full bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl">
              <TabsTrigger
                value="enrolled"
                className="text-xs font-bold rounded-lg cursor-pointer"
              >
                {t("tournamentsPage.enrolledTab", "Inscritos")} (
                {participants.length})
              </TabsTrigger>
              <TabsTrigger
                value="searchDojo"
                className="text-xs font-bold rounded-lg cursor-pointer"
              >
                {t("tournamentsPage.searchDojoTab", "Buscar Alumno Dojo")}
              </TabsTrigger>
              <TabsTrigger
                value="quickAdd"
                className="text-xs font-bold rounded-lg cursor-pointer"
              >
                {t("tournamentsPage.quickAddExternalTab", "Alta Rápida Externo")}
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: ENROLLED PARTICIPANTS */}
            <TabsContent value="enrolled" className="space-y-3 pt-3">
              <div className="flex items-center gap-2.5 bg-zinc-50 dark:bg-zinc-800/60 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                <Input
                  placeholder={t(
                    "groups.searchEnrolledPlaceholder",
                    "Filtrar participantes por nombre o dojo..."
                  )}
                  value={searchEnrolled}
                  onChange={(e) => setSearchEnrolled(e.target.value)}
                  className="border-0 bg-transparent text-xs p-0 focus-visible:ring-0"
                />
              </div>

              <div className="max-h-[50vh] overflow-y-auto sidebar-scroll custom-scrollbar space-y-2 pr-1">
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  </div>
                ) : filteredParticipants.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-2xl border-zinc-200 dark:border-zinc-800">
                    <p className="text-xs text-zinc-400 font-medium">
                      {t(
                        "groups.noEnrolledStudents",
                        "No hay competidores inscritos aún."
                      )}
                    </p>
                  </div>
                ) : (
                  filteredParticipants.map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold text-xs flex items-center justify-center shrink-0">
                          {p.firstName[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-zinc-900 dark:text-white">
                              {p.firstName} {p.lastName || ""}
                            </span>
                            {p.isExternal ? (
                              <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 text-[9px] font-extrabold">
                                {p.dojoName || "Externo"}
                              </Badge>
                            ) : (
                              <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[9px] font-extrabold">
                                Dojo Interno
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500 font-medium">
                            {p.age && <span>{p.age} años</span>}
                            {p.weightKg && <span>• {p.weightKg} kg</span>}
                            {p.beltName && <span>• {p.beltName}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {p.paymentStatus === "PAID" ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-extrabold gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            PAGADO (${p.feeAmount})
                          </Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPayingParticipant(p)}
                            className="h-7 text-[11px] font-bold gap-1 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 rounded-xl cursor-pointer"
                          >
                            <Clock className="w-3 h-3 text-amber-500" />
                            PENDIENTE (${p.feeAmount})
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-zinc-400 hover:text-rose-500 cursor-pointer"
                          onClick={() => handleUnenroll(p.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* TAB 2: SEARCH DOJO STUDENTS */}
            <TabsContent value="searchDojo" className="space-y-3 pt-3">
              <div className="flex items-center gap-2.5 bg-zinc-50 dark:bg-zinc-800/60 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                <Input
                  placeholder={t(
                    "groups.searchStudentPlaceholder",
                    "Buscar alumno del dojo por nombre..."
                  )}
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="border-0 bg-transparent text-xs p-0 focus-visible:ring-0"
                />
              </div>

              <div className="max-h-[50vh] overflow-y-auto sidebar-scroll custom-scrollbar space-y-2 pr-1">
                {filteredStudents.map((s) => {
                  const isEnrolled = enrolledStudentIds.has(s.id);
                  return (
                    <div
                      key={s.id}
                      className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-800/40"
                    >
                      <div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-white">
                          {s.firstName} {s.lastName || ""}
                        </p>
                        <p className="text-[11px] text-zinc-500 font-medium">
                          {(s as unknown as { currentBelt?: { name?: string } }).currentBelt?.name || "Sin cinturón"}{" "}
                          {s.email ? `• ${s.email}` : ""}
                        </p>
                      </div>

                      {isEnrolled ? (
                        <Badge variant="secondary" className="text-[10px] font-bold">
                          {t("groups.enrolledBadge", "Inscrito")}
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          disabled={isSubmitting}
                          onClick={() => handleEnrollDojoStudent(s)}
                          className="h-7 text-xs bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold gap-1 rounded-xl cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {t("groups.enrollBtn", "Inscribir")}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* TAB 3: QUICK ADD EXTERNAL COMPETITOR */}
            <TabsContent value="quickAdd" className="space-y-3 pt-2">
              <form onSubmit={handleRegisterExternal} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      {t("groups.nameLabel", "Nombre *")}
                    </Label>
                    <Input
                      placeholder="Nombre del competidor"
                      value={extFirstName}
                      onChange={(e) => setExtFirstName(e.target.value)}
                      className="h-9 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Apellidos
                    </Label>
                    <Input
                      placeholder="Apellidos"
                      value={extLastName}
                      onChange={(e) => setExtLastName(e.target.value)}
                      className="h-9 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Edad (Años)
                    </Label>
                    <Input
                      type="number"
                      placeholder="ej. 14"
                      value={extAge}
                      onChange={(e) => setExtAge(e.target.value)}
                      className="h-9 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Peso (kg)
                    </Label>
                    <Input
                      type="number"
                      placeholder="ej. 52.5"
                      value={extWeightKg}
                      onChange={(e) => setExtWeightKg(e.target.value)}
                      className="h-9 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Rama / Género
                    </Label>
                    <select
                      value={extGender}
                      onChange={(e) => setExtGender(e.target.value)}
                      className="w-full h-9 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs px-2.5 font-semibold text-zinc-900 dark:text-white"
                    >
                      <option value="MIXED">Mixto</option>
                      <option value="MALE">Varonil</option>
                      <option value="FEMALE">Femenil</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Escuela / Dojo de Origen
                    </Label>
                    <Input
                      placeholder="ej. Academia Bukan Krav Maga"
                      value={extDojoName}
                      onChange={(e) => setExtDojoName(e.target.value)}
                      className="h-9 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Cinturón / Grado
                    </Label>
                    <Input
                      placeholder="ej. Cinturón Verde"
                      value={extBeltName}
                      onChange={(e) => setExtBeltName(e.target.value)}
                      className="h-9 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Categoría
                    </Label>
                    <select
                      value={extCategoryId}
                      onChange={(e) => setExtCategoryId(e.target.value)}
                      className="w-full h-9 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs px-2.5 font-semibold text-zinc-900 dark:text-white"
                    >
                      <option value="">-- Sin Categoría --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Contacto de Emergencia
                    </Label>
                    <Input
                      placeholder="Nombre y teléfono"
                      value={extEmergencyContact}
                      onChange={(e) => setExtEmergencyContact(e.target.value)}
                      className="h-9 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Correo Electrónico
                    </Label>
                    <Input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={extEmail}
                      onChange={(e) => setExtEmail(e.target.value)}
                      className="h-9 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Teléfono de Contacto
                    </Label>
                    <Input
                      placeholder="+52 55..."
                      value={extPhone}
                      onChange={(e) => setExtPhone(e.target.value)}
                      className="h-9 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Cuota Inscripción ($)
                    </Label>
                    <Input
                      type="number"
                      value={extFeeAmount}
                      onChange={(e) => setExtFeeAmount(e.target.value)}
                      className="h-9 text-xs font-bold rounded-xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Estatus de Pago Inicial
                    </Label>
                    <select
                      value={extPaymentStatus}
                      onChange={(e) =>
                        setExtPaymentStatus(e.target.value as "PENDING" | "PAID")
                      }
                      className="w-full h-9 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs px-2.5 font-bold text-zinc-900 dark:text-white"
                    >
                      <option value="PAID">🟢 Pagado (Ingresar al Balance)</option>
                      <option value="PENDING">🔴 Pendiente por Pagar</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs gap-1.5 rounded-xl cursor-pointer shadow-xs"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <UserPlus className="w-3.5 h-3.5" />
                    Registrar Competidor Externo
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Quick Payment Modal */}
      {payingParticipant && (
        <TournamentPaymentModal
          open={Boolean(payingParticipant)}
          onOpenChange={(open) => {
            if (!open) setPayingParticipant(null);
          }}
          participantId={payingParticipant.id}
          competitorName={`${payingParticipant.firstName} ${payingParticipant.lastName || ""}`}
          tournamentTitle={tournament?.title || ""}
          feeAmount={
            payingParticipant.feeAmount > 0
              ? payingParticipant.feeAmount
              : (tournament?.feeAmount || 0)
          }
          onSuccess={() => {
            loadParticipants();
            if (onSuccess) onSuccess();
          }}
        />
      )}
    </>
  );
}
