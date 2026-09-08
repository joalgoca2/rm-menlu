"use client";

import React, { useState } from "react";
import { Dumbbell, Plus, CheckCircle2, XCircle, Gift, Pencil, Trash2, X, AlertTriangle } from "lucide-react";
import { useBrand } from "@/context/brand-context";
import { Button } from "@/components/ui/button";
import { createPhysicalChallengeAction } from "@/actions/gamification";

interface ChallengeItem {
  id: string;
  title: string;
  minAge: number;
  maxAge: number;
  targetReps: number;
  xpReward: number;
}

interface EvidenceItem {
  id: string;
  studentName: string;
  challengeTitle: string;
  completedAt: string;
  status: string;
}

export default function GamificationAdminPage() {
  const { selectedBrandId } = useBrand();

  const [activeTab, setActiveTab] = useState<"challenges" | "verifications" | "rewards">("challenges");

  // State for challenges
  const [challenges, setChallenges] = useState<ChallengeItem[]>([
    {
      id: "ch-1",
      title: "10 Flexiones de Pecho (Infantil)",
      minAge: 4,
      maxAge: 12,
      targetReps: 10,
      xpReward: 30,
    },
    {
      id: "ch-2",
      title: "25 Sentadillas Explosivas (Adultos)",
      minAge: 13,
      maxAge: 99,
      targetReps: 25,
      xpReward: 50,
    },
  ]);

  // Modals state for Edit / Delete Challenge
  const [editingChallenge, setEditingChallenge] = useState<ChallengeItem | null>(null);
  const [deletingChallenge, setDeletingChallenge] = useState<ChallengeItem | null>(null);

  // State for pending verifications
  const [verifications, setVerifications] = useState<EvidenceItem[]>([
    {
      id: "ev-1",
      studentName: "Carlos Mendoza",
      challengeTitle: "10 Flexiones de Pecho (Infantil)",
      completedAt: "Hace 10 min",
      status: "PENDING",
    },
  ]);

  // Form states for Create
  const [title, setTitle] = useState("");
  const [minAge, setMinAge] = useState(4);
  const [maxAge, setMaxAge] = useState(12);
  const [targetReps, setTargetReps] = useState(10);
  const [xpReward, setXpReward] = useState(40);

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const brandIdToUse = selectedBrandId === "ALL" ? "seed-brand-general" : selectedBrandId;
    const res = await createPhysicalChallengeAction({
      brandId: brandIdToUse,
      title,
      minAge: Number(minAge),
      maxAge: Number(maxAge),
      targetReps: Number(targetReps),
      xpReward: Number(xpReward),
    });

    if (res.success && res.data) {
      setChallenges([
        ...challenges,
        {
          id: res.data.id,
          title: res.data.title,
          minAge: res.data.minAge || 4,
          maxAge: res.data.maxAge || 99,
          targetReps: res.data.targetReps,
          xpReward: res.data.xpReward,
        },
      ]);
      setTitle("");
    }
  };

  const handleUpdateChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChallenge) return;

    setChallenges(challenges.map((c) => (c.id === editingChallenge.id ? editingChallenge : c)));
    setEditingChallenge(null);
  };

  const handleDeleteChallenge = () => {
    if (!deletingChallenge) return;

    setChallenges(challenges.filter((c) => c.id !== deletingChallenge.id));
    setDeletingChallenge(null);
  };

  const handleApprove = (id: string) => {
    setVerifications(verifications.filter((v) => v.id !== id));
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Dumbbell className="h-7 w-7 text-amber-500" />
            Gestor de Gamificación & Retos Físicos
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Administra los retos por edad, la bandeja de verificación del coach y la Tienda de
            Recompensas.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6">
        <button
          onClick={() => setActiveTab("challenges")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "challenges"
              ? "border-amber-500 text-amber-600 dark:text-amber-400"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          🏋️ Retos Físicos
        </button>
        <button
          onClick={() => setActiveTab("verifications")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "verifications"
              ? "border-amber-500 text-amber-600 dark:text-amber-400"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          ✅ Bandeja del Coach
          {verifications.length > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500 text-white font-bold">
              {verifications.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("rewards")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "rewards"
              ? "border-amber-500 text-amber-600 dark:text-amber-400"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          🎁 Tienda de Recompensas
        </button>
      </div>

      {/* Tab: Retos Físicos */}
      {activeTab === "challenges" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Nuevo Reto Físico</h2>
            <form onSubmit={handleCreateChallenge} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-500">Título del Reto</label>
                <input
                  type="text"
                  placeholder="ej. 15 Flexiones Explosivas"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-500">Edad Mínima</label>
                  <input
                    type="number"
                    value={minAge}
                    onChange={(e) => setMinAge(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Edad Máxima</label>
                  <input
                    type="number"
                    value={maxAge}
                    onChange={(e) => setMaxAge(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-500">Repeticiones</label>
                  <input
                    type="number"
                    value={targetReps}
                    onChange={(e) => setTargetReps(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Recompensa XP</label>
                  <input
                    type="number"
                    value={xpReward}
                    onChange={(e) => setXpReward(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl">
                <Plus className="h-4 w-4 mr-1" /> Crear Reto
              </Button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Retos Físicos Activos</h2>
            <div className="space-y-3">
              {challenges.map((ch) => (
                <div
                  key={ch.id}
                  className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900"
                >
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white">{ch.title}</h3>
                    <p className="text-xs text-zinc-500">
                      Rango de Edad: {ch.minAge} - {ch.maxAge} años | Meta:{" "}
                      {ch.targetReps} repeticiones
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs rounded-full">
                      +⚡ {ch.xpReward} XP
                    </span>
                    <div className="flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-800 pl-2">
                      <button
                        onClick={() => setEditingChallenge(ch)}
                        className="p-1.5 text-zinc-400 hover:text-amber-500 rounded-md transition-colors"
                        title="Editar reto"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingChallenge(ch)}
                        className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-md transition-colors"
                        title="Eliminar reto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Bandeja de Verificación */}
      {activeTab === "verifications" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Bandeja de Validación del Coach</h2>
          {verifications.length === 0 ? (
            <p className="text-sm text-zinc-500">No hay tareas o retos pendientes de aprobación.</p>
          ) : (
            <div className="space-y-3">
              {verifications.map((v) => (
                <div
                  key={v.id}
                  className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white">{v.studentName}</h3>
                    <p className="text-xs text-zinc-500">{v.challengeTitle} • {v.completedAt}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleApprove(v.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs">
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Aprobar (+30 XP)
                    </Button>
                    <Button onClick={() => handleApprove(v.id)} variant="outline" className="rounded-xl text-xs">
                      <XCircle className="h-4 w-4 mr-1" /> Rechazar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Tienda de Recompensas */}
      {activeTab === "rewards" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <Gift className="h-5 w-5 text-amber-500" /> Tienda de Recompensas del Dojo (Honor Shop)
            </h2>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs">
              <Plus className="h-4 w-4 mr-1" /> Nueva Recompensa
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 space-y-2">
              <span className="text-2xl">🐉</span>
              <h3 className="font-bold text-zinc-900 dark:text-white text-sm">Parche Dragón Dorado para Gi</h3>
              <p className="text-xs text-zinc-500">Parche bordado exclusivo para el uniforme.</p>
              <div className="text-xs font-bold text-amber-500">Costo: 500 XP</div>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 space-y-2">
              <span className="text-2xl">🎵</span>
              <h3 className="font-bold text-zinc-900 dark:text-white text-sm">Monitor de Clase (1 día)</h3>
              <p className="text-xs text-zinc-500">Dirigir el calentamiento y elegir la música.</p>
              <div className="text-xs font-bold text-amber-500">Costo: 300 XP</div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Reto */}
      {editingChallenge && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Editar Reto Físico</h3>
              <button onClick={() => setEditingChallenge(null)} className="text-zinc-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateChallenge} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-500 font-medium">Título del Reto</label>
                <input
                  type="text"
                  value={editingChallenge.title}
                  onChange={(e) =>
                    setEditingChallenge({ ...editingChallenge, title: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 font-medium">Edad Mínima</label>
                  <input
                    type="number"
                    value={editingChallenge.minAge}
                    onChange={(e) =>
                      setEditingChallenge({
                        ...editingChallenge,
                        minAge: Number(e.target.value),
                      })
                    }
                    className="w-full mt-1 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 font-medium">Edad Máxima</label>
                  <input
                    type="number"
                    value={editingChallenge.maxAge}
                    onChange={(e) =>
                      setEditingChallenge({
                        ...editingChallenge,
                        maxAge: Number(e.target.value),
                      })
                    }
                    className="w-full mt-1 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 font-medium">Repeticiones</label>
                  <input
                    type="number"
                    value={editingChallenge.targetReps}
                    onChange={(e) =>
                      setEditingChallenge({
                        ...editingChallenge,
                        targetReps: Number(e.target.value),
                      })
                    }
                    className="w-full mt-1 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 font-medium">Recompensa XP</label>
                  <input
                    type="number"
                    value={editingChallenge.xpReward}
                    onChange={(e) =>
                      setEditingChallenge({
                        ...editingChallenge,
                        xpReward: Number(e.target.value),
                      })
                    }
                    className="w-full mt-1 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingChallenge(null)} className="rounded-xl">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl">
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar Reto */}
      {deletingChallenge && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertTriangle className="h-7 w-7 shrink-0" />
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white">¿Eliminar Reto Físico?</h3>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Estás a punto de eliminar el reto <strong className="text-zinc-900 dark:text-white">"{deletingChallenge.title}"</strong>.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeletingChallenge(null)} className="rounded-xl">
                Cancelar
              </Button>
              <Button onClick={handleDeleteChallenge} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl">
                Sí, Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
