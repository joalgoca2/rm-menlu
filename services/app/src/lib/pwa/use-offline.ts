"use client";

import { useState, useEffect, useCallback } from "react";
import { FEATURES } from "@/lib/config/features";
import {
  getPendingActions,
  removePendingAction,
  type PendingOfflineAction,
} from "./offline-db";

export function useOffline() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const refreshPendingCount = useCallback(async () => {
    if (!FEATURES.offlineMode) return;
    try {
      const actions = await getPendingActions();
      setPendingCount(actions.length);
    } catch {
      setPendingCount(0);
    }
  }, []);

  const syncPendingQueue = useCallback(async () => {
    if (!FEATURES.offlineMode || isSyncing) return;

    setIsSyncing(true);
    try {
      const actions = await getPendingActions();

      for (const action of actions) {
        // Enviar evento de sincronización de la acción almacenada
        await processSingleOfflineAction(action);
        await removePendingAction(action.id);
      }

      await refreshPendingCount();
    } catch {
      // Error procesando la cola offline
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshPendingCount]);

  useEffect(() => {
    if (typeof window === "undefined" || !FEATURES.offlineMode) return;

    setIsOnline(navigator.onLine);
    refreshPendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      syncPendingQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [refreshPendingCount, syncPendingQueue]);

  return {
    isOnline: !FEATURES.offlineMode || isOnline,
    pendingCount,
    isSyncing,
    refreshPendingCount,
    syncPendingQueue,
  };
}

async function processSingleOfflineAction(
  _action: PendingOfflineAction
): Promise<void> {
  // Simulador de despacho asíncrono para Server Actions encoladas
  return new Promise((resolve) => setTimeout(resolve, 300));
}
