"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import { Loader2, VideoOff, Camera, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TournamentQRScannerProps {
  tournamentId: string;
  onScanSuccess: (decodedText: string) => void;
  paused?: boolean;
}

export function TournamentQRScanner({
  tournamentId,
  onScanSuccess,
  paused = false,
}: TournamentQRScannerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const qrCodeInstanceRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef(false);
  const scanCooldownRef = useRef<number>(0);
  const lastScannedTextRef = useRef<string>("");

  const handleScanDecoded = useCallback(
    (decodedText: string) => {
      const now = Date.now();

      // Check anti-duplicate cooldown lock (2.5 seconds)
      if (paused) return;
      if (now < scanCooldownRef.current) return;
      if (decodedText === lastScannedTextRef.current && now < scanCooldownRef.current + 2000) {
        return;
      }

      // Lock cooldown for 2.5 seconds
      scanCooldownRef.current = now + 2500;
      lastScannedTextRef.current = decodedText;

      onScanSuccess(decodedText);
    },
    [onScanSuccess, paused]
  );

  const startScanner = useCallback(async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;

    try {
      setIsProcessing(true);

      const container = document.getElementById("menlu-qr-reader");
      if (!container) return;

      if (!qrCodeInstanceRef.current) {
        qrCodeInstanceRef.current = new Html5Qrcode("menlu-qr-reader");
      }

      if (qrCodeInstanceRef.current.isScanning) {
        setHasPermission(true);
        setIsScanning(true);
        return;
      }

      await qrCodeInstanceRef.current.start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.65;
            return { width: size, height: size };
          },
        },
        (decodedText) => {
          handleScanDecoded(decodedText);
        },
        () => {
          // Ignore frame decode errors
        }
      );

      setHasPermission(true);
      setIsScanning(true);
    } catch (err) {
      console.error("Error starting camera:", err);
      setHasPermission(false);
      setIsScanning(false);
      toast.error("No se pudo iniciar la cámara. Verifica los permisos de tu navegador.");
    } finally {
      setIsProcessing(false);
      isStartingRef.current = false;
    }
  }, [handleScanDecoded]);

  const stopScanner = useCallback(async () => {
    try {
      setIsProcessing(true);
      if (qrCodeInstanceRef.current && qrCodeInstanceRef.current.isScanning) {
        await qrCodeInstanceRef.current.stop();
      }
      setIsScanning(false);
    } catch (err) {
      console.error("Error stopping camera:", err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  useEffect(() => {
    startScanner();

    return () => {
      if (qrCodeInstanceRef.current && qrCodeInstanceRef.current.isScanning) {
        qrCodeInstanceRef.current.stop().catch(console.error);
      }
    };
  }, [startScanner]);

  return (
    <div className="space-y-4">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        #menlu-qr-reader {
          border: none !important;
          background: #09090b !important;
        }
        #menlu-qr-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 1.5rem !important;
        }
        @keyframes menlu-scan-laser {
          0% { top: 20%; }
          50% { top: 80%; }
          100% { top: 20%; }
        }
        .menlu-scanner-laser {
          position: absolute;
          left: 20%;
          right: 20%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #f59e0b, transparent);
          box-shadow: 0 0 10px #f59e0b, 0 0 20px #f59e0b;
          animation: menlu-scan-laser 2.2s infinite linear;
          z-index: 20;
          pointer-events: none;
        }
      `,
        }}
      />

      <div className="relative aspect-square max-w-[360px] mx-auto overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 shadow-xl group">
        <div className="absolute inset-0 border border-amber-500/20 rounded-3xl z-10 pointer-events-none" />

        {/* Video Canvas Container */}
        <div id="menlu-qr-reader" className="w-full h-full" />

        {/* Laser & Target Corners Overlay */}
        {isScanning && !paused && (
          <>
            <div className="menlu-scanner-laser" />

            <div className="absolute inset-[20%] border-2 border-transparent z-15 pointer-events-none">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-amber-500 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-amber-500 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-amber-500 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-amber-500 rounded-br-lg" />
            </div>
          </>
        )}

        {/* Processing / Paused overlay */}
        {(isProcessing || paused) && (
          <div className="absolute inset-0 bg-zinc-950/70 flex flex-col items-center justify-center backdrop-blur-xs z-30 space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            {paused && (
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                Procesando Competidor...
              </span>
            )}
          </div>
        )}

        {/* No Permission View */}
        {!isScanning && !isProcessing && (
          <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center text-center p-6 space-y-3 z-20">
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500">
              <VideoOff className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Permiso de Cámara Denegado</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed max-w-xs">
                Haz clic en el icono de candado 🔒 en la barra de direcciones de tu navegador y selecciona <strong>Permitir Cámara</strong>.
              </p>
            </div>
            <Button
              onClick={startScanner}
              className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs px-4 h-9 cursor-pointer"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Reintentar Permiso de Cámara
            </Button>
          </div>
        )}
      </div>

      {/* Manual Input / Hardware USB Barcode Reader Fallback */}
      <div className="max-w-[360px] mx-auto p-3.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl space-y-2">
        <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
          <span>⌨️ Lector USB / Bluetooth o Entrada Manual:</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Pegar o escanear código QR..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const target = e.target as HTMLInputElement;
                if (target.value.trim()) {
                  handleScanDecoded(target.value.trim());
                  target.value = "";
                }
              }
            }}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>
    </div>
  );
}
