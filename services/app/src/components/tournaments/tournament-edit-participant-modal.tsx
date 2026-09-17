"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "@/components/providers/i18n-provider";
import { updateParticipantDetailsAction } from "@/actions/tournaments";
import type { TournamentParticipant, TournamentCategory } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, User } from "lucide-react";
import { toast } from "sonner";

interface TournamentEditParticipantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participant: TournamentParticipant | null;
  categories: TournamentCategory[];
  onSuccess?: () => void;
}

export function TournamentEditParticipantModal({
  open,
  onOpenChange,
  participant,
  categories,
  onSuccess,
}: TournamentEditParticipantModalProps) {
  const { t } = useTranslation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState<string>("");
  const [weightKg, setWeightKg] = useState<string>("");
  const [dojoName, setDojoName] = useState("");
  const [beltName, setBeltName] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [feeAmount, setFeeAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (participant) {
      setFirstName(participant.firstName || "");
      setLastName(participant.lastName || "");
      setEmail(participant.email || "");
      setPhone(participant.phone || "");
      setAge(participant.age !== undefined && participant.age !== null ? String(participant.age) : "");
      setWeightKg(
        participant.weightKg !== undefined && participant.weightKg !== null
          ? String(participant.weightKg)
          : ""
      );
      setDojoName(participant.dojoName || "");
      setBeltName(participant.beltName || "");
      setEmergencyContact(participant.emergencyContact || "");
      setCategoryId(participant.categoryId || "");
      setFeeAmount(
        participant.feeAmount !== undefined && participant.feeAmount !== null
          ? String(participant.feeAmount)
          : ""
      );
    }
  }, [participant]);

  if (!open || !participant) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      toast.error(t("common.requiredField", "El nombre es obligatorio."));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateParticipantDetailsAction(participant.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        age: age.trim() ? Number(age) : null,
        weightKg: weightKg.trim() ? Number(weightKg) : null,
        dojoName: dojoName.trim() || null,
        beltName: beltName.trim() || null,
        emergencyContact: emergencyContact.trim() || null,
        categoryId: categoryId || null,
        feeAmount: feeAmount.trim() ? Number(feeAmount) : null,
      });

      if (res.success) {
        toast.success(
          t("tournamentsPage.participantUpdated", "Datos del participante actualizados correctamente.")
        );
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || "Error al actualizar participante.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar datos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-amber-500" />
            {t("tournamentsPage.editParticipantTitle", "Editar Competidor")}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            {t("tournamentsPage.editParticipantDesc", "Modifica los datos personales y de categoría del participante.")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Nombres y Apellidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Nombre(s) *
              </Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Nombre"
                required
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Apellido(s)
              </Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Apellido"
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Edad, Peso y Cinta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Edad (años)
              </Label>
              <Input
                type="number"
                min="1"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Ej. 14"
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Peso (kg)
              </Label>
              <Input
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="Ej. 55.5"
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Cinta / Rango
              </Label>
              <Input
                value={beltName}
                onChange={(e) => setBeltName(e.target.value)}
                placeholder="Ej. Cinta Azul"
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Dojo / Escuela y Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Escuela / Dōjō
              </Label>
              <Input
                value={dojoName}
                onChange={(e) => setDojoName(e.target.value)}
                placeholder="Nombre del Dojo"
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Categoría
              </Label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-10 px-3 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="">-- Sin Categoría --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Email y Teléfono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Correo Electrónico
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Teléfono de Contacto
              </Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+52 55..."
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Cuota e información de emergencia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Cuota Asignada ($)
              </Label>
              <Input
                type="number"
                min="0"
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
                placeholder="Cuota de inscripción"
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Contacto de Emergencia
              </Label>
              <Input
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Nombre y teléfono"
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-xl text-xs font-bold"
            >
              {t("common.cancel", "Cancelar")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("common.saving", "Guardando...")}
                </>
              ) : (
                t("common.saveChanges", "Guardar Cambios")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
