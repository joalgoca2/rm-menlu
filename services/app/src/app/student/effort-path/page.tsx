"use client";

import React, { useState } from "react";
import { Flame, Shield, Award, Dumbbell, Gift, CheckCircle, Sparkles } from "lucide-react";

interface NodeItem {
  id: number;
  title: string;
  type: "ATTENDANCE" | "PHYSICAL" | "EXAM";
  status: "COMPLETED" | "ACTIVE" | "LOCKED";
  xpReward: number;
}

export default function EffortPathStudentPage() {
  const [effortPoints, setEffortPoints] = useState(340);
  const [currentStreak, setCurrentStreak] = useState(4);
  const [shieldsAvailable, setShieldsAvailable] = useState(1);

  const [nodes, setNodes] = useState<NodeItem[]>([
    { id: 1, title: "Pase de Lista - Clase 1", type: "ATTENDANCE", status: "COMPLETED", xpReward: 20 },
    { id: 2, title: "10 Flexiones de Pecho", type: "PHYSICAL", status: "COMPLETED", xpReward: 30 },
    { id: 3, title: "Pase de Lista - Clase 2", type: "ATTENDANCE", status: "COMPLETED", xpReward: 20 },
    { id: 4, title: "20 Sentadillas Explosivas", type: "PHYSICAL", status: "ACTIVE", xpReward: 40 },
    { id: 5, title: "Quiz Teórico de Kata", type: "ATTENDANCE", status: "LOCKED", xpReward: 50 },
    { id: 6, title: "🥋 EXAMEN DE CINTURÓN VERDE", type: "EXAM", status: "LOCKED", xpReward: 200 },
  ]);

  const handleCompleteActiveNode = (nodeId: number, xpReward: number) => {
    setEffortPoints((prev) => prev + xpReward);
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id === nodeId) return { ...node, status: "COMPLETED" };
        if (node.id === nodeId + 1) return { ...node, status: "ACTIVE" };
        return node;
      })
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 space-y-8">
      {/* Header Gamificado */}
      <div className="max-w-4xl mx-auto bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/20">
            🥋
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Carlos Mendoza</h1>
            <p className="text-xs text-amber-400 font-semibold">Cinturón Amarillo • Sanda (Sanshou)</p>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-4 bg-zinc-950/60 px-5 py-3 rounded-2xl border border-zinc-800">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <div className="text-xs">
              <div className="text-zinc-400">Puntos XP</div>
              <div className="font-bold text-amber-400 text-sm">{effortPoints} XP</div>
            </div>
          </div>

          <div className="h-8 w-px bg-zinc-800" />

          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 fill-orange-500 text-orange-500" />
            <div className="text-xs">
              <div className="text-zinc-400">Racha</div>
              <div className="font-bold text-orange-400 text-sm">{currentStreak} sem</div>
            </div>
          </div>

          <div className="h-8 w-px bg-zinc-800" />

          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-cyan-400" />
            <div className="text-xs">
              <div className="text-zinc-400">Escudos</div>
              <div className="font-bold text-cyan-400 text-sm">{shieldsAvailable}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mapa del Camino del Esfuerzo (Estilo Duolingo) */}
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>El Camino del Esfuerzo</span> ✨
          </h2>
          <p className="text-xs text-zinc-400">Completa cada reto en el tatami y en casa para avanzar a tu próximo grado.</p>
        </div>

        <div className="relative py-8 flex flex-col items-center space-y-8">
          {/* Línea Conectora Vertical */}
          <div className="absolute top-10 bottom-10 w-1 bg-zinc-800 -z-0" />

          {nodes.map((node, index) => {
            const isLeft = index % 2 === 0;

            return (
              <div
                key={node.id}
                className={`relative z-10 flex items-center gap-4 w-full ${
                  isLeft ? "flex-row" : "flex-row-reverse"
                }`}
              >
                <div className="w-1/2 flex justify-end" style={{ justifyContent: isLeft ? "flex-end" : "flex-start" }}>
                  <button
                    disabled={node.status === "LOCKED"}
                    onClick={() => node.status === "ACTIVE" && handleCompleteActiveNode(node.id, node.xpReward)}
                    className={`w-16 h-16 rounded-3xl flex items-center justify-center font-bold shadow-xl transition-all ${
                      node.status === "COMPLETED"
                        ? "bg-emerald-500 text-white shadow-emerald-500/30 scale-100"
                        : node.status === "ACTIVE"
                        ? "bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-amber-500/40 animate-pulse scale-110 ring-4 ring-amber-500/20"
                        : "bg-zinc-800 text-zinc-500 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    {node.status === "COMPLETED" ? (
                      <CheckCircle className="h-8 w-8 text-white" />
                    ) : node.type === "PHYSICAL" ? (
                      <Dumbbell className="h-7 w-7" />
                    ) : node.type === "EXAM" ? (
                      <Award className="h-7 w-7" />
                    ) : (
                      <Sparkles className="h-7 w-7" />
                    )}
                  </button>
                </div>

                <div className="w-1/2">
                  <div className={`p-3 rounded-2xl border text-xs max-w-xs ${
                    node.status === "ACTIVE"
                      ? "border-amber-500/50 bg-amber-500/10 text-amber-200"
                      : node.status === "COMPLETED"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-zinc-800 bg-zinc-900 text-zinc-500"
                  }`}>
                    <div className="font-bold">{node.title}</div>
                    <div className="text-[10px] mt-0.5 opacity-80">+⚡ {node.xpReward} XP</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tienda de Recompensas Canjeables */}
      <div className="max-w-4xl mx-auto bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Gift className="h-5 w-5 text-amber-400" /> Tienda del Dojo (Premios por Canjear)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-950 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-3xl">🐉</span>
              <h4 className="font-bold text-white text-sm mt-1">Parche Dragón Dorado</h4>
              <p className="text-xs text-zinc-400">Bordado para el gi/dobok.</p>
            </div>
            <button className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs">
              Canjear (500 XP)
            </button>
          </div>

          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-950 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-3xl">🎵</span>
              <h4 className="font-bold text-white text-sm mt-1">Monitor de Clase</h4>
              <p className="text-xs text-zinc-400">Dirigir el calentamiento 1 día.</p>
            </div>
            <button className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs">
              Canjear (300 XP)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
